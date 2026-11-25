import { rentalDb, rows, write } from "./rental-db.server";
import type { RentalBooking } from "./rental-types";

export function whatsappEnabled() {
  return (
    process.env.WABA_NOTIFICATIONS_ENABLED === "true" &&
    !!process.env.WABA_API_KEY &&
    !!process.env.WABA_API_BASE &&
    !!process.env.WABA_ADMIN_PHONE
  );
}
type Notification = {
  booking_id: string;
  recipient: string;
  template_name: string;
  status: string;
  attempts: number;
};
function clean(value: string) {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function dateLabel(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}
export async function sendBookingNotification(id: string, retry = false) {
  if (!whatsappEnabled()) return;
  const db = rentalDb();
  // Claim before network I/O; parallel checkout retries/webhooks cannot send twice.
  const claim = await write(
    db,
    `UPDATE rental_admin_notifications SET status='sending',attempts=attempts+1,last_error='' WHERE booking_id=? AND status IN (${retry ? "'queued','failed'" : "'queued'"})`,
    [id],
  );
  if (!claim.affectedRows) return;
  try {
    const [notice] = await rows<Notification>(
      db,
      "SELECT * FROM rental_admin_notifications WHERE booking_id=?",
      [id],
    );
    const [booking] = await rows<RentalBooking>(db, "SELECT * FROM rental_bookings WHERE id=?", [
      id,
    ]);
    if (!booking || !["confirmed", "collected", "completed"].includes(booking.status)) {
      await write(
        db,
        "UPDATE rental_admin_notifications SET status='skipped',last_error='Booking is no longer confirmed.' WHERE booking_id=?",
        [id],
      );
      return;
    }
    const items = await rows<{ name: string; size: string; quantity: number }>(
      db,
      "SELECT name,size,quantity FROM rental_booking_items WHERE booking_id=? ORDER BY id",
      [id],
    );
    const productNames = items
      .map((i) => `${i.name}${i.size ? ` (${i.size})` : ""} x ${i.quantity}`)
      .join("; ");
    const params = [
      booking.booking_number,
      productNames,
      booking.customer_name,
      booking.customer_phone,
      dateLabel(booking.start_date),
      dateLabel(booking.end_date),
      `${booking.days} ${booking.days === 1 ? "day" : "days"}`,
    ].map(clean);
    const base = new URL(process.env.WABA_API_BASE!);
    if (base.protocol !== "https:") throw Error("WhatsApp API must use HTTPS.");
    const response = await fetch(`${base.href.replace(/\/$/, "")}/messages`, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${process.env.WABA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: `+${notice.recipient.replace(/\D/g, "")}`,
        type: "template",
        template: {
          name: notice.template_name,
          language: process.env.WABA_TEMPLATE_LANGUAGE || "en_US",
          params,
        },
      }),
    });
    const result = await response.json();
    const messageId = result.data?.whatsapp_message_id || result.data?.message_id;
    if (response.ok && typeof messageId === "string" && messageId) {
      await write(
        db,
        "UPDATE rental_admin_notifications SET status='accepted',provider_message_id=?,last_error='' WHERE booking_id=?",
        [messageId, id],
      );
      return;
    }
    // Only explicit provider rejections are safe to retry. Timeouts/unknown
    // failures need provider-log review because a message may already be sent.
    const knownRejection =
      !!result.error &&
      (response.status < 500 ||
        result.error.code === "meta_error" ||
        result.error.code === "template_malformed");
    const detail = String(result.error?.code || `http_${response.status}`)
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 80);
    await write(
      db,
      "UPDATE rental_admin_notifications SET status=?,last_error=? WHERE booking_id=?",
      [
        knownRejection ? "failed" : "unknown",
        `Provider response: ${detail}. Check KK WABA message logs.`,
        id,
      ],
    );
  } catch {
    await write(
      db,
      "UPDATE rental_admin_notifications SET status='unknown',last_error='Delivery request could not be confirmed. Check KK WABA logs before resending.' WHERE booking_id=?",
      [id],
    );
  }
}
export async function dispatchBookingNotification(id: string) {
  try {
    await sendBookingNotification(id);
  } catch {
    console.error("WhatsApp notification requires admin review; booking remains confirmed.");
  }
}
export async function notificationSummary() {
  const db = rentalDb();
  // A process may have stopped after sending but before recording the response.
  await write(
    db,
    "UPDATE rental_admin_notifications SET status='unknown',last_error='Interrupted send. Check KK WABA logs before resending.' WHERE status='sending' AND updated_at<DATE_SUB(NOW(),INTERVAL 2 MINUTE)",
  );
  const counts = await rows<{ status: string; count: number }>(
    db,
    "SELECT status,COUNT(*) AS count FROM rental_admin_notifications GROUP BY status",
  );
  const recent = await rows(
    db,
    "SELECT n.booking_id,b.booking_number,n.status,n.attempts,n.last_error,n.provider_message_id FROM rental_admin_notifications n JOIN rental_bookings b ON b.id=n.booking_id ORDER BY n.created_at DESC LIMIT 20",
  );
  return {
    enabled: whatsappEnabled(),
    recipient: process.env.WABA_ADMIN_PHONE || "",
    counts,
    recent,
  };
}
