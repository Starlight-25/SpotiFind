"use client";

import { useState, useEffect } from "react";

export interface HomeArtist {
  name: string;
  listeners?: string;
  mbid?: string;
  thumb?: string;
}

export interface HomeAlbum {
  name: string;
  artist: string;
  image: string;
}

interface HomeCharts {
  artists: HomeArtist[];
  albums: HomeAlbum[];
  albumsRock: HomeAlbum[];
}

export function useHomeCharts() {
  const [data, setData] = useState<HomeCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
