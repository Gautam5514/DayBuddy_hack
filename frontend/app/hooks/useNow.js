"use client";

import { useEffect, useState } from "react";

// The current time, refreshed every minute. `null` until mounted, so the
// server render and the first client render match (no hydration mismatch).
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const initial = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [intervalMs]);

  return now;
}
