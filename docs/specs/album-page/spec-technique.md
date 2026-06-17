# Spec Technique — Page Album

| Champ   | Valeur           |
|---------|------------------|
| Module  | album-page       |
| Version | 0.2.0            |
| Date    | 2026-06-17       |
| Auteur  | update-writer    |

---

## Stack utilisée

- **Runtime :** Next.js 14.2.35 (App Router) — TypeScript 5 strict
- **Tests :** Jest 30 + ts-jest, alias `@/*` → `src/*`
- **Source de données album :** Last.fm API (`album.getInfo`, `track.getInfo`)
- **Source de données (rétro-ingénierie) :** Spotify Web API (voir spec-fonctionnel v0.1.0 DRAFT)

> Note : l'implémentation effective de cette session utilise Last.fm comme source principale de données album, et non Spotify. La spec fonctionnelle (DRAFT) décrivait Spotify — à mettre à jour lors de la validation humaine.

---

## Fichiers de la couche lib (implémentés cette session)

### `src/lib/music-types.ts` — Nouveaux types ajoutés

```ts
export interface LastfmTrackDetail {
  name: string;
  duration: string;           // durée en secondes (string Last.fm)
  "@attr"?: { rank: string }; // optionnel — position dans la tracklist
}

export interface AlbumDetail {
  name: string;
  artist: string;
  image: LastfmImage[];       // réutilise le type existant (small/medium/large/extralarge)
  tracks: LastfmTrackDetail[];
}
```

### `src/lib/album-utils.ts` — Utilitaires de slug URL

Encode et décode un couple `(artist, name)` en un slug URL-safe pour la navigation vers `/album/[slug]`.

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `encodeAlbumSlug` | `(artist: string, name: string) => string` | Concatène `artist + "|||" + name` puis applique `encodeURIComponent` sur le tout |
| `decodeAlbumSlug` | `(slug: string) => { artist: string; name: string }` | Recherche `|||` via `indexOf` dans le slug (Next.js URL-décode le segment `[id]` automatiquement avant de le passer à `params.id`) ; lève `Error("Invalid album slug: …")` si séparateur absent |

**Séparateur interne :** `|||` (triple pipe). Choix qui garantit l'absence de collision avec les caractères courants dans les noms d'artistes et d'albums, tout en restant encodable en URL.

**Note sur le décodage URL :** `encodeAlbumSlug` encode l'intégralité de la chaîne (y compris `|||` → `%7C%7C%7C`). Next.js App Router décode automatiquement le segment dynamique `[id]` avant de le passer dans `params.id`, ce qui explique pourquoi `decodeAlbumSlug` n'appelle pas `decodeURIComponent` — le segment arrive déjà décodé avec `|||` lisible.

### `src/lib/album-service.ts` — Service Last.fm album

