"use client";

import { useMemo } from "react";
import ListenButton from "@/app/components/ListenButton";
import { ErrorNotice, SectionHeader, Spinner } from "@/app/components/ui";
import { useAiReady } from "@/app/hooks/useAiReady";
import { usePlanReminders } from "@/app/hooks/usePlanReminders";
import { KIND_DOT } from "@/app/lib/constants";
import { formatTime } from "@/app/lib/dates";

// Shown until a plan is generated — a plain routine, nothing fancy.
const STARTER_PLAN = [
  { time: "7:00 AM", title: "Wake up", icon: "🌅", kind: "routine" },
  { time: "7:30 AM", title: "Move a little", icon: "🏃", kind: "exercise" },
  { time: "8:30 AM", title: "Breakfast", icon: "🍳", kind: "meal" },
  { time: "10:00 AM", title: "Main task", icon: "💻", kind: "work" },
  { time: "1:30 PM", title: "Lunch", icon: "🥗", kind: "meal" },
  { time: "6:00 PM", title: "Evening walk", icon: "🚶", kind: "exercise" },
];

export default function PlanSection({ plan, loading, error, onGenerate, wakeTime }) {
  const aiReady = useAiReady();

  // Personalize the starter plan with the saved wake-up time.
  const starterPlan = useMemo(
    () => [{ ...STARTER_PLAN[0], time: formatTime(wakeTime) }, ...STARTER_PLAN.slice(1)],
    [wakeTime]
  );

  const items = plan?.items ?? starterPlan;
  const { remindersEnabled, remindersSupported, remindersDenied, setReminderEnabled } = usePlanReminders(items);
  // What gets read aloud: the greeting, then each step as a short spoken line.
  const spoken = plan
    ? [plan.greeting, ...plan.items.map((i) => `${i.time}, ${i.title}.`), plan.tip].filter(Boolean).join(" ")
    : "";
  const showMeta = plan && !error;

  return (
    <section>
      <SectionHeader title="Today">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-full bg-clay px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:cursor-wait disabled:opacity-70"
        >
          {loading && <Spinner />}
          {loading ? "Thinking it through…" : plan ? "Redo the plan" : "Plan my day"}
        </button>
      </SectionHeader>

      <ErrorNotice className="mb-4">{error}</ErrorNotice>

      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={remindersEnabled}
          disabled={!remindersSupported}
          onChange={(e) => setReminderEnabled(e.target.checked)}
          className="h-4 w-4 accent-clay disabled:cursor-not-allowed"
        />
        <span>
          Remind me
          {remindersDenied ? " (blocked in browser settings)" : ""}
          {!remindersSupported ? " (not available in this browser)" : ""}
        </span>
      </label>

      {showMeta && plan.greeting && (
        <p className="mb-5 font-serif text-lg italic text-ink/80">“{plan.greeting}”</p>
      )}

      {!plan && (
        <p className="mb-4 text-sm text-muted">
          This is just a basic routine for now. Plan my day tailors it to you.
        </p>
      )}

      <ol className="relative ml-1 border-l border-line">
        {items.map((item) => (
          <li key={`${item.time}-${item.title}`} className="relative flex items-baseline gap-4 py-3 pl-6">
            <span
              className={`absolute -left-[5px] top-[1.15rem] h-2.5 w-2.5 rounded-full ring-4 ring-paper ${KIND_DOT[item.kind] ?? "bg-stone-300"}`}
              aria-hidden="true"
            />
            <span className="w-[4.5rem] shrink-0 text-sm tabular-nums text-muted">{item.time}</span>
            <span className="flex-1 text-base">{item.title}</span>
            <span className="text-lg" aria-hidden="true">
              {item.icon}
            </span>
          </li>
        ))}
      </ol>

      {showMeta && spoken && (
        <div className="mt-4">
          <ListenButton text={spoken.slice(0, 1500)} />
        </div>
      )}

      {showMeta && plan.tip && (
        <p className="mt-5 rounded-lg bg-sand px-4 py-3 text-sm leading-relaxed text-ink/80">
          <span className="font-medium text-ink">One thing to remember: </span>
          {plan.tip}
        </p>
      )}

      {aiReady === false && (
        <p className="mt-4 text-xs text-muted">
          The AI planner is offline, so this plan comes from a simpler built-in one.
        </p>
      )}
      {aiReady && plan?.source === "rule-based" && (
        <p className="mt-4 text-xs text-muted">
          The AI was slow this time, so this plan comes from the built-in planner. Try again for a more
          personal one.
        </p>
      )}
    </section>
  );
}
