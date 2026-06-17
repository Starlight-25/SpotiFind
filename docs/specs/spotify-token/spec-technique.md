# Spec Technique — Gestion du token Spotify

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | spotify-token       |
| Version       | 0.1.0               |
| Date          | 2026-06-17          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module `src/lib/spotify.ts` est un singleton de processus Node.js. Il expose deux fonctions publiques principales :

- `getSpotifyToken()` — point d'entrée pour obtenir un token valide (cache-or-fetch)
- `fetchSpotify(path)` — wrapper de `fetch` vers `https://api.spotify.com/v1` avec gestion automatique du token et retry sur 401

Trois fonctions utilitaires sont également exportées pour les tests :

- `isTokenExpired()` — état du cache
- `getTokenExpiresIn()` — secondes restantes avant expiration
- `invalidateToken()` — réinitialisation forcée du cache

La fonction interne `fetchNewToken()` n'est pas exportée : elle est déclenchée uniquement par `getSpotifyToken()`.

### Flux de fonctionnement

```
Appelant
  └─> fetchSpotify(path)
        ├─> getSpotifyToken()
        │     ├─ [cache valide] → retourne accessToken
        │     └─ [cache vide ou expiré] → fetchNewToken()
        │           └─ POST https://accounts.spotify.com/api/token
        │                 (Basic Auth : clientId:clientSecret en base64)
        │                 body : grant_type=client_credentials
        │                 └─> stocke { accessToken, expiresAt } dans cache
        ├─> GET https://api.spotify.com/v1{path}  (Bearer token)
        │     ├─ [status != 401] → retourne Response
        │     └─ [status 401] → invalidateToken()
        │           └─> getSpotifyToken() [force fetchNewToken]
        │                 └─> GET https://api.spotify.com/v1{path} (retry)
        │                       └─ retourne Response (quel que soit le statut)
```

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `src/lib/spotify.ts` | Gestion du token et wrapper fetch Spotify | ~94 |
| `src/lib/spotify.test.ts` | Tests unitaires du module (seul module testé) | ~140 |
| `src/app/api/spotify/route.ts` | Consommateur de `fetchSpotify` — Route Handler Next.js | N/A |

---

## Schéma BDD

Non applicable — ce module ne persiste aucune donnée. Le cache est exclusivement en mémoire (variable de module).

---

## API exposée (fonctions exportées)

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `getSpotifyToken` | `() => Promise<string>` | Retourne un token valide (depuis cache ou réseau) |
| `fetchSpotify` | `(path: string) => Promise<Response>` | Effectue une requête `GET` vers l'API Spotify v1 |
| `isTokenExpired` | `() => boolean` | Vrai si le cache est vide ou expiré |
| `getTokenExpiresIn` | `() => number \| null` | Secondes restantes avant expiration ; null si pas de cache |
| `invalidateToken` | `() => void` | Vide le cache (usage test + retry interne) |

---

## Patterns identifiés

- **Singleton mémoire** : le cache (`let cache: TokenCache | null`) est une variable de module — une seule instance par processus Node.js. Pas de mécanisme de partage entre workers ou instances serverless.
- **Cache-or-fetch** : `getSpotifyToken()` applique le pattern "retourner depuis cache si valide, sinon fetcher" sans verrouillage concurrent (race condition possible si deux requêtes arrivent simultanément avec un cache vide).
- **Retry-once sur 401** : `fetchSpotify` gère la révocation de token côté Spotify en invalidant le cache et rerejouant la requête une seule fois. Pas de retry sur d'autres codes d'erreur (429, 5xx, réseau).
- **Safety margin** : l'expiration est anticipée de 30 secondes (`expires_in - 30`) pour éviter d'utiliser un token sur le point d'expirer. Ce choix est documenté dans un commentaire de code.
- **`cache: "no-store"`** : tous les `fetch()` vers Spotify désactivent le cache HTTP de Next.js pour forcer des requêtes réseau réelles à chaque appel.
- **Basic Auth base64** : les credentials Spotify sont encodés en base64 (`Buffer.from(clientId:clientSecret).toString("base64")`) conformément à la spécification OAuth2 Client Credentials.

---

## Décisions techniques documentées ici (non-ADR)

### Cache en mémoire de processus (non partagé)

Le token est stocké dans une variable de module JavaScript, pas dans Redis, une base de données, ou un mécanisme de cache distribué. En environnement multi-instance (plusieurs workers Next.js, déploiement serverless), chaque instance obtient son propre token indépendamment. Cela peut augmenter le nombre d'appels à l'endpoint token Spotify si le projet évolue vers un déploiement multi-instance.

### Marge de sécurité de 30 secondes

La durée de vie effective du token mis en cache est `expires_in - 30` secondes. Ce choix évite d'envoyer une requête avec un token qui expire dans les prochaines secondes. La valeur 30s est arbitraire et codée en dur — elle n'est pas configurable.

### Retry limité à 1 tentative sur 401 uniquement

La logique de retry est délibérément minimaliste : un seul retry, déclenché uniquement sur 401. Les erreurs réseau, les réponses 429 (rate limiting), ou les erreurs 5xx ne déclenchent pas de retry. Ce comportement est cohérent avec un module de couche basse qui délègue la gestion des erreurs à l'appelant.

### `cache: "no-store"` sur tous les fetch serveur

Next.js 14 met en cache les réponses `fetch()` par défaut dans les Route Handlers. L'option `cache: "no-store"` est appliquée sur tous les appels (`fetchNewToken` et `fetchSpotify`) pour garantir que chaque appel effectue une vraie requête réseau.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| `src/lib/spotify.test.ts` | `isTokenExpired` (3 cas), `getTokenExpiresIn` (2 cas), `getSpotifyToken` (4 cas), `fetchSpotify` (2 cas) | Existant |

### Couverture identifiée

- Cache vide → retourne true pour `isTokenExpired`
- Après fetch réussi → cache valide, `isTokenExpired` retourne false
- Après `invalidateToken` → cache vide
- `getTokenExpiresIn` retourne null si pas de cache, valeur positive (≤ 3570s) après fetch
- `getSpotifyToken` : fetch initial, réutilisation cache, erreur credentials manquants, erreur réponse non-OK Spotify
- `fetchSpotify` : appel normal avec Bearer token, retry complet sur 401 (4 appels réseau : token + requête + nouveau token + retry)

### Couverture absente (observée)

- Cas `getTokenExpiresIn` retournant 0 (token expiré mais cache non encore invalidé)
- Comportement concurrent (deux appels simultanés sur cache vide)
- Erreurs réseau (fetch rejetant une Promise)
- Réponses 429 ou 5xx de l'API Spotify
