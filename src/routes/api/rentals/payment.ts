import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rentals/payment")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await import("@/lib/rental-api.server")).rentalApi(request, "payment"),
    },
  },
});
