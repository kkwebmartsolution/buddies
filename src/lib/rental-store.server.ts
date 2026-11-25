import { dispatchBookingNotification } from "./rental-notifications.server";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  bookingEvent,
  RentalError,
  rentalDb,
  rows,
  transaction,
  write,
  type Db,
} from "./rental-db.server";
import { checkoutSchema, dateRangeSchema, productSchema } from "./rental-validation";
import {
  indiaToday,
  rentalDays,
  type Customer,
  type RentalProduct,
  type RentalBooking,
  type BookingItem,
} from "./rental-types";

type Occupancy = { product_id: string; start_date: string; end_date: string; quantity: number };
const blocking =
  "(b.status IN ('confirmed','collected','cancel_requested') OR (b.status='pending_payment' AND b.hold_expires_at>NOW()))";
export async function availability(
  db: Db,
  ids: string[],
  start: string,
  end: string,
  exclude = "",
) {
  if (!ids.length) return new Map<string, number>();
  const reserved = await rows<Occupancy>(
    db,
    `SELECT i.product_id, b.start_date, b.end_date, i.quantity FROM rental_booking_items i JOIN rental_bookings b ON b.id=i.booking_id WHERE i.product_id IN (?) AND b.start_date<=? AND b.end_date>=? AND b.id<>? AND ${blocking}`,
    [ids, end, start, exclude],
  );
  const result = new Map<string, number>();
  for (const id of ids) {
    // Peak concurrent use, rather than summing non-overlapping reservations.
    const events = new Map<number, number>();
    for (const item of reserved.filter((r) => r.product_id === id)) {
      const from = Math.max(Date.parse(start), Date.parse(item.start_date));
      const until = Math.min(Date.parse(end), Date.parse(item.end_date)) + 86400000;
      events.set(from, (events.get(from) || 0) + item.quantity);
      events.set(until, (events.get(until) || 0) - item.quantity);
    }
    let current = 0,
      peak = 0;
    for (const [, delta] of [...events.entries()].sort(([a], [b]) => a - b)) {
      current += delta;
      peak = Math.max(peak, current);
    }
    result.set(id, peak);
  }
  return result;
}
export async function catalog(start?: string, end?: string, admin = false) {
  const products = await rows<RentalProduct>(
    rentalDb(),
    `SELECT * FROM rental_products ${admin ? "" : "WHERE active=1"} ORDER BY kind, created_at, name`,
  );
  let used = new Map<string, number>();
  if (start || end) {
    dateRangeSchema.parse({ startDate: start, endDate: end });
    used = await availability(
      rentalDb(),
      products.map((p) => p.id),
      start!,
      end!,
    );
  }
  return products.map((p) => ({
    ...p,
    active: !!p.active,
    available: start && end ? Math.max(0, p.stock - (used.get(p.id) || 0)) : undefined,
  }));
}
export async function saveProduct(input: unknown) {
  const data = productSchema.parse(input);
  return transaction(async (db) => {
    const id = data.id || randomUUID();
    if (data.id) {
      const [existing] = await rows<RentalProduct>(
        db,
        "SELECT * FROM rental_products WHERE id=? FOR UPDATE",
        [id],
      );
      if (!existing) throw new RentalError(404, "Product not found.");
      const used = await availability(db, [id], indiaToday(), "9999-12-30");
      if (data.stock < (used.get(id) || 0))
        throw new RentalError(
          409,
          "Stock cannot be lower than quantities reserved in existing bookings.",
        );
    }
    const values = [
      data.kind,
      data.name,
      data.category,
      data.description,
      data.image,
      data.size,
      data.specifications,
      data.price_paise,
      data.deposit_paise,
      data.stock,
      data.min_days,
      data.active,
    ];
    if (data.id)
      await write(
        db,
        "UPDATE rental_products SET kind=?, name=?, category=?, description=?, image=?, size=?, specifications=?, price_paise=?, deposit_paise=?, stock=?, min_days=?, active=? WHERE id=?",
        [...values, id],
      );
    else
      await write(
        db,
        "INSERT INTO rental_products (kind,name,category,description,image,size,specifications,price_paise,deposit_paise,stock,min_days,active,id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [...values, id],
      );
    return { ...data, id };
  });
}

