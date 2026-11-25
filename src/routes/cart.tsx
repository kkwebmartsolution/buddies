import { createFileRoute } from "@tanstack/react-router";
import { RentalCheckout } from "@/components/rentals/checkout";
export const Route = createFileRoute("/cart")({
  component: RentalCheckout,
  head: () => ({
    meta: [
      { title: "Your rental cart | Buddies Production" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
