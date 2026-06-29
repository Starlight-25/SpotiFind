"use client";

import { useEffect } from "react";

export default function ScrollAnimator({ deps }: { deps?: unknown[] }) {
  useEffect(() => {
    let observer: IntersectionObserver;
    let scrollDir: "down" | "up" = "down";
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      scrollDir = y >= lastY ? "down" : "up";
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const rafId = requestAnimationFrame(() => {
      const els = document.querySelectorAll<HTMLElement>(".scroll-fade-in");
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.toggle("from-top", scrollDir === "up");
              entry.target.classList.add("visible");
            } else {
              entry.target.classList.remove("visible");
              entry.target.classList.remove("from-top");
            }
          });
        },
        { threshold: 0.08 }
      );
      els.forEach((el) => observer.observe(el));

      // Fallback: activate elements already in viewport if IO fires late
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
      window.removeEventListener("scroll", onScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? []);

  return null;
}
