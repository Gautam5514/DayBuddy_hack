// Preferences live in two places: localStorage (instant, works offline) and
// the backend (source of truth when reachable).

import { api } from "./api";
import { DEFAULT_PREFS } from "./constants";
import { readJson, writeJson } from "./storage";

const PREFS_KEY = "daybuddy.prefs.v1";

export function loadCachedPrefs() {
  return { ...DEFAULT_PREFS, ...readJson(PREFS_KEY, {}) };
}

export function cachePrefs(prefs) {
  writeJson(PREFS_KEY, { ...DEFAULT_PREFS, ...prefs });
}

// Remote prefs merged over defaults, or null if the backend is unreachable.
export async function fetchRemotePrefs() {
  try {
    return { ...DEFAULT_PREFS, ...(await api.getPrefs()) };
  } catch {
    return null;
  }
}
