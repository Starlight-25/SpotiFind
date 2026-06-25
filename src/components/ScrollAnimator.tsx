"use client";

import { useEffect } from "react";

export default function ScrollAnimator({ deps }: { deps?: unknown[] }) {
  useEffect(() => {
    let observer: IntersectionObserver;
    const rafId = requestAnimationFrame(() => {
      const els = document.querySelectorAll<HTMLElement>(".scroll-fade-in");
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            } else {
              const exitedFromTop = entry.boundingClientRect.top < 0;
              (entry.target as HTMLElement).style.setProperty(
                "--slide-from",
                exitedFromTop ? "-14px" : "14px"
              );
              entry.target.classList.remove("visible");
            }
          });
        },
        { threshold: 0.1 }
      );
      els.forEach((el) => observer.observe(el));

      // Fallback: activate elements already in viewport if IO is slow to fire
      requestAnimationFrame(() => {
        els.forEach((el) => {
          if (!el.classList.contains("visible")) {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              el.classList.add("visible");
            }
          }
        });
      });
    });
    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, deps ?? []);

  return null;
}
