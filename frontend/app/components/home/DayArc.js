"use client";

import { formatDuration, formatTime, minutesOfDay, parseTime24 } from "@/app/lib/dates";

const MINUTES_PER_DAY = 24 * 60;
const WIDTH = 240;
const RADIUS = 100;
const CX = WIDTH / 2;
const CY = 112;
// A half circle from the left (wake) to the right (sleep).
const ARC_PATH = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;

// Where "now" sits between wake-up and bedtime, as 0..1, plus a short caption.
function dayProgress(now, wakeTime, sleepTime) {
  const wake = parseTime24(wakeTime) ?? 7 * 60;
  let sleep = parseTime24(sleepTime) ?? 23 * 60;
  if (sleep <= wake) sleep += MINUTES_PER_DAY; // bedtime after midnight

  let current = minutesOfDay(now);
  if (current < wake && current + MINUTES_PER_DAY <= sleep) current += MINUTES_PER_DAY;

  if (current < wake) return { fraction: 0, caption: `Day starts at ${formatTime(wakeTime)}` };
  if (current >= sleep) return { fraction: 1, caption: "Past bedtime. Rest well." };
  return {
    fraction: (current - wake) / (sleep - wake),
    caption: `${formatDuration(sleep - current)} until bedtime`,
  };
}

// The waking day drawn as the sun's path, with the sun at the current time.
export default function DayArc({ now, wakeTime, sleepTime }) {
  const { fraction, caption } = now ? dayProgress(now, wakeTime, sleepTime) : { fraction: 0, caption: "" };
  const angle = Math.PI * fraction;
  const sunX = CX - RADIUS * Math.cos(angle);
  const sunY = CY - RADIUS * Math.sin(angle);

  return (
    <figure className="flex flex-col items-center" aria-label={caption || "Your day"}>
      <svg viewBox={`0 -6 ${WIDTH} ${CY + 30}`} className="w-full max-w-[260px]" aria-hidden="true">
        <defs>
          <linearGradient id="day-arc" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--honey)" />
            <stop offset="100%" stopColor="var(--clay)" />
          </linearGradient>
        </defs>
        <path d={ARC_PATH} fill="none" stroke="var(--line)" strokeWidth="8" strokeLinecap="round" strokeDasharray="1 14" />
        {now && (
          <>
            <path
              d={ARC_PATH}
              fill="none"
              stroke="url(#day-arc)"
              strokeWidth="8"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${fraction * 100} 100`}
              className="transition-[stroke-dasharray] duration-700"
            />
            <circle cx={sunX} cy={sunY} r="16" fill="var(--honey)" opacity="0.2" />
            <circle cx={sunX} cy={sunY} r="9" fill="var(--honey)" stroke="var(--card)" strokeWidth="3" />
          </>
        )}
      </svg>
      <div className="flex w-full max-w-[260px] justify-between text-xs tabular-nums text-muted">
        <span>{formatTime(wakeTime)}</span>
        <span>{formatTime(sleepTime)}</span>
      </div>
      <figcaption className="mt-2 min-h-5 text-sm font-medium">{caption}</figcaption>
    </figure>
  );
}
