// Voice endpoints, mounted at /api/voice:
//   GET  /status      is ElevenLabs configured?
//   POST /transcribe  raw audio body -> { text }
//   POST /speak       { text } -> audio/mpeg

const express = require("express");
const { Router } = require("express");
const { z } = require("zod");
const elevenlabs = require("../services/elevenlabs");
const { HttpError } = require("../errors");
const { LIMITS } = require("../constants");

const router = Router();

const speakSchema = z.object({ text: z.string().trim().min(1).max(LIMITS.speakText) });

function requireVoice(req, res, next) {
  if (!elevenlabs.isConfigured()) return next(new HttpError(503, "Voice is not configured."));
  next();
}

router.get("/status", (req, res) => {
  res.json({ success: true, ready: elevenlabs.isConfigured(), provider: "elevenlabs" });
});

router.post(
  "/transcribe",
  requireVoice,
  express.raw({ type: () => true, limit: LIMITS.audioBytes }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new HttpError(400, "Send the recorded audio as the request body.");
    }
    let text;
    try {
      text = await elevenlabs.transcribe(req.body, req.get("content-type") || undefined);
    } catch (err) {
      console.warn(`[voice] transcribe failed: ${err.message}`);
      throw new HttpError(502, "Couldn't transcribe that. Try again.");
    }
    res.json({ success: true, text });
  }
);

router.post("/speak", requireVoice, async (req, res) => {
  const { text } = speakSchema.parse(req.body ?? {});
  let audio;
  try {
    audio = await elevenlabs.speak(text);
  } catch (err) {
    console.warn(`[voice] speak failed: ${err.message}`);
    throw new HttpError(502, "Couldn't read that out loud. Try again.");
  }
  res.set("Content-Type", "audio/mpeg").set("Cache-Control", "private, max-age=3600").send(audio);
});

module.exports = router;
