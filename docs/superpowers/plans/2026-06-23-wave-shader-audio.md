# Wave Shader Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter deux canvases WebGL fixés sur les bords gauche et droit de la page, affichant chacun 6 waves GLSL colorées réactives à l'audio système.

**Architecture:** Extraire la gestion audio de `AudioPulseButton` vers un nouveau `AudioAnalyserContext`. Deux `WaveShader` lisent ce contexte et tournent chacun un rAF WebGL indépendant. `AudioPulseButton` est simplifié pour appeler `start()`/`stop()` du contexte tout en conservant sa logique `.audio-bar`.

**Tech Stack:** WebGL 1.0 (natif navigateur), GLSL ES 1.0, React Context, Next.js 14 App Router — zéro dépendance npm ajoutée.

---

## File map

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| Create | `src/contexts/AudioAnalyserContext.tsx` | Lifecycle stream/analyser, `isActive` state, `analyserRef` partagé |
| Create | `src/hooks/useAudioAnalyser.ts` | Hook consommateur (re-export) |
| Create | `src/components/WaveShader.tsx` | Canvas WebGL, shaders GLSL, render loop audio-réactif |
| Modify | `src/components/AudioPulseButton.tsx` | Utiliser context start/stop, garder logique `.audio-bar` |
| Modify | `src/app/layout.tsx` | Wrapper provider + deux instances WaveShader |

---

### Task 1 — AudioAnalyserContext

**Files:**
- Create: `src/contexts/AudioAnalyserContext.tsx`

- [ ] **Step 1 — Créer le fichier**

```tsx
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
```

- [ ] **Step 2 — Commit**

```bash
git add src/contexts/AudioAnalyserContext.tsx
git commit -m "feat(audio): add AudioAnalyserContext provider"
```

---

### Task 2 — useAudioAnalyser hook

**Files:**
- Create: `src/hooks/useAudioAnalyser.ts`

- [ ] **Step 1 — Créer le fichier**

```ts
export { useAudioAnalyserContext as useAudioAnalyser } from "@/contexts/AudioAnalyserContext";
```

- [ ] **Step 2 — Commit**

```bash
git add src/hooks/useAudioAnalyser.ts
git commit -m "feat(audio): add useAudioAnalyser hook"
```

---

### Task 3 — Refactorer AudioPulseButton

**Files:**
- Modify: `src/components/AudioPulseButton.tsx`

- [ ] **Step 1 — Remplacer le contenu du fichier**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useAudioAnalyserContext } from "@/contexts/AudioAnalyserContext";

