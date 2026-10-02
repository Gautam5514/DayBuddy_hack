const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { fakeClient } = require("./helpers");
const { createDailyPlan, answerQuestion, SOURCE } = require("../src/services/assistant");
const { buildPlanPrompt, buildAskPrompt } = require("../src/services/prompts");

// Same shape the /api/plan route passes after validation.
const EMPTY_INPUT = Object.freeze({ prefs: {}, tasks: [], checkin: null });

const MODEL_PLAN = JSON.stringify({
  greeting: "Morning, Yashu.",
  plan: [{ time: "7:00 AM", title: "Wake up", icon: "🌅", kind: "routine" }],
  tasks: [],
  tip: "Start small.",
});

describe("createDailyPlan", () => {
  it("uses Gemma's plan when it is valid", async () => {
    const plan = await createDailyPlan(EMPTY_INPUT, { client: fakeClient(() => MODEL_PLAN) });
    assert.equal(plan.source, SOURCE.GEMMA);
    assert.equal(plan.greeting, "Morning, Yashu.");
  });

  it("falls back to the rule-based planner when Gemma throws", async () => {
    const client = fakeClient(() => {
      throw new Error("timeout");
    });
    const plan = await createDailyPlan(EMPTY_INPUT, { client });
    assert.equal(plan.source, SOURCE.RULE_BASED);
    assert.ok(plan.plan.length > 0);
  });

  it("falls back when Gemma returns unusable text", async () => {
    const plan = await createDailyPlan(EMPTY_INPUT, { client: fakeClient(() => "I can't do that") });
    assert.equal(plan.source, SOURCE.RULE_BASED);
  });

  it("skips the network entirely when no API key is configured", async () => {
    const client = { isConfigured: () => false, generateText: () => assert.fail("should not be called") };
    const plan = await createDailyPlan(EMPTY_INPUT, { client });
    assert.equal(plan.source, SOURCE.RULE_BASED);
  });
});

describe("answerQuestion", () => {
  it("passes the question and history to the model", async () => {
    let seenPrompt = "";
    const answer = await answerQuestion(
      {
        question: "Did I exercise?",
        prefs: { name: "Yashu" },
        checkins: [{ date: "2026-10-02", exercised: true, mood: "Great", tasksCompleted: 1, tasksTotal: 2 }],
        tasks: [],
      },
      { client: fakeClient((prompt) => ((seenPrompt = prompt), "Yes, on 2 Oct.")) }
    );
    assert.equal(answer, "Yes, on 2 Oct.");
    assert.match(seenPrompt, /QUESTION: Did I exercise\?/);
    assert.match(seenPrompt, /2026-10-02/);
  });
});

describe("prompts", () => {
  it("includes only open tasks in the plan prompt", () => {
    const prompt = buildPlanPrompt({
      tasks: [
        { label: "Open one", done: false },
        { label: "Closed one", done: true },
      ],
    });
    assert.match(prompt, /- Open one/);
    assert.doesNotMatch(prompt, /Closed one/);
  });

  it("asks for Hinglish when the user prefers it", () => {
    const prompt = buildAskPrompt({ question: "?", prefs: { language: "Hinglish" }, checkins: [], tasks: [] });
    assert.match(prompt, /Reply in Hinglish/);
  });
});
