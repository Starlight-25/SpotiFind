# Spec Fonctionnelle — Favoris

| Champ      | Valeur              |
|------------|---------------------|
| Module     | favourites          |
| Version    | 0.2.0               |
| Date       | 2026-06-28          |
| Auteur     | update-writer       |
| Statut     | Validé              |
| Source     | Code implémenté     |

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-004](../../adr/RETRO-004-favourites-localstorage.md) | Persistance favoris via localStorage | Actif (base) |

> Note : la spec technique v0.6.3 documente une couche Supabase en complément du localStorage. Voir `spec-technique.md`.

---

## Contexte et objectif

La page `/favourites` affiche la liste des artistes et tracks mis en favoris par l'utilisateur authentifié. Les favoris sont persistés en `localStorage` sous la clé `spotifind_favourites` et synchronisés avec Supabase. L'ajout aux favoris est disponible depuis les pages artiste, album et les résultats de recherche via le composant `HeartButton`.

---

## Règles métier

1. La page `/favourites` est réservée aux utilisateurs authentifiés. Le `HeartButton` redirige vers `/login` si l'utilisateur n'est pas connecté.
2. Deux types d'éléments peuvent être mis en favoris : `"artist"` et `"track"`. (Les albums ne sont pas favorisables directement dans l'implémentation actuelle.)
3. Les favoris sont affichés en deux sections séparées : **Artists** (en haut) et **Tracks** (en bas), triés par date d'ajout décroissante (`addedAt` desc).
4. Chaque ligne de favori affiche : image/initiale, nom, artiste (pour les tracks), et des données live enrichies depuis Last.fm (voir §Enrichissement live).
5. L'utilisateur peut retirer un favori via le bouton cœur rouge à droite de chaque ligne. La mise à jour est immédiate sans rechargement.
6. En l'absence de favoris, un `EmptyState` invite l'utilisateur à cliquer sur un cœur depuis la recherche ou une page de détail.
7. Chaque ligne est cliquable et redirige vers `item.href` (page artiste ou page album associée au track).

---

## Enrichissement live (Last.fm)

Après le montage, la page enrichit chaque favori avec des données live via les API internes :

| Kind | Endpoint | Données récupérées |
|------|----------|--------------------|
| `artist` | `GET /api/artist-info?name=<name>` | `listeners` (monthly listeners Last.fm) |
| `track` | `GET /api/track-info?artist=<artist>&track=<name>` | `playcount`, `duration` (ms), `album` (titre) |

Ces appels sont en parallèle (`Promise.all`). Les erreurs sont silencieuses — l'absence de données live n'empêche pas l'affichage du favori.

---

## Cas d'usage

### CU-001 — Consultation des favoris

**Acteur :** Utilisateur authentifié

**Préconditions :**
- L'utilisateur est connecté.
- `LASTFM_API_KEY` présent en environnement serveur (pour l'enrichissement live).

**Flux principal :**
1. L'utilisateur navigue vers `/favourites`.
2. La page lit les favoris via `useFavourites()` (localStorage + contexte Supabase).
3. Les sections Artists et Tracks sont affichées, triées par `addedAt` desc.
4. En parallèle, les données live sont récupérées et injectées dans les lignes.

**Flux alternatifs :**
- Aucun favori → `EmptyState` "Aucun favori pour le moment."
- Données live indisponibles → la ligne s'affiche sans métadonnées supplémentaires.

### CU-002 — Ajout d'un favori (depuis une autre page)

**Acteur :** Utilisateur authentifié

**Flux :**
1. L'utilisateur clique sur `HeartButton` sur une page artiste, album ou résultats.
2. `toggle(item)` est appelé via `useFavourites()`.
3. L'item est ajouté/retiré du localStorage et synchronisé avec Supabase.
4. Animation burst de particules si ajout.

**Flux alternatif :** Utilisateur non authentifié → redirection `/login`.

### CU-003 — Suppression d'un favori depuis `/favourites`

**Flux :**
1. L'utilisateur clique sur le bouton cœur rouge à droite d'une ligne.
2. `remove(item.id)` est appelé.
3. La ligne disparaît immédiatement de la liste.

### CU-004 — Navigation depuis un favori

**Flux :** Clic sur la ligne (hors bouton supprimer) → redirection vers `item.href` (ex. `/artist/Daft%20Punk` ou `/album/<slug>`).

---

## Structure d'un `FavouriteItem`

```typescript
interface FavouriteItem {
  id: string;        // buildFavouriteId(kind, name, artist?)
  kind: "track" | "artist";
  name: string;
  artist?: string;   // pour kind="track"
  imageUrl?: string;
  href: string;
  addedAt: number;   // timestamp ms
}
```

La clé `id` est construite par `buildFavouriteId` :
- Artist : `"artist:<name>"`
- Track : `"track:<artist>:<name>"`

---

## Composants impliqués

| Composant | Rôle |
|-----------|------|
| `FavouriteRow` (local) | Ligne de favori : image, nom, données live, bouton supprimer |
| `FavouritesHeart` | Icône cœur animée dans le header de la page |
| `HeartButton` | Bouton toggle favori sur les autres pages |
| `EmptyState` | État vide si aucun favori |
| `ScrollAnimator` | Réinitialise les animations scroll quand la liste change |

---

## Dépendances

- **`src/hooks/useFavourites.ts`** → `src/context/FavouritesContext` (localStorage + Supabase)
- **`src/lib/music-types.ts`** — `FavouriteItem`, `FavouriteKind`
- **`/api/artist-info`** — enrichissement listeners artiste (Last.fm)
- **`/api/track-info`** — enrichissement playcount/duration/album track (Last.fm)
- **Variable d'env** — `LASTFM_API_KEY` (serveur)
