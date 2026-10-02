// End-to-end tests over HTTP against the in-memory store (no MongoDB, no Gemma).

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

const { startTestServer } = require("./helpers");

describe("DayBuddy API", () => {
  let api;
  before(async () => {
    api = await startTestServer();
  });
  after(() => api.close());

  it("GET / reports liveness and storage mode", async () => {
    const { status, body } = await api.request("GET", "/");
    assert.equal(status, 200);
    assert.equal(body.storage, "in-memory");
  });

  describe("preferences", () => {
    it("returns defaults before anything is saved", async () => {
      const { body } = await api.request("GET", "/api/prefs");
      assert.equal(body.prefs.wakeTime, "07:00");
    });

    it("saves a partial update without erasing other fields", async () => {
      await api.request("PUT", "/api/prefs", { name: "Yashu", wakeTime: "06:30" });
      const { body } = await api.request("PUT", "/api/prefs", { goal: "Sleep earlier", sleepTime: "" });
      assert.equal(body.prefs.wakeTime, "06:30");
      assert.equal(body.prefs.goal, "Sleep earlier");
      assert.equal(body.prefs.sleepTime, "23:00");
    });

    it("rejects an invalid time with a 400 and field details", async () => {
      const { status, body } = await api.request("PUT", "/api/prefs", { wakeTime: "7am" });
      assert.equal(status, 400);
      assert.equal(body.details[0].path, "wakeTime");
    });
  });

  describe("tasks", () => {
    it("supports create, update, list and delete", async () => {
      const created = await api.request("POST", "/api/tasks", { label: "  Finish assignment  " });
      assert.equal(created.status, 201);
      assert.equal(created.body.task.label, "Finish assignment");
      const { id } = created.body.task;

      const updated = await api.request("PATCH", `/api/tasks/${id}`, { done: true });
      assert.equal(updated.body.task.done, true);

      const listed = await api.request("GET", "/api/tasks");
      assert.ok(listed.body.tasks.some((t) => t.id === id && t.done));

      const removed = await api.request("DELETE", `/api/tasks/${id}`);
      assert.equal(removed.status, 200);
      assert.equal((await api.request("DELETE", `/api/tasks/${id}`)).status, 404);
    });

    it("rejects an empty label", async () => {
      const { status } = await api.request("POST", "/api/tasks", { label: "   " });
      assert.equal(status, 400);
    });

    it("rejects an empty patch", async () => {
      const { body } = await api.request("POST", "/api/tasks", { label: "Something" });
      const { status } = await api.request("PATCH", `/api/tasks/${body.task.id}`, {});
      assert.equal(status, 400);
    });
  });

  describe("check-ins", () => {
    it("saves a check-in and returns it as the latest", async () => {
      const saved = await api.request("POST", "/api/checkin", {
        date: "2026-10-02",
        exercised: false,
        tasksCompleted: 1,
        tasksTotal: 3,
        mood: "Tired",
        note: "Long day",
      });
      assert.equal(saved.status, 201);

      const { body } = await api.request("GET", "/api/checkin/latest");
      assert.equal(body.checkin.date, "2026-10-02");
      assert.equal(body.checkin.mood, "Tired");
    });

    it("rejects an unknown mood", async () => {
      const { status } = await api.request("POST", "/api/checkin", { mood: "Ecstatic" });
      assert.equal(status, 400);
    });

    it("clamps the history limit", async () => {
      const { status, body } = await api.request("GET", "/api/checkins?limit=9999");
      assert.equal(status, 200);
      assert.ok(Array.isArray(body.checkins));
    });
  });

  describe("AI", () => {
    it("falls back to the rule-based plan and adapts to the last check-in", async () => {
      const { status, body } = await api.request("POST", "/api/plan", {
        prefs: { wakeTime: "06:00" },
        tasks: [{ label: "Finish assignment", done: false }],
      });
      assert.equal(status, 200);
      assert.equal(body.source, "rule-based");
      assert.equal(body.plan[0].time, "6:00 AM");
      assert.match(body.plan[1].title, /Light 15-min/); // last check-in had no exercise
    });

    it("answers /api/ask with 503 when the model is unavailable", async () => {
      const { status } = await api.request("POST", "/api/ask", { question: "How was my week?" });
      assert.equal(status, 503);
    });

    it("validates the question", async () => {
      const { status } = await api.request("POST", "/api/ask", { question: "" });
      assert.equal(status, 400);
    });
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const { status, body } = await api.request("GET", "/api/nope");
    assert.equal(status, 404);
    assert.equal(body.success, false);
  });

  it("returns a JSON 400 for a malformed body", async () => {
    const res = await fetch(`${api.baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).success, false);
  });
});
