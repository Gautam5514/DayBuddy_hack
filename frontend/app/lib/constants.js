// Domain values shared across pages. Keep in sync with backend/src/constants.js.

export const DEFAULT_PREFS = Object.freeze({
  name: "Yashu",
  wakeTime: "07:00",
  sleepTime: "23:00",
  foodPreference: "Vegetarian",
  exercisePreference: "Walking",
  goal: "Stay active and organized",
  language: "English",
});

export const FOOD_OPTIONS = ["Vegetarian", "Vegan", "Non-vegetarian", "Eggetarian"];
export const EXERCISE_OPTIONS = ["Walking", "Running", "Yoga", "Gym", "Cycling"];
export const LANGUAGE_OPTIONS = ["English", "Hinglish"];
export const MOODS = ["Great", "Okay", "Tired"];

export const NOTE_MAX_LENGTH = 300;
export const QUESTION_MAX_LENGTH = 300;

// Timeline dot colour per plan item kind.
export const KIND_DOT = {
  routine: "bg-amber-400",
  exercise: "bg-sage",
  meal: "bg-clay",
  work: "bg-stone-400",
};

export const MOOD_DOT = { Great: "bg-sage", Okay: "bg-amber-400", Tired: "bg-clay" };
