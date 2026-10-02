"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/app/lib/api";

// Reads `text` out loud with ElevenLabs. Renders nothing when voice isn't set up.
export default function ListenButton({ text, label = "Read it to me" }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState("idle"); // idle | loading | playing
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .voiceStatus()
      .then((s) => !cancelled && setReady(Boolean(s.ready)))
      .catch(() => {});
    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, []);

  if (!ready || !text) return null;

  async function toggle() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    if (state === "loading") return;
    setState("loading");
    try {
      const blob = await api.speak(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setState("idle");
      };
      audioRef.current = audio;
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-sm font-medium text-clay hover:text-clay-dark disabled:opacity-60"
    >
      {state === "loading" ? "One moment…" : state === "playing" ? "Stop" : `▶ ${label}`}
    </button>
  );
}
