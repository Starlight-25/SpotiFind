# Stack technique du projet

> Fichier généré automatiquement par le subagent `stack-detector` lors de l'initialisation.
> Dernière détection : 2026-06-17

## Frontend

- **Framework :** Next.js 14.2.35 (App Router)
- **Langage :** TypeScript 5 (strict mode activé)
- **UI :** Tailwind CSS 3.4.1 — pas de librairie de composants tierce (shadcn, MUI, etc.). Composants 100% custom.
- **Fonts :** Geist Sans + Geist Mono (via `next/font/local`, fichiers `.woff` embarqués)
- **State management :** useState / useEffect natifs React. Pas de store global (pas de Redux, Zustand, etc.).
- **Structure :** App Router (`src/app/`), alias `@/*` → `src/*`

### Architecture des pages

| Route | Fichier | Rendu |
|---|---|---|
| `/` | `src/app/page.tsx` | Client Component (`"use client"`) |
| `/artist/[id]` | `src/app/artist/[id]/page.tsx` | Squelette vide (à implémenter) |
| `/album/[id]` | `src/app/album/[id]/page.tsx` | Squelette vide (à implémenter) |
| `/favourites` | `src/app/favourites/page.tsx` | Squelette vide (à implémenter) |

### API Routes (Next.js Route Handlers)

| Route | Fichier | Rôle |
|---|---|---|
| `GET /api/search` | `src/app/api/search/route.ts` | Proxy vers Last.fm — recherche tracks/artists/albums |
| `GET /api/spotify` | `src/app/api/spotify/route.ts` | Proxy vers Spotify API — token jamais exposé au client |

### Conventions frontend

- Composants dans `src/components/` — nommage PascalCase
- Hooks custom dans `src/hooks/` — préfixe `use`
- Types dans `src/lib/` — fichiers `*-types.ts` dédiés
- Séparation stricte des types Last.fm (`music-types.ts`) et Spotify (`spotify-types.ts`)
- CSS : Tailwind utility classes + variables CSS custom définies dans `globals.css` (`--background`, `--foreground`, `--muted`, `--border`, `--surface`)
- Couleur brand : `#1DB954` (spotify green), exposée comme classe Tailwind `text-spotify`
- Les appels API externes ne passent **jamais** par le client : tout transite via les Route Handlers Next.js

### Commandes frontend

```bash
npm run dev       # Démarrage serveur de développement (next dev)
npm run build     # Build de production (next build)
npm run start     # Démarrage serveur de production (next start)
npm run lint      # Lint ESLint (next lint)
npm run test      # Lancement des tests Jest
```

## Backend

Ce projet n'a pas de backend séparé. Le backend est **intégré à Next.js** via les Route Handlers (App Router).

- **Framework :** Next.js 14.2.35 Route Handlers
- **Langage :** TypeScript 5
- **ORM / BDD :** Aucun — pas de base de données. La persistance est faite côté client via `localStorage` (favoris).
- **Auth :** Aucune authentification utilisateur. Les clés API tierces sont stockées en variables d'environnement serveur.
- **Structure :** `src/app/api/` — un dossier par ressource, fichier `route.ts`

### Intégrations API tierces

#### Last.fm API (primaire — recherche)
- Endpoint de base : `https://ws.audioscrobbler.com/2.0/`
- Auth : clé API en query param (`api_key`)
- Variable d'environnement requise : `LASTFM_API_KEY`
- Méthodes utilisées : `track.search`, `artist.search`, `album.search`

#### Spotify Web API (détails artiste/album)
- Endpoint de base : `https://api.spotify.com/v1`
- Auth : OAuth 2.0 Client Credentials Flow (token géré server-side avec cache + auto-refresh)
- Variables d'environnement requises : `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- Token endpoint : `https://accounts.spotify.com/api/token`
- Le client Spotify (`src/lib/spotify.ts`) gère : fetch initial, cache mémoire avec expiry, retry automatique sur 401

### Variables d'environnement

```bash
# .env.local (non commité)
LASTFM_API_KEY=         # Clé API Last.fm (obligatoire pour la recherche)
SPOTIFY_CLIENT_ID=      # Client ID Spotify (obligatoire pour les pages artiste/album)
SPOTIFY_CLIENT_SECRET=  # Client Secret Spotify (obligatoire pour les pages artiste/album)
```

> Note : seul `LASTFM_API_KEY` est documenté dans `.env.example`. Les credentials Spotify sont à ajouter manuellement.

### Conventions backend

- Les Route Handlers exportent des fonctions nommées par méthode HTTP (`GET`, `POST`, etc.)
- Toujours utiliser `NextRequest` / `NextResponse` — pas de `Request`/`Response` raw
- Erreurs remontées en JSON : `{ error: string }` avec le status HTTP approprié
- `cache: "no-store"` sur tous les `fetch()` serveur pour éviter le cache Next.js

## Outils transverses

- **Gestionnaire de paquets :** npm (présence de `node_modules`, scripts dans `package.json`)
- **Tests :** Jest 30.4.2 + ts-jest 29.4.11, environnement `node`
  - Config : `jest.config.ts` avec preset `ts-jest`, alias `@/*` mappé
  - Fichiers de test : `*.test.ts` colocalisés avec le module (`src/lib/spotify.test.ts`)
- **Linter :** ESLint 8 avec config `next/core-web-vitals` + `next/typescript`
- **TypeScript :** Mode strict (`"strict": true`), `noEmit: true`, `moduleResolution: bundler`
- **CI/CD :** Non identifié (pas de fichier GitHub Actions, GitLab CI, etc.)
- **Docker :** Non identifié (pas de `Dockerfile` ni `docker-compose.yml`)
- **Monorepo :** Non — projet single-app

## Structure des dossiers

```
src/
  app/
    api/
      search/route.ts       # Proxy Last.fm
      spotify/route.ts      # Proxy Spotify
    artist/[id]/page.tsx    # Page dynamique artiste (à implémenter)
    album/[id]/page.tsx     # Page dynamique album (à implémenter)
    favourites/page.tsx     # Page favoris (à implémenter)
    globals.css             # Variables CSS globales + Tailwind directives
    layout.tsx              # RootLayout — fonts Geist, container-app
    page.tsx                # Homepage — recherche globale
  components/
    SearchBar.tsx           # Input de recherche avec debounce
    SearchResults.tsx       # Grille 3 colonnes Tracks/Artists/Albums
  hooks/
    useSearch.ts            # Hook debounced fetch vers /api/search
  lib/
    spotify.ts              # Client Spotify (token cache, fetchSpotify)
    spotify.test.ts         # Tests unitaires du client Spotify
    spotify-types.ts        # Types TypeScript pour l'API Spotify
    music-types.ts          # Types TypeScript pour l'API Last.fm
public/
  logo.png                  # Logo SpotiFind
```
