# ~~Spec Fonctionnelle — Gestion du token Spotify~~ [OBSOLÈTE]

> **[OBSOLÈTE — 2026-06-28]** Le module `src/lib/spotify.ts` et ses tests ont été supprimés. L'authentification Spotify (Client Credentials) n'est plus utilisée. Conservé à titre d'historique.

| Champ      | Valeur              |
|------------|---------------------|
| Module     | spotify-token       |
| Version    | 0.1.0               |
| Date       | 2026-06-17          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT               |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant. Elle doit être relue et validée par un développeur
> qui connaît le contexte métier.

---

## ADRs

— (ADR RETRO-003 supprimé avec le retrait de Spotify)

---

## Contexte et objectif

Ce module fournit à l'ensemble du serveur Next.js un accès authentifié à l'API Spotify Web. Il gère le cycle de vie d'un token OAuth2 de type Client Credentials : obtention initiale, mise en cache mémoire, détection d'expiration, et renouvellement automatique. Aucune action utilisateur n'est requise pour obtenir le token — il est acquis de façon transparente à la première requête qui en a besoin.

L'objectif est de ne jamais exposer les credentials Spotify (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`) ni le token d'accès au navigateur client. Tout transit par le serveur Next.js.

---

## Règles métier (déduites du code)

1. Un token valide est requis pour toute requête vers `https://api.spotify.com/v1`. Sans credentials configurés, l'application ne peut pas interroger Spotify.
2. Le token est considéré expiré si aucun token n'est en cache, ou si `Date.now() >= expiresAt`. La date d'expiration est calculée avec une marge de sécurité de 30 secondes par rapport au `expires_in` fourni par Spotify.
3. Tant que le token n'est pas expiré, il est réutilisé sans nouvel appel réseau vers Spotify.
4. Si l'API Spotify retourne un statut 401 sur une requête de données (indiquant une révocation côté serveur Spotify avant l'expiration prévue), le token en cache est invalidé et un nouveau token est obtenu immédiatement. La requête initiale est rejouée une seule fois avec le nouveau token.
5. L'obtention d'un nouveau token échoue avec une erreur explicite si `SPOTIFY_CLIENT_ID` ou `SPOTIFY_CLIENT_SECRET` sont absents de l'environnement.
6. L'obtention d'un nouveau token échoue avec une erreur incluant le statut HTTP si Spotify retourne une réponse non-OK lors de la demande de token.

---

## Cas d'usage (déduits)

### CU-001 — Premier appel Spotify (cache vide)

Le serveur reçoit une requête vers un endpoint Spotify. Aucun token n'est en cache. Le module obtient un nouveau token via le flow Client Credentials, le met en cache avec une expiration calculée (durée Spotify - 30s), puis effectue la requête Spotify avec ce token. La réponse est retournée à l'appelant.

### CU-002 — Appel Spotify ultérieur (token valide en cache)

Le serveur reçoit une requête vers un endpoint Spotify. Un token valide est en cache. Le module le réutilise directement sans appel réseau supplémentaire vers Spotify. La requête Spotify est effectuée avec le token mis en cache.

### CU-003 — Token révoqué par Spotify avant expiration (401)

Le serveur effectue une requête Spotify avec un token en cache considéré valide. Spotify retourne 401. Le module invalide le cache, obtient un nouveau token, et rejoue la requête. Le résultat de la deuxième tentative est retourné à l'appelant, quel que soit son statut.

### CU-004 — Credentials manquants

Le serveur tente d'obtenir un token mais `SPOTIFY_CLIENT_ID` ou `SPOTIFY_CLIENT_SECRET` n'est pas défini. Une erreur explicite est levée, qui remonte à l'appelant.

---

## Dépendances

- Variables d'environnement serveur : `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- Endpoint Spotify token : `https://accounts.spotify.com/api/token`
- API Spotify données : `https://api.spotify.com/v1`
- Module consommateur : `src/app/api/spotify/route.ts` (Route Handler Next.js)

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- Le comportement lors d'un second 401 consécutif (après retry) n'est pas géré explicitement : la réponse 401 du retry est retournée telle quelle à l'appelant. Est-ce intentionnel ou une dette à adresser ?
- Le cache est une variable de module JavaScript (singleton de processus). En mode serverless ou avec plusieurs workers Next.js, chaque instance maintient son propre cache. L'impact de cette contrainte sur la limite de taux de l'API Spotify token n'a pas été évalué dans le code.
- La politique de retry est limitée à 1 tentative sur 401 uniquement. Les erreurs 429 (rate limit), 5xx ou les erreurs réseau ne sont pas gérées — est-ce une décision volontaire ?
