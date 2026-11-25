import { createFileRoute } from "@tanstack/react-router";
import { RentalProductPage } from "@/components/rentals/catalog";
export const Route = createFileRoute("/rental-item/$productId")({
  component: Product,
  head: () => ({ meta: [{ title: "Rental details | Buddies Production" }] }),
});
function Product() {
  const { productId } = Route.useParams();
  return <RentalProductPage id={productId} />;
}
