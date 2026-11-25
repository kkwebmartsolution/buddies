import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = "http://localhost:8080";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  baseURL: base,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const login = await context.request.post("/api/admin/login", {
  data: { username: "admin", password: process.env.ADMIN_PASSWORD },
});
assert.equal(login.status(), 200);
const token = (await login.json()).token;
await context.addInitScript((t) => {
  localStorage.setItem("buddies_admin_token", t);
  if (!localStorage.getItem("admin_theme")) localStorage.setItem("admin_theme", "light");
}, token);
const original = (await (await context.request.get("/api/content")).json()).site;
await mkdir(".rental-test-artifacts", { recursive: true });
let visitor;
try {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Equipment Products", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".rental-admin")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.screenshot({
    path: ".rental-test-artifacts/admin-light-editor.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Bookings & Customers", exact: true }).click();
  await expect(page.locator(".rental-admin")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.getByTitle("Switch to Dark Mode").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".rental-admin")).not.toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await page.getByTitle("Switch to Light Mode").click();
  await page.getByRole("button", { name: "Site Settings", exact: true }).click();
  await page.getByRole("radio", { name: "Light — white & red" }).check();
  await page.getByRole("button", { name: "Save Site Settings" }).click();
  await expect(page.getByText("Section 'site' saved successfully!", { exact: true })).toBeVisible();
  assert.equal(
    (
      await (
        await context.request.get("/api/content", { headers: { "Cache-Control": "no-cache" } })
      ).json()
    ).site.theme,
    "light",
  );
  const invalid = await context.request.post("/api/admin/update", {
    data: { section: "site", data: { ...original, theme: "invalid" } },
  });
  assert.equal(invalid.status(), 400);
  const html = await (await context.request.get("/rentals")).text();
  assert.match(html, /<html[^>]*data-theme="light"/);
  visitor = await browser.newContext({ baseURL: base, viewport: { width: 390, height: 844 } });
  const publicPage = await visitor.newPage();
  publicPage.on("pageerror", (e) => errors.push(e.message));
  for (const route of ["/", "/rentals", "/costume-rentals", "/account", "/cart"]) {
    await publicPage.goto(route);
    await publicPage.waitForLoadState("networkidle");
    if (route === "/account")
      await expect(publicPage.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(publicPage.locator("html")).toHaveAttribute("data-theme", "light");
    assert.ok(
      await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      "Overflow " + route,
    );
    if (route === "/rentals" || route === "/account")
      await publicPage.screenshot({
        path: ".rental-test-artifacts/light-" + route.slice(1) + ".png",
        fullPage: true,
        animations: "disabled",
      });
  }
  await page.getByRole("radio", { name: "Dark — charcoal & red" }).check();
  await page.getByRole("button", { name: "Save Site Settings" }).click();
  await expect
    .poll(
      async () =>
        (
          await (
            await context.request.get("/api/content", { headers: { "Cache-Control": "no-cache" } })
          ).json()
        ).site.theme,
    )
    .toBe("dark");
  await publicPage.reload();
  await expect(publicPage.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  assert.deepEqual(errors, []);
  console.log(
    "PASS admin light/dark, rental editor portal, website theme save, independent admin theme, SSR, fresh visitor, mobile layouts and invalid theme rejection",
  );
} finally {
  await context.request.post("/api/admin/update", { data: { section: "site", data: original } });
  await browser.close();
}
