import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rentals/account")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/rental-api.server")).rentalApi(request, "account"),
      POST: async ({ request }) =>
        (await import("@/lib/rental-api.server")).rentalApi(request, "account"),
    },
  },
});
