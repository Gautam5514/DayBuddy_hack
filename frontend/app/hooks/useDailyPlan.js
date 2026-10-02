"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
import { todayIso } from "@/app/lib/dates";
import { readJson, writeJson } from "@/app/lib/storage";

const PLAN_KEY = "daybuddy.plan.v1";

// Today's generated plan. It is cached per day so a refresh doesn't lose it,
// and a new day starts clean.
export function useDailyPlan() {
  const [plan, setPlan] = useState(null); // { items, greeting, tip, source } | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      const saved = readJson(PLAN_KEY);
      if (saved?.day === todayIso() && Array.isArray(saved.plan?.items)) setPlan(saved.plan);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  async function generate(prefs, tasks) {
    setLoading(true);
    setError("");
    try {
      const data = await api.generatePlan(prefs, tasks);
      if (!Array.isArray(data.plan) || data.plan.length === 0) throw new Error("Empty plan");
      const next = {
        items: data.plan,
        greeting: data.greeting || "",
        tip: data.tip || "",
        source: data.source || "",
      };
      setPlan(next);
      writeJson(PLAN_KEY, { day: todayIso(), plan: next });
    } catch {
      setError("Couldn't reach the planner just now. Give it a moment and try again.");
    } finally {
      setLoading(false);
    }
  }

  return { plan, loading, error, generate };
}
