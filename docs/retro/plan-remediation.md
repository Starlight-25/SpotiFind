# Plan de Remédiation — SpotiFind

> **Mise à jour 2026-06-28** — Phase 1 entièrement résolue (les bloquants Spotify sont devenus obsolètes avec le retrait de l'API). Phase 2 partiellement complétée : artist-page, album-page, favourites implémentés. Items de tests et validation toujours en attente.

## Stratégie (originale)

Corriger d'abord les deux bloquants de configuration (images Spotify, `.env.example`) qui empêchent toute progression sur les 3 features stub, puis définir et implémenter la résolution d'identifiants Last.fm → Spotify qui est le verrou fonctionnel central, puis stabiliser la qualité (tests, validation, dégradation gracieuse) avant de s'attaquer aux implémentations des pages vides. Les améliorations d'opportunité (nommage, logging, rate limiting) sont traitées en dernier, en profitant des passages dans les fichiers concernés.

---

## Phase 1 — Corrections critiques ✅ COMPLÉTÉE

| # | Action | État |
|---|--------|------|
| 1.1 | ~~Ajouter domaines CDN Spotify dans `next.config.mjs`~~ | ✅ OBSOLÈTE — Spotify retiré, TheAudioDB ajouté à la place |
| 1.2 | ~~Mettre à jour `.env.example` avec credentials Spotify~~ | ✅ OBSOLÈTE — Spotify retiré |
| 1.3 | ~~Renommer `SearchResults` dans `spotify-types.ts`~~ | ✅ RÉSOLU — `spotify-types.ts` supprimé avec Spotify |
| 1.4 | Supprimer `instrumentationHook: true` de `next.config.mjs` | ⏳ Toujours en attente (MINEUR) |

---

## Phase 2 — Stabilisation (partiellement complétée)

| # | Action | Feature | Effort estimé | État |
|---|--------|---------|--------------|------|
| 2.1 | ~~Résolution d'ID Last.fm → Spotify~~ | search, artist-page, album-page | — | ✅ RÉSOLU autrement — navigation par nom encodé (`/artist/<name>`, `/album/<artist\|\|\|name>`) |
| 2.2 | Écrire les tests unitaires du hook `useSearch` | search | M (2-3h) | ⏳ En attente |
| 2.3 | Écrire les tests d'intégration de `/api/search` | proxy-lastfm | M (2-3h) | ⏳ En attente |
| 2.4 | ~~Tests du Route Handler `/api/spotify`~~ | proxy-spotify | — | ✅ OBSOLÈTE — Proxy Spotify supprimé |
| 2.5 | Dégradation gracieuse (`Promise.allSettled`) dans le proxy Last.fm | proxy-lastfm | S (1-2h) | ⏳ En attente |
| 2.6 | ~~Validation du paramètre `path` du proxy Spotify~~ | proxy-spotify | — | ✅ OBSOLÈTE |
| 2.7 | Implémenter `artist-page` | artist-page | L | ✅ COMPLÉTÉ — Last.fm + TheAudioDB, navigation par nom |
| 2.8 | Implémenter `album-page` | album-page | M | ✅ COMPLÉTÉ — Last.fm, slug `artist\|\|\|name` |

---

## Phase 3 — Amélioration continue (Sprints 4+)

| # | Action | Feature | Effort estimé | Prérequis |
|---|--------|---------|--------------|-----------|
| 3.1 | ~~Implémenter la feature `favourites`~~ ✅ **COMPLÉTÉ** : Client Component lisant/écrivant dans `localStorage`, clé de stockage documentée, format de données défini dans la spec technique, état vide, ajout depuis les cartes de résultats et les pages de détail | favourites | L (1-2 jours) | 2.7 et 2.8 (bouton d'ajout aux favoris visible sur les pages de détail) |
| 3.2 | ~~Documenter la clé `localStorage` dans `spec-technique.md`~~ | favourites | — | ✅ COMPLÉTÉ — documenté en v0.6.3 |
| 3.3 | ~~Corriger la race condition dans `getSpotifyToken()`~~ : encapsuler l'appel `fetchNewToken()` dans une promise partagée (`let pendingTokenFetch: Promise<string> | null`) pour éviter deux appels simultanés sur cache vide | spotify-token | S (1-2h) | Aucun |
| 3.4 | ~~Réduire le couplage entre `spotify.ts` et la variable de module~~ (singleton) en acceptant une interface injectable pour faciliter les tests futurs des consommateurs de `fetchSpotify` | spotify-token | M (2-3h) | 3.3 |
| 3.5 | Exposer `limit` comme paramètre optionnel de l'endpoint `/api/search?q=...&limit=N` (avec valeur par défaut 5 et maximum raisonnable de 20) pour ouvrir la voie à la pagination | proxy-lastfm | S (1-2h) | 2.3 (tests à étendre) |
| 3.6 | Ajouter un cache serveur court (30-60 secondes, `next()` ou cache custom) sur les résultats Last.fm pour les termes fréquents, conformément à la recommandation RETRO-002 | proxy-lastfm | M (2-3h) | 2.3 |
| 3.7 | Assainir le logging dans les Route Handlers : remplacer `console.error("[search route]", err)` par un log structuré qui masque les détails sensibles (clé API, URL interne) | proxy-lastfm, proxy-spotify | XS (< 30 min) | Aucun |
| 3.8 | ~~Corriger la discordance URL `/favourites` vs `/favorites`~~ ✅ **RÉSOLU** — `/favourites` retenu : choisir une convention, aligner le code, le README et les futurs liens de navigation | favourites | XS (< 15 min) | Aucun |
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
