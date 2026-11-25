import { mockSmsConfig } from "./rental-test-auth.mjs";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { readdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const sms = mockSmsConfig();
const base = "http://127.0.0.1:8183";
const env = {
  ...process.env,
  ...sms.env,
  PORT: "8183",
  HOST: "127.0.0.1",
  NODE_ENV: "production",
  APP_ORIGIN: base,
  ADMIN_PASSWORD: randomBytes(24).toString("hex"),
  RENTAL_TEST_URL: base,
  RENTAL_PAYMENT_PROVIDER: "pickup",
};
assert.ok(
  ["localhost", "127.0.0.1", "::1"].includes(env.MYSQL_HOST),
  "Production smoke tests require local MySQL",
);
const child = spawn(
  process.execPath,
  ["--import", "./scripts/mock-fast2sms.mjs", ".output/server/index.mjs"],
  {
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "",
  uploaded;
child.stdout.on("data", (s) => {
  logs = (logs + s).slice(-4000);
});
child.stderr.on("data", (s) => {
  logs = (logs + s).slice(-4000);
});
try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    if (child.exitCode !== null) throw new Error(`Production server exited: ${logs}`);
    try {
      const r = await fetch(base + "/api/rentals/catalog");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Server starting. */
    }
    await delay(1000);
  }
  assert.ok(ready, `Production server did not start: ${logs}`);
  const login = await fetch(base + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: env.ADMIN_PASSWORD }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers
    .getSetCookie()
    .map((s) => s.split(";")[0])
    .join("; ");
  const admin = await fetch(base + "/api/rentals/admin", { headers: { Cookie: cookie } });
  assert.equal(admin.status, 200);
  console.log("PASS production Node server, MySQL catalog and authenticated admin");
  const upload = await fetch(base + "/api/admin/upload", {
    method: "POST",
    headers: { Cookie: cookie, Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: "production-test-pixel.png",
      base64:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1kAAAAASUVORK5CYII=",
    }),
  });
  assert.equal(upload.status, 200);
  uploaded = (await upload.json()).imageUrl;
  const image = await fetch(base + uploaded);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.equal(image.headers.get("x-content-type-options"), "nosniff");
  console.log("PASS uploaded images are served by the production build from durable storage");
  const files = await readdir(".output/public/assets");
  for (const filename of files.filter((f) => f.endsWith(".js"))) {
    const content = await readFile(path.join(".output/public/assets", filename), "utf8");
    for (const key of [
      "JWT_SECRET",
      "MYSQL_PASSWORD",
      "CASHFREE_SECRET_KEY",
      "FAST2SMS_API_KEY",
      "OTP_SECRET",
      "WABA_API_KEY",
    ]) {
      if (process.env[key]?.length > 8)
        assert.ok(!content.includes(process.env[key]), `${key} leaked into client bundle`);
    }
  }
  console.log("PASS configured server secrets are absent from browser JavaScript");
  const browserTest = spawn(process.execPath, ["scripts/test-rental-browser.mjs"], {
    env,
    windowsHide: true,
    stdio: "inherit",
  });
  const code = await new Promise((resolve, reject) => {
    browserTest.on("error", reject);
    browserTest.on("exit", resolve);
  });
  assert.equal(code, 0, "Production browser journey failed");
  const logout = await fetch(base + "/api/admin/logout", {
    method: "POST",
    headers: { Origin: base, Cookie: cookie },
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  console.log("PASS admin logout clears the HttpOnly cookie");
} finally {
  child.kill();
  sms.cleanup();
  if (uploaded) {
    const filename = path.basename(uploaded);
    assert.match(filename, /production-test-pixel\.png\.png$/);
    await unlink(
      path.join(process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads"), filename),
    );
  }
}
