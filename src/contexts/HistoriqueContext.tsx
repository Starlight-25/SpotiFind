"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { HistoriqueItem } from "@/lib/music-types";
import { addToHistorique } from "@/lib/historique-utils";

const STORAGE_KEY = "spotifind_historique";

function readFromStorage(): HistoriqueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoriqueItem[];
  } catch {
    return [];
  }
}

function writeToStorage(items: HistoriqueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

interface HistoriqueContextValue {
  historique: HistoriqueItem[];
  ready: boolean;
  add: (item: Omit<HistoriqueItem, "visitedAt">) => void;
  clear: () => void;
}

const HistoriqueContext = createContext<HistoriqueContextValue | null>(null);

export function HistoriqueProvider({ children }: { children: ReactNode }) {
  const [historique, setHistorique] = useState<HistoriqueItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHistorique(readFromStorage());
    setReady(true);
  }, []);

  const add = useCallback((item: Omit<HistoriqueItem, "visitedAt">) => {
    setHistorique(prev => {
      const next = addToHistorique(prev, item);
      writeToStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistorique([]);
    writeToStorage([]);
  }, []);

  return (
    <HistoriqueContext.Provider value={{ historique, ready, add, clear }}>
      {children}
    </HistoriqueContext.Provider>
  );
}

export function useHistoriqueContext(): HistoriqueContextValue {
  const ctx = useContext(HistoriqueContext);
  if (!ctx) throw new Error("useHistoriqueContext must be used inside HistoriqueProvider");
  return ctx;
}
