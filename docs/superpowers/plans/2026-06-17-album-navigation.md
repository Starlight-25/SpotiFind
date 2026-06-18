# Album Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make track and album cards in search results clickable, navigating to a dynamic album page that displays album name, cover image, and tracklist.

**Architecture:** URL slugs encode `artist|||name` as the dynamic `[id]` segment. A shared `album-service.ts` calls Last.fm `album.getInfo` (and `track.getInfo` first when the clicked result is a track) directly from the Server Component — no HTTP self-call. Three reusable components (`AlbumHero`, `TrackList`, `TrackRow`) compose the album page.

**Tech Stack:** Next.js 14 App Router (Server Components), TypeScript, Tailwind CSS, Last.fm REST API (`LASTFM_API_KEY`). `next.config.mjs` already allows `lastfm.freetls.fastly.net` — no image domain change needed.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/lib/music-types.ts` | Add `LastfmTrackDetail` and `AlbumDetail` types |
| Create | `src/lib/album-utils.ts` | Slug encode/decode helpers |
| Create | `src/lib/album-utils.test.ts` | Unit tests for slug helpers |
| Create | `src/lib/album-service.ts` | Last.fm album/track fetch logic (server-only) |
| Create | `src/components/AlbumHero.tsx` | Album cover + name + artist header |
| Create | `src/components/TrackRow.tsx` | Single track row (rank, title, duration) |
| Create | `src/components/TrackList.tsx` | Full track list using `TrackRow` |
| Modify | `src/app/album/[id]/page.tsx` | Album detail page (currently 1 empty line) |
| Modify | `src/components/SearchResults.tsx` | Wrap `AlbumCard` and `TrackCard` in `<Link>` |

---

## Git setup

Before starting, create the feature branch:

```bash
git checkout -b feat/album-page-navigation
```

---

### Task 1: Add types for album detail data

**Files:**
- Modify: `src/lib/music-types.ts`

- [ ] **Step 1: Append two new interfaces to `music-types.ts`**

Open `src/lib/music-types.ts`. At the end of the file, after the `SearchResults` interface, add:

```typescript
export interface LastfmTrackDetail {
  name: string;
  duration: string;
  "@attr"?: { rank: string };
}

