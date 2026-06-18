# Audit Initial — SpotiFind

| Champ             | Valeur              |
|-------------------|---------------------|
| Date              | 2026-06-17          |
| Auditeur          | retro-auditor       |
| Source            | Rétro-ingénierie    |
| Features auditées | 7                   |
| ADRs identifiés   | 4                   |

---

## Résumé exécutif

SpotiFind est une application Next.js 14 App Router en TypeScript strict qui agrège des données musicales depuis Last.fm (recherche) et Spotify (pages de détail). La couche implémentée — recherche globale et ses deux proxys serveur — est solide : sécurité des credentials respectée, patterns corrects (debounce, AbortController, cache-token avec retry). Cependant, 3 features sur 7 sont des stubs vides (artist-page, album-page, favourites), ce qui représente la majorité de la valeur produit attendue. La couverture de tests est quasi nulle hors du module `spotify.ts`, et plusieurs problèmes de configuration bloqueront directement les prochaines implémentations (images Spotify non autorisées, `.env.example` incomplet, conflit de types `SearchResults`).

## Stack et architecture

| Composant          | Valeur                                                       |
|--------------------|--------------------------------------------------------------|
| Framework          | Next.js 14.2.35 — App Router, SSR/Client mixte              |
| Langage            | TypeScript 5 — mode strict activé                           |
| UI                 | Tailwind CSS 3.4.1 — composants 100% custom, pas de librairie |
| State              | useState/useEffect natifs — pas de store global             |
| Persistence        | localStorage navigateur uniquement (favoris)                |
| Tests              | Jest 30.4.2 + ts-jest 29.4.11                               |
| Auth               | Aucune auth utilisateur — secrets API en variables d'env serveur |
| CI/CD              | Aucun pipeline identifié                                    |

L'architecture suit un pattern BFF (Backend-for-Frontend) : tous les appels vers Last.fm et Spotify transitent par des Route Handlers Next.js (`/api/search`, `/api/spotify`), les credentials ne sont jamais exposés au navigateur. Le client Spotify (`src/lib/spotify.ts`) implémente un cache mémoire singleton avec marge de sécurité de 30 secondes et retry automatique sur 401. Les types sont séparés entre les modèles Last.fm (`music-types.ts`) et Spotify (`spotify-types.ts`), avec un conflit de nommage sur `SearchResults` présent dans les deux fichiers.

## Cartographie fonctionnelle

| # | Feature         | État        | Complexité | Tests | Spec                              |
|---|-----------------|-------------|------------|-------|-----------------------------------|
| 1 | search          | Fonctionnel | Moyenne    | Non   | docs/specs/search/                |
| 2 | proxy-lastfm    | Fonctionnel | Faible     | Non   | docs/specs/proxy-lastfm/          |
| 3 | proxy-spotify   | Fonctionnel | Faible     | Non   | docs/specs/proxy-spotify/         |
| 4 | spotify-token   | Fonctionnel | Moyenne    | Oui   | docs/specs/spotify-token/         |
| 5 | artist-page     | Stub vide   | Haute      | Non   | docs/specs/artist-page/           |
| 6 | album-page      | Stub vide   | Haute      | Non   | docs/specs/album-page/            |
| 7 | favourites      | Stub vide   | Moyenne    | Non   | docs/specs/favourites/            |

## Points forts

1. **Sécurité des credentials irréprochable** — Le pattern proxy serveur (RETRO-002) est appliqué de manière cohérente et rigoureuse : aucune clé API ne transite vers le navigateur. La règle est encodée dans `.claude/rules/02-stack.md` et dans les deux ADRs concernés.
2. **Client Spotify robuste et bien testé** — `src/lib/spotify.ts` implémente correctement le cache-or-fetch, la marge de sécurité de 30 secondes et le retry-once sur 401. C'est le seul module couvert par des tests (7 cas unitaires pertinents).
3. **Debounce + AbortController sans dépendance externe** — La gestion des requêtes concurrentes dans `useSearch.ts` est correcte et n'introduit pas de librairie superflue.
4. **Architecture modulaire claire** — La séparation `app/`, `components/`, `hooks/`, `lib/` est cohérente et les conventions de nommage sont respectées (PascalCase composants, préfixe `use` hooks).
5. **ADRs documentés et justifiés** — Les 4 décisions architecturales majeures sont tracées avec leur contexte, leurs conséquences et leur recommandation, ce qui facilitera la reprise par un nouveau développeur.

