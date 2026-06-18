"use client";

import { useState } from "react";
import { useFavourites } from "@/hooks/useFavourites";
import type { FavouriteItem } from "@/lib/music-types";

type HeartButtonProps = Omit<FavouriteItem, "addedAt">;

const PARTICLES = [
  { tx:  0,   ty: -24, w: 5, h: 5, color: "#f43f5e" },
  { tx:  17,  ty: -17, w: 4, h: 4, color: "#ec4899" },
  { tx:  24,  ty:   0, w: 5, h: 5, color: "#a855f7" },
  { tx:  17,  ty:  17, w: 3, h: 3, color: "#f43f5e" },
  { tx:  0,   ty:  24, w: 5, h: 5, color: "#ec4899" },
  { tx: -17,  ty:  17, w: 4, h: 4, color: "#f43f5e" },
  { tx: -24,  ty:   0, w: 3, h: 3, color: "#a855f7" },
  { tx: -17,  ty: -17, w: 5, h: 5, color: "#ec4899" },
];

export default function HeartButton(props: HeartButtonProps) {
  const { isFavourite, toggle, ready } = useFavourites();
  const active = ready && isFavourite(props.id);
  const [bursting, setBursting] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const willBeActive = !active;
    toggle({ ...props, addedAt: Date.now() });
    if (willBeActive) {
      setBursting(true);
      setTimeout(() => setBursting(false), 650);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`relative flex-shrink-0 transition-colors ${
        active ? "text-red-400" : "text-muted hover:text-foreground"
      }`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={bursting ? "heart-pop" : ""}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {bursting && PARTICLES.map((p, i) => (
        <span
          key={i}
          className="heart-particle"
          style={{
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            "--p-delay": `${i * 15}ms`,
            width: p.w,
            height: p.h,
            marginLeft: -p.w / 2,
            marginTop: -p.h / 2,
            background: p.color,
          } as React.CSSProperties}
        />
      ))}
    </button>
  );
}
