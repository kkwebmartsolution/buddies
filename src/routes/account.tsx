import { createFileRoute } from "@tanstack/react-router";
import { RentalAccount } from "@/components/rentals/account";
export const Route = createFileRoute("/account")({
  component: RentalAccount,
  head: () => ({
    meta: [{ title: "My bookings | Buddies Production" }, { name: "robots", content: "noindex" }],
  }),
});
