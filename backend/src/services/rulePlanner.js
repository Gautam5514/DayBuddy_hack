// Deterministic, rule-based daily planner. It is the fallback whenever the AI
// model is unavailable, so a sensible plan is always returned.

const { DEFAULT_PREFS } = require("../constants");

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_WAKE_MINUTES = 7 * 60;

const BREAKFAST = {
  Vegetarian: "Poha with curd, or idli",
  Vegan: "Oats with fruit and nuts",
  "Non-vegetarian": "Eggs and toast",
  Eggetarian: "Omelette with toast",
};

const LUNCH = {
  Vegetarian: "Dal, rice, and a vegetable",
  Vegan: "Chickpea bowl with salad",
  "Non-vegetarian": "Grilled chicken with rice",
  Eggetarian: "Veg pulao with boiled eggs",
};

// "HH:MM" (24h) -> minutes since midnight, or `fallback` when unparsable.
function parseTime(value, fallback = DEFAULT_WAKE_MINUTES) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ""));
  if (!match) return fallback;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  if (hours > 23 || minutes > 59) return fallback;
  return hours * 60 + minutes;
}

// Minutes since midnight (wrapping past 24h) -> "7:00 AM".
function formatMinutes(total) {
  const minutes = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(minutes / 60);
  const period = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes % 60).padStart(2, "0")} ${period}`;
}

// Yesterday's check-in decides the tip; open tasks are the next best signal.
function pickTip({ checkin, missedExercise, exercise, openTasks }) {
  if (missedExercise) {
    return `Yesterday's workout got missed — start today with a light 15-minute ${exercise.toLowerCase()} to ease back in.`;
  }
  if (checkin?.skippedMeal) {
    return "You skipped a meal yesterday. Try not to skip breakfast today — even something small helps.";
  }
  if (checkin?.mood === "Tired") {
    return "You felt tired yesterday. Keep today gentle and get to bed on time.";
  }
  if (openTasks.length > 0) {
    const plural = openTasks.length > 1 ? "s" : "";
    return `You have ${openTasks.length} open task${plural}. Start with "${openTasks[0]}" right after breakfast.`;
  }
  return "No open tasks — a great day to get ahead or rest.";
}

// Returns { greeting, plan: [{ time, title, icon, kind }], tasks, tip }.
function buildRulePlan({ prefs = {}, tasks = [], checkin = null }) {
  const { name, foodPreference, exercisePreference: exercise, goal, wakeTime } = {
    ...DEFAULT_PREFS,
    ...prefs,
  };
  const wake = parseTime(wakeTime);
  const missedExercise = checkin?.exercised === false;
  const openTasks = tasks.filter((t) => !t.done).map((t) => t.label);

  const plan = [
    { at: wake, title: "Wake Up", icon: "🌅", kind: "routine" },
    {
      at: wake + 30,
      title: missedExercise ? `Light 15-min ${exercise} (easy restart)` : `Exercise — ${exercise}`,
      icon: "🏃",
      kind: "exercise",
    },
    {
      at: wake + 90,
      title: `Breakfast — ${BREAKFAST[foodPreference] ?? BREAKFAST.Vegetarian}`,
      icon: "🍳",
      kind: "meal",
    },
    { at: wake + 180, title: "Focus on top task", icon: "💻", kind: "work" },
    {
      at: 13 * 60 + 30,
      title: `Lunch — ${LUNCH[foodPreference] ?? LUNCH.Vegetarian}`,
      icon: "🥗",
      kind: "meal",
    },
    { at: 16 * 60, title: "Hydrate + short break", icon: "💧", kind: "routine" },
    { at: 18 * 60, title: "Evening walk", icon: "🚶", kind: "exercise" },
  ].map(({ at, ...item }) => ({ time: formatMinutes(at), ...item }));

  return {
    greeting: `Good day, ${name || "friend"}! Here's a plan to help you ${goal.toLowerCase()}.`,
    plan,
    tasks: openTasks,
    tip: pickTip({ checkin, missedExercise, exercise, openTasks }),
  };
}

module.exports = { buildRulePlan, parseTime, formatMinutes };
