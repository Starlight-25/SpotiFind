# RETRO-002 — Proxy server-side pour les appels aux APIs tierces

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-17          |
| Source     | Rétro-ingénierie    |
| Features   | search              |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | SECURITY |
| Q1 — Coût de revert > 1j ? | OUI — passer les appels côté client nécessite de revoir l'architecture de tous les accès API (search et Spotify), de remplacer les Route Handlers par une solution de gestion de secrets côté client (impossible sans risque d'exposition), et d'adapter les types de réponse actuellement normalisés par les proxys. L'impact est transverse à l'ensemble des intégrations tierces du projet. |
| Q2 — Non-déductible du code ? | OUI — `package.json` liste seulement `next` ; le choix délibéré de ne jamais appeler Last.fm ou Spotify directement depuis le navigateur est une décision architecturale qui ne se lit pas dans la configuration du framework. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — le pattern est appliqué dans `src/app/api/search/route.ts` (Last.fm) et `src/app/api/spotify/route.ts` (Spotify), et concernera obligatoirement toute future intégration tierce. La règle est explicitement documentée dans `.claude/rules/02-stack.md` : "Les appels API externes ne passent jamais par le client". |
| Q4 — Casse un invariant si ignoré ? | OUI — un développeur ajoutant un appel `fetch("https://ws.audioscrobbler.com/...")` directement dans un composant client exposerait `LASTFM_API_KEY` en clair dans les requêtes réseau du navigateur, violant l'invariant de sécurité fondamental du projet. |

> Validé contre la politique ADR v2.3.0 (catégorie SECURITY, aucun anti-pattern AP-1 à AP-7, 4/4 questions OUI).

## Contexte

Le projet utilise deux APIs tierces nécessitant des credentials secrets : Last.fm (clé API) et Spotify (Client ID + Client Secret via OAuth 2.0 Client Credentials). Dans une application Next.js App Router rendue partiellement côté client, exposer ces credentials dans des composants `"use client"` les rendrait visibles dans les outils de développement du navigateur et dans les bundles JavaScript publics.

## Décision identifiée

Tous les appels vers des APIs tierces authentifiées transitent exclusivement par des Route Handlers Next.js (`src/app/api/`). Les composants clients ne connaissent que les routes internes (`/api/search`, `/api/spotify`). Les credentials sont lus uniquement depuis `process.env` côté serveur et ne sont jamais sérialisés dans les réponses JSON retournées au client.

Cette règle est renforcée par la stack : `cache: "no-store"` est appliqué sur tous les `fetch()` serveur pour éviter que Next.js ne mette en cache des réponses contenant potentiellement des données sensibles.

## Conséquences observées

### Positives
- Aucune clé API n'est exposée dans les bundles client ou les requêtes réseau du navigateur.
- Le client Spotify peut gérer le cache de token et le refresh automatique côté serveur (`src/lib/spotify.ts`) sans que le token ne soit jamais transmis au client.
- Les Route Handlers servent de couche de normalisation : ils peuvent agréger, filtrer et reformater les réponses tierces avant de les transmettre au client.

### Négatives / Dette
- Chaque intégration API tierce nécessite un Route Handler dédié, même pour des opérations simples en lecture seule.
- L'absence de cache serveur (`cache: "no-store"`) sur les appels Last.fm signifie que chaque requête utilisateur génère systématiquement 3 appels HTTP vers Last.fm, sans mutualisations possible entre utilisateurs tapant le même terme.
- Les erreurs internes (ex. Last.fm down) sont remontées au client sous forme de message générique, perdant le détail de l'erreur d'origine.

## Recommandation

Garder. Il s'agit d'un invariant de sécurité non négociable pour ce type d'application. Documenter explicitement cette règle dans le guide de contribution (CONTRIBUTING.md) pour éviter toute régression lors de l'ajout de nouvelles intégrations. Envisager un cache serveur court (ex. 60 secondes) sur les résultats Last.fm pour réduire la charge API sur les termes fréquents.
