// Use cases that combine the model with a fallback. Routes call these;
// the Gemma client is injectable so tests never touch the network.

const defaultClient = require("./gemmaClient");
const { buildPlanPrompt, buildAskPrompt } = require("./prompts");
const { parsePlan } = require("./planParser");
const { buildRulePlan } = require("./rulePlanner");
const { traceAgent, Sentry } = require("./telemetry");

const SOURCE = Object.freeze({ GEMMA: "gemma", RULE_BASED: "rule-based" });

// Ask Gemma for a plan; on any failure fall back to the rule-based planner.
// Always resolves, and `source` says which one produced the plan.
function createDailyPlan(input, { client = defaultClient } = {}) {
  const openTasks = (input.tasks ?? []).filter((t) => !t.done).length;
  return traceAgent(
    "daybuddy-planner",
    { "app.open_tasks": openTasks, "app.language": input.prefs?.language ?? "English" },
    async (span) => {
      if (client.isConfigured()) {
        try {
          const plan = parsePlan(await client.generateText(buildPlanPrompt(input)));
          if (!plan) throw new Error("model returned an unusable plan");
          console.log(`[plan] source=${SOURCE.GEMMA} items=${plan.plan.length}`);
          span.setAttribute("app.plan_source", SOURCE.GEMMA);
          span.setAttribute("app.plan_items", plan.plan.length);
          return { ...plan, source: SOURCE.GEMMA };
        } catch (err) {
          // The user still gets a plan, but we want to know the AI path failed.
          console.warn(`[plan] Gemma failed, using rule-based planner: ${err.message}`);
          span.setAttribute("app.fallback_reason", err.message);
          Sentry.captureException(err, { tags: { feature: "plan", fallback: SOURCE.RULE_BASED } });
        }
      }
      span.setAttribute("app.plan_source", SOURCE.RULE_BASED);
      return {
        ...buildRulePlan(input),
        source: SOURCE.RULE_BASED,
        note: "Generated with the built-in planner (AI model was unavailable).",
      };
    }
  );
}

// Answer a question from the user's own history. Throws if the model is unavailable,
// because a made-up answer would be worse than none.
function answerQuestion(input, { client = defaultClient } = {}) {
  return traceAgent(
    "daybuddy-ask",
    { "app.history_entries": (input.checkins ?? []).length, "app.question_chars": (input.question ?? "").length },
    () => client.generateText(buildAskPrompt(input))
  );
}

module.exports = { createDailyPlan, answerQuestion, SOURCE };
