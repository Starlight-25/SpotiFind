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
// 6 sinusoidal waves mapped to frequency bands.
// u_flip mirrors x-axis for the right-side canvas (visual symmetry).
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
    // All waves at exactly the same horizontal center
    float center = 0.5;
    // Base idle oscillation identical for all waves
    // Each wave adds its own frequency band energy on top — fully independent
    float amp = 0.06 + u_bands[i] * 0.38 * u_active;
    float speed  = 0.8;
    float phase  = 0.0;
    float sfreq  = 4.0;
    float waveX  = center + amp * sin(y * sfreq * 6.2832 + u_time * speed + phase);
    float dist   = abs(x - waveX);

    // Sharp core line
    float thick = 0.016;
    float core  = smoothstep(thick, 0.001, dist);
    // Pronounced outer glow
    float glow  = smoothstep(0.18, 0.001, dist) * 0.45;
    float alpha = clamp(core * 0.95 + glow * (1.0 - core * 0.95), 0.0, 1.0);

    vec3  wc    = getColor(i);
    result += vec4(wc * alpha * 1.2, alpha);
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

// ─── Frequency band ranges [startBin, endBin] ────────────────────────────────
// fftSize=256 → 128 bins, ~172 Hz/bin at 44100 Hz sample rate
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

    // Full-screen quad via TRIANGLE_STRIP
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

    const fftData = new Uint8Array(128) as Uint8Array<ArrayBuffer>;

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
      gl.uniform2f(uRes,    canvas.width, canvas.height);
      gl.uniform1f(uTime,   t);
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
