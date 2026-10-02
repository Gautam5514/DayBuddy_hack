// Entry point: connect storage, start HTTP, and shut down cleanly on signals.

require("./instrument"); // keep first: Sentry has to start before Express loads
const config = require("./config");
const { createApp } = require("./app");
const { connectDB, disconnectDB } = require("./storage/connection");

async function main() {
  await connectDB(config.mongo); // falls back to in-memory storage on failure

  const server = createApp().listen(config.port, () => {
    console.log(`[server] DayBuddy API listening on http://localhost:${config.port}`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Don't hang forever on keep-alive connections.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[server] failed to start", err);
  process.exit(1);
});
