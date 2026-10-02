const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer } = require("./helpers");

describe("voice endpoints without an ElevenLabs key", () => {
  let server;
  before(async () => {
    server = await startTestServer();
  });
  after(() => server.close());

  test("status reports voice as not ready", async () => {
    const { status, body } = await server.request("GET", "/api/voice/status");
    assert.equal(status, 200);
    assert.equal(body.ready, false);
  });

  test("transcribe and speak answer 503 instead of crashing", async () => {
    const t = await server.request("POST", "/api/voice/transcribe", {});
    assert.equal(t.status, 503);
    const s = await server.request("POST", "/api/voice/speak", { text: "hello" });
    assert.equal(s.status, 503);
  });

  test("health says voice falls back to the browser", async () => {
    const { body } = await server.request("GET", "/api/health");
    assert.equal(body.voice, "browser");
  });
});
