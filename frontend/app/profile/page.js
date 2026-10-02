"use client";

import { useState } from "react";
import { Button, Card, ChoiceButton, PageIntro, PageShell, SectionHeader, Spinner, fieldClass } from "@/app/components/ui";
import { usePrefs } from "@/app/hooks/usePrefs";
import { api } from "@/app/lib/api";
import { EXERCISE_OPTIONS, FOOD_OPTIONS, LANGUAGE_OPTIONS } from "@/app/lib/constants";
import { cachePrefs } from "@/app/lib/prefs";

const LANGUAGE_LABELS = { Hinglish: "Hinglish (Hindi + English)" };

// "idle" | "saving" | "saved" | "local-only"
const STATUS_TEXT = {
  saved: "Saved. Your next plan will use this.",
  "local-only": "Saved on this device. It will sync when the server is back.",
};

export default function ProfilePage() {
  const { prefs, setPrefs, ready } = usePrefs();
  const [status, setStatus] = useState("idle");

  function setField(field, value) {
    setPrefs((prev) => ({ ...prev, [field]: value }));
    setStatus("idle");
  }
  const onInput = (field) => (e) => setField(field, e.target.value);

  async function handleSubmit(e) {
    e.preventDefault();
    cachePrefs(prefs);
    setStatus("saving");
    try {
      await api.savePrefs(prefs);
      setStatus("saved");
    } catch {
      setStatus("local-only");
    }
  }

  return (
    <PageShell>
      <PageIntro eyebrow="Profile" title="About you">
        The more honest this is, the better your plans will fit.
      </PageIntro>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card delay={60}>
          <SectionHeader title="You and your rhythm" />
          <div className="space-y-5">
            <Field id="name" label="What should I call you?">
              <input
                id="name"
                type="text"
                value={prefs.name}
                onChange={onInput("name")}
                placeholder="Your name"
                className={fieldClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="wakeTime" label="You wake up around">
                <input id="wakeTime" type="time" value={prefs.wakeTime} onChange={onInput("wakeTime")} className={fieldClass} />
              </Field>
              <Field id="sleepTime" label="And sleep around">
                <input id="sleepTime" type="time" value={prefs.sleepTime} onChange={onInput("sleepTime")} className={fieldClass} />
              </Field>
            </div>
          </div>
        </Card>

        <Card delay={120}>
          <SectionHeader title="Food and movement" />
          <div className="space-y-5">
            <OptionGroup
              label="What do you eat?"
              options={FOOD_OPTIONS}
              value={prefs.foodPreference}
              onChange={(v) => setField("foodPreference", v)}
            />
            <OptionGroup
              label="How do you like to move?"
              options={EXERCISE_OPTIONS}
              value={prefs.exercisePreference}
              onChange={(v) => setField("exercisePreference", v)}
            />
          </div>
        </Card>

        <Card delay={180}>
          <SectionHeader title="How we talk" />
          <div className="space-y-5">
            <OptionGroup
              label="Which language should I use?"
              options={LANGUAGE_OPTIONS}
              labels={LANGUAGE_LABELS}
              value={prefs.language}
              onChange={(v) => setField("language", v)}
            />
            <Field id="goal" label="What are you trying to get better at?">
              <textarea
                id="goal"
                rows={2}
                value={prefs.goal}
                onChange={onInput("goal")}
                placeholder="Waking up on time, eating properly, finishing work early"
                className={`${fieldClass} resize-none`}
              />
            </Field>
          </div>
        </Card>

        <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-full border border-line bg-card/90 p-2 pl-5 shadow-card backdrop-blur-md">
          <span role="status" className={`flex-1 text-sm ${status === "saved" ? "text-sage" : "text-muted"}`}>
            {STATUS_TEXT[status] ?? "Changes are saved when you tap Save."}
          </span>
          <Button type="submit" disabled={!ready || status === "saving"}>
            {status === "saving" && <Spinner />}
            {status === "saving" ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

// A single-choice group of pills (a friendlier <select> for a handful of options).
function OptionGroup({ label, options, value, onChange, labels = {} }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ChoiceButton key={option} active={value === option} onClick={() => onChange(option)}>
            {labels[option] ?? option}
          </ChoiceButton>
        ))}
      </div>
    </fieldset>
  );
}