Appels serveur uniquement (variable d'env `LASTFM_API_KEY`, `cache: "no-store"`).

| Fonction exportée | Signature | Description |
|-------------------|-----------|-------------|
| `fetchAlbumByName` | `(artist: string, album: string) => Promise<AlbumDetail \| null>` | Appelle `album.getInfo` sur Last.fm ; normalise la tracklist (gestion cas 1 track = objet vs array) ; retourne `null` sur erreur |
| `fetchAlbumForTrack` | `(artist: string, track: string) => Promise<AlbumDetail \| null>` | Résout le nom d'album via `track.getInfo` puis chaîne vers `fetchAlbumByName` ; retourne `null` si le track n'a pas d'album |

**Helper interne :** `normalizeTracks(raw: unknown): LastfmTrackDetail[]` — Last.fm renvoie un objet unique (et non un tableau) quand l'album ne contient qu'un seul track ; ce helper normalise dans les deux cas.

---

## Couche UI (composants + page)

### `src/app/album/[id]/page.tsx` — Page dynamique album

Server Component async (`export default async function AlbumPage`). Rendu côté serveur — aucun `"use client"`.

**Props :**
- `params.id` — slug URL-encodé décodé via `decodeAlbumSlug`
- `searchParams.isTrack` — si `"1"`, la page interprète `(artist, name)` comme une piste et résout l'album via `fetchAlbumForTrack` ; sinon utilise `fetchAlbumByName`

**Flux de rendu :**
1. `decodeAlbumSlug(params.id)` → `{ artist, name }` — erreur → affiche `"Lien invalide."`
2. Branchement sur `searchParams.isTrack === "1"` → choisit `fetchAlbumForTrack` ou `fetchAlbumByName`
3. Résultat `null` → affiche `"Album introuvable."`
4. Résultat valide → `<AlbumHero>` + `<TrackList>`

**Layout :** `<main className="max-w-2xl mx-auto px-4 py-8">`

---

### `src/components/AlbumHero.tsx`

Header visuel de la page album.

**Props :**

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Nom de l'album |
| `artist` | `string` | Nom de l'artiste |
| `images` | `LastfmImage[]` | Tableau des images Last.fm |

**Helper interne :** `getBestImage(images)` — choisit l'image `extralarge` en priorité, puis `large`, puis la première non-vide ; retourne `""` si aucune image.

**Rendu :** flex row — pochette 200×200 (`next/image`, `rounded shadow-md`) à gauche ; label « Album », titre `<h1>` et artiste `<p>` à droite. Si aucune image : placeholder `div` 200×200 avec `bg-border`.

---

### `src/components/TrackRow.tsx`

Ligne individuelle de piste dans la tracklist.

**Props :**

| Prop | Type | Description |
|------|------|-------------|
| `rank` | `number` | Numéro de position dans l'album |
| `name` | `string` | Titre de la piste |
| `duration` | `string?` | Durée en secondes (chaîne Last.fm) — optionnel |

**Helper interne :** `formatDuration(seconds: string): string | null` — convertit les secondes en `M:SS` ; retourne `null` si la valeur n'est pas un nombre valide (ex : `"0"` → `null`).

**Rendu :** flex row — rang (6 chars, `tabular-nums`), titre (flex-1, `truncate`), durée (si non nulle, `tabular-nums`). Séparateur `border-b border-border`, supprimé sur le dernier enfant (`last:border-0`).

---

### `src/components/TrackList.tsx`

Conteneur de la tracklist. Reçoit `tracks: LastfmTrackDetail[]`. Si vide → message `"Aucune piste disponible."`. Sinon : titre de section `"Tracklist"` + liste de `<TrackRow>`. Utilise `track["@attr"]?.rank` en priorité ; fallback sur l'index `i + 1`.

---

### `src/components/SearchResults.tsx` — Mise à jour

`TrackCard` et `AlbumCard` sont maintenant des composants `<Link>` cliquables :

| Composant | URL générée |
|-----------|-------------|
| `TrackCard` | `/album/${encodeAlbumSlug(track.artist, track.name)}?isTrack=1` |
| `AlbumCard` | `/album/${encodeAlbumSlug(album.artist, album.name)}` |

`ArtistCard` reste non-cliquable (pas de page artiste implémentée dans cette session).

---

## API / Endpoints

Aucun endpoint API nouvellement créé dans cette session. Les fonctions du service sont appelées depuis les Server Components ou les Route Handlers.

---

## Schéma BDD

Sans objet — pas de base de données sur ce projet.

---

## Tests écrits

Fichier : `src/lib/album-utils.test.ts`

| Test | Description |
|------|-------------|
| round-trips artist and name | Encode puis décode un slug, vérifie l'égalité |
| handles special characters | Artiste avec `/` (ex : AC/DC) |
| produces a URL-safe string | Pas d'espaces ni de pipes dans le slug encodé |
| throws on slug without separator | `decodeAlbumSlug("nodivider")` lève `"Invalid album slug"` |

Commande : `npm run test`

---

## Patterns identifiés

- `album-service.ts` expose des fonctions serveur pures (pas de classe) — cohérent avec le pattern utilisé dans `src/lib/spotify.ts`.
- Le service normalise silencieusement les anomalies Last.fm (tracklist mono-piste), conformément à la règle « erreurs remontées en null » adoptée sur le proxy Last.fm.
- `album-utils.ts` est isomorphe (côté client et serveur) — aucune dépendance Node.js ni environnement, utilisable dans les composants Next.js sans contrainte.
- La page album est un **Server Component async** — pas de `useState`, pas de `useEffect`, pas de skeleton loader côté client. Les erreurs de slug ou d'album introuvable sont gérées par des retours `<p>` inline (pas de `notFound()` Next.js dans cette version).
- La résolution « piste → album » (`isTrack=1`) est entièrement côté serveur : deux appels Last.fm séquentiels (`track.getInfo` puis `album.getInfo`) sans état partagé avec le client.
