# Dette Technique — SpotiFind

> Classement par criticité : CRITIQUE > MAJEUR > MINEUR
>
> **Mise à jour 2026-06-28** — Items 1 et 2 (CRITIQUE) résolus. Items 3, 4, 7, 8 (MAJEUR) résolus. Items 9, 12, 16 (MINEUR) résolus. L'API Spotify a été supprimée — les dettes liées à Spotify (token, proxy, variables d'env) sont obsolètes.

---

## CRITIQUE — ~~À corriger immédiatement~~ ✅ Résolu

| # | Description | Feature | Fichier(s) | Impact |
|---|-------------|---------|-----------|--------|
| 1 | ~~**Images Spotify non autorisées dans `next/image`**~~ : `next.config.mjs` n'autorise que `lastfm.freetls.fastly.net`. Toute `<Image src="https://i.scdn.co/...">` ou autre CDN Spotify déclenche une erreur Next.js et bloque le rendu de la page entière. | artist-page, album-page | `next.config.mjs` | Bloquant à 100% pour toute page affichant du contenu Spotify. Erreur visible dès le premier render en développement ou production. |
| 2 | ~~**`.env.example` incomplet**~~ ✅ **OBSOLÈTE** — Spotify retiré, seule `LASTFM_API_KEY` est requise : seule `LASTFM_API_KEY` est documentée. `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` sont absents. Tout environnement cloné depuis le dépôt (CI, nouveau dev, déploiement) ne peut pas configurer Spotify sans fouiller le code. | proxy-spotify, spotify-token, artist-page, album-page | `.env.example` | Empêche tout déploiement ou onboarding fonctionnel impliquant l'API Spotify. Risque de déploiement en production avec des variables manquantes et des erreurs 500 silencieuses. |

---

## MAJEUR — Items actifs et résolus

