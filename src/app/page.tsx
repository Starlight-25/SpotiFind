"use client";

import Image from "next/image";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  function handleSearch(query: string) {
    console.log("search:", query);
  }

  return (
    <div>
      <header className="py-8 border-b-2 border-foreground text-center">
        <div className="flex items-center justify-center gap-3">
          <Image src="/logo.png" alt="SpotiFind logo" width={40} height={40} />
          <h1 className="text-4xl font-semibold tracking-tight text-spotify">
            SpotiFind
          </h1>
        </div>
      </header>

      <main className="py-10">
        <SearchBar onSearch={handleSearch} />
      </main>
    </div>
  );
}
