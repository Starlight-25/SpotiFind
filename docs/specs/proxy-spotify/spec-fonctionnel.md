# Spec Fonctionnelle — Proxy Spotify [DRAFT — a valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | proxy-spotify       |
| Version    | 0.1.0               |
| Date       | 2026-06-17          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT               |
| Source     | Retro-ingenierie    |

> [DRAFT — a valider par le dev] Cette spec a ete generee par retro-ingenierie
> a partir du code existant. Elle doit etre relue et validee par un developpeur
> qui connait le contexte metier.

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-002](../../adr/RETRO-002-server-side-api-proxy.md) | Proxy server-side pour les appels aux APIs tierces | Documenté (rétro) |

---

## Contexte et objectif

Le module Proxy Spotify est un intermediaire serveur entre les pages Next.js et l'API Spotify. Il permet aux futures pages artiste (`/artist/[id]`) et album (`/album/[id]`) d'acceder a des donnees Spotify sans que le token d'acces OAuth ne soit jamais transmis au navigateur.

Le proxy expose une unique route HTTP generique (`GET /api/spotify`) qui accepte un parametre `path` representant le chemin Spotify relatif a interroger. Il delegue l'appel a un client Spotify dedie (`src/lib/spotify.ts`) qui gere le cycle de vie du token (obtention, mise en cache, rafraichissement automatique).

## Regles metier (deduites du code)

1. Le parametre `?path=` est obligatoire. Toute requete sans ce parametre est rejetee avec HTTP 400.
2. Le chemin fourni via `?path=` est transmis tel quel a l'API Spotify (`https://api.spotify.com/v1{path}`). Aucune validation de la valeur du chemin n'est effectuee par la route.
3. Le token d'acces Spotify n'est jamais envoye au navigateur client ; il est injecte exclusivement cote serveur par `fetchSpotify()`.
4. Si `fetchSpotify()` leve une exception (credentials manquants, reseau), la route renvoie HTTP 500 avec le message d'erreur.
5. La reponse de Spotify est retransmise telle quelle au client avec le meme code HTTP que celui retourne par Spotify, tant que le corps est du JSON valide.
6. Si Spotify retourne un corps non-JSON, la route renvoie HTTP 502 avec un message d'erreur et les 300 premiers caracteres du corps brut.
7. Le token est mis en cache en memoire serveur et reutilise jusqu'a expiration (marge de 30 secondes avant la date d'expiration declaree par Spotify). Un token expiredou revoque declenche un rafraichissement automatique.
8. En cas de reponse HTTP 401 de Spotify sur un appel API (token revoque avant expiration), le client invalide le cache et effectue une unique tentative de retry avec un nouveau token.

## Cas d'usage (deduits)

### CU-001 — Interroger un endpoint Spotify depuis une page Next.js

Un composant serveur ou client appelle `GET /api/spotify?path=/artists/4Z8W4fKeB5YxbusRsdQVPb` pour obtenir le detail d'un artiste.

- La route extrait le parametre `path`.
- Elle delegue a `fetchSpotify("/artists/4Z8W4fKeB5YxbusRsdQVPb")`.
- `fetchSpotify` obtient un token valide (depuis le cache ou via un appel a `accounts.spotify.com`).
- L'appel vers `api.spotify.com/v1/artists/4Z8W4fKeB5YxbusRsdQVPb` est effectue avec le token en header `Authorization: Bearer`.
- La reponse JSON est retransmise au client avec le code HTTP de Spotify.

### CU-002 — Requete sans parametre path

Un appel `GET /api/spotify` sans `?path=` recoit HTTP 400 `{ "error": "Missing \`path\` query parameter." }`.

### CU-003 — Spotify retourne du non-JSON (ex. erreur CDN)

La route retourne HTTP 502 `{ "error": "Spotify returned non-JSON", "raw": "<debut_du_corps>" }`.

### CU-004 — Token revoque cote Spotify avant expiration

`fetchSpotify` recoit un 401, invalide le cache, obtient un nouveau token et rejoue la requete une fois. Le client recoit la reponse du second appel.

## Dependances

- `src/lib/spotify.ts` — client Spotify (gestion token, `fetchSpotify`)
- Variables d'environnement serveur : `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- API externe : `https://accounts.spotify.com/api/token` (OAuth 2.0 Client Credentials)
- API externe : `https://api.spotify.com/v1` (API Spotify)
- Next.js Route Handlers (`NextRequest`, `NextResponse`)

## Zones d'incertitude

> Les points suivants n'ont pas pu etre determines par le code seul :

- Le parametre `?path=` est passe tel quel a Spotify sans aucune validation ni liste blanche de chemins autorises. Il n'est pas etabli si c'est volontaire (confiance totale aux appelants internes) ou un oubli de validation.
- Il n'existe pas de mecanisme de rate limiting ni de quota sur la route `/api/spotify` : plusieurs appels simultanes cote client pourraient generer autant d'appels vers Spotify. L'intention en production n'est pas documentee.
- La gestion du cache token est un singleton en memoire de processus Node.js. En mode multi-instance (deploiement distribue), chaque instance maintiendrait son propre cache. L'impact sur les quotas de tokens Spotify n'est pas evalue.
- La route ne supporte que la methode `GET`. Il n'est pas precise si des methodes POST/PUT vers Spotify seront eventuellement necessaires pour les futures pages.
