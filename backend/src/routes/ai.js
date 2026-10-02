// AI endpoints. Mounted at /api: POST /plan, POST /ask, GET /ai/status.

const { Router } = require("express");
const store = require("../storage");
const gemmaClient = require("../services/gemmaClient");
const { createDailyPlan, answerQuestion } = require("../services/assistant");
const { HttpError } = require("../errors");
const { planRequestSchema, askSchema } = require("../schemas");
const { LIMITS } = require("../constants");

const router = Router();

// Is the open-source model ready? The UI uses this to explain fallback plans.
router.get("/ai/status", async (req, res) => {
  const status = await gemmaClient.probe();
  res.json({ success: true, ready: status.reachable && status.modelPresent, ...status });
});

// Daily plan from prefs + tasks + yesterday's check-in. Never fails on model
// errors: the rule-based planner answers instead.
router.post("/plan", async (req, res) => {
  const { prefs, tasks } = planRequestSchema.parse(req.body ?? {});
  const checkin = await store.latestCheckin(req.userId);
  const plan = await createDailyPlan({ prefs, tasks, checkin });
  res.json({ success: true, ...plan });
});

// Answer a question using only the user's own saved days.
router.post("/ask", async (req, res) => {
  const { question } = askSchema.parse(req.body ?? {});
  const [prefs, checkins, tasks] = await Promise.all([
    store.getPrefs(req.userId),
    store.listCheckins(req.userId, LIMITS.checkinHistoryDefault),
    store.listTasks(req.userId),
  ]);

  let answer;
  try {
    answer = await answerQuestion({ question, prefs, checkins, tasks });
  } catch (err) {
    console.warn(`[ask] failed: ${err.message}`);
    throw new HttpError(503, "The assistant is unavailable right now.");
  }

  // Which saved days the answer could draw on, so it never feels like magic.
  res.json({ success: true, answer, sources: checkins.map((c) => c.date) });
});

module.exports = router;
