"use client";

import { useState } from "react";
import { PageIntro, PageShell, SubpageHeader, fieldClass } from "@/app/components/ui";
import { usePrefs } from "@/app/hooks/usePrefs";
import { api } from "@/app/lib/api";
import { EXERCISE_OPTIONS, FOOD_OPTIONS, LANGUAGE_OPTIONS } from "@/app/lib/constants";
import { cachePrefs } from "@/app/lib/prefs";

const LANGUAGE_LABELS = { Hinglish: "Hinglish (Hindi + English)" };

// "idle" | "saving" | "saved" | "local-only"
const STATUS_TEXT = {
  saving: "Saving…",
  saved: "Saved.",
  "local-only": "Saved on this device. It will sync when the server is back.",
};

export default function ProfilePage() {
  const { prefs, setPrefs, ready } = usePrefs();
  const [status, setStatus] = useState("idle");

  function update(field) {
    return (e) => {
      setPrefs((prev) => ({ ...prev, [field]: e.target.value }));
      setStatus("idle");
    };
  }

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
      <SubpageHeader />

      <PageIntro title="About you">The more honest this is, the better your plans will fit.</PageIntro>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Field id="name" label="What should I call you?">
            <input
              id="name"
              type="text"
              value={prefs.name}
              onChange={update("name")}
              placeholder="Your name"
              className={fieldClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field id="wakeTime" label="You wake up around">
              <input id="wakeTime" type="time" value={prefs.wakeTime} onChange={update("wakeTime")} className={fieldClass} />
            </Field>
            <Field id="sleepTime" label="And sleep around">
              <input id="sleepTime" type="time" value={prefs.sleepTime} onChange={update("sleepTime")} className={fieldClass} />
            </Field>
          </div>

          <Field id="foodPreference" label="What do you eat?">
            <Select id="foodPreference" value={prefs.foodPreference} onChange={update("foodPreference")} options={FOOD_OPTIONS} />
          </Field>

          <Field id="exercisePreference" label="How do you like to move?">
            <Select
              id="exercisePreference"
              value={prefs.exercisePreference}
              onChange={update("exercisePreference")}
              options={EXERCISE_OPTIONS}
            />
          </Field>

          <Field id="language" label="How should I talk to you?">
            <Select
              id="language"
              value={prefs.language}
              onChange={update("language")}
              options={LANGUAGE_OPTIONS}
              labels={LANGUAGE_LABELS}
            />
          </Field>

          <Field id="goal" label="What are you trying to get better at?">
            <textarea
              id="goal"
              rows={2}
              value={prefs.goal}
              onChange={update("goal")}
              placeholder="Waking up on time, eating properly, finishing work early"
              className={`${fieldClass} resize-none`}
            />
          </Field>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button
            type="submit"
            disabled={!ready || status === "saving"}
            className="rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-50"
          >
            Save
          </button>
          <span role="status" className={`text-sm ${status === "saved" ? "text-sage" : "text-muted"}`}>
            {STATUS_TEXT[status]}
          </span>
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

function Select({ id, value, onChange, options, labels = {} }) {
  return (
    <select id={id} value={value} onChange={onChange} className={fieldClass}>
      {options.map((option) => (
        <option key={option} value={option}>
          {labels[option] ?? option}
        </option>
      ))}
    </select>
  );
}
