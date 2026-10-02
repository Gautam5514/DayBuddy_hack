// Turns the model's raw text into a plan the UI can trust.
// Lenient on small slips (code fences, missing icon, odd "kind"), strict on
// what the UI actually needs: at least one item with a time and a title.

const { z } = require("zod");
const { PLAN_KINDS } = require("../constants");

const planItemSchema = z.object({
  time: z.coerce.string().trim().min(1),
  title: z.coerce.string().trim().min(1),
  icon: z.string().trim().min(1).catch("•"),
  kind: z.enum(PLAN_KINDS).catch("routine"),
});

const modelPlanSchema = z.object({
  greeting: z.string().trim().min(1).catch("Here's your plan for today."),
  plan: z.array(z.unknown()).min(1),
  tasks: z.array(z.coerce.string()).catch([]),
  tip: z.string().trim().catch(""),
});

// Pull the first {...} block out of a response that may be wrapped in prose or fences.
function extractJson(text) {
  if (typeof text !== "string") return null;
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Validate and normalize a parsed plan. Returns null when it is unusable.
function normalizePlan(candidate) {
  const parsed = modelPlanSchema.safeParse(candidate);
  if (!parsed.success) return null;

  // Drop individual broken rows rather than rejecting the whole plan.
  const plan = parsed.data.plan
    .map((raw) => planItemSchema.safeParse(raw))
    .filter((result) => result.success)
    .map(({ data }) => ({ ...data, time: data.time.replace(/^0(\d:)/, "$1") }));

  if (plan.length === 0) return null;
  return { greeting: parsed.data.greeting, plan, tasks: parsed.data.tasks, tip: parsed.data.tip };
}

const parsePlan = (text) => normalizePlan(extractJson(text));

module.exports = { extractJson, normalizePlan, parsePlan };
