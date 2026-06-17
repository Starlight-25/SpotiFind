"use client";

import { useState, useEffect, useRef } from "react";
import type { SearchResults } from "@/lib/spotify-types";

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
        const path = `/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=5`;
        const res = await fetch(`/api/spotify?path=${encodeURIComponent(path)}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("Spotify search error:", res.status, body);
          throw new Error(`Search failed (${res.status})`);
        }

        const data = await res.json();
        setResults({
          tracks: data.tracks?.items ?? [],
          artists: data.artists?.items ?? [],
          albums: data.albums?.items ?? [],
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, debounceMs]);

  return { results, loading, error };
}
