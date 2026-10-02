"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";

// Whether the AI model is reachable: true / false, or null while still checking.
export function useAiReady() {
  const [ready, setReady] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .getAiStatus()
      .then((status) => active && setReady(Boolean(status.ready)))
      .catch(() => active && setReady(false));
    return () => {
      active = false;
    };
  }, []);

  return ready;
}
