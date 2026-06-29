# ~~Spec Technique — Proxy Spotify~~ [OBSOLÈTE]

> **[OBSOLÈTE — 2026-06-28]** La route `/api/spotify` et le module `src/lib/spotify.ts` ont été supprimés du projet. L'API Spotify n'est plus utilisée. Conservé à titre d'historique.

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | proxy-spotify       |
| Version       | 0.1.0               |
| Date          | 2026-06-17          |
| Source        | Retro-ingenierie    |

## Architecture du module

Le module est compose de deux couches :

**Route Handler (`src/app/api/spotify/route.ts`)** — Point d'entree HTTP. Valide la presence du parametre `path`, delegue a `fetchSpotify()`, gere la deserialisation JSON de la reponse et normalise les erreurs en JSON.

**Client Spotify (`src/lib/spotify.ts`)** — Couche d'acces a l'API Spotify. Contient la logique de token management (cache en memoire, expiration, refresh) et la fonction `fetchSpotify()` qui effectue l'appel authentifie avec retry automatique sur 401.

```
Client HTTP
    |
    | GET /api/spotify?path=<chemin_spotify>
    v
[Route Handler] src/app/api/spotify/route.ts
    | fetchSpotify(path)
    v
[Client Spotify] src/lib/spotify.ts
    | getSpotifyToken()  →  cache mémoire (TokenCache)
    |                    →  POST /api/token (si expiré)
    v
https://api.spotify.com/v1{path}
```

## Fichiers impactes

| Fichier | Role | Lignes |
|---------|------|--------|
| `src/app/api/spotify/route.ts` | Route Handler Next.js — point d'entree HTTP du proxy | ~34 |
| `src/lib/spotify.ts` | Client Spotify — token lifecycle + fetch wrapper | ~94 |
| `src/lib/spotify.test.ts` | Tests unitaires du client Spotify | ~140 |
| `src/lib/spotify-types.ts` | Types TypeScript pour les reponses Spotify (non examine dans cette feature) | — |

## Schema BDD (si applicable)

Aucune base de donnees. La persistance du token est un cache memoire en variable de module Node.js (`let cache: TokenCache | null`). Ce cache est perdu a chaque redemarrage du serveur.

## API / Endpoints

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/spotify?path=<chemin>` | Proxy transparent vers `api.spotify.com/v1{chemin}` | Aucune (cote client) — Bearer token injecte cote serveur |

### Parametres

| Param | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `path` | query string | Oui | Chemin relatif Spotify (ex. `/artists/4Z8W4...`, `/search?q=...&type=track`) |

### Reponses

| Code | Condition | Corps |
|------|-----------|-------|
| 200–4xx | Reponse Spotify valide en JSON | Corps JSON de Spotify, status HTTP miroir |
| 400 | Parametre `path` absent | `{ "error": "Missing \`path\` query parameter." }` |
| 500 | Exception levee par `fetchSpotify()` | `{ "error": "<message exception>" }` |
| 502 | Spotify a repondu en non-JSON | `{ "error": "Spotify returned non-JSON", "raw": "<300 premiers chars>" }` |

## Token Management (src/lib/spotify.ts)

| Fonction | Visibilite | Role |
|----------|------------|------|
| `getSpotifyToken()` | export | Retourne le token depuis le cache ou en obtient un nouveau |
| `fetchNewToken()` | interne | Appel POST `accounts.spotify.com/api/token` (Client Credentials) |
| `isTokenExpired()` | export | Verifie si le cache est vide ou expire |
| `getTokenExpiresIn()` | export | Retourne les secondes restantes avant expiration (utilitaire de debug) |
| `invalidateToken()` | export | Vide le cache manuellement (utilise lors du retry 401) |
| `fetchSpotify(path)` | export | Fetch authentifie avec retry automatique sur 401 |

### Logique de cache token

```
expiresAt = Date.now() + (expires_in - 30) * 1000
```

Spotify declare `expires_in` en secondes (typiquement 3600). Une marge de 30 secondes est soustraite pour eviter d'utiliser un token en fin de vie.

### Flux de retry 401

1. Premier appel → 401 recu
2. `invalidateToken()` — vide le cache
3. `fetchNewToken()` — obtient un nouveau token
4. Deuxieme appel avec le nouveau token
5. Le resultat du deuxieme appel est retourne sans nouvelle tentative

## Patterns identifies

- **Proxy pattern** — la route `/api/spotify` est un proxy transparent qui transmet le chemin, retransmit le status HTTP et le corps JSON de Spotify sans transformation metier.
- **Cache-aside pattern** — `getSpotifyToken()` verifie le cache avant d'appeler l'API d'auth ; le cache est mis a jour uniquement lors d'un fetch.
- **Retry-once pattern** — `fetchSpotify()` effectue exactement une tentative supplementaire sur 401, sans boucle ni backoff. Pas de retry sur d'autres codes d'erreur (5xx, timeout).
- **Singleton en variable de module** — le cache `let cache: TokenCache | null` est un singleton lie au cycle de vie du processus Node.js (non exportable, non injectable, non mockable sans `invalidateToken()`).

## Decisions techniques documentees en spec (non ADR)

**Validation du parametre `path` non effectuee** — le chemin Spotify est transmis tel quel a `api.spotify.com` sans liste blanche ni sanitization. Cela simplifie le code mais permet theoriquement d'appeler n'importe quel endpoint Spotify depuis le client via ce proxy (ex. `/users/{user_id}/playlists`).

**Un seul retry sur 401, pas de retry sur 5xx** — la logique de retry est implementee uniquement pour les tokens revoques (401). Les erreurs Spotify transitoires (502, 503) ne declenchent pas de retry et remontent directement au client.

**`cache: "no-store"` sur tous les fetch()** — applique a la fois sur l'appel token et sur l'appel API Spotify, conformement a la convention du projet (voir `.claude/rules/02-stack.md`). Empeche Next.js de mettre en cache les reponses Spotify.

**Logging console** — `console.error` sur les exceptions de `fetchSpotify()` et `console.log` avec status + 300 premiers chars du body sur chaque reponse. Ces logs sont visibles uniquement cote serveur (terminal Next.js).

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| `src/lib/spotify.test.ts` | `isTokenExpired`, `getTokenExpiresIn`, `getSpotifyToken` (fetch, cache, missing env), `fetchSpotify` (appel API, retry 401) | Existant |
| `src/app/api/spotify/route.ts` | Aucun test de la route elle-meme | Absent |

La couverture de test porte entierement sur `src/lib/spotify.ts`. La Route Handler (`route.ts`) — notamment la validation du parametre `path`, la deserialisation JSON, les cas 400/502 — n'est pas testee.