export interface AlbumDetail {
  name: string;
  artist: string;
  image: LastfmImage[];
  tracks: LastfmTrackDetail[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/music-types.ts
git commit -m "feat(album-page): add LastfmTrackDetail and AlbumDetail types"
```

---

### Task 2: Create slug encode/decode utilities with tests

**Files:**
- Create: `src/lib/album-utils.ts`
- Create: `src/lib/album-utils.test.ts`

The separator `|||` (triple pipe) is chosen because it never appears in artist or album names and survives `encodeURIComponent`/`decodeURIComponent` round-trips.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/album-utils.test.ts`:

```typescript
import { encodeAlbumSlug, decodeAlbumSlug } from "@/lib/album-utils";

describe("encodeAlbumSlug / decodeAlbumSlug", () => {
  it("round-trips artist and name", () => {
    const slug = encodeAlbumSlug("Daft Punk", "Discovery");
    expect(decodeAlbumSlug(slug)).toEqual({ artist: "Daft Punk", name: "Discovery" });
  });

  it("handles special characters", () => {
    const slug = encodeAlbumSlug("AC/DC", "Back in Black");
    expect(decodeAlbumSlug(slug)).toEqual({ artist: "AC/DC", name: "Back in Black" });
  });

  it("produces a URL-safe string (no spaces, no pipes)", () => {
    const slug = encodeAlbumSlug("The Beatles", "Abbey Road");
    expect(slug).not.toContain(" ");
    expect(slug).not.toContain("|");
  });

  it("throws on slug without separator", () => {
    expect(() => decodeAlbumSlug("nodivider")).toThrow("Invalid album slug");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- album-utils --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/album-utils'`

- [ ] **Step 3: Implement `album-utils.ts`**

Create `src/lib/album-utils.ts`:

```typescript
const SEP = "|||";

export function encodeAlbumSlug(artist: string, name: string): string {
  return encodeURIComponent(artist + SEP + name);
}

export function decodeAlbumSlug(slug: string): { artist: string; name: string } {
  const decoded = decodeURIComponent(slug);
  const idx = decoded.indexOf(SEP);
  if (idx === -1) throw new Error(`Invalid album slug: ${slug}`);
  return { artist: decoded.slice(0, idx), name: decoded.slice(idx + SEP.length) };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- album-utils --no-coverage
```

Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/album-utils.ts src/lib/album-utils.test.ts
git commit -m "feat(album-page): add album slug encode/decode utilities with tests"
```

---

### Task 3: Create album service (Last.fm fetching)

**Files:**
- Create: `src/lib/album-service.ts`

This module is **server-only** (uses `process.env.LASTFM_API_KEY`). Never import it in a Client Component.

- [ ] **Step 1: Create `album-service.ts`**

Create `src/lib/album-service.ts`:

```typescript
import type { AlbumDetail, LastfmImage, LastfmTrackDetail } from "@/lib/music-types";

const BASE = "https://ws.audioscrobbler.com/2.0/";

async function lastfmGet(params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("Missing LASTFM_API_KEY");
  const qs = new URLSearchParams({ ...params, api_key: apiKey, format: "json" });
  const res = await fetch(`${BASE}?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Last.fm error ${res.status}`);
  return res.json();
}

function normalizeTracks(raw: unknown): LastfmTrackDetail[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export async function fetchAlbumByName(
  artist: string,
  album: string
): Promise<AlbumDetail | null> {
  try {
    const data = (await lastfmGet({ method: "album.getInfo", artist, album })) as {
      album?: {
        name: string;
        artist: string;
        image: LastfmImage[];
        tracks?: { track: unknown };
      };
    };
    const raw = data?.album;
    if (!raw) return null;
    return {
      name: raw.name,
      artist: raw.artist,
      image: raw.image ?? [],
      tracks: normalizeTracks(raw.tracks?.track),
    };
  } catch {
    return null;
  }
}

export async function fetchAlbumForTrack(
  artist: string,
  track: string
): Promise<AlbumDetail | null> {
  try {
    const data = (await lastfmGet({ method: "track.getInfo", artist, track })) as {
      track?: { album?: { title: string } };
    };
    const albumName = data?.track?.album?.title;
    if (!albumName) return null;
    return fetchAlbumByName(artist, albumName);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/album-service.ts
git commit -m "feat(album-page): add album-service for Last.fm fetching"
```

---

### Task 4: Create `AlbumHero` component

**Files:**
- Create: `src/components/AlbumHero.tsx`

- [ ] **Step 1: Create `AlbumHero.tsx`**

Create `src/components/AlbumHero.tsx`:

```typescript
import Image from "next/image";
import type { LastfmImage } from "@/lib/music-types";

function getBestImage(images: LastfmImage[]): string {
  return (
    images.find(i => i.size === "extralarge")?.["#text"] ||
    images.find(i => i.size === "large")?.["#text"] ||
    images.find(i => i["#text"])?.["#text"] ||
    ""
  );
}

interface AlbumHeroProps {
  name: string;
  artist: string;
  images: LastfmImage[];
}

export default function AlbumHero({ name, artist, images }: AlbumHeroProps) {
  const cover = getBestImage(images);
  return (
    <div className="flex items-end gap-6 mb-8">
      {cover ? (
        <Image
          src={cover}
          alt={name}
          width={200}
          height={200}
          className="rounded shadow-md flex-shrink-0 object-cover"
        />
      ) : (
        <div className="w-[200px] h-[200px] rounded bg-border flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Album</p>
        <h1 className="text-3xl font-bold text-foreground truncate">{name}</h1>
        <p className="text-lg text-muted mt-1 truncate">{artist}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AlbumHero.tsx
git commit -m "feat(album-page): add AlbumHero component"
```

---

### Task 5: Create `TrackRow` component

**Files:**
- Create: `src/components/TrackRow.tsx`

- [ ] **Step 1: Create `TrackRow.tsx`**

Create `src/components/TrackRow.tsx`:

```typescript
interface TrackRowProps {
  rank: number;
  name: string;
  duration?: string;
}

function formatDuration(seconds: string): string | null {
  const n = Number(seconds);
  if (!n) return null;
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

export default function TrackRow({ rank, name, duration }: TrackRowProps) {
  const time = duration ? formatDuration(duration) : null;
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <span className="w-6 text-right text-sm text-muted flex-shrink-0 tabular-nums">{rank}</span>
      <span className="flex-1 text-sm font-medium text-foreground truncate">{name}</span>
      {time && (
        <span className="text-xs text-muted flex-shrink-0 tabular-nums">{time}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TrackRow.tsx
git commit -m "feat(album-page): add TrackRow component"
```

---

### Task 6: Create `TrackList` component

**Files:**
- Create: `src/components/TrackList.tsx`

- [ ] **Step 1: Create `TrackList.tsx`**

Create `src/components/TrackList.tsx`:

```typescript
import type { LastfmTrackDetail } from "@/lib/music-types";
import TrackRow from "@/components/TrackRow";

interface TrackListProps {
  tracks: LastfmTrackDetail[];
}

export default function TrackList({ tracks }: TrackListProps) {
  if (tracks.length === 0) {
    return <p className="text-sm text-muted py-4">Aucune piste disponible.</p>;
  }
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        Tracklist
      </h2>
      {tracks.map((track, i) => (
        <TrackRow
          key={track.name + i}
          rank={Number(track["@attr"]?.rank ?? i + 1)}
          name={track.name}
          duration={track.duration}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TrackList.tsx
git commit -m "feat(album-page): add TrackList component"
```

---

### Task 7: Implement album detail page

**Files:**
- Modify: `src/app/album/[id]/page.tsx` (currently contains 1 empty line)

- [ ] **Step 1: Replace the entire content of the page**

Replace `src/app/album/[id]/page.tsx` with:

```typescript
import { fetchAlbumByName, fetchAlbumForTrack } from "@/lib/album-service";
import { decodeAlbumSlug } from "@/lib/album-utils";
import AlbumHero from "@/components/AlbumHero";
import TrackList from "@/components/TrackList";

interface PageProps {
  params: { id: string };
  searchParams: { isTrack?: string };
}

export default async function AlbumPage({ params, searchParams }: PageProps) {
  let artist: string, name: string;
  try {
    ({ artist, name } = decodeAlbumSlug(params.id));
  } catch {
    return <p className="p-8 text-muted">Lien invalide.</p>;
  }

  const album =
    searchParams.isTrack === "1"
      ? await fetchAlbumForTrack(artist, name)
      : await fetchAlbumByName(artist, name);

  if (!album) {
    return <p className="p-8 text-muted">Album introuvable.</p>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <AlbumHero name={album.name} artist={album.artist} images={album.image} />
      <TrackList tracks={album.tracks} />
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/album/[id]/page.tsx
git commit -m "feat(album-page): implement album detail page"
```

---

### Task 8: Add navigation links to `SearchResults.tsx`

**Files:**
- Modify: `src/components/SearchResults.tsx`

- [ ] **Step 1: Add imports after line 1**

The current line 1 is:
```typescript
import Image from "next/image";
```

Add two new imports after it:
```typescript
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
```

- [ ] **Step 2: Replace the `TrackCard` function**

Replace the entire `TrackCard` function (lines 9–29) with:

```typescript
function TrackCard({ track }: { track: LastfmTrack }) {
  const cover = getImage(track.image);
  return (
    <Link
      href={`/album/${encodeAlbumSlug(track.artist, track.name)}?isTrack=1`}
      className="flex items-center gap-3 py-2 rounded hover:bg-border transition-colors"
    >
      {cover ? (
        <Image src={cover} alt={track.name} width={40} height={40} className="rounded flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded bg-border flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
        <p className="text-xs text-muted truncate">{track.artist}</p>
      </div>
      {track.listeners && (
        <span className="ml-auto text-xs text-muted flex-shrink-0">
          {Number(track.listeners).toLocaleString()} listeners
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 3: Replace the `AlbumCard` function**

Replace the entire `AlbumCard` function (lines 52–67) with:

```typescript
function AlbumCard({ album }: { album: LastfmAlbum }) {
  const cover = getImage(album.image);
  return (
    <Link
      href={`/album/${encodeAlbumSlug(album.artist, album.name)}`}
      className="flex items-center gap-3 py-2 rounded hover:bg-border transition-colors"
    >
      {cover ? (
        <Image src={cover} alt={album.name} width={40} height={40} className="rounded flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded bg-border flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{album.name}</p>
        <p className="text-xs text-muted truncate">{album.artist}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run full test suite**

```bash
npm test -- --no-coverage
```

Expected: all existing tests pass + 4 new `album-utils` tests pass.

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

1. Open `http://localhost:3000`
2. Search for **"daft punk"**
3. Click an **album card** (e.g., "Discovery") → navigates to `/album/...`, shows album name, cover image, and tracklist
4. Go back → click a **track card** (e.g., "Get Lucky") → navigates to `/album/...?isTrack=1`, shows the album that track belongs to ("Random Access Memories")

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchResults.tsx
git commit -m "feat(album-page): add album navigation links to search result cards"
```

---

## Self-review

**Spec coverage:**
- ✅ Clicking an album card navigates to `/album/[id]` — Task 8
- ✅ Clicking a track card navigates to the album it belongs to — Tasks 3 + 8
- ✅ Album page shows album name — `AlbumHero`, Task 4
- ✅ Album page shows album image — `AlbumHero`, Task 4
- ✅ Album page shows tracklist — `TrackList` + `TrackRow`, Tasks 5 + 6
- ✅ Reusable components: `AlbumHero`, `TrackList`, `TrackRow` — Tasks 4, 5, 6

**Type consistency:**
- `AlbumDetail.image: LastfmImage[]` matches `AlbumHero` prop `images: LastfmImage[]` ✅
- `AlbumDetail.tracks: LastfmTrackDetail[]` matches `TrackList` prop `tracks: LastfmTrackDetail[]` ✅
- `TrackRow` receives `rank: number, name: string, duration?: string` — `TrackList` passes these from `LastfmTrackDetail` fields (`@attr.rank`, `name`, `duration`) ✅
- `encodeAlbumSlug` used in both `SearchResults.tsx` and produced by `album-utils.ts` with same signature ✅
- `decodeAlbumSlug` used in `AlbumPage`, defined in `album-utils.ts` ✅

**No placeholders:** All code blocks are complete and self-contained. ✅

**Git workflow:** Zelian rules require Conventional Commits + feature branch `feat/<module>-<description>` — followed throughout. ✅
