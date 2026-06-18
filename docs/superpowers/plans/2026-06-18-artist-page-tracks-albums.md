# Artist Page — Top Tracks & Albums Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher les 10 titres les plus écoutés et les albums par ordre chronologique décroissant sur la page artiste.

**Architecture:** Les top tracks viennent de Last.fm (`artist.getTopTracks`), les albums de Spotify (search artist → ID → `artists/{id}/albums` trié par `release_date` desc). Les deux fetches sont ajoutées à `artist-service.ts` côté serveur. Deux nouveaux composants (`ArtistTopTracks`, `ArtistAlbums`) sont intégrés dans `artist/[id]/page.tsx` via un `Promise.all`.

**Tech Stack:** Next.js 14 App Router (Server Components), Last.fm API, Spotify Web API (`fetchSpotify` de `src/lib/spotify.ts`), TypeScript, Tailwind CSS.

---

## Fichiers

| Fichier | Action |
|---------|--------|
| `src/lib/music-types.ts` | Ajout type `ArtistTopTrack` |
| `src/lib/artist-service.ts` | Ajout `fetchArtistTopTracks()` + `fetchArtistAlbums()` |
| `src/lib/artist-service.test.ts` | Tests unitaires des deux nouvelles fonctions |
| `src/components/ArtistTopTracks.tsx` | Nouveau composant — liste top 10 |
| `src/components/ArtistAlbums.tsx` | Nouveau composant — grille albums cliquables |
| `src/app/artist/[id]/page.tsx` | Fetch parallèle + rendu des deux sections |

---

### Task 1: Ajouter le type `ArtistTopTrack` et les services dans `artist-service.ts`

**Files:**
- Modify: `src/lib/music-types.ts`
- Modify: `src/lib/artist-service.ts`
- Create: `src/lib/artist-service.test.ts`

- [ ] **Step 1: Ajouter le type `ArtistTopTrack` dans `music-types.ts`**

Ouvrir `src/lib/music-types.ts` et ajouter à la fin :

```ts
export interface ArtistTopTrack {
  name: string;
  playcount: string;
}

export interface ArtistAlbum {
  name: string;
  release_date: string;
  imageUrl: string | null;
}
```

- [ ] **Step 2: Écrire les tests qui échouent**

Créer `src/lib/artist-service.test.ts` :

```ts
import { fetchArtistTopTracks, fetchArtistAlbums } from "./artist-service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => mockFetch.mockReset());

describe("fetchArtistTopTracks", () => {
  it("returns top 10 tracks from Last.fm", async () => {
    process.env.LASTFM_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        toptracks: {
          track: [
            { name: "Track A", playcount: "1000000" },
            { name: "Track B", playcount: "800000" },
          ],
        },
      }),
    });

    const tracks = await fetchArtistTopTracks("Radiohead");
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({ name: "Track A", playcount: "1000000" });
  });

  it("returns empty array when Last.fm errors", async () => {
    process.env.LASTFM_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const tracks = await fetchArtistTopTracks("Unknown");
    expect(tracks).toEqual([]);
  });
});

describe("fetchArtistAlbums", () => {
  it("returns albums sorted by release_date descending", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";

    // token fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "tok", expires_in: 3600 }),
    });
    // Spotify search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        artists: { items: [{ id: "artist123" }] },
      }),
    });
    // Spotify albums
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { name: "Album Old", release_date: "2010-01-01", images: [{ url: "http://img2" }] },
          { name: "Album New", release_date: "2023-06-15", images: [{ url: "http://img1" }] },
        ],
      }),
    });

    const albums = await fetchArtistAlbums("Radiohead");
    expect(albums[0].name).toBe("Album New");
    expect(albums[1].name).toBe("Album Old");
  });

  it("returns empty array when artist not found on Spotify", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "tok", expires_in: 3600 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ artists: { items: [] } }),
    });

    const albums = await fetchArtistAlbums("NonExistent");
    expect(albums).toEqual([]);
  });
});
```

- [ ] **Step 3: Lancer les tests pour vérifier qu'ils échouent**

```bash
cd "C:/Users/linje/EPITA/Zelian Internship/SpotiFind"
npm test -- artist-service --verbose
```

Expected : FAIL — `fetchArtistTopTracks is not a function` (ou équivalent).

- [ ] **Step 4: Implémenter `fetchArtistTopTracks` et `fetchArtistAlbums` dans `artist-service.ts`**

Remplacer le contenu complet de `src/lib/artist-service.ts` par :

```ts
import { fetchSpotify } from "@/lib/spotify";
import type { ArtistTopTrack, ArtistAlbum } from "@/lib/music-types";

export interface ArtistDetail {
  name: string;
  thumb: string | null;
}

export async function fetchArtistByName(name: string): Promise<ArtistDetail | null> {
  try {
    const key = process.env.THEAUDIODB_API_KEY ?? "123";
    const url = `https://www.theaudiodb.com/api/v1/json/${key}/search.php?s=${encodeURIComponent(name)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const artist = data.artists?.[0];
    if (!artist) return null;
    return {
      name: artist.strArtist as string,
      thumb: (artist.strArtistThumb as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchArtistTopTracks(name: string): Promise<ArtistTopTrack[]> {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) return [];
    const qs = new URLSearchParams({
      method: "artist.getTopTracks",
      artist: name,
      limit: "10",
      api_key: apiKey,
      format: "json",
    });
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${qs}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const tracks = data?.toptracks?.track;
    if (!Array.isArray(tracks)) return [];
    return tracks.map((t: { name: string; playcount: string }) => ({
      name: t.name,
      playcount: t.playcount,
    }));
  } catch {
    return [];
  }
}

