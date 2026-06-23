import type { HistoriqueItem, HistoriqueKind } from "./music-types";

const MAX = 20;

export function buildHistoriqueId(kind: HistoriqueKind, label: string): string {
  return `${kind}:${label}`;
}

export function addToHistorique(
  items: HistoriqueItem[],
  newItem: Omit<HistoriqueItem, "visitedAt">,
  now: number = Date.now()
): HistoriqueItem[] {
  const filtered = items.filter(i => i.id !== newItem.id);
  const next = [{ ...newItem, visitedAt: now }, ...filtered];
  return next.slice(0, MAX);
}