export default function AudioPulseButton() {
  const { isActive, start, stop, analyserRef } = useAudioAnalyserContext();
  const rafRef = useRef<number>();
  const dataRef = useRef<Uint8Array>(new Uint8Array(128));

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
```

- [ ] **Step 2 — Commit**

```bash
git add src/components/AudioPulseButton.tsx
git commit -m "refactor(audio): AudioPulseButton delegates analyser to context"
```

---

### Task 4 — WaveShader component

**Files:**
- Create: `src/components/WaveShader.tsx`

- [ ] **Step 1 — Créer le fichier**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useAudioAnalyserContext } from "@/contexts/AudioAnalyserContext";

// ─── Vertex shader ────────────────────────────────────────────────────────────
const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// ─── Fragment shader ──────────────────────────────────────────────────────────
// 6 sinusoidal waves, each mapped to a frequency band.
// u_flip mirrors the x-axis for the right-side canvas.
const FRAG = `
precision mediump float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_bands[6];
uniform float u_active;
uniform float u_flip;

vec3 getColor(int i) {
  if (i == 0) return vec3(0.545, 0.361, 0.965); // #8B5CF6 violet
  if (i == 1) return vec3(0.388, 0.400, 0.945); // #6366F1 indigo
  if (i == 2) return vec3(0.231, 0.510, 0.965); // #3B82F6 blue
  if (i == 3) return vec3(0.024, 0.714, 0.831); // #06B6D4 cyan
  if (i == 4) return vec3(0.063, 0.725, 0.506); // #10B981 emerald
  return       vec3(0.114, 0.729, 0.333);        // #1DB954 spotify green
}

void main() {
  vec2  uv     = gl_FragCoord.xy / u_resolution;
  float x      = u_flip > 0.5 ? 1.0 - uv.x : uv.x;
  float y      = uv.y;
  vec4  result = vec4(0.0);

  for (int i = 0; i < 6; i++) {
    float fi     = float(i);
    float center = (fi + 0.5) / 6.0;
    float idle   = 0.05 + fi * 0.005;
    float active = u_bands[i] * 0.32;
    float amp    = mix(idle, active, u_active);
    float speed  = 0.7 + fi * 0.13;
    float phase  = fi * 1.047;
    float sfreq  = 3.5 + fi * 0.45;
    float waveX  = center + amp * sin(y * sfreq * 6.2832 + u_time * speed + phase);
    float dist   = abs(x - waveX);
    float thick  = 0.015;
    float alpha  = smoothstep(thick, thick * 0.05, dist) * 0.88;
    vec3  wc     = getColor(i);
    result      += vec4(wc * alpha, alpha);
  }

  gl_FragColor = clamp(result, 0.0, 1.0);
}
`;

// ─── WebGL helpers ────────────────────────────────────────────────────────────
function buildProgram(gl: WebGLRenderingContext): WebGLProgram {
  const compile = (type: number, src: string): WebGLShader => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  return prog;
}

// ─── Frequency band ranges [startBin, endBin] ─────────────────────────────────
// fftSize=256 → 128 bins, ~172 Hz/bin
const BANDS: [number, number][] = [
  [0,   1],   // sub-bass  0–200 Hz
  [2,   4],   // bass      200–500 Hz
  [5,  15],   // low-mid   500 Hz–2 kHz
  [16, 30],   // mid       2–5 kHz
  [31, 60],   // high-mid  5–10 kHz
  [61, 110],  // high      10–20 kHz
];

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  side: "left" | "right";
}

export default function WaveShader({ side }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyserRef, isActive } = useAudioAnalyserContext();
  const isActiveRef = useRef(isActive);

  // Keep ref in sync to avoid stale closure in the rAF loop
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const prog = buildProgram(gl);
    gl.useProgram(prog);

    // Full-screen quad (two triangles via TRIANGLE_STRIP)
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uRes    = gl.getUniformLocation(prog, "u_resolution");
    const uTime   = gl.getUniformLocation(prog, "u_time");
    const uBands  = gl.getUniformLocation(prog, "u_bands");
    const uActive = gl.getUniformLocation(prog, "u_active");
    const uFlip   = gl.getUniformLocation(prog, "u_flip");

    gl.uniform1f(uFlip, side === "right" ? 1.0 : 0.0);

    const fftData = new Uint8Array(128);

    const resize = () => {
      const w = canvas.offsetWidth  || 100;
      const h = canvas.offsetHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const t0 = performance.now();
    let raf: number;

    const render = () => {
      raf = requestAnimationFrame(render);
      resize();

      const t      = (performance.now() - t0) / 1000;
      const active = isActiveRef.current;
      const bands  = new Float32Array(6);

      if (active && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(fftData);
        for (let i = 0; i < 6; i++) {
          const [s, e] = BANDS[i];
          let sum = 0;
          for (let b = s; b <= e; b++) sum += fftData[b];
          bands[i] = Math.min(sum / (e - s + 1) / 200, 1);
        }
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes,   canvas.width, canvas.height);
      gl.uniform1f(uTime,  t);
      gl.uniform1fv(uBands, bands);
      gl.uniform1f(uActive, active ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 ${
        side === "left" ? "left-0" : "right-0"
      } h-screen w-[100px] hidden lg:block pointer-events-none z-10`}
    />
  );
}
```

- [ ] **Step 2 — Commit**

```bash
git add src/components/WaveShader.tsx
git commit -m "feat(wave-shader): WebGL GLSL audio-reactive wave component"
```

---

### Task 5 — Wiring dans layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1 — Remplacer le contenu du fichier**

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FavouritesProvider } from "@/contexts/FavouritesContext";
import { AudioAnalyserProvider } from "@/contexts/AudioAnalyserContext";
import AudioPulseButton from "@/components/AudioPulseButton";
import ThemeToggle from "@/components/ThemeToggle";
import WaveShader from "@/components/WaveShader";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SpotiFind",
  description: "Explore music with the Spotify API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AudioAnalyserProvider>
          <FavouritesProvider>
            <div className="container-app">
              {children}
            </div>
            <AudioPulseButton />
            <ThemeToggle />
            <WaveShader side="left" />
            <WaveShader side="right" />
          </FavouritesProvider>
        </AudioAnalyserProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2 — Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(wave-shader): wire AudioAnalyserProvider and WaveShader in layout"
```
