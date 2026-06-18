# Spec Technique — Favoris

| Champ   | Valeur              |
|---------|---------------------|
| Module  | favourites          |
| Version | 0.2.0               |
| Date    | 2026-06-18          |
| Auteur  | update-writer       |
| Statut  | En cours            |

---

## Stack utilisée

- **Langage :** TypeScript 5 (strict mode)
- **Framework :** Next.js 14 App Router — composants Client (`"use client"`)
- **Persistance :** `localStorage` navigateur — pas de BDD, pas de backend
- **State :** React `useState` / `useEffect` / `useCallback` — pas de store global

---

## Fichiers implémentés

| Fichier | Rôle |
|---------|------|
| `src/lib/music-types.ts` | Types `FavouriteItem` et `FavouriteKind` |
| `src/lib/favourite-utils.ts` | Utilitaire `buildFavouriteId()` |
| `src/hooks/useFavourites.ts` | Hook React `useFavourites()` |
| `src/components/HeartButton.tsx` | Client Component bouton toggle favori |
| `src/components/TrackList.tsx` | Modifié — passe le contexte album à `TrackRow` |
| `src/components/ArtistTopTracks.tsx` | Modifié — intègre `HeartButton` par ligne de top track |

---

## Types

### `FavouriteKind` (`src/lib/music-types.ts`)

```ts
export type FavouriteKind = "track" | "album" | "artist";
```

### `FavouriteItem` (`src/lib/music-types.ts`)

```ts
export interface FavouriteItem {
  id: string;          // ID stable construit par buildFavouriteId()
  kind: FavouriteKind;
  name: string;
  artist?: string;     // absent pour les favoris de type "artist"
  imageUrl?: string;
  href: string;        // URL de destination (page album ou artiste)
  addedAt: number;     // timestamp Unix ms (Date.now())
}
```

---

## Utilitaire `buildFavouriteId` (`src/lib/favourite-utils.ts`)

Construit un ID stable pour un favori, utilisé comme clé de déduplication dans le tableau localStorage.

**Signature :**
```ts
buildFavouriteId(kind: FavouriteItem["kind"], name: string, artist?: string): string
```

**Format de l'ID généré :**
- Avec artiste : `"<kind>:<artist>:<name>"` (ex : `"track:Daft Punk:Harder Better Faster Stronger"`)
- Sans artiste : `"<kind>:<name>"` (ex : `"artist:Daft Punk"`)

---

## Hook `useFavourites` (`src/hooks/useFavourites.ts`)

Hook React Client-side. Lit et écrit dans `localStorage` de manière réactive.

**Clé localStorage :** `"spotifind_favourites"`

**API exposée :**

| Propriété / Méthode | Type | Description |
|---------------------|------|-------------|
| `favourites` | `FavouriteItem[]` | Liste courante des favoris |
| `ready` | `boolean` | `false` pendant le premier rendu SSR (hydratation), `true` après `useEffect` |
| `isFavourite(id)` | `(id: string) => boolean` | Teste si un item est déjà favori par son `id` |
| `toggle(item)` | `(item: FavouriteItem) => void` | Ajoute si absent, retire si présent |
| `remove(id)` | `(id: string) => void` | Retire un favori par son `id` |

**Comportement :**
- Lecture initiale dans `useEffect` (jamais en SSR) — évite les erreurs hydratation Next.js.
- `ready` passe à `true` après la lecture initiale. `HeartButton` s'appuie sur ce flag pour éviter un flash d'état incorrect.
- Lecture et écriture enveloppées dans `try/catch` : si `localStorage` est indisponible (mode privé restrictif, quota dépassé), le hook se dégrade silencieusement sans erreur (`favourites` reste `[]`).

---

## Composant `HeartButton` (`src/components/HeartButton.tsx`)

Client Component. Affiche un bouton cœur SVG 15×15 toggleable.

**Props :** `Omit<FavouriteItem, "addedAt">` — tous les champs de `FavouriteItem` sauf `addedAt` (injecté automatiquement au moment du `toggle` via `Date.now()`).

**Comportement :**
- `e.preventDefault()` + `e.stopPropagation()` sur le click — permet d'intégrer le bouton dans un `<Link>` sans déclencher la navigation.
- Affichage conditionnel au flag `ready` — aucun état actif affiché avant hydratation (`ready === false`).
- Couleur active : `text-red-400` (cœur plein rouge). Couleur inactive : `text-muted` avec hover `text-foreground`.
- SVG inliné — pas de dépendance à une lib d'icônes.

---

## Intégrations dans les composants existants

### `TrackList` (`src/components/TrackList.tsx`)

Props ajoutées :

| Prop | Type | Description |
|------|------|-------------|
| `albumArtist` | `string` (optionnel) | Artiste de l'album — transmis au `FavouriteItem` de chaque track |
| `albumImageUrl` | `string` (optionnel) | URL de la pochette album |
| `albumHref` | `string` (optionnel) | URL de la page album (destination du `href` dans `FavouriteItem`) |

Quand `albumArtist` et `albumHref` sont fournis, chaque `TrackRow` reçoit un `favouriteItem` construit via `buildFavouriteId("track", track.name, albumArtist)`.

### `ArtistTopTracks` (`src/components/ArtistTopTracks.tsx`)

`HeartButton` ajouté à droite de la colonne auditeurs sur chaque ligne. Le `href` pointe vers la page album si `track.albumName` est défini, sinon vers la page artiste.

---

## Format de stockage localStorage

La clé `"spotifind_favourites"` contient un tableau JSON de `FavouriteItem[]` :

```json
[
  {
    "id": "track:Daft Punk:Harder Better Faster Stronger",
    "kind": "track",
    "name": "Harder Better Faster Stronger",
    "artist": "Daft Punk",
    "imageUrl": "https://...",
    "href": "/album/Daft%20Punk|||Discovery",
    "addedAt": 1750252800000
  }
]
```

---

## Tests prévus

Aucun test unitaire écrit pour cette session (hook + composants UI). À prévoir :

| Fichier de test | Cas à couvrir |
|----------------|---------------|
| `src/lib/favourite-utils.test.ts` | `buildFavouriteId` avec et sans `artist`, formats de sortie |
| `src/hooks/useFavourites.test.ts` | `toggle` (ajoute / retire), `remove`, `isFavourite`, comportement si `localStorage` indisponible |

---

## Points non implémentés (périmètre session)

- Page `/favourites` — affichage de la liste des favoris (squelette vide, à implémenter)
- Support type `"album"` et `"artist"` dans `HeartButton` (seul `"track"` est intégré pour l'instant)
