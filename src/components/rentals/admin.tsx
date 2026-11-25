import { AdminNotifications, type WhatsAppSummary } from "./admin-notifications";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Camera,
  CreditCard,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Shirt,
  Users,
} from "lucide-react";
import { ApiError, rentalRequest } from "@/lib/rental-client";
import {
  indiaToday,
  type Customer,
  type RentalBooking,
  type RentalKind,
  type RentalProduct,
} from "@/lib/rental-types";
import { BookingDetails } from "./booking-details";
import { EmptyState, Notice, rentalImage } from "./shared";

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { InventoryList, BookingList, RentalAdminStats } from "./admin-lists";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
const secondaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-xs text-foreground hover:bg-accent/10 disabled:opacity-50";
const inputClass =
  "w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none focus:border-primary";
const drawerClass =
  "w-full overflow-y-auto border-border bg-card p-5 text-foreground sm:max-w-2xl sm:p-7";
type Dashboard = {
  products: RentalProduct[];
  bookings: RentalBooking[];
  customers: (Customer & { booking_count: number })[];
  notificationCount: number;
  whatsapp: WhatsAppSummary;
  onlinePayment: boolean;
};
const blankProduct = (kind: RentalKind): RentalProduct => ({
  id: "",
  kind,
  name: "",
  category: "",
  description: "",
  image: "",
  size: "",
  specifications: "",
  price_paise: 0,
  deposit_paise: 0,
  stock: 0,
  min_days: 1,
  active: false,
});

