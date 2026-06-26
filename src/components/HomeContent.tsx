"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import HomeCharts from "@/components/HomeCharts";
import { GlassButton } from "@/components/ui/glass-button";
import GenreRow from "@/components/GenreRow";
import { useSearch } from "@/hooks/useSearch";
import { useFavourites } from "@/hooks/useFavourites";
import { useHistorique } from "@/hooks/useHistorique";
import { useHomeCharts } from "@/hooks/useHomeCharts";
import { createClient } from "@/lib/supabase";

const GENRES = ["Hip-Hop", "Electronic", "Jazz", "Classical", "R&B", "Metal"];

const SESSION_KEY = "spotifind_query";

export default function HomeContent() {
  const [query, setQuery] = useState("");
  const { results, loading, error } = useSearch(query.trim());
  const { favourites, ready, isAuthenticated } = useFavourites();
  const { historique } = useHistorique();
  const { data: chartsData, loading: chartsLoading, error: chartsError } = useHomeCharts();
  const count = ready ? favourites.length : 0;
  const router = useRouter();

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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-8 flex-shrink-0">
        <div className="grid grid-cols-3 items-center">
          {/* Colonne gauche — vide */}
          <div />

          {/* Logo centré */}
          <div className="flex items-center justify-center gap-3 header-enter">
            <Image src="/logo.png" alt="SpotiFind logo" width={40} height={40} />
            <h1 className="text-4xl font-semibold tracking-tight text-spotify">
              SpotiFind
            </h1>
          </div>

          {/* Colonne droite : [historique] [coeur] [auth] */}
          <div className="flex justify-end pr-4 gap-2">

            {/* Historique */}
            <GlassButton
              size="icon"
              wrapClassName="relative pop-in"
              onClick={() => router.push("/historique")}
              aria-label="Historique"
              title="Historique"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </GlassButton>

            {/* Favoris */}
            <GlassButton
              size="icon"
              wrapClassName="relative pop-in text-red-400"
              onClick={() => router.push(isAuthenticated ? "/favourites" : "/login?redirect=/favourites")}
              aria-label={`Mes favoris${count > 0 ? ` (${count})` : ""}`}
              title="Mes favoris"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={count > 0 ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none pointer-events-none z-10">
                  {count}
                </span>
              )}
            </GlassButton>

            {/* Connexion / Déconnexion */}
            {isAuthenticated ? (
              <GlassButton
                size="icon"
                wrapClassName="pop-in"
                onClick={handleLogout}
                aria-label="Déconnexion"
                title="Déconnexion"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </GlassButton>
            ) : (
              <GlassButton
                size="icon"
                wrapClassName="pop-in"
                onClick={() => router.push("/login")}
                aria-label="Connexion"
                title="Connexion"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </GlassButton>
            )}
          </div>
        </div>
      </header>
      <div className="h-0.5 bg-foreground search-expand audio-bar" />

      <main className="pt-10 pb-6 flex flex-col">
        <div className="relative z-50">
          <SearchBar value={query} onSearch={handleSearch} />
        </div>

        <div className="relative z-0">
          {!query && (
            <>
              <HomeCharts data={chartsData} loading={chartsLoading} error={chartsError} />
              {!chartsLoading && (
                <div className="flex flex-col gap-6 mt-6 pb-6">
                  {GENRES.map(genre => (
                    <GenreRow key={genre} genre={genre} />
                  ))}
                </div>
              )}
            </>
          )}

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
