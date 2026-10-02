// Builds the Express app without starting it, so tests can mount it on any port.

const express = require("express");
const { Sentry } = require("./services/telemetry");
const cors = require("cors");

const config = require("./config");
const { currentUser } = require("./middleware/currentUser");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "50kb" }));
  app.use(currentUser(config.defaultUserId));

  app.use("/", require("./routes/health"));
  app.use("/api/prefs", require("./routes/prefs"));
  app.use("/api/tasks", require("./routes/tasks"));
  app.use("/api", require("./routes/checkins"));
  app.use("/api", require("./routes/ai"));
  app.use("/api/voice", require("./routes/voice"));

  // After the routes, before our own handlers: reports 5xx errors to Sentry.
  Sentry.setupExpressErrorHandler(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
