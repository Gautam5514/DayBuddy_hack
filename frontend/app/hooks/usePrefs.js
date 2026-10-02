"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PREFS } from "@/app/lib/constants";
import { cachePrefs, fetchRemotePrefs, loadCachedPrefs } from "@/app/lib/prefs";

// Preferences for the current user: the local cache first (instant), then the
// backend copy once it arrives. `ready` turns true as soon as the cache is read.
export function usePrefs() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    // Deferred past the effect body: localStorage is only readable after
    // hydration, and setting state synchronously here would cascade renders.
    const id = setTimeout(async () => {
      setPrefs(loadCachedPrefs());
      setReady(true);
      const remote = await fetchRemotePrefs();
      if (active && remote) {
        setPrefs(remote);
        cachePrefs(remote);
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, []);

  return { prefs, setPrefs, ready };
}