export async function fetchArtistAlbums(name: string): Promise<ArtistAlbum[]> {
  try {
    // 1. Find Spotify artist ID
    const searchRes = await fetchSpotify(
      `/search?q=${encodeURIComponent(name)}&type=artist&limit=1`
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const artistId = searchData?.artists?.items?.[0]?.id as string | undefined;
    if (!artistId) return [];

    // 2. Fetch albums
    const albumsRes = await fetchSpotify(
      `/artists/${artistId}/albums?include_groups=album&limit=50`
    );
    if (!albumsRes.ok) return [];
    const albumsData = await albumsRes.json();
    const items = albumsData?.items as Array<{
      name: string;
      release_date: string;
      images: { url: string }[];
    }>;
    if (!Array.isArray(items)) return [];

    // 3. Sort descending by release_date
    return items
      .map(a => ({
        name: a.name,
        release_date: a.release_date,
        imageUrl: a.images?.[0]?.url ?? null,
      }))
      .sort((a, b) => b.release_date.localeCompare(a.release_date));
  } catch {
    return [];
  }
}
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

```bash
npm test -- artist-service --verbose
```

Expected : PASS — toutes les assertions vertes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/music-types.ts src/lib/artist-service.ts src/lib/artist-service.test.ts
git commit -m "feat(artist-page): add fetchArtistTopTracks and fetchArtistAlbums services"
```

---

### Task 2: Créer le composant `ArtistTopTracks`

**Files:**
- Create: `src/components/ArtistTopTracks.tsx`

- [ ] **Step 1: Créer `src/components/ArtistTopTracks.tsx`**

```tsx
import type { ArtistTopTrack } from "@/lib/music-types";

interface ArtistTopTracksProps {
  tracks: ArtistTopTrack[];
}

function formatPlaycount(count: string): string {
  const n = Number(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export default function ArtistTopTracks({ tracks }: ArtistTopTracksProps) {
  if (tracks.length === 0) return null;
  return (
    <section className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        Top titres
      </h2>
      {tracks.map((track, i) => (
        <div
          key={track.name + i}
          className="flex items-center gap-4 py-3 border-b border-border last:border-0"
        >
          <span className="w-6 text-right text-sm text-muted flex-shrink-0 tabular-nums">
            {i + 1}
          </span>
          <span className="flex-1 text-sm font-medium text-foreground truncate">{track.name}</span>
          <span className="text-xs text-muted flex-shrink-0 tabular-nums">
            {formatPlaycount(track.playcount)}
          </span>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ArtistTopTracks.tsx
git commit -m "feat(artist-page): add ArtistTopTracks component"
```

---

### Task 3: Créer le composant `ArtistAlbums`

**Files:**
- Create: `src/components/ArtistAlbums.tsx`

- [ ] **Step 1: Créer `src/components/ArtistAlbums.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
import type { ArtistAlbum } from "@/lib/music-types";

interface ArtistAlbumsProps {
  albums: ArtistAlbum[];
  artistName: string;
}

function releaseYear(date: string): string {
  return date.slice(0, 4);
}

export default function ArtistAlbums({ albums, artistName }: ArtistAlbumsProps) {
  if (albums.length === 0) return null;
  return (
    <section className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-border">
        Albums
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {albums.map((album, i) => (
          <Link
            key={album.name + i}
            href={`/album/${encodeAlbumSlug(artistName, album.name)}`}
            className="group flex flex-col gap-2"
          >
            {album.imageUrl ? (
              <Image
                src={album.imageUrl}
                alt={album.name}
                width={180}
                height={180}
                className="w-full aspect-square object-cover rounded shadow-sm group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-full aspect-square rounded bg-border flex items-center justify-center text-muted text-3xl font-bold uppercase">
                {album.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:underline">
                {album.name}
              </p>
              <p className="text-xs text-muted">{releaseYear(album.release_date)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ArtistAlbums.tsx
git commit -m "feat(artist-page): add ArtistAlbums component"
```

---

### Task 4: Mettre à jour `artist/[id]/page.tsx`

**Files:**
- Modify: `src/app/artist/[id]/page.tsx`

- [ ] **Step 1: Remplacer le contenu de `src/app/artist/[id]/page.tsx`**

```tsx
import Image from "next/image";
import { fetchArtistByName, fetchArtistTopTracks, fetchArtistAlbums } from "@/lib/artist-service";
import ArtistTopTracks from "@/components/ArtistTopTracks";
import ArtistAlbums from "@/components/ArtistAlbums";

interface PageProps {
  params: { id: string };
}

export default async function ArtistPage({ params }: PageProps) {
  const name = decodeURIComponent(params.id);

  const [artist, topTracks, albums] = await Promise.all([
    fetchArtistByName(name),
    fetchArtistTopTracks(name),
    fetchArtistAlbums(name),
  ]);

  if (!artist) {
    return <p className="p-8 text-muted">Artiste introuvable.</p>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center gap-8">
      {artist.thumb ? (
        <Image
          src={artist.thumb}
          alt={artist.name}
          width={240}
          height={240}
          className="rounded-full object-cover w-60 h-60"
        />
      ) : (
        <div className="w-60 h-60 rounded-full bg-border flex items-center justify-center text-muted text-6xl font-bold uppercase">
          {artist.name.charAt(0)}
        </div>
      )}
      <h1 className="text-3xl font-semibold text-foreground text-center">{artist.name}</h1>
      <ArtistTopTracks tracks={topTracks} />
      <ArtistAlbums albums={albums} artistName={artist.name} />
    </main>
  );
}
```

- [ ] **Step 2: Lancer le lint**

```bash
npm run lint
```

Expected : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/app/artist/[id]/page.tsx
git commit -m "feat(artist-page): display top tracks and albums"
```
