import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import mysql from "mysql2/promise";
import { testPhone, testOtp } from "./rental-test-auth.mjs";
const base = process.env.RENTAL_TEST_URL;
assert.ok(process.env.FAST2SMS_MOCK_STATE);
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
const marker = randomUUID(),
  phone = testPhone(),
  second = testPhone(),
  failing = testPhone(),
  expiredPhone = testPhone(),
  legacyPhone = testPhone(),
  ambiguousPhone = testPhone();
const phones = [phone, second, failing, expiredPhone, legacyPhone, ambiguousPhone];
async function api(body, cookie = "", origin = base) {
  const r = await fetch(base + "/api/rentals/account", {
    method: body ? "POST" : "GET",
    headers: { Origin: origin, Cookie: cookie, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json(), cookie: r.headers.get("set-cookie") || "" };
}
const send = (p, purpose = "register", extra = {}) =>
  api({
    action: "request_otp",
    purpose,
    phone: p,
    name: "OTP test",
    email: `otp-${p.replace(/\D/g, "")}-${marker}@example.invalid`,
    ...extra,
  });
const verify = (sent, otp) => api({ action: "verify_otp", challenge: sent.data.challenge, otp });
async function resetCooldown(p) {
  await db.query(
    "UPDATE rental_otp_challenges SET resend_at=DATE_SUB(NOW(),INTERVAL 1 SECOND) WHERE phone=?",
    [p],
  );
}
try {
  assert.equal((await api({ action: "request_otp" }, "", "https://invalid.example")).status, 403);
  assert.equal(
    (await api({ action: "login", email: "x@example.invalid", password: "old-password" })).status,
    400,
  );
  assert.equal((await send("1234")).status, 400);
  const sent = await send("+91 " + phone);
  assert.equal(sent.status, 200);
  assert.equal(sent.data.expiresIn, 600);
  assert.equal(sent.cookie, "");
  assert.equal(sent.data.otp, undefined);
  const [before] = await db.query("SELECT id FROM rental_customers WHERE phone=?", [phone]);
  assert.equal(before.length, 0);
  const [stored] = await db.query("SELECT code_hash FROM rental_otp_challenges WHERE phone=?", [
    phone,
  ]);
  assert.notEqual(stored[0].code_hash, testOtp(phone));
  assert.equal((await send(phone)).status, 429);
  const correct = testOtp(phone),
    wrong = correct === "111111" ? "222222" : "111111";
  assert.equal((await verify(sent, wrong)).status, 400);
  const successes = await Promise.all([verify(sent, correct), verify(sent, correct)]);
  assert.equal(successes.filter((r) => r.status === 200).length, 1);
  const session = successes.find((r) => r.status === 200);
  assert.match(session.cookie, /HttpOnly/);
  assert.equal(session.data.customer.phone, phone);
  assert.equal(session.data.customer.password_hash, undefined);
  assert.equal((await api(undefined, session.cookie)).data.customer.id, session.data.customer.id);
  assert.equal(
    (await api({ action: "profile", name: "OTP test", phone: second }, session.cookie)).status,
    400,
  );
  await api({ action: "logout" }, session.cookie);
  assert.equal((await api(undefined, session.cookie)).data.customer, null);
  await resetCooldown(phone);
  const login = await send(phone, "login");
  assert.equal(login.status, 200);
  assert.equal((await verify(login, testOtp(phone))).data.customer.id, session.data.customer.id);
  console.log(
    "PASS OTP signup/login, phone normalization, no pre-verification account/session, hashed code, CSRF, single-use concurrent verification, session/logout, protected phone",
  );
  const limited = await send(second);
  for (let i = 0; i < 5; i++) assert.equal((await verify(limited, "000000")).status, 400);
  assert.equal((await verify(limited, testOtp(second))).status, 400);
  await resetCooldown(second);
  const resent = await send(second);
  assert.equal((await verify(limited, testOtp(second))).status, 400);
  assert.equal((await verify(resent, testOtp(second))).status, 200);
  const exp = await send(expiredPhone);
  await db.query(
    "UPDATE rental_otp_challenges SET expires_at=DATE_SUB(NOW(),INTERVAL 1 SECOND) WHERE phone=?",
    [expiredPhone],
  );
  assert.equal((await verify(exp, testOtp(expiredPhone))).status, 400);
  for (let i = 0; i < 6; i++) {
    await resetCooldown(expiredPhone);
    const r = await send(expiredPhone);
    if (i >= 4) assert.equal(r.status, 429);
  }
  const state = JSON.parse(readFileSync(process.env.FAST2SMS_MOCK_STATE, "utf8"));
  writeFileSync(process.env.FAST2SMS_MOCK_STATE, JSON.stringify({ ...state, fail: true }));
  const failed = await send(failing);
  assert.equal(failed.status, 502);
  assert.equal(failed.data.challenge, undefined);
  const [failedRows] = await db.query(
    "SELECT consumed,sent FROM rental_otp_challenges WHERE phone=?",
    [failing],
  );
  assert.equal(failedRows[0].consumed, 1);
  assert.equal(failedRows[0].sent, 0);
  const next = JSON.parse(readFileSync(process.env.FAST2SMS_MOCK_STATE, "utf8"));
  writeFileSync(process.env.FAST2SMS_MOCK_STATE, JSON.stringify({ ...next, fail: false }));
  console.log(
    "PASS wrong-code limit, resend invalidation, expiry, request limits and provider failure",
  );
  const legacyId = randomUUID(),
    oldToken = "a".repeat(64);
  await db.query(
    "INSERT INTO rental_customers (id,name,email,phone,password_hash) VALUES (?,?,?,?,?)",
    [legacyId, "Legacy", `legacy-${marker}@example.invalid`, "+91 " + legacyPhone, "unused"],
  );
  await db.query(
    "INSERT INTO rental_sessions (token_hash,customer_id,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 1 DAY))",
    [createHash("sha256").update(oldToken).digest("hex"), legacyId],
  );
  const oldCookie = "buddies_customer_session=" + oldToken;
  assert.equal((await api(undefined, oldCookie)).data.customer, null);
  const migrated = await send(legacyPhone, "login");
  assert.equal((await verify(migrated, testOtp(legacyPhone))).data.customer.id, legacyId);
  assert.equal((await api(undefined, oldCookie)).data.customer, null);
  for (let i = 0; i < 2; i++)
    await db.query(
      "INSERT INTO rental_customers (id,name,email,phone,password_hash) VALUES (?,?,?,?,?)",
      [
        randomUUID(),
        "Ambiguous",
        `ambiguous-${i}-${marker}@example.invalid`,
        ambiguousPhone,
        "unused",
      ],
    );
  const ambiguous = await send(ambiguousPhone, "login");
  assert.equal((await verify(ambiguous, testOtp(ambiguousPhone))).status, 409);
  console.log(
    "PASS unique legacy account migration preserves account ID, revokes old sessions, and rejects ambiguous legacy phones",
  );
} finally {
  await db.query("DELETE FROM rental_customers WHERE email LIKE ?", [`%${marker}@example.invalid`]);
  await db.query("DELETE FROM rental_otp_challenges WHERE phone IN (?)", [phones]);
  for (const p of phones)
    await db.query("DELETE FROM rental_auth_attempts WHERE bucket_key=?", [
      createHash("sha256")
        .update("otp-send:" + p)
        .digest("hex"),
    ]);
  await db.end();
}
