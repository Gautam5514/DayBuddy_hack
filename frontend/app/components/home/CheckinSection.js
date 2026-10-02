"use client";

import { useState } from "react";
import MicButton from "@/app/components/MicButton";
import { Button, Card, ChoiceButton, ErrorNotice, SectionHeader, Spinner, fieldClass } from "@/app/components/ui";
import { api } from "@/app/lib/api";
import { MOOD_DOT, MOOD_HINT, MOODS, NOTE_MAX_LENGTH } from "@/app/lib/constants";
import { todayIso } from "@/app/lib/dates";

const EMPTY_ANSWERS = { exercised: null, skippedMeal: null, mood: null, note: "" };

// One plain sentence that reflects how the day actually went.
function summaryLine(checkin) {
  if (checkin.mood === "Tired") return "Sounds like a heavy one. Tomorrow will start gently.";
  if (!checkin.exercised) return "No workout today, and that's okay. Tomorrow starts light.";
  if (checkin.tasksTotal > 0 && checkin.tasksCompleted === checkin.tasksTotal) {
    return "You finished everything. Go enjoy the evening.";
  }
  return "Good day. Thanks for checking in.";
}

export default function CheckinSection({ tasksCompleted, tasksTotal }) {
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setAnswer = (field) => (value) => setAnswers((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      setSummary(
        await api.saveCheckin({
          date: todayIso(),
          exercised: answers.exercised === true,
          skippedMeal: answers.skippedMeal === true,
          tasksCompleted,
          tasksTotal,
          mood: answers.mood ?? "Okay",
          note: answers.note.trim(),
        })
      );
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function startOver() {
    setSummary(null);
    setAnswers(EMPTY_ANSWERS);
    setError("");
  }

  return (
    <Card delay={240}>
      <SectionHeader
        title="Before you sleep"
        description="A quick look back. Tomorrow's plan is built from this."
      />

      {summary ? (
        <CheckinSummary checkin={summary} onEdit={startOver} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="divide-y divide-line rounded-2xl border border-line">
            <YesNo label="Did you exercise today?" value={answers.exercised} onChange={setAnswer("exercised")} />
            <YesNo label="Did you skip a meal?" value={answers.skippedMeal} onChange={setAnswer("skippedMeal")} />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">How was the day?</legend>
            <div className="grid grid-cols-3 gap-2">
              {MOODS.map((mood) => (
                <MoodTile
                  key={mood}
                  mood={mood}
                  active={answers.mood === mood}
                  onClick={() => setAnswer("mood")(mood)}
                />
              ))}
            </div>
          </fieldset>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="note" className="text-sm font-medium">
                Anything on your mind? <span className="font-normal text-muted">(optional)</span>
              </label>
              <MicButton
                onText={(text) =>
                  setAnswers((prev) => ({
                    ...prev,
                    note: (prev.note ? `${prev.note} ${text}` : text).slice(0, NOTE_MAX_LENGTH),
                  }))
                }
              />
            </div>
            <textarea
              id="note"
              rows={2}
              value={answers.note}
              maxLength={NOTE_MAX_LENGTH}
              onChange={(e) => setAnswer("note")(e.target.value)}
              placeholder="Low on energy after lunch, that kind of thing"
              className={`${fieldClass} resize-none`}
            />
          </div>

          <ErrorNotice>{error}</ErrorNotice>

          <Button type="submit" variant="dark" disabled={saving} className="w-full sm:w-auto">
            {saving && <Spinner />}
            {saving ? "Saving…" : "Done for today"}
          </Button>
        </form>
      )}
    </Card>
  );
}

function CheckinSummary({ checkin, onEdit }) {
  return (
    <div className="animate-rise">
      <p className="font-serif text-xl leading-snug">{summaryLine(checkin)}</p>
      <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
        <Stat label="Exercise" value={checkin.exercised ? "Done" : "Skipped"} good={checkin.exercised} />
        <Stat label="Meals" value={checkin.skippedMeal ? "Skipped one" : "All good"} good={!checkin.skippedMeal} />
        <Stat
          label="Tasks"
          value={`${checkin.tasksCompleted} of ${checkin.tasksTotal}`}
          good={checkin.tasksTotal > 0 && checkin.tasksCompleted === checkin.tasksTotal}
        />
        <Stat label="Mood" value={checkin.mood} good={checkin.mood === "Great"} />
      </dl>
      {checkin.note && (
        <p className="mt-4 border-l-2 border-clay pl-3 text-sm italic text-ink/80">{checkin.note}</p>
      )}
      <button type="button" onClick={onEdit} className="mt-5 text-sm font-medium text-clay hover:text-clay-dark">
        Change my answers
      </button>
    </div>
  );
}

function Stat({ label, value, good }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${good ? "bg-sage-soft" : "bg-sand"}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-medium">{value}</dd>
    </div>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <fieldset className="flex items-center justify-between gap-3 px-4 py-3">
      <legend className="float-left text-sm font-medium">{label}</legend>
      <div className="flex gap-1.5">
        <ChoiceButton active={value === true} onClick={() => onChange(true)} className="px-3.5 py-1.5">
          Yes
        </ChoiceButton>
        <ChoiceButton active={value === false} onClick={() => onChange(false)} className="px-3.5 py-1.5">
          No
        </ChoiceButton>
      </div>
    </fieldset>
  );
}

function MoodTile({ mood, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-start gap-1 rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.97] ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-muted"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${MOOD_DOT[mood]}`} aria-hidden="true" />
      <span className="text-sm font-semibold">{mood}</span>
      <span className={`text-xs ${active ? "text-paper/70" : "text-muted"}`}>{MOOD_HINT[mood]}</span>
    </button>
  );
}
