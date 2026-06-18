"use client";

import { useRef, useEffect, useState } from "react";

export default function ArtistScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 8);
    setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
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

  return (
    <div className="relative">
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2">
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--background)] to-transparent transition-opacity duration-200"
        style={{ opacity: fadeLeft ? 1 : 0 }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--background)] to-transparent transition-opacity duration-200"
        style={{ opacity: fadeRight ? 1 : 0 }}
      />
    </div>
  );
}
