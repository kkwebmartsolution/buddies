import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "./cms-store";

export class RentalError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function rentalDb() {
  const pool = getDbPool();
  if (!pool)
    throw new RentalError(503, "Booking service is temporarily unavailable. Please try again.");
  return pool;
}
export type Db = ReturnType<typeof rentalDb> | PoolConnection;
export async function rows<T>(db: Db, sql: string, values: unknown[] = []): Promise<T[]> {
  const [result] = await db.query<RowDataPacket[]>(sql, values);
  return result as T[];
}
export async function write(db: Db, sql: string, values: unknown[] = []) {
  const [result] = await db.query<ResultSetHeader>(sql, values);
  return result;
}
export async function transaction<T>(action: (db: PoolConnection) => Promise<T>): Promise<T> {
  const db = await rentalDb().getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await db.beginTransaction();
    const result = await action(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}

export async function bookingEvent(
  db: Db,
  bookingId: string,
  event: string,
  actor: string,
  details = "",
) {
  const result = await write(
    db,
    "INSERT INTO rental_booking_events (booking_id, event, actor, details) VALUES (?, ?, ?, ?)",
    [bookingId, event, actor, details],
  );
  await write(db, "INSERT INTO rental_notification_outbox (booking_id, event_id) VALUES (?, ?)", [
    bookingId,
    result.insertId,
  ]);
  if (
    process.env.WABA_NOTIFICATIONS_ENABLED === "true" &&
    (event === "booking_confirmed" || (event === "payment_received" && actor === "cashfree"))
  ) {
    await write(
      db,
      "INSERT IGNORE INTO rental_admin_notifications (booking_id,recipient,template_name) VALUES (?,?,?)",
      [
        bookingId,
        process.env.WABA_ADMIN_PHONE || "",
        process.env.WABA_BOOKING_TEMPLATE || "buddies_booking_confirmed",
      ],
    );
  }
}
