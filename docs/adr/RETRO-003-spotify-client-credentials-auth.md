# RETRO-003 — Spotify : OAuth2 Client Credentials Flow (pas d'authentification utilisateur)

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-17          |
| Source     | Rétro-ingénierie    |
| Features   | spotify-token       |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | AUTH |
| Q1 — Coût de revert > 1j ? | OUI — passer au flow Authorization Code (ou PKCE) nécessiterait de revoir `spotify.ts`, `src/app/api/spotify/route.ts`, et toutes les pages futures qui appellent `fetchSpotify` ; implique l'ajout d'une couche session utilisateur absente du projet. |
| Q2 — Non-déductible du code ? | OUI — le choix entre Client Credentials, Authorization Code et PKCE n'est pas visible dans `package.json` ni dans `tsconfig.json` ; seule la lecture de `spotify.ts` révèle que le flow retenu est `grant_type=client_credentials`, ce qui implique l'impossibilité d'accéder aux données utilisateur Spotify. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — contraint `spotify-token` (ce module) ET `src/app/api/spotify/route.ts` (Route Handler consommateur) ; toute future spec artist ou album qui utilise `fetchSpotify` hérite de cette contrainte. |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev qui ajoute un endpoint nécessitant des scopes utilisateur Spotify (ex : `user-read-recently-played`, `playlist-modify-public`) construirait sur un token qui ne peut pas fournir ces scopes, causant des erreurs 403 silencieuses en production. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

---

## Contexte

SpotiFind utilise l'API Spotify uniquement pour enrichir des résultats de recherche (détails artiste, album) — pas pour agir sur le compte d'un utilisateur Spotify. Le flow Client Credentials est le plus simple pour ce cas d'usage : il ne nécessite pas de redirection OAuth ni de gestion de session utilisateur, et s'obtient avec deux variables d'environnement serveur.

---

## Décision identifiée

Le module `src/lib/spotify.ts` implémente exclusivement le flow OAuth2 **Client Credentials** (`grant_type=client_credentials`). Le token est obtenu avec les credentials applicatifs (`SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`) via un `POST` en Basic Auth sur `https://accounts.spotify.com/api/token`. Aucun scope utilisateur n'est demandé ni possible avec ce flow.

---

## Conséquences observées

### Positives

- Pas de gestion de session utilisateur, pas de callback OAuth, pas de refresh token à stocker — implémentation minimale.
- Le token est entièrement server-side, les credentials ne transitent jamais vers le navigateur.
- Cohérent avec l'usage actuel : données publiques Spotify uniquement (artistes, albums).

### Négatives / Dette

- Ce flow ne permet pas d'accéder aux endpoints Spotify nécessitant un scope utilisateur (historique d'écoute, playlists, favoris Spotify). Si SpotiFind évolue pour intégrer le compte Spotify d'un utilisateur, l'ensemble de la couche auth devra être refondue.
- Le cache mémoire singleton (variable de module) n'est pas partagé entre workers. En déploiement multi-instance, plusieurs tokens distincts sont maintenus simultanément — compatible avec Client Credentials (Spotify l'autorise) mais à surveiller si les limites de taux deviennent contraignantes.

---

## Recommandation

**Garder** — le flow Client Credentials est approprié tant que SpotiFind n'accède qu'à des données publiques Spotify. Si une feature nécessite des données utilisateur Spotify, documenter la migration vers Authorization Code avec PKCE avant d'implémenter.
