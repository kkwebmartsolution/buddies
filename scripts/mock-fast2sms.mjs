// Test-only preload. Intercepts Fast2SMS before requests can reach the network.
import { readFileSync, writeFileSync } from "node:fs";
if (!process.env.FAST2SMS_MOCK_STATE || process.env.FAST2SMS_API_KEY !== "isolated-sms-test-key")
  throw new Error("SMS mock requires isolated test configuration");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  if (String(input).startsWith("https://waba.kkwebmart.in/")) {
    const state = JSON.parse(readFileSync(process.env.FAST2SMS_MOCK_STATE, "utf8"));
    const body = JSON.parse(init.body);
    if (
      init.headers.Authorization !== "Bearer isolated-waba-test-key" ||
      body.to !== "+916001263561" ||
      body.template?.name !== "buddies_booking_confirmed" ||
      body.template?.language !== "en_US" ||
      body.template?.params?.length !== 7
    )
      throw Error("Incorrect WhatsApp test payload");
    state.waba ||= [];
    state.waba.push(body);
    writeFileSync(process.env.FAST2SMS_MOCK_STATE, JSON.stringify(state));
    if (state.wabaFail === "unknown") throw Error("Mock uncertain timeout");
    if (state.wabaFail)
      return Response.json(
        { error: { code: "meta_error", message: "Mock rejected send" } },
        { status: 502 },
      );
    return Response.json(
      {
        data: {
          message_id: "mock-message-" + state.waba.length,
          whatsapp_message_id: "wamid.mock-" + state.waba.length,
        },
      },
      { status: 201 },
    );
  }
  if (String(input) !== "https://www.fast2sms.com/dev/bulkV2") return originalFetch(input, init);
  const state = JSON.parse(readFileSync(process.env.FAST2SMS_MOCK_STATE, "utf8"));
  const body = Object.fromEntries(new URLSearchParams(init.body));
  if (
    init.headers.authorization !== "isolated-sms-test-key" ||
    body.sender_id !== "KKWMRT" ||
    body.message !== "225363" ||
    body.route !== "dlt"
  )
    throw new Error("Incorrect SMS payload");
  state.messages ||= {};
  state.messages[body.numbers] = body.variables_values;
  writeFileSync(process.env.FAST2SMS_MOCK_STATE, JSON.stringify(state));
  if (state.fail)
    return Response.json({ return: false, message: "Mock provider rejection" }, { status: 400 });
  return Response.json({ return: true, request_id: "mock-sms-request" });
};
