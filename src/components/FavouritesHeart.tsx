"use client";

import React, { useEffect, useState } from "react";

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

export default function FavouritesHeart() {
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setBurst(true), 100);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-6 h-6">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-red-400 ${burst ? "heart-pop" : "opacity-0"}`}
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {burst && PARTICLES.map((p, i) => (
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
    </div>
  );
}
