import { notificationSummary, sendBookingNotification } from "./rental-notifications.server";
import { ZodError, z } from "zod";
import {
  accountAction,
  checkOrigin,
  currentCustomer,
  requireCustomer,
  requireRentalAdmin,
  throttle,
} from "./rental-auth.server";
import { RentalError, rentalDb, rows } from "./rental-db.server";
import {
  adminBookingAction,
  cancelBooking,
  catalog,
  createBooking,
  getBookings,
  onlinePaymentEnabled,
  saveProduct,
} from "./rental-store.server";
import { paymentOrder, paymentWebhook, verifyPayment } from "./rental-payments.server";

function json(data: unknown, status = 200, cookie?: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
}
export async function rentalApi(
  request: Request,
  route: "catalog" | "account" | "bookings" | "admin" | "payment" | "webhook",
) {
  try {
    const url = new URL(request.url);
    if (route === "webhook") return json(await paymentWebhook(request));
    if (request.method === "GET") {
      if (route === "catalog")
        return json({
          products: await catalog(
            url.searchParams.get("start") || undefined,
            url.searchParams.get("end") || undefined,
          ),
          onlinePayment: onlinePaymentEnabled(),
        });
      if (route === "account") return json({ customer: await currentCustomer(request) });
      if (route === "bookings")
        return json({ bookings: await getBookings((await requireCustomer(request)).id) });
      if (route === "admin") {
        requireRentalAdmin(request);
        const [products, bookings, customers, notifications] = await Promise.all([
          catalog(undefined, undefined, true),
          getBookings(),
          rows(
            rentalDb(),
            "SELECT c.id,c.name,c.email,c.phone,c.created_at, COUNT(b.id) AS booking_count FROM rental_customers c LEFT JOIN rental_bookings b ON b.customer_id=c.id GROUP BY c.id ORDER BY c.created_at DESC LIMIT 300",
          ),
          rows<{ count: number }>(
            rentalDb(),
            "SELECT COUNT(*) AS count FROM rental_notification_outbox WHERE status='awaiting_integration'",
          ),
        ]);
        return json({
          products,
          bookings,
          customers,
          notificationCount: notifications[0].count,
          whatsapp: await notificationSummary(),
          onlinePayment: onlinePaymentEnabled(),
        });
      }
      throw new RentalError(405, "Method not allowed.");
    }
    checkOrigin(request);
    if (Number(request.headers.get("content-length") || 0) > 30000)
      throw new RentalError(413, "Request is too large.");
    const raw = await request.text();
    if (raw.length > 30000) throw new RentalError(413, "Request is too large.");
    const body = JSON.parse(raw);
    if (route === "account") {
      const result = await accountAction(request, body);
      return json(result.data, 200, result.cookie);
    }
    if (route === "admin") {
      requireRentalAdmin(request);
      if (body.action === "retry_notification") {
        await sendBookingNotification(z.string().uuid().parse(body.id), true);
        return json({ success: true });
      }
      if (body.action === "save_product") return json({ product: await saveProduct(body.product) });
      await adminBookingAction(body);
      return json({ success: true });
    }
    const user = await requireCustomer(request);
    if (route === "bookings") {
      if (body.action === "cancel") {
        await cancelBooking(user, z.string().uuid().parse(body.id));
        return json({ success: true });
      }
      await throttle(`checkout:${user.id}`, 40);
      return json({ booking: await createBooking(user, body) }, 201);
    }
    if (route === "payment") {
      await throttle(`payment:${user.id}`, 60);
      return json(
        body.action === "verify"
          ? await verifyPayment(user, body)
          : await paymentOrder(user, z.string().uuid().parse(body.bookingId)),
      );
    }
    throw new RentalError(405, "Method not allowed.");
  } catch (error) {
    if (error instanceof RentalError) return json({ message: error.message }, error.status);
    if (error instanceof ZodError)
      return json({ message: error.issues[0]?.message || "Please check your input." }, 400);
    if (error instanceof SyntaxError) return json({ message: "Invalid request body." }, 400);
    const code = (error as { code?: string }).code;
    console.error("Rental service error:", code || (error as Error).name);
    return json(
      {
        message:
          code === "ER_LOCK_DEADLOCK"
            ? "Availability changed. Please try again."
            : "The booking service is temporarily unavailable. Please try again.",
      },
      503,
    );
  }
}
