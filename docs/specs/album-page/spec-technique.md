# Spec Technique — Page Album

| Champ   | Valeur           |
|---------|------------------|
| Module  | album-page       |
| Version | 0.1.0            |
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
| `encodeAlbumSlug` | `(artist: string, name: string) => string` | Concatène avec le séparateur `\|\|\|`, puis `encodeURIComponent` |
| `decodeAlbumSlug` | `(slug: string) => { artist: string; name: string }` | `decodeURIComponent` puis split sur `\|\|\|` ; lève `Error` si séparateur absent |

**Séparateur interne :** `|||` (triple pipe). Choix qui garantit l'absence de collision avec les caractères courants dans les noms d'artistes et d'albums, tout en restant encodable en URL.

### `src/lib/album-service.ts` — Service Last.fm album

Appels serveur uniquement (variable d'env `LASTFM_API_KEY`, `cache: "no-store"`).

| Fonction exportée | Signature | Description |
|-------------------|-----------|-------------|
| `fetchAlbumByName` | `(artist: string, album: string) => Promise<AlbumDetail \| null>` | Appelle `album.getInfo` sur Last.fm ; normalise la tracklist (gestion cas 1 track = objet vs array) ; retourne `null` sur erreur |
| `fetchAlbumForTrack` | `(artist: string, track: string) => Promise<AlbumDetail \| null>` | Résout le nom d'album via `track.getInfo` puis chaîne vers `fetchAlbumByName` ; retourne `null` si le track n'a pas d'album |

**Helper interne :** `normalizeTracks(raw: unknown): LastfmTrackDetail[]` — Last.fm renvoie un objet unique (et non un tableau) quand l'album ne contient qu'un seul track ; ce helper normalise dans les deux cas.

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
- `album-utils.ts` est côté client et serveur — aucune dépendance Node.js ni environnement.
