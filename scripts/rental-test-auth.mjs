import assert from "node:assert/strict";
import { randomInt, randomUUID, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
export const testPhone = () => "9" + String(randomInt(100000000, 999999999));
export function mockSmsConfig() {
  mkdirSync(".rental-test-artifacts", { recursive: true });
  const file = path.resolve(".rental-test-artifacts", `sms-${randomUUID()}.json`);
  writeFileSync(file, "{}");
  return {
    env: {
      FAST2SMS_MOCK_STATE: file,
      FAST2SMS_API_KEY: "isolated-sms-test-key",
      WABA_API_KEY: "isolated-waba-test-key",
      WABA_API_BASE: "https://waba.kkwebmart.in/api/v1",
      WABA_ADMIN_PHONE: "916001263561",
      WABA_BOOKING_TEMPLATE: "buddies_booking_confirmed",
      WABA_TEMPLATE_LANGUAGE: "en_US",
      WABA_NOTIFICATIONS_ENABLED: "true",
      FAST2SMS_SENDER_ID: "KKWMRT",
      FAST2SMS_MESSAGE_ID: "225363",
      FAST2SMS_OTP_VARIABLES: "{otp}",
      OTP_SECRET: randomBytes(32).toString("hex"),
    },
    cleanup: () => unlinkSync(file),
  };
}
export function testOtp(phone) {
  assert.ok(
    process.env.FAST2SMS_MOCK_STATE,
    "Run via the isolated OTP test runner; never send real SMS from tests.",
  );
  return JSON.parse(readFileSync(process.env.FAST2SMS_MOCK_STATE, "utf8")).messages[phone];
}
export async function testRegister(api, profile) {
  assert.ok(
    process.env.FAST2SMS_MOCK_STATE,
    "OTP test mock must be configured before registration",
  );
  const phone = profile.phone || testPhone();
  const sent = await api("account", {
    ...profile,
    phone,
    action: "request_otp",
    purpose: "register",
  });
  assert.equal(sent.status, 200, JSON.stringify(sent.data));
  const verified = await api("account", {
    action: "verify_otp",
    challenge: sent.data.challenge,
    otp: testOtp(phone),
  });
  return verified;
}
