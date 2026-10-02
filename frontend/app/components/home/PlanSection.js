"use client";

import { useMemo } from "react";
import ListenButton from "@/app/components/ListenButton";
import { Button, Card, ErrorNotice, SectionHeader, Spinner } from "@/app/components/ui";
import { useAiReady } from "@/app/hooks/useAiReady";
import { KIND_STYLE } from "@/app/lib/constants";
import { formatTime, minutesOfDay, parseClock } from "@/app/lib/dates";

// Shown until a plan is generated — a plain routine, nothing fancy.
const STARTER_PLAN = [
  { time: "7:00 AM", title: "Wake up", icon: "🌅", kind: "routine" },
  { time: "7:30 AM", title: "Move a little", icon: "🏃", kind: "exercise" },
  { time: "8:30 AM", title: "Breakfast", icon: "🍳", kind: "meal" },
  { time: "10:00 AM", title: "Main task", icon: "💻", kind: "work" },
  { time: "1:30 PM", title: "Lunch", icon: "🥗", kind: "meal" },
  { time: "6:00 PM", title: "Evening walk", icon: "🚶", kind: "exercise" },
];

// Index of the item happening now (the last one that has started), -1 before the
// first one, or null while the clock isn't known yet.
function currentIndex(items, now) {
  if (!now) return null;
  const current = minutesOfDay(now);
  let index = -1;
  items.forEach((item, i) => {
    const start = parseClock(item.time);
    if (start !== null && start <= current) index = i;
  });
  return index;
}

function statusOf(i, nowIndex) {
  if (nowIndex === null || i > nowIndex) return "upcoming";
  return i < nowIndex ? "past" : "now";
}

const sourceLabel = (source) =>
  source === "gemma" ? "Written for you by Gemma." : "Made by the built-in planner.";

export default function PlanSection({ plan, loading, error, now, onGenerate, wakeTime }) {
  const aiReady = useAiReady();

  // Personalize the starter plan with the saved wake-up time.
  const starterPlan = useMemo(
    () => [{ ...STARTER_PLAN[0], time: formatTime(wakeTime) }, ...STARTER_PLAN.slice(1)],
    [wakeTime]
  );

  const items = plan?.items ?? starterPlan;
  const nowIndex = currentIndex(items, now);
  // What gets read aloud: the greeting, then each step as a short spoken line.
  const spoken = plan
    ? [plan.greeting, ...plan.items.map((i) => `${i.time}, ${i.title}.`), plan.tip].filter(Boolean).join(" ")
    : "";
  const showMeta = plan && !error;

  return (
    <Card delay={120} aria-busy={loading}>
      <SectionHeader
        title="Today's plan"
        description={plan ? sourceLabel(plan.source) : "A basic routine for now. Let Gemma tailor it to you."}
      >
        <Button onClick={onGenerate} disabled={loading}>
          {loading && <Spinner />}
          {loading ? "Thinking it through…" : plan ? "Redo the plan" : "Plan my day"}
        </Button>
      </SectionHeader>

      <ErrorNotice className="mb-4">{error}</ErrorNotice>

      {showMeta && plan.greeting && (
        <blockquote className="mb-5 border-l-2 border-clay pl-4 font-serif text-lg italic leading-snug text-ink/85">
          {plan.greeting}
        </blockquote>
      )}

      <ol className={`transition-opacity ${loading ? "animate-pulse opacity-50" : ""}`}>
        {items.map((item, i) => (
          <PlanItem
            key={`${item.time}-${item.title}`}
            item={item}
            status={statusOf(i, nowIndex)}
            isNext={nowIndex === -1 && i === 0}
            isLast={i === items.length - 1}
          />
        ))}
      </ol>

      {showMeta && plan.tip && (
        <div className="mt-5 rounded-2xl bg-sand px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay">One thing to remember</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">{plan.tip}</p>
        </div>
      )}

      {showMeta && spoken && (
        <div className="mt-4">
          <ListenButton text={spoken.slice(0, 1500)} />
        </div>
      )}

      {aiReady === false && (
        <p className="mt-4 text-xs text-muted">
          The AI planner is offline, so plans come from a simpler built-in one.
        </p>
      )}
      {aiReady && plan?.source === "rule-based" && (
        <p className="mt-4 text-xs text-muted">
          The AI was slow this time, so this plan comes from the built-in planner. Try again for a more
          personal one.
        </p>
      )}
    </Card>
  );
}

function PlanItem({ item, status, isNext, isLast }) {
  const isNow = status === "now";
  const isPast = status === "past";
  const badge = isNow ? "Now" : isNext ? "Next" : null;

  return (
    <li className="relative flex gap-4 pb-2">
      {!isLast && <span className="absolute bottom-0 left-[21px] top-12 w-px bg-line" aria-hidden="true" />}

      <span
        className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg ${
          KIND_STYLE[item.kind] ?? "bg-stone-soft"
        } ${isNow ? "ring-2 ring-clay ring-offset-2 ring-offset-card" : ""} ${isPast ? "opacity-45 grayscale" : ""}`}
        aria-hidden="true"
      >
        {item.icon}
      </span>

      <div
        className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-3 py-2 transition-colors ${
          isNow ? "bg-clay-soft" : ""
        }`}
        aria-current={isNow ? "time" : undefined}
      >
        <div className="min-w-0">
          <p className={`text-xs tabular-nums ${isNow ? "font-semibold text-clay" : "text-muted"}`}>{item.time}</p>
          <p className={`leading-snug ${isPast ? "text-muted" : ""}`}>{item.title}</p>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isNow ? "bg-clay text-on-accent" : "border border-line text-muted"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </li>
  );
}
