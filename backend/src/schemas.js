// Zod schemas for every request payload the API accepts.
// Routes call `schema.parse(...)`; a failure becomes a 400 in the error handler.

const { z } = require("zod");
const { LANGUAGES, MOODS, LIMITS } = require("./constants");

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Form fields arrive as "" when cleared; treat that the same as "not sent".
const blankToUndefined = (value) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const optionalTime = z.preprocess(
  blankToUndefined,
  z.string().regex(TIME_24H, "Expected a 24h time like 07:30").optional()
);

// Drop keys whose value is undefined so a partial update never erases a stored field.
const withoutUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

const prefsSchema = z
  .object({
    name: optionalText(60),
    wakeTime: optionalTime,
    sleepTime: optionalTime,
    foodPreference: optionalText(40),
    exercisePreference: optionalText(40),
    goal: optionalText(200),
    language: z.enum(LANGUAGES).optional(),
  })
  .transform(withoutUndefined);

const taskLabel = z.string().trim().min(1, "Label is required").max(LIMITS.taskLabel);

const createTaskSchema = z.object({ label: taskLabel });

const updateTaskSchema = z
  .object({ label: taskLabel.optional(), done: z.boolean().optional(), date: z.string().regex(ISO_DATE).optional() })
  .refine((patch) => patch.label !== undefined || patch.done !== undefined, {
    message: "Provide `label` and/or `done`",
  });

const taskListQuerySchema = z.object({
  date: z.string().regex(ISO_DATE, "Expected YYYY-MM-DD").optional(),
});

const checkinSchema = z
  .object({
    date: z.string().regex(ISO_DATE, "Expected YYYY-MM-DD").optional(),
    exercised: z.boolean().default(false),
    skippedMeal: z.boolean().default(false),
    tasksCompleted: z.number().int().min(0).default(0),
    tasksTotal: z.number().int().min(0).default(0),
    mood: z.enum(MOODS).default("Okay"),
    note: z.string().trim().max(LIMITS.checkinNote).default(""),
  })
  .refine((c) => c.tasksCompleted <= c.tasksTotal, {
    message: "tasksCompleted cannot exceed tasksTotal",
    path: ["tasksCompleted"],
  });

const checkinListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .catch(LIMITS.checkinHistoryDefault)
    .transform((n) => Math.min(Math.max(n, 1), LIMITS.checkinHistoryMax)),
});

const planRequestSchema = z.object({
  prefs: prefsSchema.default({}),
  tasks: z
    .array(z.object({ label: z.string().trim().min(1), done: z.boolean().default(false) }))
    .default([]),
});

const askSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(LIMITS.question),
});

module.exports = {
  prefsSchema,
  createTaskSchema,
  updateTaskSchema,
  taskListQuerySchema,
  checkinSchema,
  checkinListQuerySchema,
  planRequestSchema,
  askSchema,
};