export function RentalAdmin({ initialKind }: { initialKind?: RentalKind }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState(initialKind || "bookings");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<RentalProduct | null>(null);
  const [selected, setSelected] = useState("");
  const [operation, setOperation] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const editorTrigger = useRef<HTMLButtonElement | null>(null);
  const bookingTrigger = useRef<HTMLButtonElement | null>(null);
  const load = useCallback(async () => {
    try {
      const result = await rentalRequest<Dashboard>("admin");
      setData(result);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      throw e;
    }
  }, []);
  useEffect(() => {
    load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);
  const reload = async () => {
    setBusy(true);
    setError("");
    try {
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await rentalRequest("admin", {
        action: "save_product",
        product: { ...editor, id: editor.id || undefined },
      });
      setEditor(null);
      await load();
      setMessage("Product saved. Published products appear in the rental shop.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function bookingAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await rentalRequest("admin", { id: selected, action: operation, reference });
      await load();
      setOperation("");
      setReference("");
      setMessage("Booking updated. The change is recorded in its timeline.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || !editor) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG or WebP image up to 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, base64 }),
      });
      const body = await result.json();
      if (!result.ok || !body.imageUrl) throw new Error(body.message || "Upload failed.");
      setEditor({ ...editor, image: body.imageUrl });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const booking = data?.bookings.find((b) => b.id === selected);
  const products =
    data?.products.filter(
      (p) =>
        p.kind === tab &&
        (filter === "all" ||
          (filter === "stock" && p.stock > 0) ||
          (filter === "empty" && p.stock === 0) ||
          (filter === "draft" && !p.active)) &&
        `${p.name} ${p.category} ${p.size}`.toLowerCase().includes(query.toLowerCase()),
    ) || [];
  const bookings =
    data?.bookings.filter(
      (b) =>
        (filter === "all" || b.status === filter || b.payment_status === filter) &&
        `${b.booking_number} ${b.customer_name} ${b.customer_email}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) || [];
  const actions: [string, string][] = [];
  if (booking) {
    if (
      booking.status === "confirmed" &&
      booking.payment_method === "pickup" &&
      booking.payment_status === "unpaid"
    )
      actions.push(["record_payment", "Record pickup payment"]);
    if (
      booking.status === "confirmed" &&
      booking.payment_status === "paid" &&
      booking.start_date <= indiaToday() &&
      booking.end_date >= indiaToday()
    )
      actions.push(["collect", "Mark items collected"]);
    if (booking.status === "collected") actions.push(["complete", "Mark items returned"]);
    if (["confirmed", "pending_payment", "cancel_requested", "expired"].includes(booking.status))
      actions.push(["cancel", "Cancel booking / approve cancellation"]);
    if (booking.status === "cancelled" && booking.payment_status === "refund_pending")
      actions.push(["record_refund", "Record completed full refund"]);
    if (
      booking.status === "completed" &&
      booking.payment_status === "paid" &&
      booking.deposit_paise &&
      !booking.deposit_returned
    )
      actions.push(["return_deposit", "Record deposit returned"]);
  }
  return (
    <section className="rental-admin rounded-3xl bg-background p-4 text-foreground sm:p-6">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-primary">
            Rental operations
          </p>
          <h2 className="font-display text-3xl font-semibold">
            {tab === "bookings"
              ? "Bookings"
              : tab === "equipment"
                ? "Equipment inventory"
                : tab === "costume"
                  ? "Costume inventory"
                  : tab === "customers"
                    ? "Customers"
                    : "Payments & notifications"}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {tab === "bookings"
              ? "Track reservations, payments, pickups and returns in one place."
              : ["equipment", "costume"].includes(tab)
                ? "Manage your products, daily prices and stock from here."
                : "Manage your rental business."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={reload}
            className={secondaryClass}
            aria-label="Refresh rental data"
          >
            <RefreshCw size={15} />
          </button>
          <a className={secondaryClass} href="/rentals" target="_blank" rel="noreferrer">
            View shop
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
      {error && (
        <div className="mb-5">
          <Notice error>{error}</Notice>
        </div>
      )}
      {message && (
        <div className="mb-5">
          <Notice>{message}</Notice>
        </div>
      )}
      {loading ? (
        <p className="py-20 text-center text-muted-foreground">Loading rental operations…</p>
      ) : !data ? (
        <button className={buttonClass} onClick={reload}>
          Retry
        </button>
      ) : (
        <>
          <RentalAdminStats
            tab={tab}
            products={data.products}
            bookings={data.bookings}
            customerCount={data.customers.length}
          />
          {tab === "bookings" && (
            <p className="mb-5 text-xs text-muted-foreground">
              Showing the latest 300 bookings. Open a booking to manage it.
            </p>
          )}
          <nav
            className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-4"
            aria-label="Rental admin sections"
          >
            {[
              ["bookings", "Bookings", CalendarDays],
              ["equipment", "Equipment", Camera],
              ["costume", "Costumes", Shirt],
              ["customers", "Customers", Users],
              ["settings", "Payments & notifications", CreditCard],
            ].map(([key, label, Icon]) => {
              const I = Icon as typeof Users;
              return (
                <button
                  key={String(key)}
                  aria-current={tab === key ? "page" : undefined}
                  disabled={busy}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-xs ${tab === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                  onClick={() => {
                    setTab(String(key));
                    setQuery("");
                    setFilter("all");
                    setError("");
                    setMessage("");
                    setSelected("");
                    setEditor(null);
                  }}
                >
                  <I size={15} />
                  {String(label)}
                </button>
              );
            })}
          </nav>
          {tab !== "settings" && (
            <div className="mb-6 flex flex-wrap gap-3">
              <label className="relative min-w-48 flex-1">
                <Search className="absolute left-4 top-3.5 text-muted-foreground" size={16} />
                <input
                  aria-label="Search rental management"
                  className={`${inputClass} pl-11`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    tab === "bookings"
                      ? "Search booking, customer or email..."
                      : tab === "customers"
                        ? "Search customer or email..."
                        : "Search product, category or size..."
                  }
                />
              </label>
              {tab === "bookings" && (
                <select
                  aria-label="Filter bookings"
                  className={`${inputClass} sm:w-52`}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    "all",
                    "pending_payment",
                    "confirmed",
                    "collected",
                    "completed",
                    "cancel_requested",
                    "cancelled",
                    "expired",
                    "unpaid",
                    "refund_pending",
                    "refunded",
                  ].map((s) => (
                    <option value={s} key={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              )}
              {["equipment", "costume"].includes(tab) && (
                <button
                  className={buttonClass}
                  onClick={(e) => {
                    editorTrigger.current = e.currentTarget;
                    setError("");
                    setMessage("");
                    setEditor(blankProduct(tab as RentalKind));
                  }}
                >
                  <Plus size={16} />
                  Add product
                </button>
              )}
            </div>
          )}
          {["equipment", "costume"].includes(tab) && (
            <>
              <div className="mb-4 flex flex-wrap gap-2" aria-label="Inventory filters">
                {[
                  ["all", "All items"],
                  ["stock", "Stock added"],
                  ["empty", "Out of stock"],
                  ["draft", "Drafts"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    aria-pressed={filter === key}
                    onClick={() => setFilter(key)}
                    className={filter === key ? buttonClass : secondaryClass}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mb-5 rounded-xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs leading-6 text-amber-100/80">
                Set daily price and total stock using Edit product. Published items appear on the
                website; zero-stock items cannot be booked. For costumes, add a separate product for
                each size.
              </div>
              <Sheet
                open={!!editor}
                onOpenChange={(open) => {
                  if (!open && !busy) setEditor(null);
                }}
              >
                <SheetContent
                  className={drawerClass}
                  onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    editorTrigger.current?.focus();
                  }}
                >
                  <SheetTitle className="pr-8 text-xl text-foreground">
                    {editor?.id ? "Edit rental product" : "New rental product"}
                  </SheetTitle>
                  <SheetDescription className="mb-6 mt-2 text-muted-foreground">
                    Update product details, pricing and available stock. Save to apply your changes.
                  </SheetDescription>
                  {error && (
                    <div className="mb-4">
                      <Notice error>{error}</Notice>
                    </div>
                  )}
                  {editor && (
                    <form onSubmit={saveProduct} className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-xs text-muted-foreground">
                          Product name
                          <input
                            required
                            minLength={2}
                            maxLength={160}
                            className={inputClass}
                            value={editor.name}
                            onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                          />
                        </label>
                        <label className="space-y-2 text-xs text-muted-foreground">
                          Category
                          <input
                            required
                            minLength={2}
                            maxLength={80}
                            className={inputClass}
                            value={editor.category}
                            onChange={(e) => setEditor({ ...editor, category: e.target.value })}
                          />
                        </label>
                        <label className="space-y-2 text-xs text-muted-foreground">
                          Collection
                          <select
                            className={inputClass}
                            value={editor.kind}
                            onChange={(e) =>
                              setEditor({ ...editor, kind: e.target.value as RentalKind })
                            }
                          >
                            <option value="equipment">Equipment</option>
                            <option value="costume">Costume</option>
                          </select>
                        </label>
                        <label className="space-y-2 text-xs text-muted-foreground">
                          {editor.kind === "costume"
                            ? "Size / fit (required to enable bookings)"
                            : "Variant / model (optional)"}
                          <input
                            maxLength={60}
                            className={inputClass}
                            value={editor.size}
                            onChange={(e) => setEditor({ ...editor, size: e.target.value })}
                            placeholder={
                              editor.kind === "costume"
                                ? "e.g. M — chest 38–40 in"
                                : "e.g. Sony FX6 kit"
                            }
                          />
                        </label>
                      </div>
                      <label className="block space-y-2 text-xs text-muted-foreground">
                        Description
                        <textarea
                          required
                          minLength={10}
                          maxLength={6000}
                          rows={3}
                          className={inputClass}
                          value={editor.description}
                          onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                        />
                      </label>
                      <label className="block space-y-2 text-xs text-muted-foreground">
                        Included items, specifications and fit notes
                        <textarea
                          maxLength={6000}
                          rows={3}
                          className={inputClass}
                          value={editor.specifications}
                          onChange={(e) => setEditor({ ...editor, specifications: e.target.value })}
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {(
                          [
                            ["Daily price (₹)", "price_paise", 100],
                            ["Refundable deposit (₹)", "deposit_paise", 100],
                            ["Total stock", "stock", 1],
                            ["Minimum rental days", "min_days", 1],
                          ] as const
                        ).map(([label, key, scale]) => (
                          <label key={key} className="space-y-2 text-xs text-muted-foreground">
                            {label}
                            <input
                              type="number"
                              min={key === "min_days" ? 1 : 0}
                              max={key === "min_days" ? 90 : key === "stock" ? 10000 : 1000000}
                              step={scale === 100 ? "0.01" : "1"}
                              required
                              className={inputClass}
                              value={editor[key] / scale}
                              onChange={(e) =>
                                setEditor({
                                  ...editor,
                                  [key]: Math.round(Number(e.target.value) * scale),
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <label className="block space-y-2 text-xs text-muted-foreground">
                        Image URL
                        <input
                          maxLength={1000}
                          className={inputClass}
                          value={editor.image}
                          onChange={(e) => setEditor({ ...editor, image: e.target.value })}
                          placeholder="https://… or /uploads/…"
                        />
                      </label>
                      <div className="flex flex-wrap items-center gap-4">
                        {editor.image && (
                          <img
                            src={rentalImage(editor.image)}
                            alt="Product preview"
                            className="size-20 rounded-xl object-cover"
                          />
                        )}
                        <label className={`${secondaryClass} cursor-pointer`}>
                          Upload image
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            disabled={busy}
                            className="sr-only"
                            onChange={(e) => upload(e.target.files?.[0])}
                          />
                        </label>
                        <span className="text-xs text-muted-foreground">
                          JPG, PNG, WebP · up to 5 MB
                        </span>
                      </div>
                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={editor.active}
                          onChange={(e) => setEditor({ ...editor, active: e.target.checked })}
                        />
                        Published in shop
                      </label>
                      <div className="sticky bottom-0 flex gap-3 border-t border-border bg-card py-4">
                        <button disabled={busy} className={buttonClass}>
                          {busy ? "Saving…" : "Save product"}
                        </button>
                        <button
                          disabled={busy}
                          type="button"
                          onClick={() => setEditor(null)}
                          className={secondaryClass}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </SheetContent>
              </Sheet>
              {products.length ? (
                <InventoryList
                  products={products}
                  onEdit={(product, trigger) => {
                    editorTrigger.current = trigger;
                    setError("");
                    setMessage("");
                    setEditor({ ...product });
                  }}
                />
              ) : (
                <EmptyState title="No products found">
                  Add an item to this collection or change your search.
                </EmptyState>
              )}
            </>
          )}
          {tab === "bookings" && (
            <>
              {bookings.length ? (
                <BookingList
                  bookings={bookings}
                  onSelect={(item, trigger) => {
                    bookingTrigger.current = trigger;
                    setSelected(item.id);
                    setOperation("");
                    setReference("");
                    setError("");
                    setMessage("");
                  }}
                />
              ) : (
                <EmptyState title="No bookings found">
                  New customer bookings will appear here. Try changing your search or status filter.
                </EmptyState>
              )}
              <Sheet
                open={!!booking}
                onOpenChange={(open) => {
                  if (!open && !busy) setSelected("");
                }}
              >
                <SheetContent
                  className={drawerClass}
                  onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    bookingTrigger.current?.focus();
                  }}
                >
                  <SheetTitle className="pr-8 text-xl text-foreground">
                    Booking {booking?.booking_number}
                  </SheetTitle>
                  <SheetDescription className="mt-2 text-muted-foreground">
                    Review the reservation and choose the next action.
                  </SheetDescription>
                  {booking && (
                    <>
                      <div className="my-5 rounded-xl border border-border bg-muted p-4">
                        <p className="font-semibold">{booking.customer_name}</p>
                        <p className="mt-2 break-all text-xs leading-6 text-muted-foreground">
                          {booking.customer_email}
                          <br />
                          {booking.customer_phone}
                        </p>
                      </div>
                      {error && <Notice error>{error}</Notice>}
                      {message && <Notice>{message}</Notice>}
                      {actions.length > 0 && (
                        <form
                          onSubmit={bookingAction}
                          className="mt-6 space-y-4 border-t border-border pt-5"
                        >
                          <fieldset disabled={busy} className="space-y-3">
                            <legend className="mb-3 text-sm font-semibold">
                              What would you like to do?
                            </legend>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {actions.map(([value, label]) => (
                                <button
                                  type="button"
                                  key={value}
                                  aria-pressed={operation === value}
                                  onClick={() => {
                                    setOperation(value);
                                    setReference("");
                                  }}
                                  className={operation === value ? buttonClass : secondaryClass}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </fieldset>
                          {["record_payment", "record_refund", "return_deposit"].includes(
                            operation,
                          ) && (
                            <>
                              <Notice>
                                {operation === "record_payment"
                                  ? "Record only money already received. This action does not charge the customer."
                                  : "Record only a refund already completed externally. This action does not transfer money."}
                              </Notice>
                              <label className="block space-y-2 text-xs text-muted-foreground">
                                Receipt / transaction reference
                                <input
                                  required
                                  minLength={3}
                                  maxLength={190}
                                  value={reference}
                                  onChange={(e) => setReference(e.target.value)}
                                  className={inputClass}
                                />
                              </label>
                            </>
                          )}
                          {operation === "cancel" && (
                            <p className="text-xs text-amber-200">
                              Cancelling releases stock. A paid booking will require a full refund
                              recorded separately.
                            </p>
                          )}
                          <button disabled={busy || !operation} className={buttonClass}>
                            {busy ? "Updating…" : "Confirm update"}
                          </button>
                        </form>
                      )}
                      <div className="mt-6 border-t border-border pt-5">
                        <BookingDetails booking={booking} />
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </>
          )}
          {tab === "customers" && (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    {["Customer", "Email", "Phone", "Bookings"].map((h) => (
                      <th className="p-4 font-medium" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.customers
                    .filter((c) =>
                      `${c.name} ${c.email}`.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((c) => (
                      <tr className="border-t border-border" key={c.id}>
                        <td className="p-4">{c.name}</td>
                        <td className="p-4 text-muted-foreground">{c.email}</td>
                        <td className="p-4 text-muted-foreground">{c.phone}</td>
                        <td className="p-4">{c.booking_count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!data.customers.length && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No customer accounts yet.
                </p>
              )}
            </div>
          )}
          {tab === "settings" && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-border p-6">
                <CreditCard className="text-primary" />
                <h3 className="font-display text-xl font-semibold">Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Pay at pickup is enabled.{" "}
                  {data.onlinePayment
                    ? "Cashfree online checkout is enabled."
                    : "Online checkout is not enabled yet."}
                </p>
                <p className="text-xs leading-6 text-muted-foreground">
                  Online payments require server credentials and the verified payment webhook.
                  Gateway payments cannot be manually marked paid. Pickup receipts and external
                  refunds are recorded in booking history.
                </p>
              </div>
              <AdminNotifications summary={data.whatsapp} onRefresh={load} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
