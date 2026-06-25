# Explore par genre — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une page `/explore` avec sélecteur de genre (8 chips) et grille 3×3 de pochettes d'albums avec favoris au clic simple et simulation de lecture au double-clic.

**Architecture:** Route Handler `GET /api/explore?genre=rock&page=N` proxy vers Last.fm `tag.getTopAlbums`. Page Client Component `/explore` avec 3 composants : `GenreChips` (sélecteur), `AlbumMosaic` (grille), `MosaicCard` (carte individuelle). Bouton boussole dans `HomeContent`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Last.fm API, FavouritesContext existant

---

### Task 1 : Route API `GET /api/explore`

**Files:**
- Create: `src/app/api/explore/route.ts`

- [ ] **Step 1 : Créer le dossier et le fichier route**

Créer `src/app/api/explore/route.ts` :

```ts
import { NextRequest, NextResponse } from "next/server";

const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";

function getLastfmKey() {
  const key = process.env.LASTFM_API_KEY;
  if (!key) throw new Error("Missing LASTFM_API_KEY");
  return key;
}

export interface ExploreAlbum {
  name: string;
  artist: string;
  imageUrl: string;
}

export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre");
  const page = req.nextUrl.searchParams.get("page") ?? "1";

  if (!genre) {
    return NextResponse.json({ error: "Missing `genre` parameter." }, { status: 400 });
  }

  try {
    const url = `${LASTFM_BASE}?method=tag.getTopAlbums&tag=${encodeURIComponent(genre)}&api_key=${getLastfmKey()}&format=json&limit=9&page=${page}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Last.fm error ${res.status}`);

    const data = await res.json();
    const raw: Array<{ name: string; artist: { name: string }; image: Array<{ "#text": string; size: string }> }> =
      data.albums?.album ?? [];

    const albums: ExploreAlbum[] = raw.map(a => ({
      name: a.name,
      artist: a.artist.name,
      imageUrl:
        a.image.find(i => i.size === "extralarge")?.["#text"] ||
        a.image.find(i => i.size === "large")?.["#text"] ||
        "",
    }));

    return NextResponse.json({ albums });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2 : Tester la route manuellement**

Avec le serveur dev lancé (`npm run dev`), ouvrir dans le navigateur :
`http://localhost:3000/api/explore?genre=rock&page=1`

Résultat attendu : JSON avec `{ "albums": [ { "name": "...", "artist": "...", "imageUrl": "..." }, ... ] }` (9 entrées)

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/explore/route.ts
git commit -m "feat(explore): route API tag.getTopAlbums Last.fm"
```

---

### Task 2 : Composant `GenreChips`

**Files:**
- Create: `src/components/GenreChips.tsx`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/GenreChips.tsx` :

```tsx
"use client";

const GENRES = ["Pop", "Rock", "Hip-Hop", "Electronic", "Jazz", "Classical", "R&B", "Metal"] as const;
export type Genre = (typeof GENRES)[number];

interface Props {
  active: Genre;
  onChange: (genre: Genre) => void;
}

export default function GenreChips({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {GENRES.map(genre => (
        <button
          key={genre}
          onClick={() => onChange(genre)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === genre
              ? "bg-spotify text-black"
              : "bg-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/GenreChips.tsx
git commit -m "feat(explore): composant GenreChips"
```

---

### Task 3 : Composant `MosaicCard`

**Files:**
- Create: `src/components/MosaicCard.tsx`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/MosaicCard.tsx` :

```tsx
"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useFavourites } from "@/hooks/useFavourites";
import { buildFavouriteId } from "@/lib/favourite-utils";
import { encodeAlbumSlug } from "@/lib/album-utils";
import type { ExploreAlbum } from "@/app/api/explore/route";

interface Props {
  album: ExploreAlbum;
}

