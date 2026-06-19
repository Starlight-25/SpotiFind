"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPulseButton() {
  const [active, setActive] = useState(false);
  const rafRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const streamRef = useRef<MediaStream>();
  const dataRef = useRef<Uint8Array>();

  const tick = () => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;

    analyser.getByteFrequencyData(data);
    // Premiers bins uniquement : basses (~20-250 Hz avec fftSize 256 à 44100 Hz)
    const bassEnd = 4;
    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += data[i];
    const level = Math.min((bassSum / bassEnd) / 180, 1);

    const bars = document.querySelectorAll<HTMLElement>(".audio-bar");
    bars.forEach(bar => {
      const r = Math.round(26  + (29  - 26)  * level);
      const g = Math.round(26  + (185 - 26)  * level);
      const b = Math.round(26  + (84  - 26)  * level);
      bar.style.backgroundColor = `rgb(${r},${g},${b})`;
      bar.style.boxShadow = level > 0.2 ? `0 0 ${level * 6}px rgba(29,185,84,${level * 0.8})` : "";
    });

    rafRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });
      // Stop video tracks immediately — on veut seulement l'audio système
      stream.getVideoTracks().forEach(t => t.stop());

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(t => t.stop());
        alert("Aucun audio système détecté. Dans la boîte de partage, coche « Partager l'audio du système » avant de confirmer.");
        return;
      }

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      streamRef.current = stream;
      setActive(true);
      tick();
    } catch {
      // L'utilisateur a annulé la boîte de dialogue — pas d'erreur à afficher
    }
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current = undefined;
    setActive(false);
    document.querySelectorAll<HTMLElement>(".audio-bar").forEach(bar => {
      bar.style.background = "";
      bar.style.boxShadow = "";
    });
  };

  useEffect(() => () => { stop(); }, []);

  return (
    <button
      onClick={active ? stop : start}
      aria-label={active ? "Désactiver la sync audio" : "Activer la sync audio"}
      title={active ? "Désactiver la sync audio" : "Activer la sync audio"}
      className={`fixed bottom-5 right-5 z-50 flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-md transition-all duration-300 ${
        active
          ? "border-spotify bg-background text-spotify shadow-[0_0_12px_rgba(29,185,84,0.5)]"
          : "border-border bg-background text-muted hover:text-foreground hover:border-foreground"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    </button>
  );
}
