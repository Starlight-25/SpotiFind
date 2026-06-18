# Spec Fonctionnelle — Page Album [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | album-page          |
| Version    | 0.1.0               |
| Date       | 2026-06-17          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT / STUB        |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant et des types de données disponibles. La page
> `src/app/album/[id]/page.tsx` est un squelette vide : aucun comportement n'est
> implémenté. Les règles ci-dessous sont déduites du README, des types Spotify
> (`spotify-types.ts`) et du proxy générique `/api/spotify`. Elles doivent être
> validées par le développeur avant toute implémentation.

---

## ADRs

Aucun ADR RETRO spécifique à cette feature. Les décisions transverses applicables sont :

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-002](../../adr/RETRO-002-server-side-api-proxy.md) | Proxy server-side pour les clés API tierces | Documenté (rétro) |

---

## Contexte et objectif

La page `/album/[id]` est une route dynamique Next.js destinée à afficher les informations détaillées d'un album identifié par son identifiant Spotify. Elle constitue une destination depuis les résultats de recherche (clic sur une carte album) ou depuis la page artiste (clic sur un album de la discographie).

L'identifiant `[id]` dans l'URL correspond à l'identifiant Spotify de l'album. La page consomme le proxy `/api/spotify` pour accéder à l'API Spotify v1 sans exposer le token au navigateur.

## Règles métier (déduites du README et des types)

1. L'identifiant `[id]` dans l'URL est l'identifiant Spotify de l'album — il est fourni par l'API Spotify et non par Last.fm.
2. La page affiche : pochette de l'album, nom de l'album, artiste(s) associé(s), date de sortie (`release_date`), et tracklist complète et cliquable.
3. Les données sont récupérées via le proxy `/api/spotify?path=/albums/{id}`. La réponse contient la pochette, les métadonnées et les tracks (`SpotifyTrack`).
4. La tracklist est "cliquable" selon le README — la destination d'un clic sur un track n'est pas spécifiée (aucune route `/track/[id]` n'existe dans le projet actuel).
5. Les credentials Spotify ne transitent jamais vers le client : le token OAuth est géré exclusivement par `src/lib/spotify.ts` côté serveur.
6. Les images de la pochette sont fournies par `SpotifyAlbum.images` (tableau `SpotifyImage` avec `url`, `width`, `height`). La configuration actuelle de `next/image` n'autorise que `lastfm.freetls.fastly.net` — les domaines Spotify devront être ajoutés à `next.config.mjs`.

## Cas d'usage (déduits)

### CU-001 — Consultation de la page album

**Acteur :** Visiteur non authentifié

**Préconditions :**
- Les variables `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` sont présentes en environnement serveur.
- L'identifiant `[id]` dans l'URL est un identifiant Spotify valide.

**Flux principal :**
1. L'utilisateur navigue vers `/album/<id>` (via un lien depuis les résultats de recherche, la page artiste, ou une URL directe).
2. La page récupère les données de l'album via `GET /api/spotify?path=/albums/<id>`.
3. La pochette, le nom, l'artiste, la date de sortie et la tracklist complète sont affichés.
4. Chaque piste de la tracklist est cliquable (destination à définir).

**Flux alternatifs :**
- Si l'identifiant est inconnu de Spotify (404) : affichage d'un message "Album introuvable" ou redirection.
- Si les credentials Spotify sont absents ou expirés : affichage d'un message d'erreur générique.
- Pendant le chargement : affichage d'un état skeleton/loading.

### CU-002 — Navigation vers l'artiste depuis la page album

**Flux :** L'utilisateur clique sur le nom de l'artiste affiché sur la page album. Il est redirigé vers `/artist/<artist_id>`.

## Dépendances

- **Spotify Web API** — endpoint `/albums/{id}`. Credentials requis : `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`.
- **Next.js Route Handler `/api/spotify`** — proxy générique vers l'API Spotify.
- **`src/lib/spotify.ts`** — gestion du token OAuth 2.0 (Client Credentials, cache mémoire, retry 401).
- **`src/lib/spotify-types.ts`** — types `SpotifyAlbum`, `SpotifyTrack`, `SpotifyArtist`, `SpotifyImage`.
- **`next.config.mjs`** — doit autoriser les domaines d'images Spotify pour `next/image`.

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- Comment l'utilisateur navigue-t-il de la recherche Last.fm (sans ID Spotify) vers `/album/[id]` (qui requiert un ID Spotify) ? Une résolution d'ID intermédiaire est nécessaire mais non implémentée.
- La tracklist est "cliquable" selon le README : quelle est la destination ? Une modale de lecture, un lien externe vers Spotify, ou une future page `/track/[id]` non encore créée ?
- La page doit-elle être un Server Component (SSR) ou un Client Component avec skeleton loader ? Le README mentionne des "Skeleton Loaders" ce qui suggère un rendu client.
- L'endpoint `/albums/{id}` retourne les tracks de manière paginée pour les albums longs (> 50 tracks) : la pagination est-elle requise dès la première itération ?
- La `release_date` Spotify peut être au format `YYYY`, `YYYY-MM` ou `YYYY-MM-DD` selon la précision disponible : quel format d'affichage est attendu ?
- Un album peut avoir plusieurs artistes (`artists` est un tableau) : comment les afficher (séparés par une virgule, chacun cliquable vers sa page artiste) ?
