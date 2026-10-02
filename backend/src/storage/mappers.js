// Convert stored records into the exact shapes the API returns, so both
// stores (Mongo and in-memory) answer identically.

const { DEFAULT_PREFS } = require("../constants");

function toPrefs(record) {
  const merged = { ...DEFAULT_PREFS, ...record };
  return {
    name: merged.name,
    wakeTime: merged.wakeTime,
    sleepTime: merged.sleepTime,
    foodPreference: merged.foodPreference,
    exercisePreference: merged.exercisePreference,
    goal: merged.goal,
    language: merged.language,
  };
}

function toTask(record) {
  return {
    id: String(record._id ?? record.id),
    label: record.label,
    done: Boolean(record.done),
  };
}

function toCheckin(record) {
  return {
    date: record.date,
    savedAt: new Date(record.createdAt).toISOString(),
    exercised: record.exercised,
    skippedMeal: record.skippedMeal,
    tasksCompleted: record.tasksCompleted,
    tasksTotal: record.tasksTotal,
    mood: record.mood,
    note: record.note,
  };
}

module.exports = { toPrefs, toTask, toCheckin };
