# Spec Fonctionnelle — Page Artiste [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | artist-page         |
| Version    | 0.1.0               |
| Date       | 2026-06-17          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT / STUB        |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant et des types de données disponibles. La page
> `src/app/artist/[id]/page.tsx` est un squelette vide : aucun comportement n'est
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

La page `/artist/[id]` est une route dynamique Next.js destinée à afficher le profil détaillé d'un artiste identifié par son identifiant Spotify. Elle constitue la destination naturelle depuis les résultats de recherche lorsqu'un utilisateur clique sur une carte artiste.

L'identifiant `[id]` dans l'URL correspond à l'identifiant Spotify de l'artiste (ex. `6XyY86QOPPrYVGvF9ch6wz` pour Linkin Park). La page consomme le proxy `/api/spotify` pour accéder à l'API Spotify v1 sans exposer le token au navigateur.

## Règles métier (déduites du README et des types)

1. L'identifiant `[id]` dans l'URL est l'identifiant Spotify de l'artiste — il est fourni directement par l'API Spotify et non par Last.fm (les MBIDs Last.fm ne sont pas utilisables ici).
2. La page affiche : artwork principal de l'artiste, nom, nombre de followers, liste des genres, top 5 tracks populaires, et discographie complète (liste d'albums).
3. Les données sont récupérées via le proxy `/api/spotify?path=/artists/{id}` et des appels complémentaires pour les top tracks et albums (endpoints Spotify dédiés).
4. Les credentials Spotify ne transitent jamais vers le client : le token OAuth est géré exclusivement par `src/lib/spotify.ts` côté serveur.
5. Les images de l'artiste sont fournies par le tableau `SpotifyArtist.images` (format `{ url, width, height }`). La configuration actuelle de `next/image` n'autorise que `lastfm.freetls.fastly.net` — les domaines Spotify devront être ajoutés à `next.config.mjs` pour que les images s'affichent.

## Cas d'usage (déduits)

### CU-001 — Consultation du profil artiste

**Acteur :** Visiteur non authentifié

**Préconditions :**
- Les variables `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` sont présentes en environnement serveur.
- L'identifiant `[id]` dans l'URL est un identifiant Spotify valide.

**Flux principal :**
1. L'utilisateur navigue vers `/artist/<id>` (via un lien depuis les résultats de recherche ou une URL directe).
2. La page récupère les données de l'artiste via `GET /api/spotify?path=/artists/<id>`.
3. La page récupère les top tracks via `GET /api/spotify?path=/artists/<id>/top-tracks`.
4. La page récupère la discographie via `GET /api/spotify?path=/artists/<id>/albums`.
5. L'artwork, le nom, le nombre de followers, les genres, les top 5 tracks et la liste d'albums sont affichés.

**Flux alternatifs :**
- Si l'identifiant est inconnu de Spotify (404) : affichage d'un message "Artiste introuvable" ou redirection vers la homepage.
- Si les credentials Spotify sont absents ou expirés : affichage d'un message d'erreur générique (le proxy renvoie une erreur 500).
- Pendant le chargement : affichage d'un état skeleton/loading cohérent avec le design global.

### CU-002 — Navigation vers un album depuis le profil artiste

**Flux :** L'utilisateur clique sur un album dans la discographie. Il est redirigé vers `/album/<album_id>`.

## Dépendances

- **Spotify Web API** — endpoints `/artists/{id}`, `/artists/{id}/top-tracks`, `/artists/{id}/albums`. Credentials requis : `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`.
- **Next.js Route Handler `/api/spotify`** — proxy générique vers l'API Spotify.
- **`src/lib/spotify.ts`** — gestion du token OAuth 2.0 (Client Credentials, cache mémoire, retry 401).
- **`src/lib/spotify-types.ts`** — types `SpotifyArtist`, `SpotifyAlbum`, `SpotifyTrack`, `SpotifyImage`.
- **`next.config.mjs`** — doit autoriser les domaines d'images Spotify (`i.scdn.co` ou autre CDN Spotify) pour que `next/image` puisse les afficher.

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- Comment l'utilisateur navigue-t-il de la page de recherche (résultats Last.fm, sans ID Spotify) vers `/artist/[id]` (qui requiert un ID Spotify) ? Une résolution d'ID intermédiaire via `/api/spotify?path=/search` est probable mais non implémentée.
- La page doit-elle être un Server Component (fetch côté serveur, SSR) ou un Client Component (fetch côté navigateur vers le proxy) ? Le README mentionne des "Skeleton Loaders" (pattern Client Component), mais le proxy Spotify est conçu pour être appelé côté serveur.
- Le top 5 tracks : est-ce un maximum absolu ou le nombre par défaut retourné par l'endpoint Spotify `/top-tracks` (qui en retourne jusqu'à 10) ?
- La discographie inclut-elle uniquement les albums ou aussi les singles et EPs ? L'endpoint Spotify `/artists/{id}/albums` supporte un filtre `include_groups` non encore spécifié.
- Quel est le comportement attendu si l'artiste n'a pas d'image disponible sur Spotify ?
