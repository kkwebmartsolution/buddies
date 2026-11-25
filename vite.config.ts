// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

// Load private server configuration even when the editor launches Vite directly.
// Never expose these through Vite's client `define` or a VITE_ variable.
const serverEnv = Object.assign(
  {},
  ...[".env", ".env.local"].filter(existsSync).map((file) => parseEnv(readFileSync(file, "utf8"))),
);
for (const key of [
  "MYSQL_HOST",
  "MYSQL_PORT",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
  "JWT_SECRET",
  "ADMIN_PASSWORD",
  "APP_ORIGIN",
  "RENTAL_PAYMENT_PROVIDER",
  "CASHFREE_APP_ID",
  "CASHFREE_SECRET_KEY",
  "CASHFREE_ENV",
  "UPLOAD_DIR",
  "FAST2SMS_API_KEY",
  "FAST2SMS_SENDER_ID",
  "FAST2SMS_MESSAGE_ID",
  "FAST2SMS_OTP_VARIABLES",
  "OTP_SECRET",
  "WABA_API_KEY",
  "WABA_API_BASE",
  "WABA_ADMIN_PHONE",
  "WABA_BOOKING_TEMPLATE",
  "WABA_TEMPLATE_LANGUAGE",
  "WABA_NOTIFICATIONS_ENABLED",
]) {
  if (process.env[key] === undefined && serverEnv[key] !== undefined)
    process.env[key] = serverEnv[key];
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
