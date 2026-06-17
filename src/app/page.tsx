"use client";

import SearchBar from "@/components/SearchBar";

export default function Home() {
  function handleSearch(query: string) {
    console.log("search:", query);
  }

  return (
    <div>
      <header className="py-8 border-b border-border text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-spotify">
          SpotiFind
        </h1>
      </header>

      <main className="py-10">
        <SearchBar onSearch={handleSearch} />
      </main>
    </div>
  );
}