export async function getBookings(customerId?: string) {
  const bookings = await rows<RentalBooking & { hold_expired: number }>(
    rentalDb(),
    `SELECT *, (hold_expires_at<=NOW()) AS hold_expired FROM rental_bookings ${customerId ? "WHERE customer_id=?" : ""} ORDER BY created_at DESC LIMIT 300`,
    customerId ? [customerId] : [],
  );
  if (!bookings.length) return [];
  const ids = bookings.map((b) => b.id);
  const items = await rows<BookingItem & { booking_id: string }>(
    rentalDb(),
    "SELECT * FROM rental_booking_items WHERE booking_id IN (?)",
    [ids],
  );
  const events = await rows<RentalBooking["events"][number] & { booking_id: string }>(
    rentalDb(),
    "SELECT id, booking_id, event, details, created_at FROM rental_booking_events WHERE booking_id IN (?) ORDER BY id DESC",
    [ids],
  );
  return bookings.map((b) => ({
    ...b,
    status: b.status === "pending_payment" && b.hold_expired ? ("expired" as const) : b.status,
    deposit_returned: !!b.deposit_returned,
    items: items.filter((i) => i.booking_id === b.id),
    events: events.filter((e) => e.booking_id === b.id),
  }));
}
export async function getBooking(
  id: string,
  customerId?: string,
  db: Db = rentalDb(),
  lock = false,
) {
  const [booking] = await rows<RentalBooking>(
    db,
    `SELECT * FROM rental_bookings WHERE id=? ${customerId ? "AND customer_id=?" : ""} ${lock ? "FOR UPDATE" : ""}`,
    customerId ? [id, customerId] : [id],
  );
  if (!booking) throw new RentalError(404, "Booking not found.");
  return booking;
}
export async function createBooking(user: Customer, input: unknown) {
  const data = checkoutSchema.parse(input);
  const items = [...data.items].sort((a, b) => a.productId.localeCompare(b.productId));
  if (new Set(items.map((i) => i.productId)).size !== items.length)
    throw new RentalError(400, "Duplicate cart items.");
  if (data.paymentMethod === "cashfree" && !onlinePaymentEnabled())
    throw new RentalError(400, "Online payment is not available. Please choose pay at pickup.");
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ ...data, items }))
    .digest("hex");
  const booking = await transaction(async (db) => {
    // Serialize retries for a customer before taking inventory locks.
    await rows(db, "SELECT id FROM rental_customers WHERE id=? FOR UPDATE", [user.id]);
    const [existing] = await rows<RentalBooking & { request_hash: string }>(
      db,
      "SELECT * FROM rental_bookings WHERE customer_id=? AND idempotency_key=?",
      [user.id, data.idempotencyKey],
    );
    if (existing) {
      if (existing.request_hash !== requestHash)
        throw new RentalError(409, "This checkout has changed. Refresh and try again.");
      return existing;
    }
    dateRangeSchema.parse(data);
    const pending = await rows<{ count: number }>(
      db,
      "SELECT COUNT(*) AS count FROM rental_bookings WHERE customer_id=? AND (status IN ('confirmed','cancel_requested') OR (status='pending_payment' AND hold_expires_at>NOW()))",
      [user.id],
    );
    if (pending[0].count >= 10)
      throw new RentalError(429, "Please manage your existing bookings before creating more.");
    const ids = items.map((i) => i.productId);
    const products = await rows<RentalProduct>(
      db,
      "SELECT * FROM rental_products WHERE id IN (?) ORDER BY id FOR UPDATE",
      [ids],
    );
    const used = await availability(db, ids, data.startDate, data.endDate);
    const days = rentalDays(data.startDate, data.endDate);
    let rental = 0,
      deposit = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.active)
        throw new RentalError(409, "An item is no longer available. Please update your cart.");
      if (days < product.min_days)
        throw new RentalError(
          400,
          `${product.name} requires at least ${product.min_days} rental days.`,
        );
      if (product.stock - (used.get(product.id) || 0) < item.quantity)
        throw new RentalError(
          409,
          `${product.name} is not available in that quantity for your dates.`,
        );
      rental += product.price_paise * days * item.quantity;
      deposit += product.deposit_paise * item.quantity;
    }
    if (rental + deposit > 100000000 || rental <= 0)
      throw new RentalError(400, "Please contact the studio for this booking value.");
    if (data.expectedTotal !== rental + deposit)
      throw new RentalError(
        409,
        "Pricing has changed. Refresh your cart and review the new total before booking.",
      );
    const id = randomUUID();
    const number = `BD-${new Date().getUTCFullYear()}-${id.slice(0, 8).toUpperCase()}`;
    const status = data.paymentMethod === "pickup" ? "confirmed" : "pending_payment";
    await write(
      db,
      `INSERT INTO rental_bookings (id,booking_number,customer_id,idempotency_key,request_hash,start_date,end_date,days,status,payment_method,rental_paise,deposit_paise,total_paise,customer_name,customer_email,customer_phone,notes,hold_expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,${status === "pending_payment" ? "DATE_ADD(NOW(), INTERVAL 15 MINUTE)" : "NULL"})`,
      [
        id,
        number,
        user.id,
        data.idempotencyKey,
        requestHash,
        data.startDate,
        data.endDate,
        days,
        status,
        data.paymentMethod,
        rental,
        deposit,
        rental + deposit,
        user.name,
        user.email,
        user.phone,
        data.notes,
      ],
    );
    for (const item of items) {
      const p = products.find((p) => p.id === item.productId)!;
      await write(
        db,
        "INSERT INTO rental_booking_items (booking_id,product_id,name,image,size,quantity,price_paise,deposit_paise) VALUES (?,?,?,?,?,?,?,?)",
        [id, p.id, p.name, p.image, p.size, item.quantity, p.price_paise, p.deposit_paise],
      );
    }
    await bookingEvent(
      db,
      id,
      status === "confirmed" ? "booking_confirmed" : "booking_created",
      "customer",
      status === "confirmed"
        ? "Pay at pickup. Dates reserved."
        : "Awaiting online payment; inventory held for 15 minutes.",
    );
    return getBooking(id, user.id, db);
  });
  await dispatchBookingNotification(booking.id);
  return booking;
}
export function onlinePaymentEnabled() {
  return (
    process.env.RENTAL_PAYMENT_PROVIDER === "cashfree" &&
    !!process.env.CASHFREE_APP_ID &&
    !!process.env.CASHFREE_SECRET_KEY &&
    !!process.env.APP_ORIGIN
  );
}
export async function cancelBooking(user: Customer, id: string) {
  return transaction(async (db) => {
    const b = await getBooking(id, user.id, db, true);
    if (b.status === "cancelled" || b.status === "cancel_requested") return;
    if (
      !["confirmed", "pending_payment", "expired"].includes(b.status) ||
      b.start_date < indiaToday()
    )
      throw new RentalError(409, "Contact the studio to change an active or completed rental.");
    const paid = b.payment_status === "paid";
    const status = paid ? "cancel_requested" : "cancelled";
    await write(db, "UPDATE rental_bookings SET status=? WHERE id=?", [status, id]);
    await bookingEvent(
      db,
      id,
      paid ? "cancellation_requested" : "booking_cancelled",
      "customer",
      paid ? "Studio review and refund required." : "Unpaid booking cancelled; inventory released.",
    );
  });
}

