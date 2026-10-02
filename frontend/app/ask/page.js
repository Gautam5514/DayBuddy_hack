"use client";

import { useEffect, useState } from "react";
import ListenButton from "@/app/components/ListenButton";
import MicButton from "@/app/components/MicButton";
import { ErrorNotice, PageIntro, PageShell, SectionHeader, SubpageHeader, fieldClass } from "@/app/components/ui";
import { api } from "@/app/lib/api";
import { MOOD_DOT, QUESTION_MAX_LENGTH } from "@/app/lib/constants";
import { formatShortDate } from "@/app/lib/dates";

const SUGGESTIONS = [
  "How has my week been?",
  "When did I skip meals?",
  "What was I tired about?",
  "Did I exercise this week?",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null); // { text, sources, asked }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(null); // null while loading

  useEffect(() => {
    let active = true;
    api
      .listCheckins()
      .catch(() => [])
      .then((checkins) => active && setHistory(checkins));
    return () => {
      active = false;
    };
  }, []);

  async function ask(text = question) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setQuestion(trimmed);
    setLoading(true);
    setError("");
    try {
      const data = await api.ask(trimmed);
      setAnswer({ text: data.answer, sources: data.sources ?? [], asked: trimmed });
    } catch {
      setError("I couldn't answer that just now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <SubpageHeader />

      <PageIntro title="Ask about your days">
        I only go by what you&apos;ve told me in your check-ins. If it isn&apos;t written down, I&apos;ll say so.
      </PageIntro>

      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="flex flex-col gap-3"
        >
          <textarea
            rows={2}
            aria-label="Your question"
            value={question}
            maxLength={QUESTION_MAX_LENGTH}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            placeholder="e.g. Why have I been tired lately?"
            className={`${fieldClass} resize-none`}
          />
          <div className="flex items-center justify-between gap-3">
            <MicButton label="Ask by voice" onText={(text) => setQuestion(text.slice(0, QUESTION_MAX_LENGTH))} />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-50"
            >
              {loading ? "Looking back…" : "Ask"}
            </button>
          </div>
        </form>

        {!answer && !loading && (
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-stone-400"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <ErrorNotice className="mt-5">{error}</ErrorNotice>

        {answer && !error && <Answer answer={answer} />}
      </section>

      <section>
        <SectionHeader title="What I remember" />
        <CheckinHistory history={history} />
      </section>
    </PageShell>
  );
}

function Answer({ answer }) {
  return (
    <div className="mt-6 border-l-2 border-clay pl-4" aria-live="polite">
      <p className="text-sm text-muted">{answer.asked}</p>
      <p className="mt-2 font-serif text-xl leading-snug">{answer.text}</p>
      <div className="mt-2">
        <ListenButton text={answer.text} label="Listen" />
      </div>
      {answer.sources.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Based on check-ins from {answer.sources.map(formatShortDate).join(", ")}.
        </p>
      )}
    </div>
  );
}

function CheckinHistory({ history }) {
  if (history === null) return <p className="py-4 text-sm text-muted">Loading…</p>;

  if (history.length === 0) {
    return (
      <p className="py-4 text-sm text-muted">
        Nothing yet. Do tonight&apos;s check-in on the Today page and it will show up here.
      </p>
    );
  }

  return (
    <ul>
      {history.map((c) => (
        <li key={`${c.date}-${c.savedAt}`} className="border-b border-line/70 py-3">
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${MOOD_DOT[c.mood] ?? "bg-stone-300"}`}
              aria-hidden="true"
            />
            <span className="w-24 shrink-0 text-sm text-muted">{formatShortDate(c.date)}</span>
            <span className="text-sm">
              {c.mood} · {c.exercised ? "exercised" : "no workout"} · {c.tasksCompleted}/{c.tasksTotal} tasks
              {c.skippedMeal && " · skipped a meal"}
            </span>
          </div>
          {c.note && <p className="mt-1 pl-[2.9rem] text-sm italic text-ink/70">{c.note}</p>}
        </li>
      ))}
    </ul>
  );
}
