"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PillRect {
  left: number;
  width: number;
  height: number;
}

interface GlassNavPillProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassNavPill({ children, className }: GlassNavPillProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<PillRect | null>(null);
  const [entered, setEntered] = useState(false);
  const [canSlide, setCanSlide] = useState(false);
  const firstRef = useRef(true);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  const getRect = (el: HTMLElement): PillRect | null => {
    if (!containerRef.current) return null;
    const cr = containerRef.current.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return { left: er.left - cr.left, width: er.width, height: er.height };
  };

  const onItemEnter = useCallback((el: HTMLElement) => {
    clearTimeout(leaveTimer.current);
    const r = getRect(el);
    if (!r) return;

    if (firstRef.current) {
      // Première apparition : position immédiate, puis animation bulle (scale 0→1)
      setCanSlide(false);
      setRect(r);
      setEntered(false);
      // Double rAF — force le navigateur à rendre à scale(0) avant de transitionner
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setEntered(true);
        setCanSlide(true);
        firstRef.current = false;
      }));
    } else {
      // Déjà visible : glisse vers la nouvelle position
      setRect(r);
      setEntered(true);
    }
  }, []);

  const onContainerLeave = useCallback(() => {
    setEntered(false);
    leaveTimer.current = setTimeout(() => {
      firstRef.current = true;
      setCanSlide(false);
    }, 300);
  }, []);

  // Injecter onMouseEnter sur chaque enfant direct
  const enhanced = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const prev = (child.props as { onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void }).onMouseEnter;
    return React.cloneElement(
      child as React.ReactElement<{ onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void }>,
      {
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          onItemEnter(e.currentTarget);
          prev?.(e);
        },
      }
    );
  });

  // Transitions
  const slideT = canSlide
    ? "left 0.6s cubic-bezier(0.4,0,0.2,1), width 0.6s cubic-bezier(0.4,0,0.2,1)"
    : "none";
  const scaleT = entered
    ? "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)"  // bounce in
    : "transform 0.2s ease";                              // fade out
  const pillT = [slideT !== "none" ? slideT : "", scaleT].filter(Boolean).join(", ");

  return (
    <div
      ref={containerRef}
      className={cn("relative flex items-center gap-1", className)}
      onMouseLeave={onContainerLeave}
    >
      {rect && (
        <>
          {/* Shadow flouée pour la profondeur */}
          <div
            aria-hidden
            className="glass-pill-shadow"
            style={{
              position: "absolute",
              left: rect.left + 3,
              width: rect.width - 6,
              top: "50%",
              height: rect.height - 4,
              transform: `translateY(-45%) scale(${entered ? 1 : 0})`,
              zIndex: -1,
              pointerEvents: "none",
              transition: pillT,
            }}
          />

          {/* Le verre — pill glissant */}
          <div
            aria-hidden
            className="glass-pill"
            style={{
              position: "absolute",
              left: rect.left,
              width: rect.width,
              top: "50%",
              height: rect.height,
              transform: `translateY(-50%) scale(${entered ? 1 : 0})`,
              transformOrigin: "center",
              zIndex: 0,
              pointerEvents: "none",
              transition: pillT,
            }}
          />

          {/* Ligne de reflet en haut du pill */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: rect.left,
              width: rect.width,
              top: `calc(50% - ${rect.height / 2}px)`,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              zIndex: 1,
              pointerEvents: "none",
              opacity: entered ? 1 : 0,
              transition: `${canSlide ? "left 0.6s cubic-bezier(0.4,0,0.2,1), width 0.6s cubic-bezier(0.4,0,0.2,1), " : ""}opacity 0.2s ease`,
            }}
          />
        </>
      )}

      {/* Boutons au-dessus du pill */}
      <div className="relative z-10 flex items-center gap-1">
        {enhanced}
      </div>
    </div>
  );
}
