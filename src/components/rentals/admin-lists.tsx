import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Package,
  Pencil,
  Users,
} from "lucide-react";
import type { MouseEvent } from "react";
import { indiaToday, money, type RentalBooking, type RentalProduct } from "@/lib/rental-types";
import { rentalImage, StatusBadge } from "./shared";

export function InventoryList({
  products,
  onEdit,
}: {
  products: RentalProduct[];
  onEdit: (product: RentalProduct, trigger: HTMLButtonElement) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-muted">
      <div className="hidden grid-cols-[minmax(0,1fr)_130px_130px_110px] gap-4 border-b border-border bg-muted px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
        <span>Item / category</span>
        <span>Daily rental</span>
        <span>Total stock</span>
        <span className="text-right">Manage</span>
      </div>
      <div className="divide-y divide-border">
        {products.map((p) => (
          <article
            key={p.id}
            className="grid items-center gap-4 p-4 transition hover:bg-muted sm:p-5 lg:grid-cols-[minmax(0,1fr)_130px_130px_110px]"
          >
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={rentalImage(p.image)}
                alt={p.name}
                className="size-16 shrink-0 rounded-xl border border-border object-cover"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                  {!p.active && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-foreground">
                      Draft
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.category}
                  {p.size ? ` · ${p.size}` : ""}
                </p>
                {p.active && (
                  <a
                    href={`/rental-item/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary"
                  >
                    View on website
                    <ArrowUpRight size={12} />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between lg:block">
              <span className="text-xs text-muted-foreground lg:hidden">Daily rental</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{money(p.price_paise)}</p>
                <p className="mt-1 text-right text-[10px] text-muted-foreground lg:text-left">
                  {p.deposit_paise ? `${money(p.deposit_paise)} deposit` : "No deposit"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between lg:block">
              <span className="text-xs text-muted-foreground lg:hidden">Total stock</span>
              <div>
                <p
                  className={`text-sm font-semibold ${p.stock === 0 ? "text-amber-300" : "text-emerald-300"}`}
                >
                  {p.stock} {p.stock === 1 ? "unit" : "units"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {!p.active
                    ? "Not published"
                    : p.stock === 0
                      ? "Add stock to enable booking"
                      : "Published in shop"}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => onEdit(p, e.currentTarget)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <Pencil size={13} />
              Edit product
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function BookingList({
  bookings,
  onSelect,
}: {
  bookings: RentalBooking[];
  onSelect: (booking: RentalBooking, trigger: HTMLButtonElement) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-muted">
      <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_160px_110px_24px] gap-4 border-b border-border bg-muted px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground xl:grid">
        <span>Booking / customer</span>
        <span>Rental dates</span>
        <span>Status</span>
        <span className="text-right">Total</span>
        <span />
      </div>
      <div className="divide-y divide-border">
        {bookings.map((b) => (
          <button
            key={b.id}
            onClick={(e: MouseEvent<HTMLButtonElement>) => onSelect(b, e.currentTarget)}
            className="grid w-full items-center gap-4 p-5 text-left transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-emerald-400 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_160px_110px_24px]"
          >
            <div className="flex min-w-0 gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-sm font-semibold text-emerald-300">
                {b.customer_name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{b.booking_number}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{b.customer_name}</p>
              </div>
            </div>
            <div>
              <p className="flex items-center gap-2 text-xs text-foreground">
                <CalendarDays size={13} className="text-muted-foreground" />
                {b.start_date} → {b.end_date}
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {b.days} day(s) · {b.items.reduce((n, i) => n + i.quantity, 0)} item(s)
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge value={b.status} />
              <StatusBadge value={b.payment_status} />
            </div>
            <div className="flex items-center justify-between xl:block">
              <span className="text-xs text-muted-foreground xl:hidden">View booking details</span>
              <p className="text-sm font-semibold text-foreground xl:text-right">
                {money(b.total_paise)}
              </p>
            </div>
            <ChevronRight size={17} className="hidden text-muted-foreground xl:block" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function RentalAdminStats({
  tab,
  products,
  bookings,
  customerCount,
}: {
  tab: string;
  products: RentalProduct[];
  bookings: RentalBooking[];
  customerCount: number;
}) {
  const own = products.filter((p) => p.kind === tab);
  const inventory = tab === "equipment" || tab === "costume";
  const items = inventory
    ? [
        { label: "Total items", value: own.length, icon: Package, hint: "In this collection" },
        {
          label: "Published",
          value: own.filter((p) => p.active).length,
          icon: ArrowUpRight,
          hint: "Visible on your website",
        },
        {
          label: "Out of stock",
          value: own.filter((p) => p.stock === 0).length,
          icon: CircleAlert,
          hint: "Update stock to take bookings",
        },
      ]
    : [
        {
          label: "Upcoming pickups",
          value: bookings.filter((b) => b.status === "confirmed" && b.start_date >= indiaToday())
            .length,
          icon: CalendarDays,
          hint: "Confirmed reservations",
        },
        {
          label: "Currently on rent",
          value: bookings.filter((b) => b.status === "collected").length,
          icon: Package,
          hint: "Awaiting return",
        },
        {
          label: "Needs attention",
          value: bookings.filter(
            (b) => b.status === "cancel_requested" || b.payment_status === "refund_pending",
          ).length,
          icon: CircleAlert,
          hint: "Cancellations & refunds",
        },
      ];
  if (tab === "customers")
    return (
      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
        <Users size={18} />
        {customerCount} customer accounts · latest 300
      </div>
    );
  if (tab === "settings") return null;
  return (
    <div className="mb-7 grid gap-3 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon, hint }) => (
        <div key={label} className="flex gap-4 rounded-2xl border border-border bg-muted p-5">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${inventory ? "bg-primary/10 text-primary" : "bg-emerald-400/10 text-emerald-300"}`}
          >
            <Icon size={19} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
