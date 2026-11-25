import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rentals/catalog")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/rental-api.server")).rentalApi(request, "catalog"),
    },
  },
});
