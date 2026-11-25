import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { RentalError, rentalDb, rows, transaction, write, type Db } from "./rental-db.server";
import type { Customer } from "./rental-types";

export const mobileSchema = z
  .string()
  .trim()
  .max(25)
  .transform((value) => {
    let number = value.replace(/[\s()+-]/g, "");
    if (number.startsWith("91") && number.length === 12) number = number.slice(2);
    if (number.startsWith("0") && number.length === 11) number = number.slice(1);
    return number;
  })
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."));
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
function codeHash(challenge: string, code: string) {
  const secret = process.env.OTP_SECRET;
  if (!secret || secret.length < 32)
    throw new RentalError(503, "Mobile verification is not configured yet.");
  return createHmac("sha256", secret).update(`${challenge}:${code}`).digest("hex");
}
type Challenge = {
  phone: string;
  challenge_hash: string;
  code_hash: string;
  purpose: string;
  profile_json: string;
  attempts: number;
  sent: number;
  consumed: number;
  expired: number;
  cooling: number;
};

async function customerForPhone(db: Db, phone: string) {
  const linked = await rows<Customer>(
    db,
    "SELECT c.id,c.name,c.email,c.phone FROM rental_customer_phones p JOIN rental_customers c ON c.id=p.customer_id WHERE p.phone=?",
    [phone],
  );
  if (linked[0]) return linked[0];
  // Legacy phones were free-form. Match only valid normalized Indian numbers,
  // and never choose arbitrarily when multiple legacy accounts share a phone.
  const legacy = await rows<Customer>(
    db,
    "SELECT c.id,c.name,c.email,c.phone FROM rental_customers c LEFT JOIN rental_customer_phones p ON p.customer_id=c.id WHERE p.customer_id IS NULL",
  );
  const matches = legacy.filter((c) => mobileSchema.safeParse(c.phone).data === phone);
  if (matches.length > 1)
    throw new RentalError(
      409,
      "Multiple accounts use this mobile number. Please contact the studio to recover your account.",
    );
  return matches[0];
}

export async function sendOtp(
  body: Record<string, unknown>,
  throttle: (key: string, limit?: number) => Promise<void>,
) {
  const phone = mobileSchema.parse(body.phone);
  const purpose = z.enum(["login", "register"]).parse(body.purpose);
  const profile =
    purpose === "register"
      ? z
          .object({
            name: z.string().trim().min(2).max(100),
            email: z
              .string()
              .trim()
              .email()
              .max(190)
              .transform((v) => v.toLowerCase()),
          })
          .parse(body)
      : {};
  const key = process.env.FAST2SMS_API_KEY;
  const sender = process.env.FAST2SMS_SENDER_ID;
  const message = process.env.FAST2SMS_MESSAGE_ID;
  const template = process.env.FAST2SMS_OTP_VARIABLES;
  if (!key || !sender || !message || !template?.includes("{otp}"))
    throw new RentalError(
      503,
      "Mobile verification is not configured yet. Please contact the studio.",
    );
  await throttle(`otp-send:${phone}`, 5);
  await throttle("otp-send:global", 100);
  const challenge = randomBytes(32).toString("hex");
  const code = String(randomInt(100000, 1000000));
  const codeDigest = codeHash(challenge, code);
  await transaction(async (db) => {
    await write(
      db,
      "INSERT IGNORE INTO rental_otp_challenges (phone,challenge_hash,code_hash,purpose,profile_json,expires_at,resend_at) VALUES (?,?,?,?,?,NOW(),NOW())",
      [phone, digest(challenge), codeDigest, purpose, JSON.stringify(profile)],
    );
    const [old] = await rows<Challenge>(
      db,
      "SELECT *,resend_at>NOW() AS cooling FROM rental_otp_challenges WHERE phone=? FOR UPDATE",
      [phone],
    );
    if (old.cooling)
      throw new RentalError(429, "Please wait 60 seconds before requesting another OTP.");
    await write(
      db,
      "UPDATE rental_otp_challenges SET challenge_hash=?,code_hash=?,purpose=?,profile_json=?,attempts=0,sent=0,consumed=0,expires_at=DATE_ADD(NOW(),INTERVAL 10 MINUTE),resend_at=DATE_ADD(NOW(),INTERVAL 60 SECOND) WHERE phone=?",
      [digest(challenge), codeDigest, purpose, JSON.stringify(profile), phone],
    );
  });
  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: key, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        sender_id: sender,
        message,
        route: "dlt",
        numbers: phone,
        variables_values: template.replaceAll("{otp}", code),
      }),
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json();
    if (!response.ok || result.return !== true) throw new Error("SMS delivery request rejected");
    await write(
      rentalDb(),
      "UPDATE rental_otp_challenges SET sent=1 WHERE phone=? AND challenge_hash=?",
      [phone, digest(challenge)],
    );
  } catch {
    await write(
      rentalDb(),
      "UPDATE rental_otp_challenges SET consumed=1 WHERE phone=? AND challenge_hash=?",
      [phone, digest(challenge)],
    );
    throw new RentalError(
      502,
      "We could not send your OTP. Please wait a minute and try again, or contact the studio.",
    );
  }
  return { challenge, phone, expiresIn: 600, resendAfter: 60 };
}

