"use client";

import CheckinSection from "@/app/components/home/CheckinSection";
import PlanSection from "@/app/components/home/PlanSection";
import TaskSection from "@/app/components/home/TaskSection";
import { Brand, PageIntro, PageShell, TextLink } from "@/app/components/ui";
import { useDailyPlan } from "@/app/hooks/useDailyPlan";
import { useNow } from "@/app/hooks/useNow";
import { usePrefs } from "@/app/hooks/usePrefs";
import { useTasks } from "@/app/hooks/useTasks";
import { greetingFor } from "@/app/lib/dates";

function describeProgress({ hasPlan, open, total }) {
  if (!hasPlan) return "Nothing is planned yet. Tap the button and we'll sort the day out.";
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
    <PageShell>
      <header className="flex items-center justify-between">
        <Brand />
        <nav className="flex items-center gap-4 text-sm text-muted">
          {dateLabel && <span className="hidden sm:inline">{dateLabel}</span>}
          <TextLink href="/ask">Ask</TextLink>
          <TextLink href="/profile">Profile</TextLink>
        </nav>
      </header>

      <PageIntro title={`${greeting}, ${prefs.name}.`}>
        {describeProgress({ hasPlan: Boolean(plan), open: tasks.length - completed, total: tasks.length })}
      </PageIntro>

      <PlanSection
        plan={plan}
        loading={loading}
        error={error}
        wakeTime={prefs.wakeTime}
        onGenerate={() => generate(prefs, tasks)}
      />

      <TaskSection
        tasks={tasks}
        completed={completed}
        onAdd={addTask}
        onToggle={toggleTask}
        onRemove={removeTask}
      />

      <CheckinSection tasksCompleted={completed} tasksTotal={tasks.length} />

      <footer className="border-t border-line pb-4 pt-6 text-sm text-muted">
        Made for Yashu. Plans are written by Gemma, an open-source model.
      </footer>
    </PageShell>
  );
}