## Risques identifiés

| # | Risque | Criticité | Impact | Feature(s) |
|---|--------|-----------|--------|------------|
| 1 | Images Spotify bloquées par `next/image` : seul `lastfm.freetls.fastly.net` est autorisé dans `next.config.mjs` — toute tentative d'afficher une image Spotify plantera avec une erreur Next.js en production | CRITIQUE | Bloquant à 100% pour les pages artiste et album dès la première tentative d'affichage | artist-page, album-page |
| 2 | `.env.example` incomplet : `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` sont absents — tout nouveau développeur ou déploiement sera bloqué sans savoir quelles variables configurer | CRITIQUE | Empêche tout déploiement fonctionnel impliquant Spotify | proxy-spotify, artist-page, album-page |
| 3 | Conflit de nommage `SearchResults` : le type existe dans `music-types.ts` (Last.fm) ET dans `spotify-types.ts` — tout fichier important les deux risque une collision silencieuse | MAJEUR | Bugs de typage difficiles à diagnostiquer lors de l'implémentation des features stub | search, artist-page, album-page |
| 4 | Résolution d'IDs Last.fm → Spotify non implémentée : les résultats de recherche utilisent des MBIDs Last.fm (souvent absents) alors que les pages de détail requièrent des IDs Spotify — le lien entre les deux est absent | MAJEUR | Bloquant fonctionnel : les cartes de résultats ne peuvent pas naviguer vers les pages artiste/album sans cette résolution | search, artist-page, album-page |
| 5 | `instrumentationHook: true` activé dans `next.config.mjs` sans code d'instrumentation : option expérimentale qui peut générer des warnings ou des comportements inattendus lors des builds | MINEUR | Bruit dans les logs / risque de régression lors des mises à jour Next.js | Transverse |
| 6 | Absence de tests sur les Route Handlers et composants : seul `spotify.ts` est couvert — un bug dans `/api/search`, `/api/spotify` ou `SearchResults` n'est pas détectable automatiquement | MAJEUR | Régressions silencieuses lors des modifications futures | search, proxy-lastfm, proxy-spotify |
| 7 | Race condition potentielle dans `getSpotifyToken()` : deux requêtes simultanées sur un cache vide peuvent déclencher deux appels parallèles à l'endpoint token Spotify | MINEUR | Doublement d'appels au quota token Spotify — sans impact fonctionnel immédiat mais risque à la montée en charge | spotify-token |
| 8 | `Promise.all` fail-fast dans le proxy Last.fm : une erreur sur une des 3 recherches fait échouer la réponse entière au lieu de retourner les 2 catégories disponibles | MINEUR | Dégradation totale pour une panne partielle de Last.fm | proxy-lastfm |

## Recommandations stratégiques

1. **Corriger immédiatement les deux bloquants de déploiement** avant toute implémentation des features stub : domaine Spotify dans `next.config.mjs` et `.env.example` complet. Ces corrections prennent moins d'une heure et débloquent tout le reste.
2. **Résoudre l'ambiguité Last.fm ID → Spotify ID** en définissant la stratégie de navigation (résolution via `/api/spotify?path=/search`, mbid Last.fm comme fallback, ou autre) avant d'implémenter artist-page et album-page — sans cela les pages seront inaccessibles depuis les résultats de recherche.
3. **Ajouter des tests sur le proxy Last.fm et le hook `useSearch`** comme première tâche de stabilisation : ce sont les modules les plus critiques pour l'expérience utilisateur principale et ils n'ont aucune couverture automatique.
