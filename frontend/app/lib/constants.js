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

// Icon bubble colours per plan item kind.
export const KIND_STYLE = {
  routine: "bg-honey-soft",
  exercise: "bg-sage-soft",
  meal: "bg-clay-soft",
  work: "bg-stone-soft",
};

export const MOOD_DOT = { Great: "bg-sage", Okay: "bg-honey", Tired: "bg-clay" };

export const MOOD_HINT = { Great: "Had energy", Okay: "A normal day", Tired: "Low battery" };
