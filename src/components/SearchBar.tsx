"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search artists, albums, tracks…",
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    onSearch(value.trim());
  }

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full max-w-xl mx-auto block px-4 py-2 rounded border border-border bg-surface text-foreground placeholder:text-muted outline-none focus:border-foreground transition-colors text-sm"
    />
  );
}
