import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { verifyAdminToken } from "./auth";
import { RentalError, rentalDb, rows, write } from "./rental-db.server";
import { sendOtp, verifyOtp } from "./rental-otp.server";
import type { Customer } from "./rental-types";

const cookieName = "buddies_customer_session";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const cookie = (request: Request, name: string) =>
  request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";

export function checkOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (
    request.headers.get("origin") !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new RentalError(403, "Please submit this request from the website.");
  }
}
export function requireRentalAdmin(request: Request) {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer /, "") ||
    cookie(request, "buddies_admin_token");
  if (!verifyAdminToken(token)) throw new RentalError(401, "Please sign in as an administrator.");
}
export async function currentCustomer(request: Request): Promise<Customer | null> {
  const token = cookie(request, cookieName);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await rows<Customer>(
    rentalDb(),
    `SELECT c.id, c.name, c.email, c.phone FROM rental_sessions s JOIN rental_customers c ON c.id=s.customer_id JOIN rental_customer_phones p ON p.customer_id=c.id WHERE s.token_hash=? AND s.expires_at>NOW()`,
    [hash(token)],
  );
  return result[0] || null;
}
export async function requireCustomer(request: Request) {
  const user = await currentCustomer(request);
  if (!user) throw new RentalError(401, "Please sign in to manage your booking.");
  return user;
}
function sessionCookie(request: Request, token: string, age: number) {
  const secure = new URL(process.env.APP_ORIGIN || request.url).protocol === "https:";
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? "; Secure" : ""}`;
}
async function newSession(request: Request, id: string) {
  const token = randomBytes(32).toString("hex");
  await write(
    rentalDb(),
    "INSERT INTO rental_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
    [hash(token), id],
  );
  return sessionCookie(request, token, 7 * 86400);
}
export async function throttle(key: string, limit = 15) {
  const db = rentalDb();
  await write(
    db,
    `INSERT INTO rental_auth_attempts (bucket_key, attempts, expires_at) VALUES (?,1,DATE_ADD(NOW(), INTERVAL 15 MINUTE))
    ON DUPLICATE KEY UPDATE attempts=IF(expires_at<=NOW(),1,attempts+1), expires_at=IF(expires_at<=NOW(),DATE_ADD(NOW(), INTERVAL 15 MINUTE),expires_at)`,
    [hash(key)],
  );
  const [bucket] = await rows<{ attempts: number }>(
    db,
    "SELECT attempts FROM rental_auth_attempts WHERE bucket_key=?",
    [hash(key)],
  );
  if (bucket.attempts > limit)
    throw new RentalError(429, "Too many attempts. Please try again in 15 minutes.");
}
export async function accountAction(request: Request, body: Record<string, unknown>) {
  const action = z.enum(["request_otp", "verify_otp", "logout", "profile"]).parse(body.action);
  if (action === "logout") {
    await write(rentalDb(), "DELETE FROM rental_sessions WHERE token_hash=?", [
      hash(cookie(request, cookieName)),
    ]);
    return { data: { customer: null }, cookie: sessionCookie(request, "", 0) };
  }
  if (action === "profile") {
    const user = await requireCustomer(request);
    const name = z.string().trim().min(2).max(100).parse(body.name);
    if (body.phone !== undefined && body.phone !== user.phone)
      throw new RentalError(
        400,
        "Your verified mobile number cannot be changed here. Please contact the studio.",
      );
    await write(rentalDb(), "UPDATE rental_customers SET name=? WHERE id=?", [name, user.id]);
    return { data: { customer: { ...user, name } } };
  }
  if (action === "request_otp") return { data: await sendOtp(body, throttle) };
  const customer = await verifyOtp(body, throttle);
  return { data: { customer }, cookie: await newSession(request, customer.id) };
}
