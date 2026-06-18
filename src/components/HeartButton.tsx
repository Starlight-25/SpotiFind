"use client";

import { useFavourites } from "@/hooks/useFavourites";
import type { FavouriteItem } from "@/lib/music-types";

type HeartButtonProps = Omit<FavouriteItem, "addedAt">;

export default function HeartButton(props: HeartButtonProps) {
  const { isFavourite, toggle, ready } = useFavourites();
  const active = ready && isFavourite(props.id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ ...props, addedAt: Date.now() });
      }}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`flex-shrink-0 transition-colors ${
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
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
