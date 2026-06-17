"use client";

import { useState, useEffect, useRef } from "react";
import type { SearchResults } from "@/lib/music-types";

export function useSearch(query: string, debounceMs = 400) {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query) {
      abortRef.current?.abort();
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Search failed (${res.status})`);

        const data = await res.json();
        setResults({
          tracks: data.tracks ?? [],
          artists: data.artists ?? [],
          albums: data.albums ?? [],
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, debounceMs]);

  return { results, loading, error };
}