export default function MosaicCard({ album }: Props) {
  const { isFavourite, toggle } = useFavourites();
  const [pulsing, setPulsing] = useState(false);
  const lastClickRef = useRef<number>(0);

  const favId = buildFavouriteId("album", album.name, album.artist);
  const isFav = isFavourite(favId);
  const href = `/album/${encodeAlbumSlug(album.artist, album.name)}`;

  function handleClick() {
    const now = Date.now();
    const delta = now - lastClickRef.current;
    lastClickRef.current = now;

    if (delta < 300) {
      // Double-clic : simulation lecture
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1000);
    } else {
      // Simple clic : toggle favori
      toggle({
        id: favId,
        kind: "album",
        name: album.name,
        artist: album.artist,
        imageUrl: album.imageUrl || undefined,
        href,
        addedAt: Date.now(),
      });
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`relative aspect-square cursor-pointer group rounded-lg overflow-hidden select-none ${
        pulsing ? "animate-pulse ring-2 ring-spotify" : ""
      } ${isFav ? "ring-2 ring-spotify" : ""}`}
    >
      {album.imageUrl ? (
        <Image
          src={album.imageUrl}
          alt={album.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 33vw, 200px"
        />
      ) : (
        <div className="w-full h-full bg-border flex items-center justify-center text-muted text-2xl font-bold">
          {album.name.charAt(0)}
        </div>
      )}

      {/* Overlay au hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <p className="text-white text-xs font-semibold truncate">{album.name}</p>
        <p className="text-white/70 text-xs truncate">{album.artist}</p>
      </div>

      {/* Badge favori */}
      {isFav && (
        <div className="absolute top-1.5 right-1.5 text-base leading-none">💚</div>
      )}

      {/* Badge lecture simulée */}
      {pulsing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/70 rounded-full p-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/MosaicCard.tsx
git commit -m "feat(explore): composant MosaicCard (favori + simulation lecture)"
```

---

### Task 4 : Composant `AlbumMosaic`

**Files:**
- Create: `src/components/AlbumMosaic.tsx`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/AlbumMosaic.tsx` :

```tsx
"use client";

import MosaicCard from "@/components/MosaicCard";
import type { ExploreAlbum } from "@/app/api/explore/route";

interface Props {
  albums: ExploreAlbum[];
  loading: boolean;
}

export default function AlbumMosaic({ albums, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-12">Aucun album trouvé pour ce genre.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {albums.map((album, i) => (
        <MosaicCard key={`${album.artist}-${album.name}-${i}`} album={album} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/AlbumMosaic.tsx
git commit -m "feat(explore): composant AlbumMosaic (grille 3x3 + skeleton)"
```

---

### Task 5 : Page `/explore`

**Files:**
- Create: `src/app/explore/page.tsx`

- [ ] **Step 1 : Créer le dossier et la page**

Créer `src/app/explore/page.tsx` :

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import GenreChips, { type Genre } from "@/components/GenreChips";
import AlbumMosaic from "@/components/AlbumMosaic";
import type { ExploreAlbum } from "@/app/api/explore/route";

export default function ExplorePage() {
  const [genre, setGenre] = useState<Genre>("Pop");
  const [albums, setAlbums] = useState<ExploreAlbum[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlbums = useCallback(async (selectedGenre: Genre) => {
    setLoading(true);
    const page = Math.floor(Math.random() * 5) + 1;
    try {
      const res = await fetch(`/api/explore?genre=${encodeURIComponent(selectedGenre)}&page=${page}`);
      const data = await res.json();
      setAlbums(data.albums ?? []);
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums(genre);
  }, [genre, fetchAlbums]);

  function handleGenreChange(newGenre: Genre) {
    setGenre(newGenre);
  }

  function handleRefresh() {
    fetchAlbums(genre);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-8 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="text-muted hover:text-foreground transition-colors" aria-label="Retour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-foreground pop-in">Explore</h1>
          <div className="w-8" />
        </div>
      </header>
      <div className="h-0.5 bg-foreground search-expand audio-bar" />

      <main className="max-w-2xl mx-auto px-4 py-8 w-full flex flex-col gap-6">
        <GenreChips active={genre} onChange={handleGenreChange} />

        <AlbumMosaic albums={albums} loading={loading} />

        <div className="flex justify-center">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-6 py-2 rounded-full bg-border text-foreground text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50"
          >
            Rafraîchir la grille
          </button>
        </div>

        <p className="text-center text-xs text-muted">
          Clic simple → favori &nbsp;·&nbsp; Double-clic → lecture simulée
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier que la page s'affiche**

Naviguer vers `http://localhost:3000/explore`. La grille de 9 pochettes Pop doit s'afficher. Changer de genre → la grille se recharge.

- [ ] **Step 3 : Commit**

```bash
git add src/app/explore/page.tsx
git commit -m "feat(explore): page /explore avec genre + grille + rafraîchir"
```

---

### Task 6 : Bouton boussole dans `HomeContent`

**Files:**
- Modify: `src/components/HomeContent.tsx`

- [ ] **Step 1 : Ajouter le bouton entre l'icône historique et le logo**

Dans `src/components/HomeContent.tsx`, la section header ressemble à :

```tsx
<div className="grid grid-cols-3 items-center">
  <div className="flex justify-start pl-4">
    {/* bouton historique existant */}
  </div>
  <div className="flex items-center justify-center gap-3 header-enter">
    {/* logo + titre */}
  </div>
  <div className="flex justify-end pr-4">
    {/* bouton favoris */}
  </div>
</div>
```

Modifier la colonne gauche pour ajouter le bouton Explore à côté du bouton historique :

```tsx
<div className="flex justify-start pl-4 gap-1">
  <Link
    href="/historique"
    aria-label={`Historique${historique.length > 0 ? ` (${historique.length})` : ""}`}
    className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-border transition-colors pop-in"
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
    {historique.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-muted text-background text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
        {historique.length}
      </span>
    )}
  </Link>
  <Link
    href="/explore"
    aria-label="Explorer par genre"
    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-border transition-colors pop-in"
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  </Link>
</div>
```

- [ ] **Step 2 : Vérifier dans le navigateur**

Sur `http://localhost:3000`, deux icônes doivent apparaître en haut à gauche : l'horloge (historique) et la boussole (explore). La boussole mène vers `/explore`.

- [ ] **Step 3 : Commit**

```bash
git add src/components/HomeContent.tsx
git commit -m "feat(explore): bouton boussole dans le header"
```
