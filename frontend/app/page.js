"use client";

import CheckinSection from "@/app/components/home/CheckinSection";
import DayArc from "@/app/components/home/DayArc";
import PlanSection from "@/app/components/home/PlanSection";
import TaskSection from "@/app/components/home/TaskSection";
import { Card, PageShell } from "@/app/components/ui";
import { useDailyPlan } from "@/app/hooks/useDailyPlan";
import { useNow } from "@/app/hooks/useNow";
import { usePrefs } from "@/app/hooks/usePrefs";
import { useTasks } from "@/app/hooks/useTasks";
import { greetingFor } from "@/app/lib/dates";

function describeProgress({ hasPlan, open, total }) {
  if (!hasPlan) return "Nothing is planned yet. Tap “Plan my day” and we'll sort it out together.";
  if (open > 0) return `${open} thing${open === 1 ? "" : "s"} left on your list today.`;
  if (total > 0) return "Everything on your list is done. Nicely done.";
  return "Here's how the day could go.";
}

export default function HomePage() {
  const now = useNow();
  const { prefs } = usePrefs();
  const { tasks, completed, addTask, toggleTask, removeTask } = useTasks();
  const { plan, loading, error, generate } = useDailyPlan();

  const greeting = now ? greetingFor(now.getHours()) : "Hello";
  const dateLabel = now?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <PageShell width="wide">
      <section className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div className="animate-rise">
          <p className="mb-2 min-h-5 text-sm font-medium uppercase tracking-[0.14em] text-clay">{dateLabel}</p>
          <h1 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            {greeting}, <span className="italic text-clay">{prefs.name}</span>.
          </h1>
          <p className="mt-4 max-w-md text-base text-muted sm:text-lg">
            {describeProgress({ hasPlan: Boolean(plan), open: tasks.length - completed, total: tasks.length })}
          </p>
        </div>
        <Card as="div" delay={80} className="md:w-[300px]">
          <DayArc now={now} wakeTime={prefs.wakeTime} sleepTime={prefs.sleepTime} />
        </Card>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <PlanSection
          plan={plan}
          loading={loading}
          error={error}
          now={now}
          wakeTime={prefs.wakeTime}
          onGenerate={() => generate(prefs, tasks)}
        />

        <div className="flex flex-col gap-6">
          <TaskSection
            tasks={tasks}
            completed={completed}
            onAdd={addTask}
            onToggle={toggleTask}
            onRemove={removeTask}
          />
          <CheckinSection tasksCompleted={completed} tasksTotal={tasks.length} />
        </div>
      </div>

      <footer className="pt-2 text-center text-sm text-muted">
        Made for Yashu. Plans are written by Gemma, an open-source model.
      </footer>
    </PageShell>
  );
}
