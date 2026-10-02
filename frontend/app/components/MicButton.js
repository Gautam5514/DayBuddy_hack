"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/app/lib/api";

// Is the backend's ElevenLabs voice ready? Asked once per page load and shared.
let voiceReady;
function checkVoiceReady() {
  voiceReady ??= api
    .voiceStatus()
    .then((s) => Boolean(s.ready))
    .catch(() => false);
  return voiceReady;
}

// Speak instead of type.
// With ElevenLabs configured it records audio and sends it to Scribe, which also
// understands Hinglish. Otherwise it uses the browser's built-in recognition
// (Chrome, Edge, Safari); the button hides itself if neither is available.
export default function MicButton({ onText, label = "Speak" }) {
  const [mode, setMode] = useState(null); // "elevenlabs" | "browser" | "none"
  const [state, setState] = useState("idle"); // idle | listening | working
  const recRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    checkVoiceReady().then((ready) => {
      if (cancelled) return;
      if (ready && navigator.mediaDevices && window.MediaRecorder) setMode("elevenlabs");
      else if (window.SpeechRecognition || window.webkitSpeechRecognition) setMode("browser");
      else setMode("none");
    });
    return () => {
      cancelled = true;
      recRef.current?.abort?.();
      if (recRef.current?.state === "recording") recRef.current.stop();
    };
  }, []);

  if (mode === null || mode === "none") return null;

  async function startRecording() {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return; // mic permission denied
    }
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setState("working");
      try {
        const text = await api.transcribe(new Blob(chunks, { type: recorder.mimeType }));
        if (text) onText(text);
      } catch {
        // Leave the field as it was; the user can just try again.
      } finally {
        setState("idle");
      }
    };
    recRef.current = recorder;
    recorder.start();
    setState("listening");
  }

  function startBrowserRecognition() {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = "en-IN"; // understands Indian English and Hinglish well
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (text) onText(text);
    };
    rec.onend = () => setState("idle");
    rec.onerror = () => setState("idle");
    recRef.current = rec;
    setState("listening");
    rec.start();
  }

  function toggle() {
    if (state === "working") return;
    if (state === "listening") {
      recRef.current?.stop();
      return;
    }
    if (mode === "elevenlabs") startRecording();
    else startBrowserRecognition();
  }

  const listening = state === "listening";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={state === "working"}
      aria-pressed={listening}
      aria-label={listening ? "Stop listening" : label}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all active:scale-[0.97] disabled:opacity-60 ${
        listening ? "border-clay bg-clay text-on-accent" : "border-line bg-paper text-ink hover:border-muted"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${listening ? "animate-pulse bg-on-accent" : "bg-clay"}`}
        aria-hidden="true"
      />
      {state === "listening" ? "Listening… tap to stop" : state === "working" ? "Writing it down…" : label}
    </button>
  );
}
