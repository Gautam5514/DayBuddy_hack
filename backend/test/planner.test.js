const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { buildRulePlan, parseTime, formatMinutes } = require("../src/services/rulePlanner");

describe("parseTime", () => {
  it("parses 24h times into minutes since midnight", () => {
    assert.equal(parseTime("07:30"), 450);
    assert.equal(parseTime("23:59"), 1439);
  });

  it("falls back on malformed or out-of-range input", () => {
    assert.equal(parseTime("seven"), 420);
    assert.equal(parseTime("25:00", 0), 0);
    assert.equal(parseTime(undefined, 60), 60);
  });
});

describe("formatMinutes", () => {
  it("formats as a 12h clock", () => {
    assert.equal(formatMinutes(0), "12:00 AM");
    assert.equal(formatMinutes(12 * 60), "12:00 PM");
    assert.equal(formatMinutes(13 * 60 + 5), "1:05 PM");
  });

  it("wraps past midnight", () => {
    assert.equal(formatMinutes(24 * 60 + 30), "12:30 AM");
  });
});

describe("buildRulePlan", () => {
  it("anchors the morning to the wake-up time", () => {
    const { plan } = buildRulePlan({ prefs: { wakeTime: "06:00" } });
    assert.equal(plan[0].time, "6:00 AM");
    assert.equal(plan[0].kind, "routine");
  });

  it("follows the food preference", () => {
    const { plan } = buildRulePlan({ prefs: { foodPreference: "Vegan" } });
    assert.match(plan.find((p) => p.kind === "meal").title, /Oats/);
  });

  it("suggests a lighter start after a missed workout", () => {
    const result = buildRulePlan({ checkin: { exercised: false } });
    assert.match(result.plan[1].title, /Light 15-min/);
    assert.match(result.tip, /workout got missed/);
  });

  it("lists only open tasks and points the tip at the first one", () => {
    const result = buildRulePlan({
      tasks: [
        { label: "Done already", done: true },
        { label: "Finish assignment", done: false },
      ],
    });
    assert.deepEqual(result.tasks, ["Finish assignment"]);
    assert.match(result.tip, /"Finish assignment"/);
  });
});
