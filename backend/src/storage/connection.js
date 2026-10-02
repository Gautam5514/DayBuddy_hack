// MongoDB connection via Mongoose. Connecting is best-effort: if Mongo is
// unreachable the app keeps running on the in-memory store, and keeps retrying
// in the background, so fixing the cause (say, an Atlas IP allow-list) needs
// no restart.

const mongoose = require("mongoose");

const RETRY_MS = 30_000;
let listenersAttached = false;
let retryTimer = null;

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on("disconnected", () =>
    console.warn("[db] MongoDB disconnected — using in-memory storage")
  );
  mongoose.connection.on("reconnected", () => console.log("[db] MongoDB reconnected"));
}

async function connectDB({ uri, serverSelectionTimeoutMs }) {
  attachListeners();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: serverSelectionTimeoutMs });
    console.log("[db] MongoDB connected");
    return true;
  } catch (err) {
    console.warn(
      `[db] MongoDB unavailable (${err.message}) — using in-memory storage, retrying in ${RETRY_MS / 1000}s`
    );
    // unref() so a pending retry never keeps the process alive on shutdown.
    retryTimer = setTimeout(() => connectDB({ uri, serverSelectionTimeoutMs }), RETRY_MS);
    retryTimer.unref();
    return false;
  }
}

function isConnected() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

async function disconnectDB() {
  clearTimeout(retryTimer);
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB, isConnected };
