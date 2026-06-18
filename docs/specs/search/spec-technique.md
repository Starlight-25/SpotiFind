# Spec Technique — Recherche Globale

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | search              |
| Version       | 0.2.0               |
| Date          | 2026-06-18          |
| Source        | Rétro-ingénierie    |

## Architecture du module

La feature est construite en trois couches :

1. **Couche présentation** — `page.tsx` orchestre l'état de la query (`useState`), délègue le fetch au hook `useSearch`, et distribue les états (`loading`, `error`, `results`) aux composants d'affichage `SearchBar` et `SearchResults`.

2. **Couche logique** — `useSearch.ts` encapsule le cycle complet : debounce via `setTimeout`, annulation des requêtes concurrentes via `AbortController` stocké dans un `useRef`, fetch vers `/api/search`, normalisation de la réponse JSON avec defaults `?? []`, et gestion des états dérivés (`loading`, `error`).

3. **Couche données / proxy** — `src/app/api/search/route.ts` est un Route Handler Next.js qui reçoit le paramètre `q`, fan-out trois appels Last.fm en `Promise.all`, et retourne un objet unifié `{ tracks, artists, albums }`. La clé API Last.fm est lue depuis `process.env.LASTFM_API_KEY` et n'est jamais sérialisée dans la réponse client.

Les trois couches communiquent uniquement via les types de `src/lib/music-types.ts`, qui modélisent fidèlement la forme des réponses Last.fm.

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `src/app/page.tsx` | Homepage — orchestration état query + rendu conditionnel | ~41 |
| `src/components/SearchBar.tsx` | Input contrôlé avec trim + callback `onSearch` | ~47 |
| `src/hooks/useSearch.ts` | Hook debounce + AbortController + fetch `/api/search` | ~58 |
| `src/components/SearchResults.tsx` | Grille 3 colonnes + cards Tracks / Artists / Albums ; pose `[scroll-snap-align:start]` sur le `Link` de `ArtistCard` | ~102 |
| `src/components/ArtistScroller.tsx` | Carousel horizontal artistes : scroll snap (`scroll-snap-type: x mandatory`), barre de progression dynamique (`progress` via `useState`, width = `scrollLeft / (scrollWidth - clientWidth)`), visible uniquement si overflow (fadeLeft ou fadeRight) | ~80 |
| `src/lib/music-types.ts` | Interfaces TypeScript Last.fm (`LastfmTrack`, `LastfmArtist`, `LastfmAlbum`, `LastfmImage`, `SearchResults`) | ~35 |
| `src/app/api/search/route.ts` | Route Handler — proxy vers Last.fm, `Promise.all` sur 3 méthodes | ~38 |

## Schéma BDD

Non applicable. Ce module n'utilise aucune base de données. Les résultats de recherche sont éphémères (pas de cache applicatif, `cache: "no-store"` sur chaque fetch serveur).

## API / Endpoints

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/search?q={query}` | Retourne `{ tracks[], artists[], albums[] }` depuis Last.fm (max 5 par catégorie) | Aucune (clé côté serveur) |

**Paramètres :**
- `q` (string, obligatoire) — terme de recherche libre. Retourne `400` avec `{ error: "Missing \`q\` query parameter." }` si absent.

**Réponse success (200) :**
```json
{
  "tracks":  [ { "name": string, "artist": string, "url": string, "listeners": string, "image": LastfmImage[], "mbid": string } ],
  "artists": [ { "name": string, "listeners": string, "url": string, "image": LastfmImage[], "mbid": string } ],
  "albums":  [ { "name": string, "artist": string, "url": string, "image": LastfmImage[], "mbid": string } ]
}
```

**Réponse erreur (500) :**
```json
{ "error": "<message de l'erreur interne>" }
```

**Méthodes Last.fm appelées :**
| Méthode Last.fm | Champ query | Clé dans la réponse |
|-----------------|-------------|---------------------|
| `track.search` | `track` | `results.trackmatches.track` |
| `artist.search` | `artist` | `results.artistmatches.artist` |
| `album.search` | `album` | `results.albummatches.album` |

## Patterns identifiés

- **Custom hook encapsulant un side-effect** — `useSearch` isole toute la logique asynchrone du composant parent ; `page.tsx` ne voit que `{ results, loading, error }`.
- **Debounce via `setTimeout` + cleanup `useEffect`** — le `return () => clearTimeout(timer)` dans `useEffect` garantit l'annulation du timer si la query change avant expiration ou si le composant est démonté.
- **AbortController dans un `useRef`** — permet d'annuler la requête HTTP précédente sans provoquer de re-render ; le `useRef` persiste la référence entre les renders sans déclencher de cycle.
- **Proxy BFF (Backend-for-Frontend)** — le Route Handler fait office de BFF : il agrège trois sources Last.fm en une seule réponse normalisée et masque les credentials côté client.
- **Normalisation défensive des données** — `data.tracks ?? []` et l'équivalent pour `artists`/`albums` protègent contre les réponses partielles de Last.fm.
- **Image fallback en cascade** — `getImage` cherche d'abord le size `large`, puis le premier `#text` non vide, puis retourne une chaîne vide déclenchant le placeholder visuel.
- **Clé React via `mbid || index`** — le `mbid` Last.fm est utilisé comme clé stable ; l'index est le fallback lorsque `mbid` est absent (cas réel : certains résultats Last.fm n'ont pas de MusicBrainz ID).
- **Scroll snap CSS natif sur carousel** — `ArtistScroller` applique `scroll-snap-type: x mandatory` sur le conteneur de défilement et `scroll-snap-align: start` (via classe Tailwind arbitraire `[scroll-snap-align:start]`) sur chaque `ArtistCard`. Le snap CSS natif évite tout calcul JS de position ou librairie externe.
- **Barre de progression dérivée du scroll** — un `useState<number>` (`progress`, 0 à 1) est mis à jour dans le handler `onScroll` via `scrollLeft / (scrollWidth - clientWidth)`. La largeur de la barre est posée en style inline (`width: \`${progress * 100}%\``). La barre est rendue conditionnellement : elle n'est visible (`fadeLeft || fadeRight`) que si le contenu est en overflow réel, évitant un artefact visuel quand tous les artistes tiennent à l'écran.

## Décisions techniques locales (non-ADR)

Les éléments ci-dessous ont été identifiés comme décisions techniques mais ont été **rejetés** comme candidats ADR (portée trop locale ou anti-pattern AP-3) :

- **Debounce 400 ms** — valeur paramétrée via `debounceMs = 400` ; modifiable sans impact transverse. Documenté ici à titre informatif.
- **Limite 5 résultats par catégorie** — hardcodée dans `lastfmSearch(... limit = 5)`. Non architecturale, modifiable en une ligne.
- **`Promise.all` pour les 3 appels Last.fm** — choix d'implémentation pour la performance, non une décision architecturale.
- **Affichage `listeners` sur Track et Artist, absent sur Album** — incohérence visible dans le code : `LastfmAlbum` ne possède pas de champ `listeners` dans les types, contrairement à `LastfmTrack` et `LastfmArtist`. Potentielle dette ou limite de l'API Last.fm.

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| `src/lib/spotify.test.ts` | Client Spotify (token cache, retry 401) | Existant |
| — | Hook `useSearch` | Absent |
| — | Route Handler `/api/search` | Absent |
| — | Composants `SearchBar`, `SearchResults` | Absent |
