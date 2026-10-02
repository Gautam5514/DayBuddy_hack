// Shared test setup. Require this before any app module: it blanks the API key
// so no test can reach the real Gemma API, whatever is in .env.
process.env.GEMMA_API_KEY = "";
process.env.ELEVENLABS_API_KEY = "";
process.env.SENTRY_DSN = "";

const { createApp } = require("../src/app");

// Start the app on a random free port and return a tiny JSON client for it.
async function startTestServer() {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  }

  return {
    baseUrl,
    request,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// A stand-in for gemmaClient that returns a canned answer (or throws).
function fakeClient(respond) {
  return {
    isConfigured: () => true,
    generateText: async (prompt) => respond(prompt),
  };
}

module.exports = { startTestServer, fakeClient };
