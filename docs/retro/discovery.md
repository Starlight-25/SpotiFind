# Discovery — SpotiFind

> Fichier généré automatiquement par retro-scanner. Usage interne uniquement.
> Ce fichier sera supprimé à la fin de la Phase 1-bis.

## Stack identifiée

| Composant | Valeur |
|-----------|--------|
| Framework | Next.js 14.2.35 (App Router) |
| Version   | 14.2.35 |
| SGBD      | Aucun — persistance client via `localStorage` |
| ORM       | Aucun |
| Auth      | Aucune auth utilisateur — secrets API en variables d'environnement serveur uniquement |
| Tests     | Jest 30.4.2 + ts-jest 29.4.11, environnement `node` |

## Features identifiées

### 1. Recherche globale (homepage)
**Description :** Page principale avec un champ de recherche unique qui interroge simultanément les tracks, artistes et albums via l'API Last.fm. Les résultats s'affichent en temps réel dans une grille 3 colonnes avec debounce de 400 ms et annulation des requêtes en vol (AbortController).
**Fichiers principaux :**
- `src/app/page.tsx`
- `src/components/SearchBar.tsx`
- `src/components/SearchResults.tsx`
- `src/hooks/useSearch.ts`
- `src/app/api/search/route.ts`

### 2. Proxy Last.fm (API Route)
**Description :** Route handler Next.js qui joue le rôle de proxy entre le client et l'API Last.fm. Exécute trois recherches en parallèle (`track.search`, `artist.search`, `album.search`) et agrège les résultats en une seule réponse JSON. La clé API Last.fm n'est jamais exposée au navigateur.
**Fichiers principaux :**
- `src/app/api/search/route.ts`
- `src/lib/music-types.ts`

### 3. Proxy Spotify (API Route + client token)
**Description :** Route handler générique qui accepte un paramètre `path` et le transfère à l'API Spotify v1 côté serveur. Le token OAuth 2.0 (Client Credentials Flow) est géré par un client dédié avec cache mémoire et auto-refresh sur expiration ou 401. Les credentials Spotify ne transitent jamais vers le navigateur.
**Fichiers principaux :**
- `src/app/api/spotify/route.ts`
- `src/lib/spotify.ts`
- `src/lib/spotify-types.ts`

### 4. Page artiste dynamique (squelette)
**Description :** Route dynamique `/artist/[id]` destinée à afficher le profil d'un artiste (artwork, followers, top tracks, discographie) en exploitant l'API Spotify via le proxy. Le fichier existe mais est vide — la fonctionnalité n'est pas encore implémentée.
**Fichiers principaux :**
- `src/app/artist/[id]/page.tsx`

### 5. Page album dynamique (squelette)
**Description :** Route dynamique `/album/[id]` destinée à afficher la pochette, les métadonnées de sortie et la tracklist d'un album Spotify. Le fichier existe mais est vide — la fonctionnalité n'est pas encore implémentée.
**Fichiers principaux :**
- `src/app/album/[id]/page.tsx`

### 6. Favoris (squelette)
**Description :** Page statique `/favourites` prévue pour lister les tracks sauvegardées par l'utilisateur en `localStorage`. Aucune persistance backend. Le fichier existe mais est vide — la fonctionnalité n'est pas encore implémentée.
**Fichiers principaux :**
- `src/app/favourites/page.tsx`

### 7. Gestion du token Spotify (lifecycle)
**Description :** Module isolé gérant le cycle de vie du token d'accès Spotify : fetch initial via Client Credentials, mise en cache mémoire avec marge de sécurité de 30 secondes, invalidation manuelle, et retry automatique en cas de 401 inattendu. Ce module est le seul à posséder des tests unitaires dans le projet.
**Fichiers principaux :**
- `src/lib/spotify.ts`
- `src/lib/spotify.test.ts`

## Décisions techniques clés

1. **Proxy pattern pour les API tierces** — Aucun appel à Last.fm ou Spotify n'est fait depuis le navigateur. Tout transite par des Route Handlers Next.js (`/api/search`, `/api/spotify`), ce qui protège les clés API et permet de centraliser la gestion des erreurs et du token.

2. **Token Spotify avec cache mémoire et retry sur 401** — Le client `src/lib/spotify.ts` maintient un cache module-level (singleton de fait dans le process Node.js) avec expiration calculée avec 30 s de marge. En cas de 401 inattendu, il invalide le cache et effectue un retry automatique une seule fois, sans exposer cette complexité aux appelants.

3. **Pas de base de données** — La persistance des favoris est déléguée au `localStorage` navigateur. Choix cohérent avec l'absence de backend séparé et la volonté de garder le projet simple.

4. **Debounce + AbortController côté hook** — Le hook `useSearch` implémente un debounce de 400 ms et annule les requêtes précédentes via `AbortController` pour éviter les race conditions, sans librairie externe.

5. **Séparation stricte des types Last.fm et Spotify** — Deux fichiers de types distincts (`music-types.ts` et `spotify-types.ts`) évitent la confusion entre les deux modèles de données, malgré certains noms de types similaires (`SearchResults` existe dans les deux fichiers).

6. **CSS custom properties + Tailwind** — Le système de design repose sur des variables CSS définies dans `globals.css` (`--background`, `--foreground`, `--muted`, `--border`, `--surface`) consommées comme couleurs Tailwind. La couleur brand Spotify (`#1DB954`) est exposée comme classe `text-spotify`.

7. **Composants 100% custom, pas de librairie UI** — Aucune dépendance à shadcn/ui, MUI, ou autre librairie de composants. Tous les composants sont faits main avec Tailwind.

8. **`instrumentationHook: true` activé** — Option expérimentale Next.js activée dans `next.config.mjs`, probablement pour un usage futur d'observabilité (OpenTelemetry). Non utilisée actuellement dans le code source.

9. **Images autorisées uniquement depuis `lastfm.freetls.fastly.net`** — Le composant `next/image` est configuré pour n'accepter que le CDN Last.fm. Les images Spotify ne sont pas encore autorisées, ce qui bloquera les pages artiste/album quand elles seront implémentées.

## Évaluation qualité globale

| Critère | État |
|---------|------|
| Tests présents | Oui — uniquement sur `src/lib/spotify.ts` (7 tests unitaires couvrant le cache token et le retry 401). Aucun test sur les composants, hooks ou routes. |
| Structure | Organisée — séparation claire `app/`, `components/`, `hooks/`, `lib/`. Conventions de nommage respectées (PascalCase composants, `use` prefix hooks). |
| Gestion d'erreurs | Partielle — centralisée dans les Route Handlers (JSON `{ error }` + status HTTP). Côté client, le hook `useSearch` absorbe les AbortErrors et expose un message générique. Les pages dynamiques (artiste, album, favoris) sont vides, donc sans gestion d'erreurs. |
| Documentation | Partielle — README présent avec description du projet et architecture. Fichier `.env.example` incomplet (ne documente que `LASTFM_API_KEY`, omettant les credentials Spotify). Commentaires JSDoc ponctuels dans `spotify.ts` et `api/spotify/route.ts`. Pas de documentation des composants. |
