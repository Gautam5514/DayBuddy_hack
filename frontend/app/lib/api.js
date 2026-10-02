// The only module that knows the backend's URL and routes.
// Every call resolves to data or throws an ApiError — callers decide how to degrade.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.error || `Request failed with ${res.status}`, res.status);
  }
  return data;
}

// Binary voice calls. They don't fit request(), which always speaks JSON.
async function binaryRequest(path, init) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error || `Request failed with ${res.status}`, res.status);
  }
  return res;
}

export const api = {
  getPrefs: () => request("/api/prefs").then((d) => d.prefs),
  savePrefs: (prefs) => request("/api/prefs", { method: "PUT", body: prefs }).then((d) => d.prefs),

  listTasks: () => request("/api/tasks").then((d) => d.tasks),
  createTask: (label) => request("/api/tasks", { method: "POST", body: { label } }).then((d) => d.task),
  updateTask: (id, patch) =>
    request(`/api/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }).then((d) => d.task),
  deleteTask: (id) => request(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" }),

  saveCheckin: (checkin) =>
    request("/api/checkin", { method: "POST", body: checkin }).then((d) => d.checkin),
  listCheckins: (limit = 14) => request(`/api/checkins?limit=${limit}`).then((d) => d.checkins),

  getAiStatus: () => request("/api/ai/status"),
  generatePlan: (prefs, tasks) => request("/api/plan", { method: "POST", body: { prefs, tasks } }),
  // Voice (ElevenLabs). voiceStatus tells the UI whether to record or use the browser.
  voiceStatus: () => request("/api/voice/status"),
  transcribe: (audio) =>
    binaryRequest("/api/voice/transcribe", {
      method: "POST",
      headers: { "Content-Type": audio.type || "audio/webm" },
      body: audio,
    })
      .then((res) => res.json())
      .then((d) => d.text),
  speak: (text) =>
    binaryRequest("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).then((res) => res.blob()),
  ask: (question) => request("/api/ask", { method: "POST", body: { question } }),
};
