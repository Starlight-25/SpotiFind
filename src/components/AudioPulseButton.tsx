"use client";

import { useEffect, useRef } from "react";
import { useAudioAnalyserContext } from "@/contexts/AudioAnalyserContext";

export default function AudioPulseButton() {
  const { isActive, start, stop, analyserRef } = useAudioAnalyserContext();
  const rafRef = useRef<number>();
  const dataRef = useRef(new Uint8Array(128) as Uint8Array<ArrayBuffer>);

  useEffect(() => {
    if (!isActive) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.querySelectorAll<HTMLElement>(".audio-bar").forEach((bar) => {
        bar.style.backgroundColor = "";
        bar.style.boxShadow = "";
      });
      return;
    }

    const tick = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      analyser.getByteFrequencyData(dataRef.current);
      const bassEnd = 4;
      let bassSum = 0;
      for (let i = 0; i < bassEnd; i++) bassSum += dataRef.current[i];
      const level = Math.min(bassSum / bassEnd / 180, 1);

      document.querySelectorAll<HTMLElement>(".audio-bar").forEach((bar) => {
        const r = Math.round(26 + (29 - 26) * level);
        const g = Math.round(26 + (185 - 26) * level);
        const b = Math.round(26 + (84 - 26) * level);
        bar.style.backgroundColor = `rgb(${r},${g},${b})`;
        bar.style.boxShadow =
          level > 0.2 ? `0 0 ${level * 6}px rgba(29,185,84,${level * 0.8})` : "";
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, analyserRef]);

  return (
    <button
      onClick={isActive ? stop : start}
      aria-label={isActive ? "Désactiver la sync audio" : "Activer la sync audio"}
      title={isActive ? "Désactiver la sync audio" : "Activer la sync audio"}
      className={`fixed bottom-20 left-5 z-50 flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-md transition-all duration-300 ${
        isActive
          ? "border-spotify bg-background text-spotify shadow-[0_0_12px_rgba(29,185,84,0.5)]"
          : "border-border bg-background text-muted hover:text-foreground hover:border-foreground"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    </button>
  );
}
