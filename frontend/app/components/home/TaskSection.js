"use client";

import { useState } from "react";
import MicButton from "@/app/components/MicButton";
import { SectionHeader, fieldClass } from "@/app/components/ui";

export default function TaskSection({ tasks, completed, onAdd, onToggle, onRemove }) {
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  function closeForm() {
    setIsAdding(false);
    setDraft("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const label = draft.trim();
    if (!label) return;
    onAdd(label);
    closeForm();
  }

  return (
    <section>
      <SectionHeader title="To do">
        {tasks.length > 0 && (
          <span className="text-sm text-muted">
            {completed} of {tasks.length} done
          </span>
        )}
      </SectionHeader>

      <ul>
        {tasks.length === 0 && <li className="py-4 text-sm text-muted">Nothing on the list yet.</li>}
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} onRemove={onRemove} />
        ))}
      </ul>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            autoFocus
            aria-label="New task"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && closeForm()}
            placeholder="What needs doing?"
            className={`${fieldClass} min-w-0 flex-1`}
          />
          <MicButton onText={(text) => setDraft((prev) => (prev ? `${prev} ${text}` : text))} />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Add
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-4 text-sm font-medium text-clay hover:text-clay-dark"
        >
          + Add a task
        </button>
      )}
    </section>
  );
}

function TaskRow({ task, onToggle, onRemove }) {
  return (
    <li className="group flex items-center gap-3 border-b border-line/70 py-3">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-pressed={task.done}
        aria-label={`Mark "${task.label}" as ${task.done ? "not done" : "done"}`}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors ${
          task.done ? "border-sage bg-sage text-white" : "border-stone-400 bg-card hover:border-clay"
        }`}
      >
        {task.done ? "✓" : ""}
      </button>
      <span className={`flex-1 text-base ${task.done ? "text-muted line-through" : ""}`}>{task.label}</span>
      <button
        type="button"
        onClick={() => onRemove(task.id)}
        aria-label={`Remove "${task.label}"`}
        className="shrink-0 px-1 text-sm text-stone-400 opacity-0 transition-opacity hover:text-clay focus:opacity-100 group-hover:opacity-100"
      >
        remove
      </button>
    </li>
  );
}
