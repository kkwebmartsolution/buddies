import { createFileRoute } from "@tanstack/react-router";
import { RentalCatalog } from "@/components/rentals/catalog";
export const Route = createFileRoute("/costume-rentals")({
  component: () => <RentalCatalog kind="costume" />,
  head: () => ({
    meta: [
      { title: "Costume Rentals | Buddies Production" },
      {
        name: "description",
        content:
          "Explore costume rentals, sizes and date availability for your production in Guwahati.",
      },
    ],
  }),
});
