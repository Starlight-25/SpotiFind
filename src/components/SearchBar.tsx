"use client";

import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { SearchResults } from "@/lib/music-types";

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onSearch(e.target.value);
    setActiveIndex(-1);
  }

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data: SearchResults = await res.json();

        const names = [
          ...data.artists.slice(0, 3).map(a => a.name),
          ...data.tracks.slice(0, 3).map(t => t.name),
          ...data.albums.slice(0, 2).map(al => al.name),
        ]
          .filter((n, i, arr) => arr.findIndex(x => x.toLowerCase() === n.toLowerCase()) === i)
          .slice(0, 6);

        setSuggestions(names);
        setOpen(names.length > 0);
      } catch {
        // AbortError — silencieux
      }
    }, 200);

    return () => clearTimeout(timerRef.current);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      onSearch(suggestions[activeIndex]);
      setOpen(false);
    }
  }

  function highlight(name: string) {
    const idx = name.toLowerCase().indexOf(value.toLowerCase());
    if (idx === -1 || !value) return <span>{name}</span>;
    return (
      <>
        <span className="font-semibold">{name.slice(0, idx)}</span>
        <span className="text-muted">{name.slice(idx, idx + value.length)}</span>
        <span className="font-semibold">{name.slice(idx + value.length)}</span>
      </>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl mx-auto search-expand">
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
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full pl-9 pr-4 py-2 rounded-full border-2 border-foreground bg-surface text-foreground placeholder:text-muted outline-none focus:border-spotify transition-colors text-sm"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-[9999]">
          {suggestions.map((name, i) => (
            <button
              key={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onSearch(name); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-border ${i === activeIndex ? "bg-border" : ""}`}
            >
              <svg className="text-muted flex-shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="text-foreground">{highlight(name)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
