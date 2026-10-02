"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
import { todayIso } from "@/app/lib/dates";

const TEMP_PREFIX = "temp-";

// Tasks created while offline (or still in flight) have a temp id the server never saw.
const isUnsynced = (id) => String(id).startsWith(TEMP_PREFIX);

// Today's task list with optimistic updates: the UI changes immediately and the
// backend is updated in the background. If the backend is down, the list still works.
export function useTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let active = true;
    api
      .listTasks(todayIso())
      .then((list) => active && setTasks(list))
      .catch(() => {}); // Backend unreachable: start with an empty list.
    return () => {
      active = false;
    };
  }, []);

  async function addTask(label) {
    const tempId = `${TEMP_PREFIX}${crypto.randomUUID()}`;
    setTasks((prev) => [...prev, { id: tempId, label, done: false }]);
    try {
      const saved = await api.createTask(label);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
    } catch {
      // Keep the optimistic task so nothing typed is lost.
    }
  }

  function toggleTask(id) {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const done = !target.done;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    if (!isUnsynced(id)) api.updateTask(id, { done, date: done ? todayIso() : undefined }).catch(() => {});
  }

  function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (!isUnsynced(id)) api.deleteTask(id).catch(() => {});
  }

  const completed = tasks.filter((t) => t.done).length;

  return { tasks, completed, addTask, toggleTask, removeTask };
}
