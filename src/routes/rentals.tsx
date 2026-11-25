import { createFileRoute } from "@tanstack/react-router";
import { RentalCatalog } from "@/components/rentals/catalog";
export const Route = createFileRoute("/rentals")({
  component: () => <RentalCatalog kind="equipment" />,
  head: () => ({
    meta: [
      { title: "Equipment Rentals | Buddies Production" },
      {
        name: "description",
        content:
          "Browse equipment, check rental dates and book your next shoot with Buddies Production in Guwahati.",
      },
    ],
  }),
});
