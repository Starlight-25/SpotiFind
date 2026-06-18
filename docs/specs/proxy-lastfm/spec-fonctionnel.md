# Spec Fonctionnelle — Proxy Last.fm [DRAFT — a valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | proxy-lastfm        |
| Version    | 0.1.0               |
| Date       | 2026-06-17          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT               |
| Source     | Retro-ingenierie    |

> **[DRAFT — a valider par le dev]** Cette spec a ete generee par retro-ingenierie
> a partir du code existant. Elle doit etre relue et validee par un developpeur
> qui connait le contexte metier.

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-001](../../adr/RETRO-001-lastfm-primary-search-source.md) | Last.fm comme source primaire de recherche musicale | Documente (retro) |
| [RETRO-002](../../adr/RETRO-002-server-side-api-proxy.md) | Proxy server-side pour les appels aux APIs tierces | Documente (retro) |

---

## Contexte et objectif

Le module `proxy-lastfm` est le point d'entree unique pour toutes les recherches musicales du projet SpotiFind. Son role est double : proteger la cle API Last.fm en la maintenant exclusivement cote serveur, et fournir au client une reponse agregee et normalisee couvrant simultanement les tracks, les artistes et les albums en un seul appel HTTP.

Le client (hook `useSearch`) ne connait que la route interne `/api/search` — il n'a aucune connaissance de Last.fm, de sa structure de reponse, ni de la cle API.

## Regles metier (deduites du code)

1. **Parametre `q` obligatoire** : toute requete sans parametre `q` est rejetee avec une reponse HTTP 400 et un message d'erreur JSON `{ "error": "Missing \`q\` query parameter." }`.
2. **Recherche simultanee sur 3 categories** : pour chaque requete valide, les trois recherches Last.fm (tracks, artistes, albums) sont declenchees en parallele. Une erreur sur l'une d'elles provoque l'echec global de la requete.
3. **Limite de 5 resultats par categorie** : chaque appel Last.fm est limite a 5 resultats (parametre `limit=5` hardcode cote serveur).
4. **Agregation avec fallback sur tableau vide** : si une categorie Last.fm retourne une structure inattendue ou absente, la valeur retournee au client est un tableau vide `[]` plutot qu'une erreur.
5. **Protection de la cle API** : la variable d'environnement `LASTFM_API_KEY` est verifiee a chaque appel. Son absence provoque une erreur levee avec un message explicite, propagee comme erreur 500 au client.
6. **Absence de cache** : chaque requete client genere systematiquement 3 appels HTTP vers Last.fm sans mutualisation entre utilisateurs ni mise en cache serveur.
7. **Remontee d'erreur generique** : toute erreur non geree (Last.fm indisponible, cle invalide, reponse non-ok) est loggee en console et remontee au client avec le message de l'exception et un status HTTP 500.

## Cas d'usage (deduits)

### CU-001 — Recherche par mot-cle

**Acteur** : composant frontend (via `useSearch`)

**Declencheur** : requete `GET /api/search?q=<terme>`

**Flux principal** :
1. Le Route Handler extrait le parametre `q` de l'URL.
2. Trois appels Last.fm sont envoyes en parallele : `track.search`, `artist.search`, `album.search`.
3. Les resultats sont extraits depuis les chemins de reponse Last.fm (`results.trackmatches.track`, `results.artistmatches.artist`, `results.albummatches.album`).
4. Une reponse JSON `{ tracks: [...], artists: [...], albums: [...] }` est retournee avec HTTP 200.

**Flux alternatif A — parametre manquant** :
1. `q` est absent ou vide.
2. Reponse immediate : HTTP 400 `{ "error": "Missing \`q\` query parameter." }`.

**Flux alternatif B — erreur Last.fm** :
1. Un des trois appels paralleles echoue (statut non-ok ou variable d'environnement absente).
2. `Promise.all` rejette.
3. L'erreur est capturee par le bloc `catch`, loggee, et remontee au client : HTTP 500 `{ "error": "<message>" }`.

### CU-002 — Appel sans cle API configuree

**Declencheur** : variable `LASTFM_API_KEY` absente de l'environnement serveur.

**Flux** : la fonction `lastfmSearch` leve une `Error` avec le message `"Missing LASTFM_API_KEY in environment variables."`. Cette erreur remonte via `Promise.all` et est retournee au client en HTTP 500.

## Dependances

- **Last.fm API** : endpoint `https://ws.audioscrobbler.com/2.0/`, methodes `track.search`, `artist.search`, `album.search`.
- **Variable d'environnement** : `LASTFM_API_KEY` (obligatoire, verifiee a l'execution).
- **Consommateurs internes** : `src/hooks/useSearch.ts` (unique appelant connu), qui transmet les resultats a `src/components/SearchResults.tsx`.
- **Types** : `src/lib/music-types.ts` definit les interfaces `LastfmTrack`, `LastfmArtist`, `LastfmAlbum` et `SearchResults` qui modelisent la reponse de ce proxy.

## Zones d'incertitude

> Les points suivants n'ont pas pu etre determines par le code seul :

- **Raison du choix de la limite a 5** : la valeur par defaut `limit = 5` est hardcodee dans la signature de `lastfmSearch`. Il n'est pas clair si ce chiffre est contrainte de maquette, compromis de performance, ou limite temporaire en attente de pagination.
- **Comportement attendu en cas d'erreur partielle** : actuellement, une erreur sur une seule des 3 recherches fait echouer l'ensemble de la reponse. Il n'est pas documente si un comportement de degradation gracieuse (retourner les 2 categories reussies) etait envisage.
- **Quota et rate limiting Last.fm** : aucune gestion de rate limit ou de retry n'est implementee. Le comportement attendu si Last.fm repond avec un 429 ou un quota depasse n'est pas specifie.
- **Encodage du parametre `q`** : le terme est encode via `encodeURIComponent` avant d'etre passe a Last.fm, mais il n'est pas specifie si des caracteres speciaux particuliers ont ete testes.
