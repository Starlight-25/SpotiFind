"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFavourites } from "@/hooks/useFavourites";
import EmptyState from "@/components/EmptyState";
import type { FavouriteItem } from "@/lib/music-types";

interface LiveData {
  listeners?: string;
  playcount?: string;
  duration?: string;
  album?: string;
}

function formatDuration(ms: string): string {
  const seconds = Math.floor(Number(ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function FavouriteRow({
  item,
  live,
  onRemove,
}: {
  item: FavouriteItem;
  live?: LiveData;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 px-2 border-b border-border last:border-0 hover:bg-border hover:rounded transition-colors">
      <Link href={item.href} className="flex items-center gap-3 flex-1 min-w-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={40}
            height={40}
            className={`flex-shrink-0 object-cover ${item.kind === "artist" ? "rounded-full" : "rounded"}`}
          />
        ) : (
          <div className={`w-10 h-10 flex-shrink-0 bg-border flex items-center justify-center text-muted font-bold text-sm ${item.kind === "artist" ? "rounded-full" : "rounded"}`}>
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
            {item.kind === "track" && live?.album && (
              <p className="text-xs text-muted truncate flex-shrink-0 max-w-[140px] hidden sm:block">{live.album}</p>
            )}
          </div>
          {item.artist && <p className="text-xs text-muted truncate">{item.artist}</p>}
        </div>
      </Link>
      {live && (live.listeners || live.playcount || live.duration) && (
        <div className="flex items-center gap-2 flex-shrink-0 text-xs text-muted tabular-nums">
          {live.listeners && item.kind === "artist" && (
            <span className="hidden sm:inline">{Number(live.listeners).toLocaleString("fr-FR")} monthly listeners</span>
          )}
          {live.playcount && item.kind === "track" && (
            <span className="hidden sm:inline">{Number(live.playcount).toLocaleString("fr-FR")} plays</span>
          )}
          {live.duration && Number(live.duration) > 0 && (
            <span>{formatDuration(live.duration)}</span>
          )}
        </div>
      )}
      <button
        onClick={onRemove}
        aria-label="Retirer des favoris"
        className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}

export default function FavouritesPage() {
  const { favourites, remove, ready } = useFavourites();
  const [liveData, setLiveData] = useState<Record<string, LiveData>>({});

  useEffect(() => {
    if (!ready || favourites.length === 0) return;

    const fetchAll = async () => {
      const results = await Promise.all(
        favourites.map(async (item) => {
          try {
            if (item.kind === "artist") {
              const res = await fetch(`/api/artist-info?name=${encodeURIComponent(item.name)}`);
              const data = await res.json();
              return { id: item.id, live: { listeners: data.listeners ?? undefined } };
            } else if (item.kind === "track" && item.artist) {
              const qs = new URLSearchParams({ artist: item.artist, track: item.name });
              const res = await fetch(`/api/track-info?${qs}`);
              const data = await res.json();
              return {
                id: item.id,
                live: {
                  listeners: data.listeners ?? undefined,
                  playcount: data.playcount ?? undefined,
                  duration: data.duration ?? undefined,
                  album: data.album ?? undefined,
                },
              };
            }
          } catch {
            // silent
          }
          return null;
        })
      );

      const map: Record<string, LiveData> = {};
      for (const r of results) {
        if (r) map[r.id] = r.live;
      }
      setLiveData(map);
    };

    fetchAll();
  }, [ready, favourites]);

  const sorted = [...favourites].sort((a, b) => b.addedAt - a.addedAt);
  const artists = sorted.filter(f => f.kind === "artist");
  const tracks = sorted.filter(f => f.kind === "track");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-8 border-b-2 border-foreground flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-4">
          <Link href="/" className="text-muted hover:text-foreground transition-colors" aria-label="Retour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <h1 className="text-xl font-semibold text-foreground">My Favourites</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 w-full">
        {!ready ? null : favourites.length === 0 ? (
          <EmptyState
            title="Aucun favori pour le moment"
            subtitle="Clique sur le cœur à côté d'un titre ou d'un artiste pour l'ajouter ici."
          />
        ) : (
          <div className="flex flex-col gap-8">
            {artists.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
                  Artists
                </h2>
                {artists.map(item => (
                  <FavouriteRow key={item.id} item={item} live={liveData[item.id]} onRemove={() => remove(item.id)} />
                ))}
              </section>
            )}
            {artists.length > 0 && tracks.length > 0 && (
              <hr className="border-t-2 border-foreground" />
            )}
            {tracks.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
                  Tracks
                </h2>
                {tracks.map(item => (
                  <FavouriteRow key={item.id} item={item} live={liveData[item.id]} onRemove={() => remove(item.id)} />
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
