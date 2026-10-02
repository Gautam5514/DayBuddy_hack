"use client";

import { useEffect, useState } from "react";
import ListenButton from "@/app/components/ListenButton";
import MicButton from "@/app/components/MicButton";
import { ArrowIcon, Button, Card, ErrorNotice, PageIntro, PageShell, SectionHeader, Spinner } from "@/app/components/ui";
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
      <PageIntro eyebrow="Look back" title="Ask about your days">
        I only go by what you&apos;ve told me in your check-ins. If it isn&apos;t written down, I&apos;ll say so.
      </PageIntro>

      <Card delay={80}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <div className="rounded-2xl border border-line bg-paper transition-shadow focus-within:border-clay focus-within:ring-4 focus-within:ring-clay/15">
            <textarea
              rows={3}
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
              className="block w-full resize-none bg-transparent px-4 pt-3.5 text-lg outline-none placeholder:text-muted/70"
            />
            <div className="flex items-center justify-between gap-3 px-3 pb-3">
              <MicButton label="Ask by voice" onText={(text) => setQuestion(text.slice(0, QUESTION_MAX_LENGTH))} />
              <Button type="submit" disabled={loading || !question.trim()}>
                {loading ? <Spinner /> : null}
                {loading ? "Looking back…" : "Ask"}
                {!loading && <ArrowIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </form>

        {!answer && !loading && (
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm text-ink transition-all hover:border-clay hover:text-clay active:scale-[0.97]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <ErrorNotice className="mt-4">{error}</ErrorNotice>

        {answer && !error && <Answer answer={answer} />}
      </Card>

      <Card delay={160}>
        <SectionHeader title="What I remember" description="Your last two weeks of check-ins." />
        <CheckinHistory history={history} />
      </Card>
    </PageShell>
  );
}

function Answer({ answer }) {
  return (
    <div className="mt-5 animate-rise rounded-2xl bg-sand p-5" aria-live="polite">
      <p className="text-sm text-muted">You asked: {answer.asked}</p>
      <p className="mt-2 font-serif text-xl leading-snug">{answer.text}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ListenButton text={answer.text} label="Listen" />
        {answer.sources.length > 0 && (
          <p className="text-xs text-muted">
            Based on check-ins from {answer.sources.map(formatShortDate).join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}

function CheckinHistory({ history }) {
  if (history === null) {
    return (
      <div className="space-y-2" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-sand" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
        Nothing yet. Do tonight&apos;s check-in on the Today page and it will show up here.
      </p>
    );
  }

  return (
    <>
      {/* Oldest to newest, so the strip reads left to right like a calendar. */}
      <div className="mb-5 flex flex-wrap gap-1.5" aria-hidden="true">
        {[...history].reverse().map((c) => (
          <span
            key={`${c.date}-${c.savedAt}`}
            title={`${formatShortDate(c.date)}: ${c.mood}`}
            className={`h-6 w-6 rounded-lg ${MOOD_DOT[c.mood] ?? "bg-stone"} opacity-85`}
          />
        ))}
      </div>

      <ul className="space-y-2">
        {history.map((c) => (
          <li key={`${c.date}-${c.savedAt}`} className="rounded-2xl border border-line bg-paper px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${MOOD_DOT[c.mood] ?? "bg-stone"}`} aria-hidden="true" />
              <span className="text-sm font-semibold">{formatShortDate(c.date)}</span>
              <span className="text-sm text-muted">
                {c.mood} · {c.exercised ? "exercised" : "no workout"} · {c.tasksCompleted}/{c.tasksTotal} tasks
                {c.skippedMeal && " · skipped a meal"}
              </span>
            </div>
            {c.note && <p className="mt-1.5 pl-5 text-sm italic text-ink/75">“{c.note}”</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