export async function verifyOtp(
  body: Record<string, unknown>,
  throttle: (key: string, limit?: number) => Promise<void>,
) {
  const challenge = z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .parse(body.challenge);
  const code = z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit OTP.")
    .parse(body.otp);
  await throttle(`otp-verify:${digest(challenge)}`, 10);
  await throttle("otp-verify:global", 1000);
  const result = await transaction(async (db) => {
    const [row] = await rows<Challenge>(
      db,
      "SELECT *,expires_at<=NOW() AS expired FROM rental_otp_challenges WHERE challenge_hash=? FOR UPDATE",
      [digest(challenge)],
    );
    if (!row || !row.sent || row.consumed || row.expired || row.attempts >= 5)
      return { error: "OTP expired or unavailable. Request a new code." };
    await write(db, "UPDATE rental_otp_challenges SET attempts=attempts+1 WHERE phone=?", [
      row.phone,
    ]);
    if (
      !timingSafeEqual(
        Buffer.from(row.code_hash, "hex"),
        Buffer.from(codeHash(challenge, code), "hex"),
      )
    )
      return { error: "Incorrect OTP. Please check the code and try again." };
    let customer = await customerForPhone(db, row.phone);
    if (!customer && row.purpose === "login")
      return { error: "No account found for this mobile number. Choose Create account." };
    if (!customer) {
      const profile = JSON.parse(row.profile_json) as { name: string; email: string };
      const existingEmail = await rows(db, "SELECT id FROM rental_customers WHERE email=?", [
        profile.email,
      ]);
      if (existingEmail.length)
        return {
          error:
            "This email is already registered. Sign in using that account's mobile number or contact the studio.",
        };
      customer = { id: randomUUID(), phone: row.phone, ...profile };
      await write(
        db,
        "INSERT INTO rental_customers (id,name,email,phone,password_hash) VALUES (?,?,?,?,?)",
        [customer.id, customer.name, customer.email, customer.phone, "OTP_ONLY"],
      );
    }
    await write(
      db,
      "DELETE FROM rental_sessions WHERE customer_id=? AND NOT EXISTS (SELECT 1 FROM rental_customer_phones WHERE customer_id=?)",
      [customer.id, customer.id],
    );
    await write(
      db,
      "INSERT INTO rental_customer_phones (phone,customer_id) VALUES (?,?) ON DUPLICATE KEY UPDATE verified_at=NOW()",
      [row.phone, customer.id],
    );
    await write(db, "UPDATE rental_customers SET phone=? WHERE id=?", [row.phone, customer.id]);
    await write(db, "UPDATE rental_otp_challenges SET consumed=1,profile_json='{}' WHERE phone=?", [
      row.phone,
    ]);
    return { customer: { ...customer, phone: row.phone } };
  });
  if (result.error || !result.customer)
    throw new RentalError(400, result.error || "Could not verify OTP.");
  return result.customer;
}
