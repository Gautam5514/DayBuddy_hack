// Single source of truth for runtime configuration.
// Every environment variable is read here once, so the rest of the code
// depends on a plain, frozen object instead of `process.env`.

const path = require("node:path");

// Resolve .env relative to the backend folder, so it loads from any cwd.
// Variables already set in the environment win over the file.
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const config = Object.freeze({
  port: toInt(process.env.PORT, 5001),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  defaultUserId: process.env.DEFAULT_USER_ID || "demo-user",

  mongo: Object.freeze({
    uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/daybuddy",
    serverSelectionTimeoutMs: 3000,
  }),

  gemma: Object.freeze({
    apiKey: process.env.GEMMA_API_KEY || "",
    model: process.env.GEMMA_API_MODEL || "gemma-4-26b-a4b-it",
    apiBase: process.env.GEMMA_API_BASE || "https://generativelanguage.googleapis.com/v1beta",
    timeoutMs: toInt(process.env.GEMMA_TIMEOUT_MS, 45_000),
    probeTimeoutMs: 5000,
  }),

  // Voice: ElevenLabs Scribe (speech to text) and TTS. Optional.
  elevenlabs: Object.freeze({
    apiKey: process.env.ELEVENLABS_API_KEY || "",
    apiBase: process.env.ELEVENLABS_API_BASE || "https://api.elevenlabs.io/v1",
    voiceId: process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL", // "Sarah", a premade voice
    sttModel: process.env.ELEVENLABS_STT_MODEL || "scribe_v1",
    ttsModel: process.env.ELEVENLABS_TTS_MODEL || "eleven_multilingual_v2",
    timeoutMs: toInt(process.env.ELEVENLABS_TIMEOUT_MS, 30_000),
  }),

  // Sentry agent tracing. Optional: no DSN means no tracing.
  sentry: Object.freeze({
    dsn: process.env.SENTRY_DSN || "",
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
  }),
});

module.exports = config;
