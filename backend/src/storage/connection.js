// MongoDB connection via Mongoose. Connecting is best-effort: if Mongo is
// unreachable the app keeps running on the in-memory store.

const mongoose = require("mongoose");

async function connectDB({ uri, serverSelectionTimeoutMs }) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: serverSelectionTimeoutMs });
    console.log("[db] MongoDB connected");

    mongoose.connection.on("disconnected", () =>
      console.warn("[db] MongoDB disconnected — using in-memory storage")
    );
    mongoose.connection.on("reconnected", () => console.log("[db] MongoDB reconnected"));
    return true;
  } catch (err) {
    console.warn(`[db] MongoDB unavailable (${err.message}) — using in-memory storage`);
    return false;
  }
}

function isConnected() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB, isConnected };
