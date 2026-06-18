# Spec Technique — Proxy Last.fm

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | proxy-lastfm        |
| Version       | 0.1.0               |
| Date          | 2026-06-17          |
| Source        | Retro-ingenierie    |

## Architecture du module

Le module est compose d'un seul fichier Route Handler Next.js (`src/app/api/search/route.ts`). Il n'utilise aucune abstraction de couche service, aucun ORM, et aucune dependance npm tierce — uniquement les primitives Next.js et le `fetch` natif Node.js.

L'architecture repose sur deux elements :

1. **`lastfmSearch(method, field, query, limit)`** — fonction interne (non exportee) qui construit l'URL Last.fm, effectue le fetch avec `cache: "no-store"`, verifie le statut HTTP et retourne le JSON brut.

2. **`GET(req: NextRequest)`** — export nomme qui constitue le handler HTTP. Il extrait `q`, declenche `Promise.all` sur 3 appels `lastfmSearch`, normalise la reponse et gere les erreurs.

```
Client (useSearch)
    |
    | GET /api/search?q=<term>
    v
Route Handler (GET)
    |-- lastfmSearch("track.search",  "track",  query, 5)  -->  Last.fm API
    |-- lastfmSearch("artist.search", "artist", query, 5)  -->  Last.fm API
    `-- lastfmSearch("album.search",  "album",  query, 5)  -->  Last.fm API
    |
    | Promise.all => agregation
    v
{ tracks: [...], artists: [...], albums: [...] }
```

## Fichiers impactes

| Fichier | Role | Lignes |
|---------|------|--------|
| `src/app/api/search/route.ts` | Route Handler — proxy et agregation Last.fm | ~38 |
| `src/lib/music-types.ts` | Interfaces TypeScript modelisant la reponse de ce proxy | ~35 |
| `src/hooks/useSearch.ts` | Consommateur — appel debounce + AbortController vers ce proxy | ~58 |

## Schema BDD

Non applicable — ce module n'utilise pas de base de donnees. Aucune persistance.

## API / Endpoints

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/search?q=<terme>` | Recherche simultanee tracks/artists/albums via Last.fm | Aucune (publique cote client) |

### Reponse HTTP 200

```json
{
  "tracks":  [ /* LastfmTrack[]  — jusqu'a 5 resultats */ ],
  "artists": [ /* LastfmArtist[] — jusqu'a 5 resultats */ ],
  "albums":  [ /* LastfmAlbum[]  — jusqu'a 5 resultats */ ]
}
```

### Erreurs

| Status | Condition | Corps |
|--------|-----------|-------|
| 400 | Parametre `q` absent | `{ "error": "Missing \`q\` query parameter." }` |
| 500 | Cle `LASTFM_API_KEY` absente | `{ "error": "Missing LASTFM_API_KEY in environment variables." }` |
| 500 | Reponse Last.fm non-ok | `{ "error": "Last.fm error <status> for method=<method>" }` |
| 500 | Toute autre exception | `{ "error": "<message d'exception>" }` |

## Appel Last.fm — detail de construction de l'URL

```
https://ws.audioscrobbler.com/2.0/
  ?method=<method>
  &<field>=<encodeURIComponent(query)>
  &api_key=<LASTFM_API_KEY>
  &format=json
  &limit=<limit>
```

| Appel | `method` | `field` | Chemin de reponse exploite |
|-------|----------|---------|---------------------------|
| Tracks | `track.search` | `track` | `results.trackmatches.track` |
| Artistes | `artist.search` | `artist` | `results.artistmatches.artist` |
| Albums | `album.search` | `album` | `results.albummatches.album` |

## Patterns identifies

- **Proxy pattern** : le Route Handler masque integralement Last.fm au client — URL, cle API, et structure de reponse brute sont opaques pour le navigateur.
- **Fan-out parallele** : `Promise.all` sur 3 promises independantes ; la latence totale est bornee par le plus lent des 3 appels (pas d'accumulation sequentielle).
- **Normalisation a l'agregation** : les chemins d'extraction (`?.trackmatches?.track ?? []`) absorbent les structures absentes ou nulles sans lever d'exception.
- **Fail-fast** : l'absence de `LASTFM_API_KEY` est detectee au moment de chaque appel `lastfmSearch`, pas au demarrage du serveur — ce qui signifie que l'erreur n'apparait qu'a la premiere requete.

## Configuration et variables d'environnement

| Variable | Obligatoire | Usage |
|----------|-------------|-------|
| `LASTFM_API_KEY` | Oui | Injectee dans chaque URL d'appel Last.fm via `process.env` |

La variable est lue a chaque invocation de `lastfmSearch` (pas de cache de la valeur en module-scope). Cela signifie qu'un hot-reload de la variable en developpement est pris en compte sans redemarrage, mais aussi qu'une absence de cle n'est pas detectee au demarrage.

## Decisions techniques documentees en spec (non ADR)

- **`cache: "no-store"` sur les fetch Last.fm** : conforme a la convention du projet (documentee dans `.claude/rules/02-stack.md`). Evite que le cache Next.js ne retourne des resultats perimes. Consequence : 3 appels HTTP Last.fm pour chaque requete utilisateur, sans mutualisation entre utilisateurs distincts.
- **Limite hardcodee `limit = 5`** : valeur par defaut du parametre optionnel de `lastfmSearch`. Non exposee dans le contrat de l'endpoint — le client ne peut pas surcharger cette limite. Toute evolution vers de la pagination necessiterait un nouveau parametre query et une modification du Route Handler.
- **Echec global sur erreur partielle** : `Promise.all` echoue si l'un des 3 appels echoue. Il n'existe pas de logique de fallback partiel (ex. retourner les 2 categories disponibles si 1 echoue). Ce comportement n'est pas documente comme intentionnel.
- **Logging de l'erreur brute** : `console.error("[search route]", err)` expose le message d'erreur interne (potentiellement avec des details sur la cle API ou l'URL) dans les logs serveur. Ce log est accessible dans les environnements de deploiement Next.js (Vercel logs, etc.).

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| — | Route Handler `/api/search` | Absent |
| — | Fonction interne `lastfmSearch` | Absent |

Aucun test unitaire ni d'integration n'est present pour ce module. Le seul fichier de test du projet (`src/lib/spotify.test.ts`) couvre le client Spotify, pas le proxy Last.fm.
