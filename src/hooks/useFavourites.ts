"use client";

import { useState, useEffect, useCallback } from "react";
import type { FavouriteItem } from "@/lib/music-types";

const STORAGE_KEY = "spotifind_favourites";

function readFromStorage(): FavouriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavouriteItem[];
  } catch {
    return [];
  }
}

function writeToStorage(items: FavouriteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable (private mode, storage full)
  }
}

export function useFavourites() {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavourites(readFromStorage());
    setReady(true);
  }, []);

  const isFavourite = useCallback(
    (id: string) => favourites.some((f) => f.id === id),
    [favourites]
  );

  const toggle = useCallback((item: FavouriteItem) => {
    setFavourites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      const next = exists ? prev.filter((f) => f.id !== item.id) : [...prev, item];
      writeToStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setFavourites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      writeToStorage(next);
      return next;
    });
  }, []);

  return { favourites, isFavourite, toggle, remove, ready };
}
