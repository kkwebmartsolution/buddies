export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function rentalRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/rentals/${path}`, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(data.message || "Something went wrong. Please try again.", response.status);
  return data;
}
declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout(options: {
        paymentSessionId: string;
        redirectTarget: "_modal";
      }): Promise<{ error?: { message?: string }; redirect?: boolean; paymentDetails?: unknown }>;
    };
  }
}
let checkoutLoader: Promise<void> | undefined;
function loadCheckout() {
  if (window.Cashfree) return Promise.resolve();
  if (!checkoutLoader)
    checkoutLoader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.onload = () => resolve();
      script.onerror = () => {
        checkoutLoader = undefined;
        script.remove();
        reject(new Error("Could not load secure checkout. Please retry from your bookings."));
      };
      document.head.appendChild(script);
    });
  return checkoutLoader;
}
export async function payForBooking(bookingId: string): Promise<void> {
  await loadCheckout();
  const order = await rentalRequest<{ paymentSessionId: string; mode: "sandbox" | "production" }>(
    "payment",
    { bookingId },
  );
  if (!window.Cashfree) throw new Error("Cashfree checkout is unavailable.");
  const result = await window
    .Cashfree({ mode: order.mode })
    .checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: "_modal" });
  if (result.redirect) return; // Cashfree returns to the account page for server-side reconciliation.
  // Even a closed modal can have a completed payment. Always ask the server.
  await rentalRequest("payment", { action: "verify", bookingId });
}
