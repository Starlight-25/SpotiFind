"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
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
  } catch {}
}

interface FavouritesContextValue {
  favourites: FavouriteItem[];
  ready: boolean;
  isFavourite: (id: string) => boolean;
  toggle: (item: FavouriteItem) => void;
  remove: (id: string) => void;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavourites(readFromStorage());
    setReady(true);
  }, []);

  const isFavourite = useCallback((id: string) => favourites.some(f => f.id === id), [favourites]);

  const toggle = useCallback((item: FavouriteItem) => {
    setFavourites(prev => {
      const next = prev.some(f => f.id === item.id)
        ? prev.filter(f => f.id !== item.id)
        : [...prev, item];
      writeToStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setFavourites(prev => {
      const next = prev.filter(f => f.id !== id);
      writeToStorage(next);
      return next;
    });
  }, []);

  return (
    <FavouritesContext.Provider value={{ favourites, ready, isFavourite, toggle, remove }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavouritesContext(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavouritesContext must be used inside FavouritesProvider");
  return ctx;
}
