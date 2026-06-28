# Spec Fonctionnelle — Page Album

| Champ      | Valeur              |
|------------|---------------------|
| Module     | album-page          |
| Version    | 0.2.0               |
| Date       | 2026-06-28          |
| Auteur     | update-writer       |
| Statut     | Validé              |
| Source     | Code implémenté     |

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-001](../../adr/RETRO-001-lastfm-primary-search-source.md) | Last.fm comme source primaire | Actif |
| [RETRO-002](../../adr/RETRO-002-server-side-api-proxy.md) | Proxy server-side pour les clés API | Actif |

---

## Contexte et objectif

La page `/album/[id]` affiche les informations détaillées d'un album musical : pochette, métadonnées et tracklist complète. Elle est accessible depuis la page artiste (section Albums ou Top Tracks) ou directement via URL. Toutes les données proviennent de Last.fm — l'API Spotify n'est pas utilisée.

Le paramètre `[id]` est un **slug encodé** représentant le couple artiste + titre d'album.

---

## Format du slug `[id]`

Le slug est produit par `encodeAlbumSlug(artist, name)` (cf. `src/lib/album-utils.ts`) :

```
slug = encodeURIComponent(artist + "|||" + name)
```

Exemple : `Daft Punk|||Random Access Memories` → `Daft%20Punk%7C%7C%7CRandom%20Access%20Memories`

Le décodage via `decodeAlbumSlug(slug)` reconstruit `{ artist, name }`. Un slug malformé (sans séparateur `|||`) retourne une erreur "Lien invalide".

---

## Mode `?isTrack=1`

Quand le paramètre de recherche `isTrack=1` est présent, la page résout l'album à partir du nom d'un **track** (et non directement d'un album) via `fetchAlbumForTrack(artist, trackName)`. Ce mode est utilisé depuis la page artiste (clic sur un top track sans album direct).

---

## Sources de données

| Donnée | Source | Méthode |
|--------|--------|---------|
| Métadonnées album (nom, artiste, pochette, playcount, listeners) | Last.fm | `album.getInfo` via `fetchAlbumByName` |
| Résolution album depuis un track | Last.fm | `track.getInfo` → `album.getInfo` via `fetchAlbumForTrack` |

La page est un **Server Component** (`async`) : tous les appels sont côté serveur via `src/lib/album-service.ts`.

---

## Règles métier

1. L'identifiant `[id]` est un slug `artist|||name` encodé en URL. Tout slug malformé affiche "Lien invalide" sans planter.
2. L'album est récupéré via `album.getInfo` Last.fm. Si introuvable, la page affiche `EmptyState` "Album introuvable."
3. En mode `?isTrack=1`, si le track n'est rattaché à aucun album dans Last.fm, un message spécifique est affiché : "Ce morceau n'est pas rattaché à un album dans la base Last.fm."
4. La pochette est sélectionnée selon la priorité : `extralarge` > `large` > premier disponible. En l'absence d'image, un bloc vide de même dimension est affiché.
5. Le lien artiste dans `AlbumHero` pointe vers `/artist/<nom-artiste-encodé>`.
6. La tracklist affiche pour chaque piste : rang (`@attr.rank`), nom, durée formatée (`mm:ss`), compteur de plays si disponible, et un `HeartButton` pour ajouter le track aux favoris.
7. Un `HistoriqueTracker` enregistre la visite (kind `"album"`, label `"<album> — <artiste>"`, imageUrl pochette `large`).

---

## Cas d'usage

### CU-001 — Consultation d'un album

**Acteur :** Utilisateur (authentifié ou non)

**Préconditions :**
- `LASTFM_API_KEY` présent en environnement serveur.
- Le slug `[id]` est valide et correspond à un album connu de Last.fm.

**Flux principal :**
1. L'utilisateur navigue vers `/album/<slug>`.
2. La page décode le slug → `{ artist, name }`.
3. `fetchAlbumByName(artist, name)` est appelé côté serveur.
4. `AlbumHero` affiche pochette, nom, lien artiste, playcount.
5. `TrackList` affiche la tracklist avec rang, durée et HeartButton par piste.

**Flux alternatifs :**
- Slug malformé → "Lien invalide."
- Album inconnu → `EmptyState` "Album introuvable."
- Tracklist vide → `EmptyState` "Aucune piste disponible."

### CU-002 — Résolution album depuis un track (`?isTrack=1`)

**Flux :**
1. L'utilisateur navigue vers `/album/<slug>?isTrack=1` (depuis un top track artiste).
2. La page appelle `fetchAlbumForTrack(artist, trackName)`.
3. Si l'album est résolu → affichage normal.
4. Si le track n'est pas rattaché à un album → message "Album non disponible."

### CU-003 — Navigation vers la page artiste

**Flux :** Clic sur le nom de l'artiste dans `AlbumHero` → redirection `/artist/<nom-encodé>`.

---

## Composants impliqués

| Composant | Rôle |
|-----------|------|
| `AlbumHero` | En-tête album : pochette, nom, artiste (lien), playcount |
| `TrackList` | Liste des pistes avec `TrackRow` par piste |
| `TrackRow` | Ligne de piste : rang, nom, durée, plays, HeartButton |
| `EmptyState` | État vide (album introuvable, tracklist vide) |
| `BackButton` | Retour page précédente (coin haut-gauche de la pochette) |
| `HistoriqueTracker` | Enregistre la visite dans l'historique |
| `ScrollAnimator` | Réinitialise les animations scroll |

---

## Dépendances

- **`src/lib/album-service.ts`** — `fetchAlbumByName`, `fetchAlbumForTrack`
- **`src/lib/album-utils.ts`** — `decodeAlbumSlug`, `encodeAlbumSlug`
- **`src/lib/music-types.ts`** — `AlbumDetail`, `LastfmImage`, `LastfmTrackDetail`
- **`next.config.mjs`** — domaine `lastfm.freetls.fastly.net` autorisé pour `next/image`
- **Variable d'env** — `LASTFM_API_KEY` (serveur uniquement)
