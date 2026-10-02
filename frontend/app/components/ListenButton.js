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

  const playing = state === "playing";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink transition-all hover:border-muted active:scale-[0.97]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-clay text-on-accent" aria-hidden="true">
        {playing ? (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-0.5 h-3 w-3" fill="currentColor">
            <path d="M7 5v14l12-7z" />
          </svg>
        )}
      </span>
      {state === "loading" ? "One moment…" : playing ? "Stop" : label}
    </button>
  );
}
