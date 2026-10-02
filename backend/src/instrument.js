// Sentry must start before Express is required so it can patch Express, fetch
// and Mongo. With no SENTRY_DSN this does nothing and the app runs as usual.

const config = require("./config");
const Sentry = require("@sentry/node");

if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    // Trace every request: this is a one-user app, so volume is tiny.
    tracesSampleRate: 1,
    // Check-ins and tasks are personal. Never attach request bodies or IPs.
    sendDefaultPii: false,
  });
  console.log("[sentry] tracing enabled");
}
