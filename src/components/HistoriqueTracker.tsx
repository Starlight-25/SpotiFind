"use client";

import { useEffect } from "react";
import { useHistorique } from "@/hooks/useHistorique";
import type { HistoriqueItem } from "@/lib/music-types";

interface Props {
  item: Omit<HistoriqueItem, "visitedAt">;
}

export default function HistoriqueTracker({ item }: Props) {
  const { add } = useHistorique();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { add(item); }, []);
  return null;
}
