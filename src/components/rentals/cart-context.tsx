import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartState } from "@/lib/rental-types";

const empty: CartState = { items: [], startDate: "", endDate: "" };
const CartContext = createContext<{
  cart: CartState;
  ready: boolean;
  setCart: (cart: CartState) => void;
  addItem: (id: string, quantity: number) => void;
} | null>(null);
export function RentalCartProvider({ children }: { children: ReactNode }) {
  const [cart, update] = useState<CartState>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("buddies_rental_cart") || "null");
      if (
        saved &&
        Array.isArray(saved.items) &&
        typeof saved.startDate === "string" &&
        typeof saved.endDate === "string"
      ) {
        update({
          ...saved,
          items: saved.items
            .filter(
              (i: { productId?: unknown; quantity?: unknown }) =>
                typeof i.productId === "string" &&
                Number.isInteger(i.quantity) &&
                Number(i.quantity) > 0,
            )
            .slice(0, 30),
        });
      }
    } catch {
      /* A blocked or outdated local store must not break the shop. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("buddies_rental_cart", JSON.stringify(cart));
      } catch {
        /* The in-memory cart still works. */
      }
    }
  }, [cart, ready]);
  const addItem = (id: string, quantity: number) =>
    update((current) => ({
      ...current,
      items: current.items.some((i) => i.productId === id)
        ? current.items.map((i) =>
            i.productId === id ? { ...i, quantity: Math.min(50, i.quantity + quantity) } : i,
          )
        : [...current.items, { productId: id, quantity }],
    }));
  return (
    <CartContext.Provider value={{ cart, ready, setCart: update, addItem }}>
      {children}
    </CartContext.Provider>
  );
}
export function useRentalCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("RentalCartProvider is missing");
  return context;
}
