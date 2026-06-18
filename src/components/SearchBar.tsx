"use client";

import type { ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onSearch,
  placeholder = "Search artists, albums, tracks…",
}: SearchBarProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onSearch(e.target.value);
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 rounded-full border-2 border-foreground bg-surface text-foreground placeholder:text-muted outline-none focus:border-spotify transition-colors text-sm"
      />
    </div>
  );
}
