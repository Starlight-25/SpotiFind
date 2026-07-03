# Stack technique du projet

> Fichier généré automatiquement par le subagent `stack-detector` lors de l'initialisation.
> Dernière détection : 2026-07-03 — Spotify retiré, Supabase (auth) + TheAudioDB (illustrations) ajoutés.

## Frontend

- **Framework :** Next.js 14.2.35 (App Router)
- **Langage :** TypeScript 5 (strict mode activé)
- **UI :** Tailwind CSS 3.4.1 — pas de librairie de composants tierce (shadcn, MUI, etc.). Composants 100% custom.
- **Fonts :** Geist Sans + Geist Mono (via `next/font/local`, fichiers `.woff` embarqués)
- **State management :** useState / useEffect natifs React + hooks custom (`useFavourites`, `useHistorique`, `useHomeCharts`, `useSearch`, `useAudioAnalyser`). Pas de store global (pas de Redux, Zustand, etc.).
- **Structure :** App Router (`src/app/`), alias `@/*` → `src/*`
- **Auth (client) :** Supabase (`@supabase/supabase-js`, `@supabase/ssr`) — session gérée via `src/middleware.ts` et `src/lib/supabase.ts`

### Architecture des pages

| Route | Fichier | Rendu |
|---|---|---|
| `/` | `src/app/page.tsx` | Client Component (`"use client"`) — recherche + accueil (charts, genres) |
| `/artist/[id]` | `src/app/artist/[id]/page.tsx` | Implémenté |
| `/album/[id]` | `src/app/album/[id]/page.tsx` | Implémenté |
| `/favourites` | `src/app/favourites/page.tsx` | Implémenté — localStorage (anonyme) ou Supabase (connecté) |
| `/historique` | `src/app/historique/page.tsx` | Implémenté — historique de recherche |
| `/login` | `src/app/login/page.tsx` + `LoginForm.tsx` | Connexion Supabase + import favoris localStorage |
| `/signup` | `src/app/signup/page.tsx` | Inscription Supabase |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Demande de réinitialisation |
| `/reset-password` | `src/app/reset-password/page.tsx` + `ResetPasswordForm.tsx` | Réinitialisation du mot de passe |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Callback OAuth Supabase |

### API Routes (Next.js Route Handlers)

| Route | Fichier | Rôle |
|---|---|---|
| `GET /api/search` | `src/app/api/search/route.ts` | Proxy vers Last.fm — recherche tracks/artists/albums |
| `GET /api/artist-info` | `src/app/api/artist-info/route.ts` | Proxy Last.fm — stats artiste (`artist.getInfo`) |
| `GET /api/track-info` | `src/app/api/track-info/route.ts` | Proxy Last.fm — stats morceau (`track.getInfo`) |
| `GET /api/home` | `src/app/api/home/route.ts` | Agrège Last.fm (charts) + TheAudioDB (illustrations artistes) |
| `GET /api/explore` | `src/app/api/explore/route.ts` | Proxy Last.fm — top albums par genre (`tag.getTopAlbums`) |

### Conventions frontend

- Composants dans `src/components/` — nommage PascalCase
- Hooks custom dans `src/hooks/` — préfixe `use`
- Types dans `src/lib/` — fichiers `*-types.ts` dédiés
- Types Last.fm centralisés dans `music-types.ts` (plus de types Spotify)
- CSS : Tailwind utility classes + variables CSS custom définies dans `globals.css` (`--background`, `--foreground`, `--muted`, `--border`, `--surface`)
- Couleur brand : `#1DB954` (spotify green, conservée pour l'identité visuelle malgré le retrait de l'API), exposée comme classe Tailwind `text-spotify`
- Les appels API externes ne passent **jamais** par le client : tout transite via les Route Handlers Next.js

### Commandes frontend

```bash
npm run dev       # Démarrage serveur de développement (next dev)
npm run build     # Build de production (next build)
npm run start     # Démarrage serveur de production (next start)
npm run lint      # Lint ESLint (next lint)
```

## Backend

Ce projet n'a pas de backend séparé. Le backend est **intégré à Next.js** via les Route Handlers (App Router).

- **Framework :** Next.js 14.2.35 Route Handlers
- **Langage :** TypeScript 5
- **ORM / BDD :** Aucun — pas de base de données relationnelle propre au projet. Supabase est utilisé uniquement pour l'auth et le stockage des favoris (`favourites` table gérée côté Supabase).
- **Auth :** Supabase Auth (email/password) — session gérée server-side via `@supabase/ssr` et `src/middleware.ts`
- **Structure :** `src/app/api/` — un dossier par ressource, fichier `route.ts`

