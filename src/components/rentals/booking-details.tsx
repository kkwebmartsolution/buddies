import { Download } from "lucide-react";
import { money, statusLabel, type RentalBooking } from "@/lib/rental-types";
import { rentalImage, secondaryClass, StatusBadge } from "./shared";

function downloadBooking(b: RentalBooking) {
  const text = [
    "BUDDIES PRODUCTION — RENTAL BOOKING SUMMARY",
    b.booking_number,
    "",
    `Customer: ${b.customer_name}`,
    `Email: ${b.customer_email}`,
    `Phone: ${b.customer_phone}`,
    `Pickup: ${b.start_date} | Return: ${b.end_date} (${b.days} days)`,
    `Booking: ${statusLabel(b.status)} | Payment: ${statusLabel(b.payment_status)}`,
    "",
    ...b.items.map(
      (i) =>
        `${i.name}${i.size ? ` (${i.size})` : ""} × ${i.quantity} — ${money(i.price_paise)} / day`,
    ),
    "",
    `Rental: ${money(b.rental_paise)}`,
    `Refundable deposit: ${money(b.deposit_paise)}`,
    `Total: ${money(b.total_paise)}`,
    `Payment reference: ${b.payment_reference || "Not paid"}`,
    `Refund reference: ${b.refund_reference || "—"}`,
    `Deposit returned: ${b.deposit_returned ? "Yes" : "No"}`,
    "",
    "This is a booking summary, not a tax invoice.",
    "Pickup: Buddies Production studio, Guwahati.",
    "Contact the studio to confirm the pickup time.",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${b.booking_number}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function BookingDetails({ booking: b }: { booking: RentalBooking }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold">{b.booking_number}</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            {b.start_date} → {b.end_date} · {b.days} rental day(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={b.status} />
          <StatusBadge value={b.payment_status} />
        </div>
      </div>
      <div className="divide-y divide-white/10">
        {b.items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-3 py-3">
            <img
              src={rentalImage(item.image)}
              alt={item.name}
              className="size-14 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.size ? `Size ${item.size} · ` : ""}Qty {item.quantity} ·{" "}
                {money(item.price_paise)} / day
              </p>
            </div>
            <span className="text-sm">{money(item.price_paise * item.quantity * b.days)}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-3">
        <div className="text-muted-foreground">
          Rental<p className="mt-1 text-foreground">{money(b.rental_paise)}</p>
        </div>
        <div className="text-muted-foreground">
          Deposit
          <p className="mt-1 text-foreground">
            {money(b.deposit_paise)}{" "}
            {b.deposit_returned && <span className="text-[10px] text-emerald-300">Returned</span>}
          </p>
        </div>
        <div className="text-muted-foreground">
          Total<p className="mt-1 font-semibold text-foreground">{money(b.total_paise)}</p>
        </div>
      </div>
      <div className="text-xs leading-6 text-muted-foreground">
        <p>
          Payment: {b.payment_method === "pickup" ? "Pay at pickup" : "Cashfree online payment"}
        </p>
        {b.payment_reference && (
          <p className="break-all">Receipt / reference: {b.payment_reference}</p>
        )}
        {b.refund_reference && <p className="break-all">Refund reference: {b.refund_reference}</p>}
        {b.deposit_reference && (
          <p className="break-all">Deposit return reference: {b.deposit_reference}</p>
        )}
        {b.notes && <p>Booking note: {b.notes}</p>}
        {b.status === "pending_payment" && (
          <p className="text-amber-200">
            Payment hold expires 15 minutes after booking creation. Complete payment promptly.
          </p>
        )}
        {b.status === "expired" && (
          <p className="text-amber-200">
            Payment hold expired. Browse the collection to create a new booking.
          </p>
        )}
        {b.payment_status === "refund_pending" && (
          <p className="text-amber-200">
            Your refund is awaiting studio processing. This status does not mean money has been
            returned yet.
          </p>
        )}
        {b.status === "cancel_requested" && (
          <p className="text-amber-200">Your cancellation request is awaiting studio review.</p>
        )}
      </div>
      <details className="border-t border-border pt-4">
        <summary className="cursor-pointer text-xs text-muted-foreground">Booking timeline</summary>
        <ol className="mt-4 space-y-3">
          {b.events.map((e) => (
            <li key={e.id} className="border-l border-primary/40 pl-3">
              <p className="text-xs capitalize">{statusLabel(e.event)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{e.details}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{e.created_at}</p>
            </li>
          ))}
        </ol>
      </details>
      <button className={secondaryClass} onClick={() => downloadBooking(b)}>
        <Download size={14} />
        Download summary
      </button>
    </div>
  );
}
