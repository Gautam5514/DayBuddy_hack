// Domain values shared by the models, validation, planners and prompts.
// Keep these in sync with frontend/app/lib/constants.js.

const LANGUAGES = Object.freeze(["English", "Hinglish"]);
const MOODS = Object.freeze(["Great", "Okay", "Tired"]);
const PLAN_KINDS = Object.freeze(["routine", "exercise", "meal", "work"]);

const DEFAULT_PREFS = Object.freeze({
  name: "Yashu",
  wakeTime: "07:00",
  sleepTime: "23:00",
  foodPreference: "Vegetarian",
  exercisePreference: "Walking",
  goal: "Stay active and organized",
  language: "English",
});

const LIMITS = Object.freeze({
  taskLabel: 200,
  checkinNote: 300,
  question: 300,
  speakText: 1500, // keeps one read-aloud well inside the free TTS quota
  audioBytes: "10mb",
  checkinHistoryDefault: 14,
  checkinHistoryMax: 60,
});

module.exports = { LANGUAGES, MOODS, PLAN_KINDS, DEFAULT_PREFS, LIMITS };