export async function adminBookingAction(input: unknown) {
  const data = z
    .object({
      id: z.string().uuid(),
      action: z.enum([
        "collect",
        "complete",
        "cancel",
        "record_payment",
        "record_refund",
        "return_deposit",
      ]),
      reference: z.string().trim().max(190).default(""),
    })
    .parse(input);
  return transaction(async (db) => {
    const b = await getBooking(data.id, undefined, db, true);
    let event = "",
      details = "";
    switch (data.action) {
      case "record_payment":
        if (
          b.payment_method !== "pickup" ||
          b.payment_status !== "unpaid" ||
          b.status !== "confirmed"
        )
          throw new RentalError(409, "Only unpaid pay-at-pickup bookings can be marked paid.");
        if (data.reference.length < 3)
          throw new RentalError(400, "Enter the cash receipt or payment reference.");
        await write(
          db,
          "UPDATE rental_bookings SET payment_status='paid', payment_reference=? WHERE id=?",
          [data.reference, b.id],
        );
        event = "payment_received";
        details = `Pickup payment recorded: ${data.reference}`;
        break;
      case "collect":
        if (
          b.status !== "confirmed" ||
          b.payment_status !== "paid" ||
          b.start_date > indiaToday() ||
          b.end_date < indiaToday()
        )
          throw new RentalError(
            409,
            "Collection requires a paid, confirmed booking within its rental dates.",
          );
        await write(db, "UPDATE rental_bookings SET status='collected' WHERE id=?", [b.id]);
        event = "items_collected";
        break;
      case "complete":
        if (b.status !== "collected")
          throw new RentalError(409, "Only collected rentals can be completed.");
        await write(db, "UPDATE rental_bookings SET status='completed' WHERE id=?", [b.id]);
        event = "items_returned";
        break;
      case "cancel":
        if (!["pending_payment", "confirmed", "cancel_requested", "expired"].includes(b.status))
          throw new RentalError(409, "This booking cannot be cancelled.");
        await write(
          db,
          "UPDATE rental_bookings SET status='cancelled', payment_status=? WHERE id=?",
          [b.payment_status === "paid" ? "refund_pending" : b.payment_status, b.id],
        );
        event = "booking_cancelled";
        details =
          b.payment_status === "paid"
            ? "Refund pending. Record the external refund when completed."
            : "Inventory released.";
        break;
      case "record_refund":
        if (b.status !== "cancelled" || b.payment_status !== "refund_pending")
          throw new RentalError(409, "No cancellation refund is pending.");
        if (data.reference.length < 3)
          throw new RentalError(400, "Enter the completed external refund reference.");
        await write(
          db,
          "UPDATE rental_bookings SET payment_status='refunded', refund_reference=?, deposit_returned=1 WHERE id=?",
          [data.reference, b.id],
        );
        event = "refund_recorded";
        details = `Full refund recorded: ${data.reference}`;
        break;
      case "return_deposit":
        if (
          b.status !== "completed" ||
          b.payment_status !== "paid" ||
          b.deposit_returned ||
          !b.deposit_paise
        )
          throw new RentalError(409, "No deposit return is due for this booking.");
        if (data.reference.length < 3)
          throw new RentalError(400, "Enter the deposit refund receipt/reference.");
        await write(
          db,
          "UPDATE rental_bookings SET deposit_returned=1, deposit_reference=? WHERE id=?",
          [data.reference, b.id],
        );
        event = "deposit_returned";
        details = data.reference;
        break;
    }
    await bookingEvent(db, b.id, event, "admin", details);
  });
}
