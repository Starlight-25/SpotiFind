"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import GenreChips, { type Genre } from "@/components/GenreChips";
import AlbumMosaic from "@/components/AlbumMosaic";
import type { ExploreAlbum } from "@/app/api/explore/route";

export default function ExplorePage() {
  const [genre, setGenre] = useState<Genre>("Pop");
  const [albums, setAlbums] = useState<ExploreAlbum[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlbums = useCallback(async (selectedGenre: Genre) => {
    setLoading(true);
    const page = Math.floor(Math.random() * 5) + 1;
    try {
      const res = await fetch(`/api/explore?genre=${encodeURIComponent(selectedGenre)}&page=${page}`);
      const data = await res.json();
      setAlbums(data.albums ?? []);
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums(genre);
  }, [genre, fetchAlbums]);

  function handleGenreChange(newGenre: Genre) {
    setGenre(newGenre);
  }

  function handleRefresh() {
    fetchAlbums(genre);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-8 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="text-muted hover:text-foreground transition-colors" aria-label="Retour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-foreground pop-in">Explore</h1>
          <div className="w-8" />
        </div>
      </header>
      <div className="h-0.5 bg-foreground search-expand audio-bar" />

      <main className="max-w-2xl mx-auto px-4 py-8 w-full flex flex-col gap-6">
        <GenreChips active={genre} onChange={handleGenreChange} />

        <AlbumMosaic albums={albums} loading={loading} />

        <div className="flex justify-center">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-6 py-2 rounded-full bg-border text-foreground text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50"
          >
            Rafraîchir la grille
          </button>
        </div>

        <p className="text-center text-xs text-muted">
          Clic simple → favori &nbsp;·&nbsp; Double-clic → lecture simulée
        </p>
      </main>
    </div>
  );
}
