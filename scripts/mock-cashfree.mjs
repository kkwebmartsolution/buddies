// Preloaded ONLY in the isolated payment test process. Never calls the real provider.
import { readFileSync } from "node:fs";
const originalFetch = globalThis.fetch;
const orders = new Map();
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (!/^https:\/\/(sandbox|api)\.cashfree\.com\/pg\//.test(url)) return originalFetch(input, init);
  const route = url.split("/pg/")[1];
  if (route === "orders" && init?.method === "POST") {
    const body = JSON.parse(init.body);
    if (orders.has(body.order_id))
      return Response.json({ code: "order_already_exists" }, { status: 409 });
    orders.set(body.order_id, body);
    return Response.json({
      ...body,
      order_status: "ACTIVE",
      payment_session_id: "session_" + body.order_id,
    });
  }
  const id = decodeURIComponent(route.split("/")[1]),
    order = orders.get(id);
  if (!order) return Response.json({ error: "Unknown fixture order" }, { status: 404 });
  const state = JSON.parse(readFileSync(process.env.CASHFREE_MOCK_STATE, "utf8"))[id] || "pending";
  if (route.endsWith("/payments"))
    return Response.json(
      state === "pending"
        ? []
        : [
            {
              cf_payment_id: "payment_" + id,
              order_id: id,
              payment_amount: order.order_amount + (state === "wrong" ? 1 : 0),
              payment_currency: "INR",
              payment_status: "SUCCESS",
              is_captured: state !== "authorized",
            },
          ],
    );
  return Response.json({
    ...order,
    order_status: state === "pending" ? "ACTIVE" : "PAID",
    payment_session_id: "session_" + id,
  });
};
