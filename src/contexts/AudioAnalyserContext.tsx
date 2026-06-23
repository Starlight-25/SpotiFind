"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type MutableRefObject,
  type ReactNode,
} from "react";

interface AudioAnalyserContextValue {
  analyserRef: MutableRefObject<AnalyserNode | null>;
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

const AudioAnalyserContext = createContext<AudioAnalyserContextValue | null>(null);

export function AudioAnalyserProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });
      stream.getVideoTracks().forEach((t) => t.stop());

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        alert(
          "Aucun audio système détecté. Dans la boîte de partage, coche « Partager l'audio du système » avant de confirmer."
        );
        return;
      }

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);

      analyserRef.current = analyser;
      streamRef.current = stream;
      setIsActive(true);
    } catch {
      // User cancelled dialog
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    analyserRef.current = null;
    streamRef.current = null;
    setIsActive(false);
  }, []);

  return (
    <AudioAnalyserContext.Provider value={{ analyserRef, isActive, start, stop }}>
      {children}
    </AudioAnalyserContext.Provider>
  );
}

export function useAudioAnalyserContext(): AudioAnalyserContextValue {
  const ctx = useContext(AudioAnalyserContext);
  if (!ctx) throw new Error("useAudioAnalyserContext must be used within AudioAnalyserProvider");
  return ctx;
}
