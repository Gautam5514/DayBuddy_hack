// Mongoose models. Every document is scoped by `userId` so multi-user support
// can be added later without a schema change.

const mongoose = require("mongoose");
const { DEFAULT_PREFS, LANGUAGES, MOODS, LIMITS } = require("../constants");

const { Schema } = mongoose;

const preferencesSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, default: DEFAULT_PREFS.name },
    wakeTime: { type: String, default: DEFAULT_PREFS.wakeTime },
    sleepTime: { type: String, default: DEFAULT_PREFS.sleepTime },
    foodPreference: { type: String, default: DEFAULT_PREFS.foodPreference },
    exercisePreference: { type: String, default: DEFAULT_PREFS.exercisePreference },
    goal: { type: String, default: DEFAULT_PREFS.goal },
    language: { type: String, enum: LANGUAGES, default: DEFAULT_PREFS.language },
  },
  { timestamps: true }
);

const taskSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: LIMITS.taskLabel },
    done: { type: Boolean, default: false },
    doneAt: { type: String, default: null },
  },
  { timestamps: true }
);

const checkinSchema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD in the user's local time
    exercised: { type: Boolean, default: false },
    skippedMeal: { type: Boolean, default: false },
    tasksCompleted: { type: Number, default: 0, min: 0 },
    tasksTotal: { type: Number, default: 0, min: 0 },
    mood: { type: String, enum: MOODS, default: "Okay" },
    note: { type: String, default: "", maxlength: LIMITS.checkinNote },
  },
  { timestamps: true }
);

// History is always read newest-first per user.
checkinSchema.index({ userId: 1, createdAt: -1 });

const Preferences = mongoose.model("Preferences", preferencesSchema);
const Task = mongoose.model("Task", taskSchema);
const Checkin = mongoose.model("Checkin", checkinSchema);

module.exports = { Preferences, Task, Checkin };
