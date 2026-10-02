"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { todayIso } from "@/app/lib/dates";
import { readJson, writeJson } from "@/app/lib/storage";

const ENABLED_KEY = "daybuddy.planReminderEnabled.v1";
const FIRED_KEY = "daybuddy.planReminderFired.v1";

function toMinutes(timeText) {
  const text = String(timeText || "").trim();

  const amPm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text);
  if (amPm) {
    const hour = Number(amPm[1]);
    const minute = Number(amPm[2]);
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    const hour24 = (hour % 12) + (amPm[3].toUpperCase() === "PM" ? 12 : 0);
    return hour24 * 60 + minute;
  }

  const twentyFour = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!twentyFour) return null;
  const hour = Number(twentyFour[1]);
  const minute = Number(twentyFour[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function usePlanReminders(items) {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unknown"
  );

  const supported = typeof window !== "undefined" && "Notification" in window;

  const reminderItems = useMemo(
    () =>
      Array.isArray(items)
        ? items
            .map((item) => ({
              ...item,
              minutes: toMinutes(item?.time),
              key: `${item?.time || ""}|${item?.title || ""}|${item?.kind || ""}`,
            }))
            .filter((item) => item.minutes !== null)
        : [],
    [items]
  );

  useEffect(() => {
    if (!supported) return;
    const id = setTimeout(() => {
      setEnabled(Boolean(readJson(ENABLED_KEY, false)));
    }, 0);
    return () => clearTimeout(id);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const today = todayIso();
    const saved = readJson(FIRED_KEY, {});
    if (saved?.day !== today) writeJson(FIRED_KEY, { day: today, keys: [] });
  }, [supported]);

  const setReminderEnabled = useCallback(
    async (next) => {
      if (!supported || !next) {
        setEnabled(false);
        writeJson(ENABLED_KEY, false);
        return;
      }

      let nextPermission = Notification.permission;
      if (nextPermission === "default") {
        try {
          nextPermission = await Notification.requestPermission();
        } catch {
          nextPermission = "denied";
        }
      }

      setPermission(nextPermission);
      const allow = nextPermission === "granted";
      setEnabled(allow);
      writeJson(ENABLED_KEY, allow);
    },
    [supported]
  );

  useEffect(() => {
    if (!supported || !enabled || permission !== "granted" || reminderItems.length === 0) return;

    const maybeNotify = () => {
      const now = new Date();
      const today = todayIso(now);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const saved = readJson(FIRED_KEY, { day: today, keys: [] });
      const fired = new Set(saved?.day === today && Array.isArray(saved.keys) ? saved.keys : []);

      let changed = false;
      for (const item of reminderItems) {
        if (item.minutes !== nowMinutes || fired.has(item.key)) continue;
        fired.add(item.key);
        changed = true;
        try {
          new Notification(`${item.time}: ${item.title}`);
        } catch {
          // If notifications fail at runtime, keep reminders silent.
        }
      }

      if (changed) writeJson(FIRED_KEY, { day: today, keys: [...fired] });
    };

    maybeNotify();
    const id = setInterval(maybeNotify, 30_000);
    return () => clearInterval(id);
  }, [enabled, permission, reminderItems, supported]);

  return {
    remindersEnabled: enabled,
    remindersSupported: supported,
    remindersDenied: permission === "denied",
    setReminderEnabled,
  };
}
