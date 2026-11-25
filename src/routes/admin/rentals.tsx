import { createFileRoute } from "@tanstack/react-router";
import { RentalAdmin } from "@/components/rentals/admin";
export const Route = createFileRoute("/admin/rentals")({
  component: AdminRentals,
  head: () => ({
    meta: [{ title: "Rental desk | Buddies Admin" }, { name: "robots", content: "noindex" }],
  }),
});
function AdminRentals() {
  return (
    <div className="min-h-screen bg-background px-3 py-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-7xl">
        <a href="/admin" className="mb-5 inline-block text-sm text-foreground/50">
          ← Studio control panel
        </a>
        <RentalAdmin />
      </div>
    </div>
  );
}
