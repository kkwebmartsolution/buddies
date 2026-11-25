import {
  CalendarDays,
  Camera,
  ChevronRight,
  PackageCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useRentalCart } from "./cart-context";
import cameraImage from "@/assets/rental-camera.jpg";
import lensesImage from "@/assets/rental-lenses.jpg";
import lightingImage from "@/assets/rental-lighting.jpg";
import droneImage from "@/assets/rental-drone.jpg";
import audioImage from "@/assets/rental-audio.jpg";
import gimbalImage from "@/assets/rental-gimbal.jpg";
import costumeImage from "@/assets/costume-rental.jpg";
import { indiaToday, statusLabel } from "@/lib/rental-types";

const images: Record<string, string> = {
  "rental-camera.jpg": cameraImage,
  "rental-lenses.jpg": lensesImage,
  "rental-lighting.jpg": lightingImage,
  "rental-drone.jpg": droneImage,
  "rental-audio.jpg": audioImage,
  "rental-gimbal.jpg": gimbalImage,
  "costume-rental.jpg": costumeImage,
};
export function rentalImage(src: string) {
  if (src.startsWith("/src/assets/")) return images[src.split("/").pop()!] || cameraImage;
  return src || cameraImage;
}
export const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-40";
export const secondaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-40";
export function RentalShell({ children, title }: { children: ReactNode; title: string }) {
  const { cart } = useRentalCart();
  const count = cart.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <div className="border-y border-border bg-muted">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <a href="/" className="hover:text-foreground">
                Home
              </a>
              <ChevronRight size={12} />
              <span className="text-foreground">{title}</span>
            </div>
            <nav aria-label="Rental shop" className="flex items-center gap-5 text-xs sm:text-sm">
              <a href="/rentals" className="inline-flex items-center gap-2 hover:text-primary">
                <Camera size={15} />
                Rentals
              </a>
              <a href="/account" className="inline-flex items-center gap-2 hover:text-primary">
                <UserRound size={15} />
                My bookings
              </a>
              <a href="/cart" className="inline-flex items-center gap-2 hover:text-primary">
                <ShoppingBag size={15} />
                Cart{" "}
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">{count}</span>
              </a>
            </nav>
          </div>
        </div>
      </div>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
export function DateFields({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="space-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <CalendarDays size={14} />
          Pickup date
        </span>
        <input
          aria-label="Pickup date"
          type="date"
          min={indiaToday()}
          value={start}
          className={inputClass}
          onChange={(e) =>
            onChange(e.target.value, end && end < e.target.value ? e.target.value : end)
          }
        />
      </label>
      <label className="space-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <CalendarDays size={14} />
          Return date
        </span>
        <input
          aria-label="Return date"
          type="date"
          min={start || indiaToday()}
          value={end}
          className={inputClass}
          onChange={(e) => onChange(start, e.target.value)}
        />
      </label>
    </div>
  );
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-xl border p-4 text-sm ${error ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}
    >
      {children}
    </div>
  );
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
      <PackageCheck className="mx-auto mb-5 text-muted-foreground" size={42} />
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
export function StatusBadge({ value }: { value: string }) {
  const positive = ["paid", "confirmed", "completed", "refunded"].includes(value);
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${positive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}
    >
      {statusLabel(value)}
    </span>
  );
}
