import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "buddies_production_secret_key_2026_change_in_production";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function signAdminToken(username: string): string {
  return jwt.sign({ username, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAdminToken(token: string): { username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.role === "admin") {
      return decoded;
    }
  } catch (err) {
    return null;
  }
  return null;
}

export function checkAdminCredentials(password: string): boolean {
  if (password === ADMIN_PASSWORD) return true;
  try {
    // If bcrypt hashed password check
    const defaultHash = "$2a$10$7Z8lq4aV4h1Qj1k.Wn8Y9u1mN0V9e8Z1w2x3y4z5a6b7c8d9e0f1g";
    return bcrypt.compareSync(password, defaultHash);
  } catch {
    return false;
  }
}
