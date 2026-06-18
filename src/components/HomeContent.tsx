"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import HomeCharts from "@/components/HomeCharts";
import { useSearch } from "@/hooks/useSearch";

const SESSION_KEY = "spotifind_query";

export default function HomeContent() {
  const [query, setQuery] = useState("");
  const { results, loading, error } = useSearch(query.trim());

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
      <header className="py-8 border-b-2 border-foreground text-center flex-shrink-0">
        <div className="flex items-center justify-center gap-3">
          <Image src="/logo.png" alt="SpotiFind logo" width={40} height={40} />
          <h1 className="text-4xl font-semibold tracking-tight text-spotify">
            SpotiFind
          </h1>
        </div>
      </header>

      <main className="pt-10 pb-6 flex flex-col">
        <SearchBar value={query} onSearch={handleSearch} />

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
      </main>
    </div>
  );
}
