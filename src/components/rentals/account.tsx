import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarDays, LogOut, PackageCheck, UserRound } from "lucide-react";
import { payForBooking, rentalRequest } from "@/lib/rental-client";
import { indiaToday, type Customer, type RentalBooking } from "@/lib/rental-types";
import { useCms } from "@/hooks/use-cms";
import { CustomerAuth } from "./customer-auth";
import { BookingDetails } from "./booking-details";
import { buttonClass, EmptyState, inputClass, Notice, RentalShell, secondaryClass } from "./shared";

export function RentalAccount() {
  const cms = useCms();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("bookings");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [confirmCancel, setConfirmCancel] = useState("");
  const loadBookings = useCallback(async () => {
    const returnedBooking = new URLSearchParams(window.location.search).get("payment_booking");
    if (returnedBooking) {
      try {
        await rentalRequest("payment", { action: "verify", bookingId: returnedBooking });
      } catch (e) {
        setError((e as Error).message);
      }
      window.history.replaceState(null, "", "/account");
    }
    const result = await rentalRequest<{ bookings: RentalBooking[] }>("bookings");
    setBookings(result.bookings);
  }, []);
  useEffect(() => {
    rentalRequest<{ customer: Customer | null }>("account")
      .then(async (r) => {
        setCustomer(r.customer);
        if (r.customer) await loadBookings();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadBookings]);
  const onAuthenticated = (user: Customer) => {
    setError("");
    setCustomer(user);
    loadBookings().catch((e: Error) => setError(e.message));
  };
  async function action(id: string, operation: "cancel" | "pay" | "verify") {
    setBusy(id);
    setError("");
    setMessage("");
    try {
      if (operation === "pay") await payForBooking(id);
      else if (operation === "verify")
        await rentalRequest("payment", { action: "verify", bookingId: id });
      else await rentalRequest("bookings", { action: "cancel", id });
      setConfirmCancel("");
      await loadBookings();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function profile(event: FormEvent<HTMLFormElement>, action: "profile") {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(action);
    setError("");
    setMessage("");
    try {
      const result = await rentalRequest<{ customer: Customer }>("account", {
        action,
        ...Object.fromEntries(new FormData(form)),
      });
      setCustomer(result.customer);
      setMessage("Your details have been saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  const active = bookings.filter((b) =>
    ["confirmed", "collected", "pending_payment", "cancel_requested"].includes(b.status),
  );
  const visible =
    filter === "active"
      ? active
      : filter === "past"
        ? bookings.filter((b) => !active.includes(b))
        : bookings;
  return (
    <RentalShell title="My account">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        {loading ? (
          <p className="py-20 text-center text-muted-foreground">Loading your account…</p>
        ) : !customer ? (
          <div className="mx-auto max-w-md py-5">
            {error && (
              <div className="mb-5">
                <Notice error>{error}</Notice>
              </div>
            )}
            <CustomerAuth onAuthenticated={onAuthenticated} />
          </div>
        ) : (
          <>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-primary">
                  Your production companion
                </p>
                <h1 className="font-display text-4xl font-semibold">
                  Hello, {customer.name.split(" ")[0]}
                  <span className="text-primary">.</span>
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your rentals, all in one place.
                </p>
              </div>
              <button
                className={secondaryClass}
                disabled={!!busy}
                onClick={async () => {
                  setBusy("logout");
                  try {
                    await rentalRequest("account", { action: "logout" });
                    setCustomer(null);
                    setBookings([]);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
            <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
              <aside className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-3 grid size-12 place-items-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                    {customer.name[0].toUpperCase()}
                  </div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{customer.email}</p>
                  <nav className="mt-6 space-y-2">
                    {[
                      ["bookings", "My bookings", CalendarDays],
                      ["profile", "Account details", UserRound],
                    ].map(([key, label, Icon]) => {
                      const I = Icon as typeof CalendarDays;
                      return (
                        <button
                          key={String(key)}
                          onClick={() => setTab(String(key))}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm ${tab === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                        >
                          <I size={16} />
                          {String(label)}
                        </button>
                      );
                    })}
                  </nav>
                </div>
                <div className="rounded-2xl border border-border p-5">
                  <PackageCheck size={22} className="mb-3 text-primary" />
                  <p className="text-sm font-semibold">Studio pickup</p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {cms.site.location.address}
                  </p>
                  <a
                    href={`mailto:${cms.site.social.email}`}
                    className="mt-3 inline-block text-xs text-primary"
                  >
                    Contact the studio →
                  </a>
                </div>
              </aside>
              <div className="space-y-5">
                {error && <Notice error>{error}</Notice>}
                {message && <Notice>{message}</Notice>}
                {tab === "bookings" ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ["Total bookings", bookings.length],
                        ["Active rentals", active.length],
                        ["Completed", bookings.filter((b) => b.status === "completed").length],
                      ].map(([label, count]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-border bg-card p-4 sm:p-5"
                        >
                          <p className="text-[11px] text-muted-foreground">{label}</p>
                          <p className="mt-2 font-display text-3xl font-semibold">{count}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap justify-between gap-4 py-2">
                      <div className="flex gap-2">
                        {["all", "active", "past"].map((f) => (
                          <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded-full px-4 py-2 text-xs capitalize ${filter === f ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <button
                        className="text-xs text-primary"
                        onClick={() => loadBookings().catch((e: Error) => setError(e.message))}
                      >
                        Refresh status
                      </button>
                    </div>
                    {!visible.length ? (
                      <EmptyState title="Your next story is waiting">
                        <p>You have no {filter === "all" ? "" : filter} bookings yet.</p>
                        <a className={`${buttonClass} mt-5`} href="/rentals">
                          Explore rentals
                        </a>
                      </EmptyState>
                    ) : (
                      visible.map((b) => (
                        <article
                          key={b.id}
                          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
                        >
                          <BookingDetails booking={b} />
                          <div className="mt-5 flex flex-wrap gap-3">
                            {b.status === "pending_payment" && (
                              <button
                                disabled={!!busy}
                                className={buttonClass}
                                onClick={() => action(b.id, "pay")}
                              >
                                {busy === b.id ? "Please wait…" : "Complete payment"}
                              </button>
                            )}
                            {b.payment_method === "cashfree" &&
                              b.gateway_order_id &&
                              b.payment_status === "unpaid" && (
                                <button
                                  disabled={!!busy}
                                  className={secondaryClass}
                                  onClick={() => action(b.id, "verify")}
                                >
                                  Check payment status
                                </button>
                              )}
                            {["confirmed", "pending_payment", "expired"].includes(b.status) &&
                              b.start_date >= indiaToday() && (
                                <button
                                  disabled={!!busy}
                                  className={secondaryClass}
                                  onClick={() => setConfirmCancel(b.id)}
                                >
                                  {b.payment_status === "paid"
                                    ? "Request cancellation"
                                    : "Cancel booking"}
                                </button>
                              )}
                          </div>
                          {confirmCancel === b.id && (
                            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm">
                              <p>
                                {b.payment_status === "paid"
                                  ? "Request cancellation? The studio will review your request and process any refund separately."
                                  : "Cancel this booking and release the reserved items?"}
                              </p>
                              <div className="mt-3 flex gap-3">
                                <button
                                  disabled={!!busy}
                                  className={buttonClass}
                                  onClick={() => action(b.id, "cancel")}
                                >
                                  Yes, continue
                                </button>
                                <button
                                  className={secondaryClass}
                                  onClick={() => setConfirmCancel("")}
                                >
                                  Keep booking
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      ))
                    )}
                  </>
                ) : (
                  <div className="space-y-6">
                    <form
                      onSubmit={(e) => profile(e, "profile")}
                      className="space-y-4 rounded-2xl border border-border bg-card p-6"
                    >
                      <h2 className="font-display text-xl font-semibold">Account details</h2>
                      <label className="block space-y-2 text-xs text-muted-foreground">
                        Full name
                        <input
                          required
                          name="name"
                          minLength={2}
                          maxLength={100}
                          defaultValue={customer.name}
                          className={inputClass}
                        />
                      </label>
                      <label className="block space-y-2 text-xs text-muted-foreground">
                        Mobile number
                        <input
                          required
                          name="phone"
                          readOnly
                          type="tel"
                          maxLength={20}
                          defaultValue={customer.phone}
                          className={inputClass}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">Email: {customer.email}</p>
                      <button disabled={!!busy} className={buttonClass}>
                        Save details
                      </button>
                    </form>
                    <Notice>
                      Sign in securely with an OTP sent to your verified mobile number. To change
                      this number, contact the studio.
                    </Notice>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </RentalShell>
  );
}
