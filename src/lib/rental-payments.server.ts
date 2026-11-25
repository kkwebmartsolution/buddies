import { dispatchBookingNotification } from "./rental-notifications.server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { bookingEvent, RentalError, rentalDb, rows, transaction, write } from "./rental-db.server";
import { availability, getBooking, onlinePaymentEnabled } from "./rental-store.server";
import { indiaToday, type BookingItem, type Customer, type RentalProduct } from "./rental-types";

export function validSignature(raw: string, timestamp: string, supplied: string, secret: string) {
  if (!/^\d{10,16}$/.test(timestamp) || !/^[A-Za-z0-9+/]{43}=$/.test(supplied)) return false;
  const expected = createHmac("sha256", secret)
    .update(timestamp + raw)
    .digest();
  const actual = Buffer.from(supplied, "base64");
  return actual.length === expected.length && timingSafeEqual(expected, actual);
}
function mode(): "sandbox" | "production" {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}
type Order = {
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: string;
  payment_session_id: string;
};
type Payment = {
  cf_payment_id: string | number;
  order_id: string;
  payment_amount: number;
  payment_currency: string;
  payment_status: string;
  is_captured: boolean;
};
async function gateway<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  if (!onlinePaymentEnabled()) throw new RentalError(503, "Online payments are not enabled.");
  const host =
    mode() === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  const response = await fetch(`${host}/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "x-client-id": process.env.CASHFREE_APP_ID!,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
      "x-api-version": "2025-01-01",
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 409 && body && path === "orders") {
    // The provider may have created the order before a previous network timeout.
    return gateway<T>(`orders/${encodeURIComponent((body as { order_id: string }).order_id)}`);
  }
  if (!response.ok)
    throw new RentalError(
      502,
      "Cashfree is unavailable. Your booking remains in your account; please retry.",
    );
  return response.json() as Promise<T>;
}
export async function paymentOrder(user: Customer, id: string) {
  return transaction(async (db) => {
    const booking = await getBooking(id, user.id, db, true);
    const [hold] = await rows<{ valid: number; expires: number }>(
      db,
      "SELECT hold_expires_at>NOW() AS valid, UNIX_TIMESTAMP(hold_expires_at) AS expires FROM rental_bookings WHERE id=?",
      [id],
    );
    if (
      booking.payment_method !== "cashfree" ||
      booking.status !== "pending_payment" ||
      booking.payment_status !== "unpaid" ||
      !hold.valid
    )
      throw new RentalError(
        409,
        "This payment hold has ended. Create a new booking for current availability.",
      );
    if (!onlinePaymentEnabled()) throw new RentalError(503, "Online payment is not available.");
    const origin = new URL(process.env.APP_ORIGIN!).origin;
    const orderId = booking.gateway_order_id || `bd_${booking.id.replaceAll("-", "")}`;
    const order = booking.gateway_order_id
      ? await gateway<Order>(`orders/${encodeURIComponent(orderId)}`)
      : await gateway<Order>(
          "orders",
          {
            order_id: orderId,
            order_amount: booking.total_paise / 100,
            order_currency: "INR",
            customer_details: {
              customer_id: user.id,
              customer_name: booking.customer_name,
              customer_email: booking.customer_email,
              customer_phone: booking.customer_phone.replace(/[\s-]/g, ""),
            },
            order_meta: {
              return_url: `${origin}/account?payment_booking=${booking.id}`,
              notify_url: `${origin}/api/rentals/webhook`,
            },
            order_expiry_time: new Date(Number(hold.expires) * 1000).toISOString(),
            order_note: `Rental ${booking.booking_number}`,
          },
          booking.id,
        );
    if (
      order.order_id !== orderId ||
      Math.round(Number(order.order_amount) * 100) !== booking.total_paise ||
      order.order_currency !== "INR"
    )
      throw new RentalError(502, "Payment order amount mismatch.");
    await write(db, "UPDATE rental_bookings SET gateway_order_id=? WHERE id=?", [orderId, id]);
    if (order.order_status !== "ACTIVE")
      throw new RentalError(
        409,
        "This payment order is no longer active. Check payment status in My bookings.",
      );
    if (!order.payment_session_id)
      throw new RentalError(502, "Cashfree did not return a checkout session.");
    return {
      paymentSessionId: order.payment_session_id,
      orderId,
      amount: booking.total_paise,
      bookingId: id,
      mode: mode(),
    };
  });
}
async function settlePayment(orderId: string) {
  const [order, payments] = await Promise.all([
    gateway<Order>(`orders/${encodeURIComponent(orderId)}`),
    gateway<Payment[]>(`orders/${encodeURIComponent(orderId)}/payments`),
  ]);
  const payment = payments.find((p) => p.payment_status === "SUCCESS" && p.is_captured === true);
  if (
    order.order_id !== orderId ||
    order.order_status !== "PAID" ||
    order.order_currency !== "INR" ||
    !payment ||
    payment.order_id !== orderId ||
    payment.payment_currency !== "INR"
  )
    throw new RentalError(
      409,
      "Payment is not confirmed by Cashfree yet. Check payment status again shortly.",
    );
  const paymentId = String(payment.cf_payment_id);
  const settled = await transaction(async (db) => {
    const [found] = await rows<{ id: string }>(
      db,
      "SELECT id FROM rental_bookings WHERE gateway_order_id=?",
      [orderId],
    );
    if (!found) throw new RentalError(404, "Payment booking not found.");
    const b = await getBooking(found.id, undefined, db, true);
    if (
      Math.round(Number(order.order_amount) * 100) !== b.total_paise ||
      Math.round(Number(payment.payment_amount) * 100) !== b.total_paise
    )
      throw new RentalError(400, "Payment amount does not match the booking.");
    if (b.gateway_payment_id === paymentId && b.payment_status !== "unpaid")
      return { id: b.id, status: b.status };
    if (b.gateway_payment_id || b.payment_status !== "unpaid")
      throw new RentalError(409, "Payment needs studio review.");
    const items = await rows<BookingItem>(
      db,
      "SELECT * FROM rental_booking_items WHERE booking_id=?",
      [b.id],
    );
    const ids = items.map((i) => i.product_id).sort();
    const products = await rows<RentalProduct>(
      db,
      "SELECT * FROM rental_products WHERE id IN (?) ORDER BY id FOR UPDATE",
      [ids],
    );
    const used = await availability(db, ids, b.start_date, b.end_date, b.id);
    const canConfirm =
      b.status === "pending_payment" &&
      b.start_date >= indiaToday() &&
      items.every((i) => {
        const p = products.find((p) => p.id === i.product_id);
        return p && p.active && p.stock - (used.get(p.id) || 0) >= i.quantity;
      });
    await write(
      db,
      "UPDATE rental_bookings SET gateway_payment_id=?, payment_reference=?, payment_status=?, status=? WHERE id=?",
      [
        paymentId,
        paymentId,
        canConfirm ? "paid" : "refund_pending",
        canConfirm ? "confirmed" : "cancelled",
        b.id,
      ],
    );
    await bookingEvent(
      db,
      b.id,
      canConfirm ? "payment_received" : "refund_required",
      "cashfree",
      canConfirm
        ? "Cashfree payment verified; booking confirmed."
        : "Payment received after cancellation or loss of availability. Full refund required.",
    );
    return { id: b.id, status: canConfirm ? "confirmed" : "cancelled" };
  });
  await dispatchBookingNotification(settled.id);
  return settled;
}
export async function verifyPayment(user: Customer, input: unknown) {
  // Browser redirects and query parameters are never proof of payment.
  const data = z.object({ bookingId: z.string().uuid() }).parse(input);
  const booking = await getBooking(data.bookingId, user.id);
  if (booking.payment_method !== "cashfree" || !booking.gateway_order_id)
    throw new RentalError(400, "No Cashfree payment order exists for this booking.");
  return settlePayment(booking.gateway_order_id);
}
export async function paymentWebhook(request: Request) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret || !onlinePaymentEnabled())
    throw new RentalError(503, "Payment webhook is not configured.");
  const raw = await request.text();
  if (
    raw.length > 100000 ||
    !validSignature(
      raw,
      request.headers.get("x-webhook-timestamp") || "",
      request.headers.get("x-webhook-signature") || "",
      secret,
    )
  )
    throw new RentalError(400, "Invalid webhook signature.");
  const event = JSON.parse(raw);
  if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
    const data = z
      .object({
        order: z.object({ order_id: z.string().max(100) }),
        payment: z.object({ payment_status: z.literal("SUCCESS") }),
      })
      .parse(event.data);
    const [ours] = await rows<{ id: string }>(
      rentalDb(),
      "SELECT id FROM rental_bookings WHERE gateway_order_id=?",
      [data.order.order_id],
    );
    if (ours) await settlePayment(data.order.order_id);
  }
  return { received: true };
}
