import { testPhone, testOtp } from "./rental-test-auth.mjs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import mysql from "mysql2/promise";

// Allow cold local compilation and slower workstations to hydrate the page.
expect.configure({ timeout: 20000 });

const base = process.env.RENTAL_TEST_URL || "http://127.0.0.1:8181";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
assert.ok(["localhost", "127.0.0.1", "::1"].includes(process.env.MYSQL_HOST));
assert.ok(process.env.FAST2SMS_MOCK_STATE, "Run browser tests through the isolated OTP runner.");
const phone = testPhone();
const marker = randomUUID().slice(0, 8),
  email = `rental-browser-${marker}@example.invalid`;
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  baseURL: base,
});
const page = await context.newPage();
const ids = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir(".rental-test-artifacts", { recursive: true });
try {
  const login = await context.request.post("/api/admin/login", {
    data: { username: "admin", password: process.env.ADMIN_PASSWORD },
  });
  assert.equal(login.status(), 200);
  for (const kind of ["equipment", "costume"]) {
    const res = await context.request.post("/api/rentals/admin", {
      headers: { Origin: base },
      data: {
        action: "save_product",
        product: {
          kind,
          name: kind === "equipment" ? `Cinema camera ${marker}` : `Royal costume ${marker}`,
          category: kind === "equipment" ? "Cinema cameras" : "Period wardrobe",
          description: "A complete production-ready rental set, prepared for your next shoot.",
          image:
            kind === "equipment"
              ? "/src/assets/rental-camera.jpg"
              : "/src/assets/costume-rental.jpg",
          size: kind === "costume" ? "M — chest 38–40 in" : "",
          specifications: "Includes the complete set and a protective carry case.",
          price_paise: kind === "equipment" ? 200000 : 100000,
          deposit_paise: 50000,
          stock: 2,
          min_days: 1,
          active: true,
        },
      },
    });
    assert.equal(res.status(), 200, await res.text());
    ids.push((await res.json()).product.id);
  }
  await page.goto("/rentals");
  await expect(page.getByRole("heading", { name: "Your vision. Our gear." })).toBeVisible();
  await expect(page.getByText(`Cinema camera ${marker}`, { exact: true })).toBeVisible();
  const start = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const end = new Date(Date.now() + 11 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel("Pickup date").fill(start);
  await page.getByLabel("Return date").fill(end);
  await page.getByRole("button", { name: "Check availability", exact: true }).click();
  await expect(page.getByText("2 available for selected dates")).toBeVisible();
  await page.screenshot({ path: ".rental-test-artifacts/equipment-desktop.png", fullPage: true });
  await page
    .locator("article")
    .filter({ hasText: `Cinema camera ${marker}` })
    .getByRole("button", { name: "Add to cart", exact: true })
    .click();
  await page.goto("/costume-rentals");
  await expect(page.getByText(`Royal costume ${marker}`, { exact: true })).toBeVisible();
  await page
    .locator("article")
    .filter({ hasText: `Royal costume ${marker}` })
    .getByRole("button", { name: "Add to cart", exact: true })
    .click();
  await page.goto("/cart");
  await expect(page.getByText(`Cinema camera ${marker}`, { exact: true })).toBeVisible();
  await expect(page.getByText(`Royal costume ${marker}`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Browser Test Customer");
  await page.getByLabel("Mobile number", { exact: true }).fill(phone);
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  await expect(page.getByLabel("One-time password (OTP)")).toBeVisible();
  await page.getByLabel("One-time password (OTP)").fill(testOtp(phone));
  await page.getByRole("button", { name: "Verify & create account", exact: true }).click();
  await expect(page.getByText("03 / Booking details")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.screenshot({ path: ".rental-test-artifacts/checkout-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Reserve rental", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your rental is reserved" })).toBeVisible();
  await page.getByRole("link", { name: "Manage my booking" }).click();
  await expect(page.getByText("unpaid", { exact: true })).toBeVisible();
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await page.screenshot({ path: ".rental-test-artifacts/account-desktop.png", fullPage: true });
  await page.goto("/admin/rentals");
  await page.getByLabel("Search rental management").fill(email);
  const bookingRow = page.getByRole("button").filter({ hasText: "Browser Test Customer" });
  await bookingRow.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Record pickup payment", exact: true }).click();
  await expect(page.getByLabel("Receipt / transaction reference")).toBeVisible();
  await page.screenshot({
    path: ".rental-test-artifacts/booking-drawer.png",
    animations: "disabled",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(bookingRow).toBeFocused();
  await page.goto("/account");
  await page.getByRole("button", { name: "Cancel booking", exact: true }).click();
  await page.getByRole("button", { name: "Yes, continue", exact: true }).click();
  await expect(page.getByText("cancelled", { exact: true })).toBeVisible();
  console.log("PASS browser signup, mixed cart, checkout, account and cancellation");
  await page.goto("/admin/rentals");
  await expect(page.getByRole("heading", { name: "Bookings", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Equipment", exact: true }).click();
  await page.getByLabel("Search rental management").fill(marker);
  await page.getByRole("button", { name: "Edit product", exact: true }).click();
  await page.getByLabel("Product name", { exact: true }).fill(`Cinema camera ${marker}`);
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(
    page.getByText("Product saved. Published products appear in the rental shop."),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.screenshot({
    path: ".rental-test-artifacts/admin-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  console.log("PASS admin product editor saves through authenticated API");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/rentals", "/costume-rentals", "/account", "/admin/rentals"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      `Horizontal overflow on ${path}`,
    );
    await page.screenshot({
      path: `.rental-test-artifacts/${path.replaceAll("/", "")}-mobile.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Equipment", exact: true }).click();
  await page.getByLabel("Search rental management").fill(marker);
  await page.getByRole("button", { name: "Out of stock", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No products found" })).toBeVisible();
  await page.getByRole("button", { name: "All items", exact: true }).click();
  await page.getByRole("button", { name: "Edit product", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  assert.ok(
    await page.getByRole("dialog").evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    "Mobile editor overflow",
  );
  await page.screenshot({
    path: ".rental-test-artifacts/product-editor-mobile.png",
    animations: "disabled",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Edit product", exact: true })).toBeFocused();
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await db.query(
    "UPDATE rental_otp_challenges SET resend_at=DATE_SUB(NOW(),INTERVAL 1 SECOND) WHERE phone=?",
    [phone],
  );
  await page.getByLabel("Mobile number", { exact: true }).fill(phone);
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  await expect(page.getByLabel("One-time password (OTP)")).toBeVisible();
  await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();
  await page.screenshot({ path: ".rental-test-artifacts/otp-mobile.png", fullPage: true });
  await page.getByLabel("One-time password (OTP)").fill(testOtp(phone));
  await page.getByRole("button", { name: "Verify & sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Hello, Browser/ })).toBeVisible();
  console.log("PASS passwordless mobile login, OTP screen and resend cooldown");
  console.log("PASS booking actions, drawer focus, stock filters and mobile editor");
  console.log("PASS equipment, costumes, account and admin mobile layouts (390px)");
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log("PASS no browser runtime errors");
} finally {
  await browser.close();
  await db.query(
    "DELETE b FROM rental_bookings b JOIN rental_customers c ON c.id=b.customer_id WHERE c.email=?",
    [email],
  );
  await db.query("DELETE FROM rental_customers WHERE email=?", [email]);
  if (ids.length) await db.query("DELETE FROM rental_products WHERE id IN (?)", [ids]);
  await db.query("DELETE FROM rental_otp_challenges WHERE phone=?", [phone]);
  await db.end();
}
