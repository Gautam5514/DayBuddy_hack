// ElevenLabs voice: Scribe turns a recorded voice note into text, and
// text-to-speech lets DayBuddy read the plan out loud. Both are optional;
// without a key the app falls back to the browser's own speech recognition.

const { elevenlabs } = require("../config");

const isConfigured = () => Boolean(elevenlabs.apiKey);

async function call(path, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), elevenlabs.timeoutMs);
  try {
    const res = await fetch(`${elevenlabs.apiBase}${path}`, {
      ...init,
      headers: { ...init.headers, "xi-api-key": elevenlabs.apiKey },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ElevenLabs responded ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Audio bytes in, transcript out. Scribe detects the language by itself,
// which handles Hinglish voice notes without any setting.
async function transcribe(audio, mimeType = "audio/webm") {
  if (!isConfigured()) throw new Error("ELEVENLABS_API_KEY is not set");
  const form = new FormData();
  form.append("model_id", elevenlabs.sttModel);
  form.append("tag_audio_events", "false");
  form.append("file", new Blob([audio], { type: mimeType }), "voice-note");
  const res = await call("/speech-to-text", { method: "POST", body: form });
  const data = await res.json();
  return String(data.text ?? "").trim();
}

// Text in, MP3 bytes out. The multilingual model reads English and Hindi.
async function speak(text) {
  if (!isConfigured()) throw new Error("ELEVENLABS_API_KEY is not set");
  const res = await call(`/text-to-speech/${elevenlabs.voiceId}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: elevenlabs.ttsModel }),
  });
  return Buffer.from(await res.arrayBuffer());
}

module.exports = { transcribe, speak, isConfigured };
