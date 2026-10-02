import { formatShortDate, todayIso } from "@/app/lib/dates";

const MOOD_FILL = {
  Great: "text-sage",
  Okay: "text-amber-400",
  Tired: "text-clay",
};

function minusDays(base, days) {
  const date = new Date(base);
  date.setDate(date.getDate() - days);
  return date;
}

function buildLast7(history) {
  const byDate = new Map();
  for (const item of history ?? []) {
    if (item?.date && item?.mood && !byDate.has(item.date)) {
      byDate.set(item.date, item.mood);
    }
  }

  const today = new Date();
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const iso = todayIso(minusDays(today, offset));
    days.push({ date: iso, mood: byDate.get(iso) ?? null });
  }
  return days;
}

function moodLabel(mood) {
  if (mood) return mood;
  return "No check-in";
}

export default function MoodTrendStrip({ history }) {
  if (history === null) return null;

  const days = buildLast7(history);

  return (
    <div className="mb-3" aria-label="Mood trend for the last 7 days" role="group">
      <div className="flex items-center gap-2">
        {days.map((day) => {
          const label = `${formatShortDate(day.date)}: ${moodLabel(day.mood)}`;
          return (
            <div key={day.date} className="group relative">
              <span
                className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                tabIndex={0}
                aria-label={label}
              >
                <svg
                  className={`h-4 w-4 ${MOOD_FILL[day.mood] ?? "text-line"}`}
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="5"
                    className={day.mood ? "fill-current" : "fill-card stroke-current"}
                    strokeWidth="1.5"
                  />
                </svg>
                <span className="sr-only">{label}</span>
              </span>
              <span
                role="tooltip"
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-card px-2 py-1 text-xs text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
