const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { extractJson, normalizePlan, parsePlan } = require("../src/services/planParser");

describe("extractJson", () => {
  it("reads JSON wrapped in code fences and prose", () => {
    const text = 'Sure! Here it is:\n```json\n{ "a": 1 }\n```';
    assert.deepEqual(extractJson(text), { a: 1 });
  });

  it("returns null for non-JSON or non-string input", () => {
    assert.equal(extractJson("no braces here"), null);
    assert.equal(extractJson("{ broken"), null);
    assert.equal(extractJson(undefined), null);
  });
});

describe("normalizePlan", () => {
  it("fills safe defaults for small slips", () => {
    const result = normalizePlan({ plan: [{ time: "07:00 AM", title: "Wake up", kind: "nap" }] });
    assert.deepEqual(result.plan, [{ time: "7:00 AM", title: "Wake up", icon: "•", kind: "routine" }]);
    assert.equal(result.greeting, "Here's your plan for today.");
    assert.deepEqual(result.tasks, []);
  });

  it("drops broken rows but keeps the good ones", () => {
    const result = normalizePlan({
      plan: [{ title: "No time" }, { time: "9:00 AM", title: "Breakfast", icon: "🍳", kind: "meal" }],
    });
    assert.equal(result.plan.length, 1);
    assert.equal(result.plan[0].title, "Breakfast");
  });

  it("rejects plans with no usable items", () => {
    assert.equal(normalizePlan({ plan: [] }), null);
    assert.equal(normalizePlan({ plan: [{ title: "" }] }), null);
    assert.equal(normalizePlan(null), null);
  });
});

describe("parsePlan", () => {
  it("goes from raw model text to a normalized plan", () => {
    const text = '```json\n{"greeting":"Hi","plan":[{"time":"8:00 AM","title":"Walk","icon":"🚶","kind":"exercise"}],"tip":"Drink water."}\n```';
    const result = parsePlan(text);
    assert.equal(result.greeting, "Hi");
    assert.equal(result.plan[0].kind, "exercise");
    assert.equal(result.tip, "Drink water.");
  });
});
