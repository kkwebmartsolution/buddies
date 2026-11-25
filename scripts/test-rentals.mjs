import { readFileSync, writeFileSync } from "node:fs";
import { testRegister } from "./rental-test-auth.mjs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

// Isolated fixtures only; never run this against a production server/database.
const base = process.env.RENTAL_TEST_URL || "http://127.0.0.1:8181";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Tests require a local app");
assert.ok(
  ["localhost", "127.0.0.1", "::1"].includes(process.env.MYSQL_HOST),
  "Tests require local MySQL",
);
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
const marker = randomUUID().slice(0, 8);
const emails = [
  `rental-test-${marker}-a@example.invalid`,
  `rental-test-${marker}-b@example.invalid`,
];
const products = [];
let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`PASS ${name}`);
};
async function call(path, body, cookie = "", origin = base) {
  const result = await fetch(`${base}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await result.json();
  return {
    status: result.status,
    data,
    cookie: result.headers
      .getSetCookie()
      .map((s) => s.split(";")[0])
      .join("; "),
    headers: result.headers,
  };
}
const api = (route, body, cookie, origin) => call(`/api/rentals/${route}`, body, cookie, origin);
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
try {
  const admin = await call("/api/admin/login", {
    username: "admin",
    password: process.env.ADMIN_PASSWORD,
  });
  assert.equal(
    admin.status,
    200,
    "Admin login failed; restart dev using npm run dev to load environment",
  );
  assert.ok(admin.cookie);
  const denied = await api("admin");
  check("admin data requires admin authentication", () => assert.equal(denied.status, 401));
  const csrf = await api("account", { action: "register" }, "", "https://attacker.invalid");
  check("cross-origin mutations are rejected", () => assert.equal(csrf.status, 403));
  const users = [];
  for (const email of emails) {
    const user = await testRegister(api, {
      name: `Rental Test ${marker}`,
      email,
    });
    assert.equal(user.status, 200, JSON.stringify(user.data));
    users.push(user);
  }
  check("registration uses HttpOnly sessions and returns no password hash", () => {
    assert.match(users[0].headers.get("set-cookie"), /HttpOnly/);
    assert.equal(users[0].data.customer.password_hash, undefined);
  });
  const duplicate = await testRegister(api, {
    name: "Duplicate",
    email: emails[0],
  });
  check("duplicate account rejected", () => assert.equal(duplicate.status, 400));
  const wrong = await api("account", {
    action: "login",
    email: emails[0],
    password: "wrong-password-123",
  });
  check("password login removed", () => assert.equal(wrong.status, 400));
  const userAdmin = await api("admin", undefined, users[0].cookie);
  check("customer cannot read admin records", () => assert.equal(userAdmin.status, 401));
  const fixture = {
    kind: "equipment",
    name: `Test camera ${marker}`,
    category: "Integration tests",
    description: "Temporary rental fixture for automated verification.",
    image: "/src/assets/rental-camera.jpg",
    size: "Test kit",
    specifications: "Test only",
    price_paise: 10000,
    deposit_paise: 5000,
    stock: 1,
    min_days: 1,
    active: true,
  };
  const product = await api("admin", { action: "save_product", product: fixture }, admin.cookie);
  assert.equal(product.status, 200, JSON.stringify(product.data));
  products.push(product.data.product.id);
  const id = products[0];
  const booking = (extra = {}) => ({
    items: [{ productId: id, quantity: 1 }],
    startDate: day(2),
    endDate: day(3),
    paymentMethod: "pickup",
    notes: "Integration test",
    idempotencyKey: randomUUID(),
    expectedTotal: 25000,
    ...extra,
  });
  const anonymous = await api("bookings", booking());
  check("checkout requires customer sign-in", () => assert.equal(anonymous.status, 401));
  const tampered = await api("bookings", booking({ expectedTotal: 1 }), users[0].cookie);
  check("server refuses tampered or stale totals", () => assert.equal(tampered.status, 409));
  const invalid = await api(
    "bookings",
    booking({ startDate: "2026-02-30", endDate: "2026-02-31" }),
    users[0].cookie,
  );
  check("invalid calendar dates rejected", () => assert.equal(invalid.status, 400));
  const duplicateItems = await api(
    "bookings",
    booking({
      items: [
        { productId: id, quantity: 1 },
        { productId: id, quantity: 1 },
      ],
    }),
    users[0].cookie,
  );
  check("duplicate cart lines rejected", () => assert.equal(duplicateItems.status, 400));
  const negative = await api(
    "bookings",
    booking({ items: [{ productId: id, quantity: -1 }] }),
    users[0].cookie,
  );
  check("negative quantity rejected", () => assert.equal(negative.status, 400));
  const inputs = [booking(), booking()];
  const concurrent = await Promise.all(users.map((u, i) => api("bookings", inputs[i], u.cookie)));
  check("concurrent checkout cannot oversell the last unit", () =>
    assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]),
  );
  const winner = concurrent.findIndex((r) => r.status === 201),
    loser = 1 - winner;
  const order = concurrent[winner].data.booking;
  check("pay-at-pickup reserves inventory without claiming payment", () => {
    assert.equal(order.status, "confirmed");
    assert.equal(order.payment_status, "unpaid");
    assert.equal(order.total_paise, 25000);
  });
  const retry = await api("bookings", inputs[winner], users[winner].cookie);
  check("checkout retry is idempotent", () => {
    assert.equal(retry.status, 201);
    assert.equal(retry.data.booking.id, order.id);
  });
  const noticeState = JSON.parse(readFileSync(process.env.FAST2SMS_MOCK_STATE, "utf8"));
  const notices = noticeState.waba.filter((n) => n.template.params[0] === order.booking_number);
  check("confirmed booking sends exactly one admin template even after checkout retry", () => {
    assert.equal(notices.length, 1);
    assert.equal(notices[0].template.params[2], order.customer_name);
    assert.equal(notices[0].template.params[3], order.customer_phone);
    assert.equal(notices[0].template.params[6], "2 days");
  });
  const changed = await api(
    "bookings",
    { ...inputs[winner], notes: "changed" },
    users[winner].cookie,
  );
  check("idempotency key cannot be reused with a different cart", () =>
    assert.equal(changed.status, 409),
  );
  const forbiddenCancel = await api(
    "bookings",
    { action: "cancel", id: order.id },
    users[loser].cookie,
  );
  check("customer cannot cancel another customer's booking", () =>
    assert.equal(forbiddenCancel.status, 404),
  );
  const otherList = await api("bookings", undefined, users[loser].cookie);
  check("booking lists are scoped to the signed-in customer", () =>
    assert.ok(!otherList.data.bookings.some((b) => b.id === order.id)),
  );
  const stock = await api(
    "admin",
    { action: "save_product", product: { ...fixture, id, stock: 0 } },
    admin.cookie,
  );
  check("stock cannot be reduced below reserved inventory", () => assert.equal(stock.status, 409));
  const pay = await api(
    "admin",
    { action: "record_payment", id: order.id, reference: `CASH-TEST-${marker}` },
    admin.cookie,
  );
  check("admin can record an actual pickup receipt", () => assert.equal(pay.status, 200));
  const requestCancel = await api(
    "bookings",
    { action: "cancel", id: order.id },
    users[winner].cookie,
  );
  assert.equal(requestCancel.status, 200);
  const review = await api("bookings", undefined, users[winner].cookie);
  check("paid cancellation needs review", () =>
    assert.equal(review.data.bookings.find((b) => b.id === order.id).status, "cancel_requested"),
  );
  const cancel = await api("admin", { action: "cancel", id: order.id }, admin.cookie);
  assert.equal(cancel.status, 200);
  const cancelled = await api("bookings", undefined, users[winner].cookie);
  check("paid cancellation records refund pending", () =>
    assert.equal(
      cancelled.data.bookings.find((b) => b.id === order.id).payment_status,
      "refund_pending",
    ),
  );
  const refund = await api(
    "admin",
    { action: "record_refund", id: order.id, reference: `REFUND-TEST-${marker}` },
    admin.cookie,
  );
  check("external refund can be recorded once", () => assert.equal(refund.status, 200));
  const refundAgain = await api(
    "admin",
    { action: "record_refund", id: order.id, reference: "repeat" },
    admin.cookie,
  );
  check("duplicate refund mutation rejected", () => assert.equal(refundAgain.status, 409));
  const fresh = await api("bookings", booking(), users[loser].cookie);
  check("cancelled booking releases inventory", () => assert.equal(fresh.status, 201));
  await api("bookings", { action: "cancel", id: fresh.data.booking.id }, users[loser].cookie);
  // Two disjoint reservations should not incorrectly consume two units across the whole window.
  const one = await api(
    "bookings",
    booking({ startDate: day(5), endDate: day(5), expectedTotal: 15000 }),
    users[0].cookie,
  );
  const two = await api(
    "bookings",
    booking({ startDate: day(7), endDate: day(7), expectedTotal: 15000 }),
    users[1].cookie,
  );
  assert.equal(one.status, 201);
  assert.equal(two.status, 201);
  await api(
    "admin",
    { action: "save_product", product: { ...fixture, id, stock: 2 } },
    admin.cookie,
  );
  const spanning = await api(
    "bookings",
    booking({ startDate: day(5), endDate: day(7), expectedTotal: 35000 }),
    users[0].cookie,
  );
  check("availability uses peak daily overlap, not sum of disjoint bookings", () =>
    assert.equal(spanning.status, 201),
  );
  const boundary = await api("catalog?start=" + day(5) + "&end=" + day(5));
  check("pickup and return dates are inclusive", () =>
    assert.equal(boundary.data.products.find((p) => p.id === id).available, 0),
  );
  const forged = await api(
    "payment",
    {
      action: "verify",
      bookingId: spanning.data.booking.id,
      payment_status: "SUCCESS",
    },
    users[0].cookie,
  );
  check("forged payment success rejected", () => assert.equal(forged.status, 400));
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const fulfil = await api(
    "bookings",
    booking({ startDate: today, endDate: today, expectedTotal: 15000 }),
    users[0].cookie,
  );
  assert.equal(fulfil.status, 201);
  const unpaidCollection = await api(
    "admin",
    { action: "collect", id: fulfil.data.booking.id },
    admin.cookie,
  );
  check("unpaid rentals cannot be collected", () => assert.equal(unpaidCollection.status, 409));
  for (const action of ["record_payment", "collect", "complete", "return_deposit"]) {
    const result = await api(
      "admin",
      { action, id: fulfil.data.booking.id, reference: `RECEIPT-${marker}-${action}` },
      admin.cookie,
    );
    assert.equal(result.status, 200, `${action}: ${JSON.stringify(result.data)}`);
  }
  const fulfilList = await api("bookings", undefined, users[0].cookie);
  const completed = fulfilList.data.bookings.find((b) => b.id === fulfil.data.booking.id);
  check("collection, return and deposit receipt persist", () => {
    assert.equal(completed.status, "completed");
    assert.equal(completed.deposit_returned, true);
    assert.ok(completed.deposit_reference);
  });
  const repeatDeposit = await api(
    "admin",
    { action: "return_deposit", id: fulfil.data.booking.id, reference: "repeat" },
    admin.cookie,
  );
  check("deposit return cannot be recorded twice", () => assert.equal(repeatDeposit.status, 409));
  const [events] = await db.query(
    "SELECT COUNT(*) AS count FROM rental_notification_outbox o JOIN rental_bookings b ON b.id=o.booking_id JOIN rental_customers c ON c.id=b.customer_id WHERE c.email IN (?) AND o.status='awaiting_integration'",
    [emails],
  );
  check("booking/payment events await future WhatsApp integration", () =>
    assert.ok(events[0].count >= 8),
  );
  const setWabaFailure = (value) => {
    const state = JSON.parse(readFileSync(process.env.FAST2SMS_MOCK_STATE, "utf8"));
    state.wabaFail = value;
    writeFileSync(process.env.FAST2SMS_MOCK_STATE, JSON.stringify(state));
  };
  setWabaFailure(true);
  const failedNotice = await api(
    "bookings",
    booking({ startDate: day(100), endDate: day(101) }),
    users[0].cookie,
  );
  assert.equal(failedNotice.status, 201);
  const [failedRows] = await db.query(
    "SELECT status FROM rental_admin_notifications WHERE booking_id=?",
    [failedNotice.data.booking.id],
  );
  check("WhatsApp rejection does not fail the booking", () =>
    assert.equal(failedRows[0].status, "failed"),
  );
  setWabaFailure(false);
  const retryNotice = await api(
    "admin",
    { action: "retry_notification", id: failedNotice.data.booking.id },
    admin.cookie,
  );
  assert.equal(retryNotice.status, 200);
  const [retried] = await db.query(
    "SELECT status,attempts FROM rental_admin_notifications WHERE booking_id=?",
    [failedNotice.data.booking.id],
  );
  check("admin can retry rejected WhatsApp notifications", () => {
    assert.equal(retried[0].status, "accepted");
    assert.equal(retried[0].attempts, 2);
  });
  setWabaFailure("unknown");
  const unknownNotice = await api(
    "bookings",
    booking({ startDate: day(103), endDate: day(104) }),
    users[0].cookie,
  );
  assert.equal(unknownNotice.status, 201);
  setWabaFailure(false);
  await api(
    "admin",
    { action: "retry_notification", id: unknownNotice.data.booking.id },
    admin.cookie,
  );
  const [unknownRows] = await db.query(
    "SELECT status,attempts FROM rental_admin_notifications WHERE booking_id=?",
    [unknownNotice.data.booking.id],
  );
  check("uncertain WhatsApp delivery is not automatically duplicated", () => {
    assert.equal(unknownRows[0].status, "unknown");
    assert.equal(unknownRows[0].attempts, 1);
  });
  const profile = await api(
    "account",
    { action: "profile", name: "Updated test customer" },
    users[0].cookie,
  );
  check("customer profile updates persist", () =>
    assert.equal(profile.data.customer.name, "Updated test customer"),
  );
  const change = await api(
    "account",
    { action: "profile", name: "Updated test customer", phone: "9876543211" },
    users[0].cookie,
  );
  check("unverified phone changes rejected", () => assert.equal(change.status, 400));
  await api("account", { action: "logout" }, users[0].cookie);
  const loggedOut = await api("account", undefined, users[0].cookie);
  check("logout invalidates the server session", () => assert.equal(loggedOut.data.customer, null));
  console.log(`\n${passed} rental integration checks passed.`);
} finally {
  // Delete only this run's explicit fixtures; cascades remove their events/items/sessions.
  await db.query(
    "DELETE b FROM rental_bookings b JOIN rental_customers c ON c.id=b.customer_id WHERE c.email IN (?)",
    [emails],
  );
  await db.query(
    "DELETE o FROM rental_otp_challenges o JOIN rental_customers c ON c.phone=o.phone WHERE c.email IN (?)",
    [emails],
  );
  await db.query("DELETE FROM rental_otp_challenges WHERE profile_json LIKE ?", [`%${marker}%`]);
  await db.query("DELETE FROM rental_customers WHERE email IN (?)", [emails]);
  if (products.length) await db.query("DELETE FROM rental_products WHERE id IN (?)", [products]);
  await db.end();
}
