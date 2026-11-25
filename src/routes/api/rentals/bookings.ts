import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rentals/bookings")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/rental-api.server")).rentalApi(request, "bookings"),
      POST: async ({ request }) =>
        (await import("@/lib/rental-api.server")).rentalApi(request, "bookings"),
    },
  },
});
