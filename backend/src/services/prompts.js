// Prompt builders. Pure functions: data in, prompt text out — easy to unit test
// and to tweak wording without touching any I/O code.

const { DEFAULT_PREFS, PLAN_KINDS } = require("../constants");

const HINGLISH_DESCRIPTION = "Hinglish (casual Hindi in Roman script mixed with English)";

const yesNo = (flag) => (flag ? "yes" : "no");

const bulletList = (items, empty = "- (none)") =>
  items.length ? items.map((item) => `- ${item}`).join("\n") : empty;

const openTaskLabels = (tasks) => tasks.filter((t) => !t.done).map((t) => t.label);

function describeCheckinFacts(checkin) {
  return [
    `- Exercised: ${yesNo(checkin.exercised)}`,
    `- Skipped a meal: ${yesNo(checkin.skippedMeal)}`,
    `- Tasks completed: ${checkin.tasksCompleted}/${checkin.tasksTotal}`,
    `- Mood: ${checkin.mood}`,
    checkin.note ? `- Note: ${checkin.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// Prompt for the daily plan. The model must answer with JSON (see planParser.js).
function buildPlanPrompt({ prefs = {}, tasks = [], checkin = null }) {
  const profile = {
    ...DEFAULT_PREFS,
    ...prefs,
    name: prefs.name || "friend",
    language: prefs.language === "Hinglish" ? "Hinglish" : "English",
  };

  const checkinBlock = checkin
    ? `YESTERDAY'S CHECK-IN (adapt today's plan to this):
${describeCheckinFacts(checkin)}
If exercise was missed, start today with a lighter workout. If a meal was skipped, gently encourage not skipping today. If mood was Tired, keep today's plan gentle.`
    : "YESTERDAY'S CHECK-IN: none yet.";

  return `You are DayBuddy, a caring friend helping someone sort out their day. Create a realistic daily plan based on their preferences, today's tasks, and yesterday's check-in.

PROFILE:
${JSON.stringify(profile, null, 2)}

TODAY'S OPEN TASKS:
${bulletList(openTaskLabels(tasks))}

${checkinBlock}

Rules:
- Give general wellness guidance only. No medical or prescriptive diet advice.
- Schedule wake up, exercise, meals (breakfast/lunch/dinner), hydration, task focus blocks, and an evening wind-down.
- Respect the wake-up and sleep times.
- Keep meal suggestions aligned with the food preference.
- 6 to 9 plan items.
- Write the greeting, plan titles and tip in the profile language. "Hinglish" means casual Hindi written in Roman script mixed with English, the way friends text in India (e.g. "Subah ki walk, thoda fresh lagega"). Keep it natural, not forced.
- Sound like a friend texting, not a wellness app: plain words, short sentences, at most one exclamation mark, no emojis in the greeting or tip. Avoid cliches like "journey", "embrace", "unlock", "let's crush it".
- Plan titles are short and specific (e.g. "Breakfast: poha with curd"), not generic.
- The tip must be specific to this person's day, one sentence.

Respond with ONLY valid JSON (no markdown, no commentary) in exactly this shape:
{
  "greeting": "short friendly one-line greeting using the name",
  "plan": [
    { "time": "7:00 AM", "title": "Wake Up", "icon": "🌅", "kind": "routine" }
  ],
  "tasks": ["task label", "..."],
  "tip": "one short motivational tip"
}
Allowed "kind" values: ${PLAN_KINDS.map((kind) => `"${kind}"`).join(", ")}.`;
}

// Prompt for "Ask about my days". The history is tiny (one check-in a day),
// so it goes straight into the prompt instead of through a vector search.
function buildAskPrompt({ question, prefs, checkins, tasks }) {
  const language = prefs.language === "Hinglish" ? HINGLISH_DESCRIPTION : "English";
  const history = checkins.length
    ? checkins.map((c, i) => `ENTRY ${i + 1} — ${c.date}\n${describeCheckinFacts(c)}`).join("\n\n")
    : "(no check-ins saved yet)";

  return `You are DayBuddy, answering a question about ${prefs.name || "the user"}'s own recent days. Talk to them directly, like a friend who has been paying attention.

OPEN TASKS RIGHT NOW:
${bulletList(openTaskLabels(tasks))}

SAVED CHECK-INS (newest first):
${history}

QUESTION: ${question}

Rules:
- Answer using only the information above. If it is not there, say you don't have that written down yet. Never guess.
- Mention which day(s) you are relying on by date, e.g. "(2 Oct)".
- Be brief: 2 to 4 sentences. Plain text, no markdown, no bullet lists, no emojis.
- Reply in ${language}.`;
}

module.exports = { buildPlanPrompt, buildAskPrompt };
