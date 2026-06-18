"use client";

import { useRef, useEffect, useState } from "react";

export default function ArtistScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);
  const [progress, setProgress] = useState(0);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setFadeLeft(el.scrollLeft > 8);
    setFadeRight(el.scrollLeft < max - 8);
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Left fade + button */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[var(--background)] to-transparent transition-opacity duration-200"
        style={{ opacity: fadeLeft ? 1 : 0 }}
      />
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Défiler à gauche"
        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-opacity duration-200 hover:bg-border"
        style={{ opacity: fadeLeft ? 1 : 0, pointerEvents: fadeLeft ? "auto" : "none" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Right fade + button */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[var(--background)] to-transparent transition-opacity duration-200"
        style={{ opacity: fadeRight ? 1 : 0 }}
      />
      <button
        onClick={() => scrollBy(1)}
        aria-label="Défiler à droite"
        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-opacity duration-200 hover:bg-border"
        style={{ opacity: fadeRight ? 1 : 0, pointerEvents: fadeRight ? "auto" : "none" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Progress bar */}
      {(fadeLeft || fadeRight) && (
        <div className="mt-2 h-0.5 w-full bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-[width] duration-100"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
