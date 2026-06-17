# Plan de Remédiation — SpotiFind

## Stratégie

Corriger d'abord les deux bloquants de configuration (images Spotify, `.env.example`) qui empêchent toute progression sur les 3 features stub, puis définir et implémenter la résolution d'identifiants Last.fm → Spotify qui est le verrou fonctionnel central, puis stabiliser la qualité (tests, validation, dégradation gracieuse) avant de s'attaquer aux implémentations des pages vides. Les améliorations d'opportunité (nommage, logging, rate limiting) sont traitées en dernier, en profitant des passages dans les fichiers concernés.

---

## Phase 1 — Corrections critiques (Sprint 1)

| # | Action | Feature | Effort estimé | Prérequis |
|---|--------|---------|--------------|-----------|
| 1.1 | Ajouter le(s) domaine(s) CDN Spotify (`i.scdn.co` et éventuellement `mosaic.scdn.co`) dans `remotePatterns` de `next.config.mjs` | artist-page, album-page | XS (< 30 min) | Aucun |
| 1.2 | Mettre à jour `.env.example` avec `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` (valeurs vides, commentaires explicatifs) | proxy-spotify, artist-page, album-page | XS (< 15 min) | Aucun |
| 1.3 | Renommer `SearchResults` dans `spotify-types.ts` en `SpotifySearchResults` (ou tout autre nom non conflictuel) et mettre à jour les imports existants | search, artist-page, album-page | S (1-2h) | Aucun — à faire avant l'implémentation des features stub pour éviter de dupliquer le travail |
| 1.4 | Supprimer `instrumentationHook: true` de `next.config.mjs` (ou créer un `instrumentation.ts` vide si l'option doit rester) | Transverse | XS (< 15 min) | Aucun |

---

## Phase 2 — Stabilisation (Sprints 2-3)

| # | Action | Feature | Effort estimé | Prérequis |
|---|--------|---------|--------------|-----------|
| 2.1 | Définir et implémenter la stratégie de résolution d'ID Last.fm → Spotify : appel à `/api/spotify?path=/search?q={name}&type=artist` (ou `album`) pour obtenir l'ID Spotify depuis le nom Last.fm, et rendre les cartes de `SearchResults` cliquables avec navigation vers `/artist/[id]` ou `/album/[id]` | search, artist-page, album-page | M (demi-journée) | 1.3 (pas de conflit de types) |
| 2.2 | Écrire les tests unitaires du hook `useSearch` : debounce (timer), AbortController (annulation), gestion d'erreurs, normalisation des réponses | search | M (2-3h) | Aucun |
| 2.3 | Écrire les tests d'intégration du Route Handler `/api/search` : paramètre `q` manquant (400), clé absente (500), réponse Last.fm ko (500), réponse partielle (fallback `[]`) | proxy-lastfm | M (2-3h) | Aucun |
| 2.4 | Écrire les tests du Route Handler `/api/spotify` : paramètre `path` manquant (400), réponse non-JSON (502), exception `fetchSpotify` (500), réponse Spotify valide (200 mirror) | proxy-spotify | S (1-2h) | Aucun |
| 2.5 | Implémenter la dégradation gracieuse dans `Promise.all` du proxy Last.fm : utiliser `Promise.allSettled` et retourner les catégories disponibles si une recherche partielle échoue | proxy-lastfm | S (1-2h) | 2.3 (tests en place pour valider le changement de comportement) |
| 2.6 | Ajouter une validation (liste blanche ou pattern `/^\/[a-z]`) sur le paramètre `path` du proxy Spotify pour restreindre les chemins autorisés | proxy-spotify | S (1-2h) | 2.4 (tests en place) |
| 2.7 | Implémenter la page `artist-page` (`/artist/[id]`) : fetch artwork, nom, followers, genres, top-5 tracks, discographie via le proxy Spotify | artist-page | L (1-2 jours) | 1.1 (images), 1.3 (types), 2.1 (navigation depuis la recherche) |
| 2.8 | Implémenter la page `album-page` (`/album/[id]`) : fetch pochette, métadonnées, tracklist via le proxy Spotify | album-page | M (demi-journée) | 1.1 (images), 1.3 (types), 2.1 (navigation depuis la recherche) |

---

## Phase 3 — Amélioration continue (Sprints 4+)

| # | Action | Feature | Effort estimé | Prérequis |
|---|--------|---------|--------------|-----------|
| 3.1 | Implémenter la feature `favourites` : Client Component lisant/écrivant dans `localStorage`, clé de stockage documentée, format de données défini dans la spec technique, état vide, ajout depuis les cartes de résultats et les pages de détail | favourites | L (1-2 jours) | 2.7 et 2.8 (bouton d'ajout aux favoris visible sur les pages de détail) |
| 3.2 | Documenter la clé `localStorage` et le format sérialisé dans `docs/specs/favourites/spec-technique.md` (à créer) avant l'implémentation de 3.1 | favourites | XS (< 30 min) | Aucun — à faire avant 3.1 |
| 3.3 | Corriger la race condition dans `getSpotifyToken()` : encapsuler l'appel `fetchNewToken()` dans une promise partagée (`let pendingTokenFetch: Promise<string> | null`) pour éviter deux appels simultanés sur cache vide | spotify-token | S (1-2h) | Aucun |
| 3.4 | Réduire le couplage entre `spotify.ts` et la variable de module (singleton) en acceptant une interface injectable pour faciliter les tests futurs des consommateurs de `fetchSpotify` | spotify-token | M (2-3h) | 3.3 |
| 3.5 | Exposer `limit` comme paramètre optionnel de l'endpoint `/api/search?q=...&limit=N` (avec valeur par défaut 5 et maximum raisonnable de 20) pour ouvrir la voie à la pagination | proxy-lastfm | S (1-2h) | 2.3 (tests à étendre) |
| 3.6 | Ajouter un cache serveur court (30-60 secondes, `next()` ou cache custom) sur les résultats Last.fm pour les termes fréquents, conformément à la recommandation RETRO-002 | proxy-lastfm | M (2-3h) | 2.3 |
| 3.7 | Assainir le logging dans les Route Handlers : remplacer `console.error("[search route]", err)` par un log structuré qui masque les détails sensibles (clé API, URL interne) | proxy-lastfm, proxy-spotify | XS (< 30 min) | Aucun |
| 3.8 | Corriger la discordance URL `/favourites` vs `/favorites` : choisir une convention, aligner le code, le README et les futurs liens de navigation | favourites | XS (< 15 min) | Aucun |
| 3.9 | Mettre en place un pipeline CI minimal (GitHub Actions ou équivalent) : `npm run lint`, `npm run test`, `npm run build` sur chaque PR | Transverse | S (1-2h) | Aucun |

---

## Dépendances entre actions

Les dépendances critiques à respecter pour ne pas bloquer le travail :

```
1.1 (domaine images) ──────────────────────┐
1.3 (conflit SearchResults) ───────────────┤──> 2.7 (artist-page)
2.1 (résolution ID Last.fm → Spotify) ─────┘    2.8 (album-page)

2.3 (tests proxy Last.fm) ─────────────────> 2.5 (dégradation gracieuse)
2.4 (tests proxy Spotify) ─────────────────> 2.6 (validation path)

3.2 (spec technique favourites) ───────────> 3.1 (implémentation favourites)
2.7 + 2.8 (pages de détail) ───────────────> 3.1 (bouton ajout favoris)

3.3 (race condition token) ─────────────────> 3.4 (injectable token client)
2.3 (tests proxy Last.fm étendus) ─────────> 3.5 (param limit), 3.6 (cache)
```

Les actions sans prérequis (1.1, 1.2, 1.4, 2.2, 2.3, 2.4, 3.7, 3.8, 3.9) peuvent être traitées dans n'importe quel ordre ou en parallèle.
