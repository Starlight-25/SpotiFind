"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import HomeCharts from "@/components/HomeCharts";
import { useSearch } from "@/hooks/useSearch";
import { useFavourites } from "@/hooks/useFavourites";
import { useHistorique } from "@/hooks/useHistorique";

const SESSION_KEY = "spotifind_query";

export default function HomeContent() {
  const [query, setQuery] = useState("");
  const { results, loading, error } = useSearch(query.trim());
  const { favourites, ready, isAuthenticated } = useFavourites();
  const { historique } = useHistorique();
  const count = ready ? favourites.length : 0;

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY) ?? "";
    if (saved) setQuery(saved);
  }, []);

  function handleSearch(value: string) {
    const trimmed = value.trim();
    setQuery(value);
    if (trimmed) sessionStorage.setItem(SESSION_KEY, trimmed);
    else sessionStorage.removeItem(SESSION_KEY);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-8 flex-shrink-0">
        <div className="grid grid-cols-3 items-center">
          <div className="flex justify-start pl-4">
            <Link
              href="/historique"
              aria-label={`Historique${historique.length > 0 ? ` (${historique.length})` : ""}`}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-border transition-colors pop-in"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {historique.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-muted text-background text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {historique.length}
                </span>
              )}
            </Link>
            <Link
              href="/explore"
              aria-label="Explorer par genre"
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-border transition-colors pop-in"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-3 header-enter">
            <Image src="/logo.png" alt="SpotiFind logo" width={40} height={40} />
            <h1 className="text-4xl font-semibold tracking-tight text-spotify">
              SpotiFind
            </h1>
          </div>
          <div className="flex justify-end pr-4">
            <Link
              href={isAuthenticated ? "/favourites" : "/login?redirect=/favourites"}
              aria-label={`Mes favoris${count > 0 ? ` (${count})` : ""}`}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-border transition-colors pop-in"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={count > 0 ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-400"
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <div className="h-0.5 bg-foreground search-expand audio-bar" />

      <main className="pt-10 pb-6 flex flex-col">
        <div className="relative z-50">
          <SearchBar value={query} onSearch={handleSearch} />
        </div>

        <div className="relative z-0">
          {!query && <HomeCharts />}

          {query && loading && (
            <p className="text-sm text-muted text-center mt-8">Recherche…</p>
          )}

          {query && error && (
            <p className="text-sm text-red-500 text-center mt-8">{error}</p>
          )}

          {query && results && !loading && (
            <SearchResults results={results} />
          )}
        </div>
      </main>
    </div>
  );
}
