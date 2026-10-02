// Thin HTTP client for Gemma 4 (Google's open-source model) on the hosted
// Gemini API. It knows nothing about plans or prompts — it sends text, returns text.
// Free key: https://aistudio.google.com/apikey

const { gemma } = require("../config");
const { traceModelCall, recordUsage } = require("./telemetry");

const isConfigured = () => Boolean(gemma.apiKey);

// fetch() with an abort deadline, always clearing its timer.
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Send a prompt and return the model's visible answer text.
// Each call is a traced span (latency, status, token usage) for Sentry agent monitoring.
function generateText(prompt) {
  if (!isConfigured()) return Promise.reject(new Error("GEMMA_API_KEY is not set"));

  return traceModelCall(
    gemma.model,
    { "gen_ai.request.temperature": 0.4, "app.prompt_chars": prompt.length },
    async (span) => {
      const res = await fetchWithTimeout(
        `${gemma.apiBase}/models/${gemma.model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": gemma.apiKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            // Gemma 4 reasons at length by default (50s+); "minimal" keeps plans ~10s.
            generationConfig: { temperature: 0.4, thinkingConfig: { thinkingLevel: "minimal" } },
          }),
        },
        gemma.timeoutMs
      );
      span.setAttribute("http.response.status_code", res.status);
      if (!res.ok) throw new Error(`Gemma API responded ${res.status}`);

      const data = await res.json();
      recordUsage(span, data.usageMetadata);

      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const text = parts
        .filter((part) => !part.thought) // Gemma 4 returns its reasoning as separate "thought" parts
        .map((part) => part.text ?? "")
        .join("")
        .trim();
      if (!text) throw new Error("Gemma returned an empty response");
      span.setAttribute("app.response_chars", text.length);
      return text;
    }
  );
}

// Cheap readiness probe via the model-metadata endpoint. Never throws.
async function probe() {
  const status = { reachable: false, modelPresent: false, model: gemma.model };
  if (!isConfigured()) return { ...status, error: "GEMMA_API_KEY is not set" };

  try {
    const res = await fetchWithTimeout(
      `${gemma.apiBase}/models/${gemma.model}`,
      { headers: { "x-goog-api-key": gemma.apiKey } },
      gemma.probeTimeoutMs
    );
    if (!res.ok) return { ...status, reachable: true, error: `HTTP ${res.status}` };
    return { ...status, reachable: true, modelPresent: true };
  } catch (err) {
    return { ...status, error: err.message };
  }
}

module.exports = { generateText, probe, isConfigured, model: gemma.model };
