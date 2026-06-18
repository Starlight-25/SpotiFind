# Spec Fonctionnelle — Recherche Globale [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | search              |
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

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-001](../../adr/RETRO-001-lastfm-primary-search-source.md) | Last.fm comme source primaire de recherche | Documenté (rétro) |
| [RETRO-002](../../adr/RETRO-002-server-side-api-proxy.md) | Proxy server-side pour les clés API tierces | Documenté (rétro) |

---

## Contexte et objectif

SpotiFind est une application de découverte musicale. La feature "Recherche globale" constitue le point d'entrée principal de l'application : depuis la homepage, l'utilisateur peut taper un terme libre pour trouver simultanément des pistes, des artistes et des albums. Les résultats sont fournis par l'API Last.fm, via un proxy serveur qui protège la clé API.

## Règles métier (déduites du code)

1. La recherche ne se déclenche pas si la saisie est vide ou ne contient que des espaces (la valeur est trimée avant d'être transmise au hook).
2. La recherche est déclenchée avec un délai de 400 ms après la dernière frappe (debounce), évitant une requête par caractère.
3. Si une nouvelle recherche est lancée avant que la précédente ne soit terminée, la requête en cours est annulée (AbortController). Seuls les résultats de la requête la plus récente sont affichés.
4. Les résultats sont limités à 5 entrées par catégorie (tracks, artists, albums), limite fixée côté serveur.
5. Chaque catégorie affiche un message "No results" si la liste est vide, plutôt qu'une section absente.
6. Si la recherche échoue (erreur HTTP ou réseau), un message d'erreur générique est affiché : "Something went wrong. Please try again." Les erreurs d'annulation (AbortError) sont silencieusement ignorées.
7. Les appels aux trois méthodes Last.fm (`track.search`, `artist.search`, `album.search`) sont effectués en parallèle pour minimiser la latence.
8. La clé API Last.fm n'est jamais exposée au client : tous les appels vers Last.fm transitent par le Route Handler `/api/search`.

## Cas d'usage (déduits)

### CU-001 — Recherche libre depuis la homepage

**Acteur :** Visiteur non authentifié

**Préconditions :** L'application est démarrée et la variable `LASTFM_API_KEY` est présente en environnement serveur.

**Flux principal :**
1. L'utilisateur arrive sur `/` et voit le champ de recherche avec le placeholder "Search artists, albums, tracks…".
2. L'utilisateur tape un terme (ex. "radiohead").
3. Après 400 ms d'inactivité, le hook `useSearch` envoie une requête `GET /api/search?q=radiohead`.
4. Le serveur envoie en parallèle trois requêtes vers Last.fm et agrège les résultats.
5. Le composant `SearchResults` affiche les résultats en trois colonnes : Tracks, Artists, Albums.
6. Un indicateur "Searching…" est visible pendant le chargement.

**Flux alternatifs :**
- Si l'utilisateur efface le champ : les résultats sont masqués, aucune requête n'est émise.
- Si l'utilisateur modifie la saisie avant 400 ms : le timer est réinitialisé et la requête précédente est annulée.
- Si Last.fm répond avec une erreur HTTP ou si le réseau est indisponible : le message d'erreur générique est affiché.
- Si une catégorie ne retourne aucun résultat : la colonne affiche "No results".

### CU-002 — Absence de résultats pour une catégorie

**Flux :** La requête aboutit mais l'une des listes retournées par Last.fm est vide (tableau vide ou champ absent). La colonne correspondante affiche "No results" sans masquer les autres colonnes.

## Dépendances

- **Last.fm API** — source de données pour la recherche (tracks, artists, albums). Clé requise : `LASTFM_API_KEY`.
- **Next.js Route Handler `/api/search`** — proxy serveur entre le hook `useSearch` et Last.fm.
- **React hooks natifs** — `useState`, `useEffect`, `useRef` (pas de librairie de state management externe).

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- La limite de 5 résultats par catégorie est-elle une contrainte produit intentionnelle ou un placeholder temporaire ?
- Le placeholder "Search artists, albums, tracks…" est-il la formulation définitive validée par le product owner ?
- Les pages de détail `/artist/[id]` et `/album/[id]` sont-elles les destinations prévues au clic sur un résultat ? (Ces routes existent mais les composants de carte ne contiennent pas de lien navigable dans le code actuel.)
- Le fallback d'image (carré gris / cercle avec initiale) est-il le comportement attendu en production ou un état transitoire ?
- L'affichage du nombre d'auditeurs (`listeners`) est-il obligatoire ? Il est présent sur `TrackCard` et `ArtistCard` mais absent sur `AlbumCard`.
