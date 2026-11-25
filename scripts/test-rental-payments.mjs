import { mockSmsConfig, testRegister } from "./rental-test-auth.mjs";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import mysql from "mysql2/promise";
assert.ok(
  ["localhost", "127.0.0.1", "::1"].includes(process.env.MYSQL_HOST),
  "Payment tests require local MySQL",
);
const sms = mockSmsConfig();
process.env.FAST2SMS_MOCK_STATE = sms.env.FAST2SMS_MOCK_STATE;
const base = "http://127.0.0.1:8182",
  keySecret = "isolated-cashfree-test-secret";
const marker = randomUUID().slice(0, 8),
  email = `payment-test-${marker}@example.invalid`,
  ids = [];
mkdirSync(".rental-test-artifacts", { recursive: true });
const stateFile = path.resolve(".rental-test-artifacts", `cashfree-state-${marker}.json`),
  states = {};
writeFileSync(stateFile, "{}");
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
const child = spawn(
  process.execPath,
  [
    "--import",
    "./scripts/mock-cashfree.mjs",
    "--import",
    "./scripts/mock-fast2sms.mjs",
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "8182",
    "--strictPort",
  ],
  {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...sms.env,
      APP_ORIGIN: base,
      RENTAL_PAYMENT_PROVIDER: "cashfree",
      CASHFREE_APP_ID: "test_isolated",
      CASHFREE_SECRET_KEY: keySecret,
      CASHFREE_ENV: "sandbox",
      CASHFREE_MOCK_STATE: stateFile,
    },
  },
);
let logs = "";
child.stdout.on("data", (s) => {
  logs = (logs + s).slice(-4000);
});
child.stderr.on("data", (s) => {
  logs = (logs + s).slice(-4000);
});
async function api(route, body, cookie = "") {
  const r = await fetch(`${base}/api/rentals/${route}`, {
    method: body ? "POST" : "GET",
    headers: { Origin: base, Cookie: cookie, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: r.status,
    data: await r.json(),
    cookie: r.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; "),
  };
}
function setState(orderId, value) {
  states[orderId] = value;
  writeFileSync(stateFile, JSON.stringify(states));
}
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (child.exitCode !== null) throw new Error(`Test server exited: ${logs}`);
    try {
      const r = await fetch(base + "/api/rentals/catalog");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(1000);
  }
  assert.ok(ready, "Isolated payment test server did not start");
  const login = await fetch(base + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: process.env.ADMIN_PASSWORD }),
  });
  assert.equal(login.status, 200);
  const admin = login.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const user = await testRegister(api, {
    name: "Payment test customer",
    email,
  });
  assert.equal(user.status, 200);
  const product = await api(
    "admin",
    {
      action: "save_product",
      product: {
        kind: "equipment",
        name: `Payment fixture ${marker}`,
        category: "Test",
        description: "Isolated payment test product.",
        image: "/src/assets/rental-camera.jpg",
        size: "",
        specifications: "",
        price_paise: 10000,
        deposit_paise: 5000,
        stock: 1,
        min_days: 1,
        active: true,
      },
    },
    admin,
  );
  assert.equal(product.status, 200);
  ids.push(product.data.product.id);
  const date = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  async function create(method = "cashfree") {
    const r = await api(
      "bookings",
      {
        items: [{ productId: ids[0], quantity: 1 }],
        startDate: date,
        endDate: date,
        paymentMethod: method,
        expectedTotal: 15000,
        idempotencyKey: randomUUID(),
      },
      user.cookie,
    );
    assert.equal(r.status, 201, JSON.stringify(r.data));
    return r.data.booking;
  }
  const booking = await create();
  assert.equal(booking.status, "pending_payment");
  assert.equal(booking.payment_status, "unpaid");
  const order = await api("payment", { bookingId: booking.id }, user.cookie);
  assert.equal(order.status, 200, JSON.stringify(order.data));
  assert.equal(order.data.amount, 15000);
  assert.ok(order.data.paymentSessionId);
  const repeat = await api("payment", { bookingId: booking.id }, user.cookie);
  assert.equal(repeat.data.orderId, order.data.orderId);
  console.log("PASS Cashfree session creation and order reuse use the server total");
  const pending = await api(
    "payment",
    { action: "verify", bookingId: booking.id, payment_status: "SUCCESS" },
    user.cookie,
  );
  assert.equal(pending.status, 409);
  setState(order.data.orderId, "authorized");
  const authorized = await api("payment", { action: "verify", bookingId: booking.id }, user.cookie);
  assert.equal(authorized.status, 409);
  setState(order.data.orderId, "wrong");
  const wrong = await api("payment", { action: "verify", bookingId: booking.id }, user.cookie);
  assert.equal(wrong.status, 400);
  console.log(
    "PASS browser success claims, uncaptured payments and amount mismatches cannot confirm",
  );
  setState(order.data.orderId, "ok");
  const paid = await api("payment", { action: "verify", bookingId: booking.id }, user.cookie);
  assert.equal(paid.status, 200);
  assert.equal(paid.data.status, "confirmed");
  const again = await api("payment", { action: "verify", bookingId: booking.id }, user.cookie);
  assert.equal(again.status, 200);
  const raw = JSON.stringify({
      type: "PAYMENT_SUCCESS_WEBHOOK",
      data: { order: { order_id: order.data.orderId }, payment: { payment_status: "SUCCESS" } },
    }),
    timestamp = String(Date.now());
  const signature = createHmac("sha256", keySecret)
    .update(timestamp + raw)
    .digest("base64");
  const invalid = await fetch(base + "/api/rentals/webhook", {
    method: "POST",
    headers: { "x-webhook-timestamp": timestamp, "x-webhook-signature": "x".repeat(43) + "=" },
    body: raw,
  });
  assert.equal(invalid.status, 400);
  const webhook = await fetch(base + "/api/rentals/webhook", {
    method: "POST",
    headers: { "x-webhook-timestamp": timestamp, "x-webhook-signature": signature },
    body: raw,
  });
  assert.equal(webhook.status, 200);
  const [events] = await db.query(
    "SELECT COUNT(*) AS count FROM rental_booking_events WHERE booking_id=? AND event='payment_received'",
    [booking.id],
  );
  assert.equal(events[0].count, 1);
  console.log("PASS Cashfree raw-body HMAC verification and callback/webhook idempotency");
  const manual = await api(
    "admin",
    { id: booking.id, action: "record_payment", reference: "not-allowed" },
    admin,
  );
  assert.equal(manual.status, 409);
  await api("admin", { id: booking.id, action: "cancel" }, admin);
  console.log("PASS Cashfree payments cannot be manually marked paid");
  const late = await create(),
    lateOrder = await api("payment", { bookingId: late.id }, user.cookie);
  assert.equal(lateOrder.status, 200);
  await db.query(
    "UPDATE rental_bookings SET hold_expires_at=DATE_SUB(NOW(),INTERVAL 1 MINUTE) WHERE id=?",
    [late.id],
  );
  const expired = await api("payment", { bookingId: late.id }, user.cookie);
  assert.equal(expired.status, 409);
  const replacement = await create("pickup");
  assert.equal(replacement.status, "confirmed");
  setState(lateOrder.data.orderId, "ok");
  const latePayment = await api("payment", { action: "verify", bookingId: late.id }, user.cookie);
  assert.equal(latePayment.status, 200);
  assert.equal(latePayment.data.status, "cancelled");
  const list = await api("bookings", undefined, user.cookie);
  assert.equal(list.data.bookings.find((b) => b.id === late.id).payment_status, "refund_pending");
  assert.equal(list.data.bookings.find((b) => b.id === replacement.id).status, "confirmed");
  console.log(
    "PASS expired holds release stock; late paid orders require refund without overselling",
  );
  const messages = JSON.parse(readFileSync(sms.env.FAST2SMS_MOCK_STATE, "utf8")).waba;
  assert.equal(messages.filter((m) => m.template.params[0] === booking.booking_number).length, 1);
  assert.equal(messages.filter((m) => m.template.params[0] === late.booking_number).length, 0);
  console.log("PASS paid booking sends one WhatsApp alert; late/refunded payment sends none");
  console.log("Cashfree tests passed using a mocked provider; no real payment was attempted.");
} finally {
  child.kill();
  sms.cleanup();
  await db.query(
    "DELETE b FROM rental_bookings b JOIN rental_customers c ON c.id=b.customer_id WHERE c.email=?",
    [email],
  );
  await db.query(
    "DELETE o FROM rental_otp_challenges o JOIN rental_customers c ON c.phone=o.phone WHERE c.email=?",
    [email],
  );
  await db.query("DELETE FROM rental_customers WHERE email=?", [email]);
  if (ids.length) await db.query("DELETE FROM rental_products WHERE id IN (?)", [ids]);
  await db.end();
  unlinkSync(stateFile);
}
