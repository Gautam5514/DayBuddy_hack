"use client";

import { useState } from "react";
import MicButton from "@/app/components/MicButton";
import { Card, CheckIcon, CloseIcon, PlusIcon, SectionHeader, fieldClass } from "@/app/components/ui";

export default function TaskSection({ tasks, completed, onAdd, onToggle, onRemove }) {
  const [draft, setDraft] = useState("");
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed === total;

  function handleSubmit(e) {
    e.preventDefault();
    const label = draft.trim();
    if (!label) return;
    onAdd(label);
    setDraft("");
  }

  return (
    <Card delay={180}>
      <SectionHeader title="To do" description={allDone ? "All done. Go enjoy the rest of the day." : undefined}>
        {total > 0 && (
          <span className="rounded-full bg-sage-soft px-3 py-1 text-sm font-medium tabular-nums text-sage">
            {completed}/{total}
          </span>
        )}
      </SectionHeader>

      {total > 0 && (
        <div
          className="-mt-2 mb-4 h-1.5 overflow-hidden rounded-full bg-stone-soft"
          role="progressbar"
          aria-label="Tasks done"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-sage transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
      )}

      <ul className="-mx-2">
        {total === 0 && (
          <li className="mx-2 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            Nothing on the list yet. What&apos;s one thing you want done today?
          </li>
        )}
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} onRemove={onRemove} />
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          aria-label="New task"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setDraft("")}
          placeholder="Add a task…"
          className={`${fieldClass} min-w-0 flex-1 py-2.5`}
        />
        <MicButton onText={(text) => setDraft((prev) => (prev ? `${prev} ${text}` : text))} />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Add task"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </form>
    </Card>
  );
}

function TaskRow({ task, onToggle, onRemove }) {
  return (
    <li className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-paper">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-pressed={task.done}
        aria-label={`Mark "${task.label}" as ${task.done ? "not done" : "done"}`}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          task.done ? "border-sage bg-sage text-on-accent" : "border-line bg-card hover:border-sage"
        }`}
      >
        {task.done && <CheckIcon className="h-3.5 w-3.5 animate-pop" />}
      </button>
      <span
        className={`flex-1 transition-colors ${task.done ? "text-muted line-through decoration-muted/60" : ""}`}
      >
        {task.label}
      </span>
      <button
        type="button"
        onClick={() => onRemove(task.id)}
        aria-label={`Remove "${task.label}"`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-all hover:bg-danger-soft hover:text-danger focus:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </li>
  );
}