| # | Description | Feature | Fichier(s) | Impact |
|---|-------------|---------|-----------|--------|
| 3 | ~~**Conflit de nommage `SearchResults`**~~ ✅ **RÉSOLU** — `spotify-types.ts` supprimé avec Spotify : le type `SearchResults` est défini dans `src/lib/music-types.ts` (structure Last.fm : `{ tracks, artists, albums }` de types Last.fm) ET dans `src/lib/spotify-types.ts` (structure Spotify). Tout module important les deux fichiers peut utiliser le mauvais type sans erreur de compilation visible si les formes sont partiellement compatibles. | search, artist-page, album-page | `src/lib/music-types.ts`, `src/lib/spotify-types.ts` | Bugs de typage silencieux lors de l'implémentation des features stub. Le compilateur TypeScript ne détectera pas la collision si les imports sont aliasés différemment. |
| 4 | ~~**Résolution d'ID Last.fm → Spotify absente**~~ ✅ **RÉSOLU** — La navigation utilise le nom artiste/album encodé en URL, sans ID Spotify : les cartes de résultats de recherche (tracks, artistes, albums) exposent des données Last.fm avec des `mbid` souvent vides. Les pages de détail (`/artist/[id]`, `/album/[id]`) requièrent des IDs Spotify. Aucun mécanisme de résolution n'est implémenté — les cartes ne sont d'ailleurs pas cliquables dans le code actuel. | search, artist-page, album-page | `src/components/SearchResults.tsx`, `src/app/artist/[id]/page.tsx`, `src/app/album/[id]/page.tsx` | Bloquant fonctionnel majeur : l'application ne permet pas de naviguer de la recherche vers les pages de détail, rendant 3 features inutilisables en cascade. |
| 5 | **Absence de tests sur les Route Handlers** : `/api/search` et `/api/spotify` n'ont aucun test. Les cas 400 (paramètre manquant), 500 (clé absente), 502 (Spotify non-JSON) et la validation du paramètre `path` ne sont pas couverts automatiquement. | proxy-lastfm, proxy-spotify | `src/app/api/search/route.ts`, `src/app/api/spotify/route.ts` | Toute régression sur ces routes (principale source de données de l'app) est invisible jusqu'en production. |
| 6 | **Absence de tests sur `useSearch` et les composants** : le hook `useSearch` (debounce, AbortController, gestion d'erreurs) et les composants `SearchBar`/`SearchResults` n'ont aucun test. | search | `src/hooks/useSearch.ts`, `src/components/SearchBar.tsx`, `src/components/SearchResults.tsx` | La feature centrale de l'application — la seule entièrement implémentée côté UI — peut régresser silencieusement. |
| 7 | ~~**Proxy Spotify sans validation du paramètre `path`**~~ ✅ **OBSOLÈTE** — Proxy Spotify supprimé : le chemin Spotify est transmis tel quel à `api.spotify.com` sans liste blanche ni sanitisation. Un appelant malveillant ou maladroit pourrait appeler n'importe quel endpoint Spotify (y compris des endpoints sensibles ou hors scope) via ce proxy. | proxy-spotify | `src/app/api/spotify/route.ts` | Risque de dépassement de quota Spotify sur des endpoints non prévus. En contexte académique, risque modéré ; en production, surface d'abus non négligeable. |
| 8 | **Fail-fast total dans `Promise.all` du proxy Last.fm** : une erreur sur l'une des 3 recherches parallèles (tracks, artists, albums) fait échouer la réponse entière. Aucune dégradation gracieuse n'est implémentée — si `artist.search` échoue, les tracks et albums valides sont perdus. | proxy-lastfm | `src/app/api/search/route.ts` | Panne partielle de Last.fm = expérience utilisateur totalement dégradée au lieu d'une dégradation partielle. Impact direct sur la résilience de la feature principale. |

---

## MINEUR — À traiter en opportunité

| # | Description | Feature | Fichier(s) | Impact |
|---|-------------|---------|-----------|--------|
| 9 | **`instrumentationHook: true` activé sans code d'instrumentation** — toujours présent dans `next.config.mjs` : l'option expérimentale Next.js est activée dans `next.config.mjs` mais aucun fichier `instrumentation.ts` n'est présent dans le projet. Génère des warnings potentiels et un comportement expérimental sans bénéfice. | Transverse | `next.config.mjs` | Bruit dans les logs de build. Risque de régression lors d'une mise à jour de Next.js qui modifie le comportement de cette option. |
| 10 | ~~**Race condition dans `getSpotifyToken()`**~~ ✅ **OBSOLÈTE** — Module Spotify supprimé : deux requêtes simultanées arrivant avec un cache vide peuvent déclencher deux appels parallèles à `accounts.spotify.com/api/token`. Le second résultat écrase le premier dans le cache. | spotify-token | `src/lib/spotify.ts` | Doublement des appels au quota token Spotify lors des pics de charge. Sans impact fonctionnel immédiat sur un projet académique, mais à corriger (verrouillage par promise en cours) si le trafic augmente. |
| 11 | **Limite de 5 résultats hardcodée** : `lastfmSearch(..., limit = 5)` est codé en dur sans paramètre configurable depuis l'API. Toute pagination ou augmentation du nombre de résultats nécessite une modification du Route Handler. | proxy-lastfm | `src/app/api/search/route.ts` | Flexibilité nulle pour l'évolution du produit (pagination, affichage étendu). Correction triviale mais avec impact sur le contrat de l'endpoint. |
| 12 | ~~**`listeners` absent sur `LastfmAlbum`**~~ ✅ **RÉSOLU** — `AlbumDetail` expose désormais `listeners` et `playcount` : les colonnes Tracks et Artists affichent un compteur d'auditeurs (`listeners`), mais la colonne Albums ne le fait pas car `LastfmAlbum` ne possède pas ce champ dans les types. Incohérence d'affichage. | search | `src/lib/music-types.ts`, `src/components/SearchResults.tsx` | Incohérence visuelle entre les trois colonnes de résultats. Peut être un manque de l'API Last.fm (le champ n'existe pas pour les albums) — à vérifier avant toute correction. |
| 13 | **Fallback index React sur clé instable** : quand `mbid` est absent d'un résultat Last.fm (cas réel et fréquent), l'index du tableau est utilisé comme clé React. Lors d'un rafraîchissement de la liste, React peut réutiliser de mauvais éléments DOM. | search | `src/components/SearchResults.tsx` | Potentiel glitch visuel lors des mises à jour de résultats. Peu visible pour 5 résultats, plus problématique si la limite est augmentée. |
| 14 | **Pas de rate limiting ni de retry sur les appels Last.fm** : une réponse 429 (quota dépassé) de Last.fm est remontée comme erreur 500 générique au client sans différenciation ni backoff. | proxy-lastfm | `src/app/api/search/route.ts` | Dégradation silencieuse si le quota Last.fm est atteint. L'utilisateur voit un message d'erreur générique sans possibilité de retry automatique. |
| 15 | **Logging de l'erreur brute dans le proxy Last.fm** : `console.error("[search route]", err)` logue le message d'exception complet côté serveur, pouvant exposer des détails sur la clé API ou la structure interne dans des environnements de logging centralisé (Vercel logs, etc.). | proxy-lastfm | `src/app/api/search/route.ts` | Risque d'information disclosure dans les logs de production. Faible en pratique mais à assainir avant tout déploiement public. |
| 16 | ~~**Discordance d'URL `/favourites` vs `/favorites`**~~ ✅ **RÉSOLU** — Convention `/favourites` (avec u) retenue : la route Next.js est `/favourites` (avec `u`) mais le README fait référence à `/favorites` (sans `u`). Ambiguïté sur la convention retenue. | favourites | `src/app/favourites/page.tsx`, `README.md` | Confusion pour les développeurs et potentielle discordance dans les liens de navigation à venir. |

---

## Métriques globales

| Indicateur | Valeur |
|-----------|--------|
| Dette CRITIQUE | 2 items |
| Dette MAJEUR   | 6 items |
| Dette MINEUR   | 8 items |
| Couverture de tests estimée | ~10% (1 module sur 7 features, 7 tests sur ~15 chemins critiques) |
| Features sans implémentation | 3 (artist-page, album-page, favourites) |
| ADRs documentés | 4 |
| ADRs manquants | 0 (couverture satisfaisante pour la portée actuelle) |
