import { useEffect, useRef, useState } from "react";
import { ArrowRight, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { payForBooking, rentalRequest } from "@/lib/rental-client";
import {
  indiaToday,
  money,
  rentalDays,
  type Customer,
  type RentalProduct,
  type RentalBooking,
} from "@/lib/rental-types";
import { useCms } from "@/hooks/use-cms";
import { CustomerAuth } from "./customer-auth";
import { useRentalCart } from "./cart-context";
import {
  buttonClass,
  DateFields,
  EmptyState,
  inputClass,
  Notice,
  rentalImage,
  RentalShell,
  secondaryClass,
} from "./shared";

export function RentalCheckout() {
  const { cart, setCart, ready } = useRentalCart();
  const cms = useCms();
  const [products, setProducts] = useState<RentalProduct[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [online, setOnline] = useState(false);
  const [method, setMethod] = useState<"pickup" | "cashfree">("pickup");
  const [notes, setNotes] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<RentalBooking | null>(null);
  const [reload, setReload] = useState(0);
  const attempt = useRef({ key: "", fingerprint: "" });
  useEffect(() => {
    rentalRequest<{ customer: Customer | null }>("account")
      .then((r) => setCustomer(r.customer))
      .catch(() => {});
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const search =
      cart.startDate && cart.endDate ? `?start=${cart.startDate}&end=${cart.endDate}` : "";
    rentalRequest<{ products: RentalProduct[]; onlinePayment: boolean }>(`catalog${search}`)
      .then((r) => {
        if (active) {
          setProducts(r.products);
          setOnline(r.onlinePayment);
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cart.startDate, cart.endDate, reload]);
  const days = rentalDays(cart.startDate, cart.endDate);
  const validDates =
    Number.isFinite(days) && days >= 1 && days <= 90 && cart.startDate >= indiaToday();
  const lines = cart.items.map((i) => ({
    ...i,
    product: products.find((p) => p.id === i.productId),
  }));
  const rental = lines.reduce(
    (n, i) => n + (i.product?.price_paise || 0) * i.quantity * (validDates ? days : 0),
    0,
  );
  const deposit = lines.reduce((n, i) => n + (i.product?.deposit_paise || 0) * i.quantity, 0);
  const unavailable = lines.some(
    (i) =>
      !i.product ||
      (i.product.available ?? i.product.stock) < i.quantity ||
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 50 ||
      (validDates && days < i.product.min_days),
  );
  async function placeOrder() {
    if (!customer || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = {
        items: cart.items,
        startDate: cart.startDate,
        endDate: cart.endDate,
        paymentMethod: method,
        notes,
        expectedTotal: rental + deposit,
      };
      const fingerprint = JSON.stringify(data);
      if (attempt.current.fingerprint !== fingerprint) {
        const persisted = sessionStorage.getItem("buddies_checkout_attempt");
        const previous = persisted ? JSON.parse(persisted) : null;
        attempt.current =
          previous?.fingerprint === fingerprint
            ? previous
            : { fingerprint, key: crypto.randomUUID() };
        sessionStorage.setItem("buddies_checkout_attempt", JSON.stringify(attempt.current));
      }
      const result = await rentalRequest<{ booking: RentalBooking }>("bookings", {
        ...data,
        idempotencyKey: attempt.current.key,
      });
      setOrder(result.booking);
      setCart({ ...cart, items: [] });
      sessionStorage.removeItem("buddies_checkout_attempt");
      if (method === "cashfree") {
        await payForBooking(result.booking.id);
        window.location.assign("/account");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <RentalShell title="Your rental cart">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-primary">
          A little closer to action
        </p>
        <h1 className="mb-9 font-display text-4xl font-bold sm:text-5xl">
          Your rental cart<span className="text-primary">.</span>
        </h1>
        {order ? (
          <div className="mx-auto max-w-2xl space-y-5 py-10 text-center">
            <ShieldCheck size={50} className="mx-auto text-emerald-400" />
            <h2 className="font-display text-3xl font-semibold">
              {order.status === "confirmed"
                ? "Your rental is reserved"
                : "Your booking has been created"}
            </h2>
            <p className="text-muted-foreground">
              Booking reference: <strong className="text-foreground">{order.booking_number}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              {order.payment_method === "pickup"
                ? `${money(order.total_paise)} is due at pickup. View dates, payment status and collection details in your account.`
                : "Complete online payment within the hold period. A booking is confirmed after payment is verified."}
            </p>
            {error && <Notice error>{error}</Notice>}
            <a className={buttonClass} href="/account">
              Manage my booking
              <ArrowRight size={16} />
            </a>
          </div>
        ) : !ready ? (
          <p>Loading cart…</p>
        ) : !cart.items.length ? (
          <EmptyState title="Your next production starts with a kit">
            <p>Add equipment or costumes to begin your rental.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="/rentals" className={buttonClass}>
                Browse equipment
              </a>
              <a href="/costume-rentals" className={secondaryClass}>
                Explore costumes
              </a>
            </div>
          </EmptyState>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {error && (
                <Notice error>
                  {error}{" "}
                  <button className="ml-2 underline" onClick={() => setReload((n) => n + 1)}>
                    Refresh pricing
                  </button>
                </Notice>
              )}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h2 className="mb-5 font-display text-xl font-semibold">01 / Rental dates</h2>
                <DateFields
                  start={cart.startDate}
                  end={cart.endDate}
                  onChange={(startDate, endDate) => setCart({ ...cart, startDate, endDate })}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  {validDates
                    ? `${days} rental day(s), including pickup and return dates.`
                    : "Choose pickup and return dates, up to 90 days."}{" "}
                  All items in this booking use the same dates.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h2 className="font-display text-xl font-semibold">02 / Your selection</h2>
                {loading ? (
                  <p className="py-8 text-sm text-muted-foreground">Updating availability…</p>
                ) : (
                  lines.map((line) => (
                    <div
                      key={line.productId}
                      className="flex gap-4 border-b border-border py-5 last:border-0"
                    >
                      {line.product && (
                        <img
                          src={rentalImage(line.product.image)}
                          alt={line.product.name}
                          className="size-20 rounded-xl object-cover sm:size-24"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <a href={`/rental-item/${line.productId}`} className="font-medium">
                          {line.product?.name || "Item no longer available"}
                        </a>
                        {line.product && (
                          <>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {line.product.size ? `Size: ${line.product.size} · ` : ""}
                              {money(line.product.price_paise)} / day
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Minimum {line.product.min_days} day(s)
                            </p>
                            {(line.product.available ?? line.product.stock) < line.quantity && (
                              <p className="mt-2 text-xs text-red-300">
                                Only {line.product.available ?? line.product.stock} available.
                                Update quantity or dates.
                              </p>
                            )}
                          </>
                        )}
                        <div className="mt-3 flex items-center gap-3">
                          <label className="text-xs text-muted-foreground">
                            Qty{" "}
                            <input
                              type="number"
                              aria-label={`Quantity for ${line.product?.name || "item"}`}
                              min={1}
                              max={50}
                              value={line.quantity}
                              onChange={(e) =>
                                setCart({
                                  ...cart,
                                  items: cart.items.map((i) =>
                                    i.productId === line.productId
                                      ? { ...i, quantity: Number(e.target.value) }
                                      : i,
                                  ),
                                })
                              }
                              className="ml-2 w-16 rounded-lg border border-border bg-transparent p-2 text-foreground"
                            />
                          </label>
                          <button
                            aria-label={`Remove ${line.product?.name || "item"}`}
                            className="p-2 text-muted-foreground hover:text-red-400"
                            onClick={() =>
                              setCart({
                                ...cart,
                                items: cart.items.filter((i) => i.productId !== line.productId),
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {!customer ? (
                <CustomerAuth onAuthenticated={setCustomer} />
              ) : (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-display text-xl font-semibold">03 / Booking details</h2>
                  <p className="mt-4 text-sm">{customer.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {customer.email} · {customer.phone}
                  </p>
                  <a href="/account" className="mt-2 inline-block text-xs text-primary">
                    Edit account details
                  </a>
                  <label className="mt-5 block space-y-2 text-xs text-muted-foreground">
                    Notes for the studio (optional)
                    <textarea
                      maxLength={1000}
                      rows={3}
                      className={inputClass}
                      placeholder="Tell us about your shoot or pickup requirements…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                </div>
              )}
              <div className="flex gap-4 rounded-2xl border border-border p-6">
                <MapPin className="shrink-0 text-primary" size={22} />
                <div>
                  <h2 className="font-semibold">Collect from Buddies Production</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {cms.site.location.address}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Studio pickup only. Contact the studio to arrange your collection time.
                  </p>
                </div>
              </div>
            </div>
            <aside className="h-fit space-y-5 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-xl font-semibold">Booking summary</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <dt>Rental {validDates ? `· ${days} day(s)` : ""}</dt>
                  <dd>{validDates ? money(rental) : "Select dates"}</dd>
                </div>
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <dt>Refundable deposit</dt>
                  <dd>{money(deposit)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-4 text-lg font-semibold">
                  <dt>Total payable</dt>
                  <dd>{validDates ? money(rental + deposit) : "—"}</dd>
                </div>
              </dl>
              <p className="text-[11px] leading-5 text-muted-foreground">
                The amount shown is the total charged for this booking. Deposit returns are recorded
                after the rental is returned and inspected.
              </p>
              <fieldset className="space-y-3 border-t border-border pt-5">
                <legend className="mb-2 text-sm font-medium">Payment method</legend>
                <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4">
                  <input
                    type="radio"
                    name="method"
                    value="pickup"
                    checked={method === "pickup"}
                    onChange={() => setMethod("pickup")}
                    className="accent-red-500"
                  />
                  <span className="text-sm">
                    Pay at pickup
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Reserve now. Payment due before collection.
                    </span>
                  </span>
                </label>
                {online && (
                  <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4">
                    <input
                      type="radio"
                      name="method"
                      value="cashfree"
                      checked={method === "cashfree"}
                      onChange={() => setMethod("cashfree")}
                      className="accent-red-500"
                    />
                    <span className="text-sm">
                      Pay securely online
                      <span className="mt-1 block text-xs text-muted-foreground">
                        UPI, cards and netbanking via Cashfree.
                      </span>
                    </span>
                  </label>
                )}
              </fieldset>
              <label className="flex items-start gap-3 text-xs leading-5 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 accent-red-500"
                />
                I have checked my dates, items and size. Unpaid bookings can be cancelled before
                collection; paid cancellation requests need studio review before a refund.
              </label>
              <button
                onClick={placeOrder}
                className={`${buttonClass} w-full`}
                disabled={
                  busy || loading || !!error || !customer || !accepted || !validDates || unavailable
                }
              >
                {busy
                  ? "Creating booking…"
                  : method === "pickup"
                    ? "Reserve rental"
                    : "Continue to payment"}
                <ArrowRight size={16} />
              </button>
              {!customer && (
                <p className="text-center text-xs text-muted-foreground">
                  Sign in or create an account to continue.
                </p>
              )}
              {unavailable && !loading && (
                <p className="text-xs text-amber-200">
                  Review unavailable items, quantity and minimum rental days.
                </p>
              )}
              <p className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <ShieldCheck size={13} />
                Availability is rechecked when you book.
              </p>
            </aside>
          </div>
        )}
      </div>
    </RentalShell>
  );
}
