import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { rentalRequest } from "@/lib/rental-client";
import { Notice } from "./shared";
export type WhatsAppSummary = {
  enabled: boolean;
  recipient: string;
  counts: { status: string; count: number }[];
  recent: {
    booking_id: string;
    booking_number: string;
    status: string;
    attempts: number;
    last_error: string;
    provider_message_id: string | null;
  }[];
};
export function AdminNotifications({
  summary,
  onRefresh,
}: {
  summary: WhatsAppSummary;
  onRefresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function retry(id: string) {
    setBusy(id);
    setError("");
    try {
      await rentalRequest("admin", { action: "retry_notification", id });
      await onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="space-y-4 rounded-2xl border border-border p-6">
      <MessageCircle className="text-emerald-300" />
      <h3 className="font-display text-xl font-semibold">Admin WhatsApp alerts</h3>
      <p className="text-sm text-muted-foreground">
        {summary.enabled
          ? `Booking confirmations go to +${summary.recipient}.`
          : "WhatsApp notifications are not enabled."}
      </p>
      <p className="text-xs leading-6 text-muted-foreground">
        Pay-at-pickup reservations notify immediately. Online bookings notify after payment
        verification. Accepted means the provider accepted the message; check KK WABA for delivery
        status.
      </p>
      {error && <Notice error>{error}</Notice>}
      <div className="flex flex-wrap gap-2">
        {summary.counts.map((c) => (
          <span key={c.status} className="rounded-lg bg-muted px-3 py-2 text-xs capitalize">
            {c.status}: {c.count}
          </span>
        ))}
      </div>
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {summary.recent.map((n) => (
          <div key={n.booking_id} className="rounded-xl border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium">{n.booking_number}</span>
              <span
                className={`text-xs capitalize ${n.status === "accepted" ? "text-emerald-300" : n.status === "failed" || n.status === "unknown" ? "text-amber-200" : "text-muted-foreground"}`}
              >
                {n.status}
              </span>
            </div>
            {n.last_error && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{n.last_error}</p>
            )}
            {summary.enabled && ["failed", "queued"].includes(n.status) && (
              <button
                disabled={!!busy}
                onClick={() => retry(n.booking_id)}
                className="mt-3 rounded-lg border border-primary/25 px-3 py-2 text-xs text-primary disabled:opacity-50"
              >
                {busy === n.booking_id ? "Sending..." : "Retry notification"}
              </button>
            )}
          </div>
        ))}
      </div>
      {!summary.recent.length && (
        <p className="text-xs text-muted-foreground">New booking notifications will appear here.</p>
      )}
    </div>
  );
}