### Intégrations API tierces

#### Last.fm API (recherche + métadonnées)
- Endpoint de base : `https://ws.audioscrobbler.com/2.0/`
- Auth : clé API en query param (`api_key`)
- Variable d'environnement requise : `LASTFM_API_KEY`
- Méthodes utilisées : `track.search`, `artist.search`, `album.search`, `artist.getInfo`, `track.getInfo`, `tag.getTopAlbums`

#### TheAudioDB API (illustrations artistes)
- Endpoint de base : `https://www.theaudiodb.com/api/v1/json`
- Auth : clé API dans le chemin (défaut `123` — clé de test publique)
- Variable d'environnement optionnelle : `THEAUDIODB_API_KEY`
- Usage : récupération du thumbnail artiste (`search.php`) en complément des données Last.fm, dans `src/app/api/home/route.ts` et `src/lib/artist-service.ts`

#### Supabase (auth + favoris)
- Auth : email/password via `@supabase/supabase-js`
- Variables d'environnement requises : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Client dans `src/lib/supabase.ts`, session middleware dans `src/middleware.ts`

> Spotify Web API a été **retiré** du projet (RETRO-003 obsolète) — plus aucune dépendance sur `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`.

### Variables d'environnement

```bash
# .env.local (non commité)
LASTFM_API_KEY=              # Clé API Last.fm (obligatoire — recherche + métadonnées)
THEAUDIODB_API_KEY=          # Clé API TheAudioDB (optionnelle, défaut "123")
NEXT_PUBLIC_SUPABASE_URL=    # URL du projet Supabase (obligatoire — auth + favoris)
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Clé anonyme Supabase (obligatoire — auth + favoris)
```

> Toutes ces variables sont documentées dans `.env.example`.

### Conventions backend

- Les Route Handlers exportent des fonctions nommées par méthode HTTP (`GET`, `POST`, etc.)
- Toujours utiliser `NextRequest` / `NextResponse` — pas de `Request`/`Response` raw
- Erreurs remontées en JSON : `{ error: string }` avec le status HTTP approprié
- `cache: "no-store"` sur tous les `fetch()` serveur pour éviter le cache Next.js

## Outils transverses

- **Gestionnaire de paquets :** npm (présence de `node_modules`, scripts dans `package.json`)
- **Tests :** Non identifié dans le `package.json` actuel (pas de script `test`)
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
      search/route.ts         # Proxy Last.fm — recherche
      artist-info/route.ts    # Proxy Last.fm — stats artiste
      track-info/route.ts     # Proxy Last.fm — stats morceau
      home/route.ts           # Last.fm (charts) + TheAudioDB (thumbs)
      explore/route.ts        # Proxy Last.fm — top albums par genre
    artist/[id]/page.tsx      # Page dynamique artiste
    album/[id]/page.tsx       # Page dynamique album
    favourites/page.tsx       # Page favoris (localStorage / Supabase)
    historique/page.tsx       # Page historique de recherche
    login/, signup/, forgot-password/, reset-password/, auth/callback/  # Auth Supabase
    globals.css               # Variables CSS globales + Tailwind directives
    layout.tsx                # RootLayout — fonts Geist, container-app
    page.tsx                  # Homepage — recherche + charts + genres
    middleware.ts             # Session Supabase (refresh cookies)
  components/                 # Composants UI (PascalCase)
  hooks/
    useSearch.ts               # Hook debounced fetch vers /api/search
    useFavourites.ts            # Gestion favoris (localStorage / Supabase)
    useHistorique.ts             # Gestion historique de recherche
    useHomeCharts.ts             # Fetch des données /api/home
    useAudioAnalyser.ts          # Analyse audio (visualisation)
  lib/
    supabase.ts                # Client Supabase
    artist-service.ts          # Agrégation TheAudioDB + Last.fm pour une fiche artiste
    album-service.ts           # Service album
    album-utils.ts             # Utilitaires album
    favourite-utils.ts         # Utilitaires favoris
    historique-utils.ts        # Utilitaires historique
    music-types.ts             # Types TypeScript pour l'API Last.fm
    utils.ts                    # Utilitaires génériques (cn, etc.)
public/
  logo.png                  # Logo SpotiFind
```
