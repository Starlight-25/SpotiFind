"use client";

import Image from "next/image";
import Link from "next/link";
import { useHistorique } from "@/hooks/useHistorique";
import EmptyState from "@/components/EmptyState";
import ScrollAnimator from "@/components/ScrollAnimator";
import type { HistoriqueItem } from "@/lib/music-types";

function HistoriqueRow({ item }: { item: HistoriqueItem }) {
  return (
    <Link
      href={item.href}
      className="scroll-fade-in flex items-center gap-3 py-3 px-2 border-b border-border last:border-0 hover:bg-border hover:rounded transition-colors"
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.label}
          width={40}
          height={40}
          className={`flex-shrink-0 object-cover ${item.kind === "artist" ? "rounded-full" : "rounded"}`}
        />
      ) : (
        <div className={`w-10 h-10 flex-shrink-0 bg-border flex items-center justify-center text-muted text-sm ${item.kind === "artist" ? "rounded-full" : "rounded"}`}>
          {item.kind === "search" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          ) : (
            <span className="font-bold">{item.label.charAt(0).toUpperCase()}</span>
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
        <p className="text-xs text-muted">
          {item.kind === "search" ? "Recherche" : item.kind === "artist" ? "Artiste" : "Album"}
        </p>
      </div>
      <p className="text-xs text-muted flex-shrink-0">
        {new Date(item.visitedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </Link>
  );
}

export default function HistoriquePage() {
  const { historique, ready, clear } = useHistorique();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-8 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted hover:text-foreground transition-colors" aria-label="Retour">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-foreground pop-in">Historique</h1>
          </div>
          {historique.length > 0 && (
            <button
              onClick={clear}
              className="text-xs text-muted hover:text-red-400 transition-colors"
            >
              Vider l&apos;historique
            </button>
          )}
        </div>
      </header>
      <div className="h-0.5 bg-foreground search-expand audio-bar" />

      <ScrollAnimator deps={[historique, ready]} />
      <main className="max-w-4xl mx-auto px-4 py-8 w-full">
        {!ready ? null : historique.length === 0 ? (
          <EmptyState
            title="Aucun historique"
            subtitle="Recherche un artiste ou un album pour commencer."
          />
        ) : (
          historique.map(item => (
            <HistoriqueRow key={`${item.id}-${item.visitedAt}`} item={item} />
          ))
        )}
      </main>
    </div>
  );
}
