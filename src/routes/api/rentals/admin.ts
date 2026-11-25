import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rentals/admin")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/rental-api.server")).rentalApi(request, "admin"),
      POST: async ({ request }) =>
        (await import("@/lib/rental-api.server")).rentalApi(request, "admin"),
    },
  },
});
