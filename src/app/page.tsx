"use client";

import { useState } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import { useSearch } from "@/hooks/useSearch";

export default function Home() {
  const [query, setQuery] = useState("");
  const { results, loading, error } = useSearch(query);

  return (
    <div className="flex flex-col h-screen">
      <header className="py-8 border-b-2 border-foreground text-center flex-shrink-0">
        <div className="flex items-center justify-center gap-3">
          <Image src="/logo.png" alt="SpotiFind logo" width={40} height={40} />
          <h1 className="text-4xl font-semibold tracking-tight text-spotify">
            SpotiFind
          </h1>
        </div>
      </header>

      <main className="pt-10 flex-1 min-h-0 flex flex-col overflow-hidden">
        <SearchBar onSearch={setQuery} />

        {loading && (
          <p className="text-sm text-muted text-center mt-8">Searching…</p>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center mt-8">{error}</p>
        )}

        {results && !loading && (
          <SearchResults results={results} />
        )}
      </main>
    </div>
  );
}
