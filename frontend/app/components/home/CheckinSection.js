"use client";

import { useState } from "react";
import MicButton from "@/app/components/MicButton";
import { ChoiceButton, ErrorNotice, SectionHeader, fieldClass } from "@/app/components/ui";
import { api } from "@/app/lib/api";
import { MOODS, NOTE_MAX_LENGTH } from "@/app/lib/constants";
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
    <section>
      <SectionHeader
        title="Before you sleep"
        description="A quick look back. Tomorrow's plan is built from this."
      />

      {summary ? (
        <CheckinSummary checkin={summary} onEdit={startOver} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <YesNo label="Did you exercise today?" value={answers.exercised} onChange={setAnswer("exercised")} />
          <YesNo label="Did you skip a meal?" value={answers.skippedMeal} onChange={setAnswer("skippedMeal")} />

          <fieldset>
            <legend className="mb-2 text-sm font-medium">How was the day?</legend>
            <div className="flex gap-2">
              {MOODS.map((mood) => (
                <ChoiceButton key={mood} active={answers.mood === mood} onClick={() => setAnswer("mood")(mood)}>
                  {mood}
                </ChoiceButton>
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

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Done for today"}
          </button>
        </form>
      )}
    </section>
  );
}

function CheckinSummary({ checkin, onEdit }) {
  return (
    <div>
      <p className="font-serif text-xl leading-snug">{summaryLine(checkin)}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <Stat label="Exercise" value={checkin.exercised ? "Done" : "Skipped"} />
        <Stat label="Meals" value={checkin.skippedMeal ? "Skipped one" : "All good"} />
        <Stat label="Tasks" value={`${checkin.tasksCompleted} of ${checkin.tasksTotal}`} />
        <Stat label="Mood" value={checkin.mood} />
      </dl>
      {checkin.note && (
        <p className="mt-5 border-l-2 border-clay pl-3 text-sm italic text-ink/80">{checkin.note}</p>
      )}
      <button type="button" onClick={onEdit} className="mt-5 text-sm font-medium text-clay hover:text-clay-dark">
        Change my answers
      </button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-medium">{value}</dd>
    </div>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        <ChoiceButton active={value === true} onClick={() => onChange(true)}>
          Yes
        </ChoiceButton>
        <ChoiceButton active={value === false} onClick={() => onChange(false)}>
          No
        </ChoiceButton>
      </div>
    </fieldset>
  );
}
