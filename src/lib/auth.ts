import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (
    !secret ||
    secret.length < 32 ||
    secret === "buddies_production_secret_key_2026_change_in_production"
  ) {
    throw new Error("Set a random JWT_SECRET of at least 32 characters in the server environment.");
  }
  return secret;
}

export function signAdminToken(username: string): string {
  return jwt.sign({ username, role: "admin" }, jwtSecret(), {
    expiresIn: "7d",
    algorithm: "HS256",
  });
}

export function verifyAdminToken(token: string): { username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, jwtSecret(), { algorithms: ["HS256"] }) as {
      username: string;
      role: string;
    };
    if (decoded && decoded.role === "admin") {
      return decoded;
    }
  } catch (err) {
    return null;
  }
  return null;
}

export function checkAdminCredentials(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") return false;
  if (process.env.NODE_ENV === "production" && (expected === "admin123" || expected.length < 12))
    return false;
  if (!expected.startsWith("$2")) return password === expected;
  try {
    return bcrypt.compareSync(password, expected);
  } catch {
    return false;
  }
}
