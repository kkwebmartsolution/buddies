import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mockSmsConfig } from "./rental-test-auth.mjs";
assert.ok(["localhost", "127.0.0.1", "::1"].includes(process.env.MYSQL_HOST));
const sms = mockSmsConfig(),
  base = "http://127.0.0.1:8184";
const env = { ...process.env, ...sms.env, APP_ORIGIN: base, RENTAL_TEST_URL: base };
const child = spawn(
  process.execPath,
  [
    "--import",
    "./scripts/mock-fast2sms.mjs",
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "8184",
    "--strictPort",
  ],
  { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
for (const stream of [child.stdout, child.stderr])
  stream.on("data", (s) => {
    logs = (logs + s).slice(-4000);
  });
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (child.exitCode !== null) throw Error("Test server stopped: " + logs);
    try {
      if ((await fetch(base + "/api/rentals/catalog")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(1000);
  }
  assert.ok(ready, "OTP test server failed to start");
  for (const script of [
    "test-rental-otp-security.mjs",
    "test-rentals.mjs",
    "test-rental-browser.mjs",
  ]) {
    const test = spawn(process.execPath, ["scripts/" + script], {
      env,
      windowsHide: true,
      stdio: "inherit",
    });
    const code = await new Promise((resolve, reject) => {
      test.once("error", reject);
      test.once("exit", resolve);
    });
    assert.equal(code, 0, script + " failed");
  }
} finally {
  child.kill();
  await new Promise((resolve) => {
    if (child.exitCode !== null) resolve();
    else child.once("exit", resolve);
  });
  sms.cleanup();
}
