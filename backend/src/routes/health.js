const { Router } = require("express");
const store = require("../storage");
const gemmaClient = require("../services/gemmaClient");
const elevenlabs = require("../services/elevenlabs");

const router = Router();

// Liveness: the process is up. Cheap, no external calls.
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    model: gemmaClient.model,
    storage: store.storageMode(),
  });
});

// Readiness: can we actually reach the model? Returns 503 when degraded.
router.get("/api/health", async (req, res) => {
  const gemma = await gemmaClient.probe();
  const ok = gemma.reachable && gemma.modelPresent;
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    database: store.storageMode(),
    gemma: ok ? "connected" : gemma.error || "unavailable",
    model: gemma.model,
    voice: elevenlabs.isConfigured() ? "elevenlabs" : "browser",
  });
});

module.exports = router;
