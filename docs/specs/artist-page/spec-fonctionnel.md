# Spec Fonctionnelle — Page Artiste

| Champ      | Valeur              |
|------------|---------------------|
| Module     | artist-page         |
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

La page `/artist/[id]` affiche le profil détaillé d'un artiste musical. Elle est accessible depuis les résultats de recherche (clic sur une carte artiste) ou directement via URL. Toutes les données proviennent de Last.fm et TheAudioDB — l'API Spotify n'est pas utilisée.

Le paramètre `[id]` est le **nom de l'artiste URL-encodé** (ex. `/artist/Daft%20Punk`).

---

## Sources de données

| Donnée | Source | Méthode |
|--------|--------|---------|
| Profil artiste (nom, listeners) | Last.fm | `artist.getInfo` via `fetchArtistByName` |
| Photo de l'artiste | TheAudioDB | `fetchArtistSpotifyData` → `strArtistThumb` |
| Top tracks (max 10) | Last.fm | `artist.getTopTracks` → enrichi avec art via `album.getInfo` |
| Discographie | Last.fm | `artist.getTopAlbums` |

La page est un **Server Component** (`async`) : tous les appels API sont effectués côté serveur via `src/lib/artist-service.ts`. Aucun credentials n'est exposé au client.

---

## Règles métier

1. L'identifiant `[id]` est le nom de l'artiste URL-encodé — pas un ID opaque (MBID, Spotify ID).
2. Si l'artiste est introuvable (Last.fm retourne `null`), la page affiche un `ErrorBanner` avec message explicatif. Aucune redirection.
3. La photo de l'artiste est récupérée depuis TheAudioDB. En l'absence de photo, un fallback affiche l'initiale du nom sur fond `bg-border`.
4. Le nombre de monthly listeners (Last.fm `stats.listeners`) est affiché si disponible, formaté en notation locale (`fr-FR`).
5. Les top tracks sont affichés en section "Top Tracks" avec : rang, pochette d'album, nom du track, nom de l'album (si disponible), playcount (si disponible), durée (si disponible). Chaque track est cliquable vers `/album/[slug]` si un album est associé.
6. La discographie est affichée en grille responsive (3 → 4 → 5 colonnes selon breakpoint) avec pochette, nom et année de sortie. Chaque album est cliquable vers `/album/[slug]`.
7. Le bouton cœur (`HeartButton`) permet d'ajouter l'artiste aux favoris. Si l'utilisateur n'est pas authentifié, il est redirigé vers `/login`.
8. Un `HistoriqueTracker` enregistre la visite dans l'historique de navigation (localStorage `spotifind_historique`).
9. Les animations scroll (`ScrollAnimator`, classes `scroll-fade-in`, `reveal-ltr`, `text-reveal`, `photo-reveal`) sont activées sur les éléments de la page.

---

## Cas d'usage

### CU-001 — Consultation du profil artiste

**Acteur :** Utilisateur (authentifié ou non)

**Préconditions :**
- `LASTFM_API_KEY` est présent en environnement serveur.
- Le nom de l'artiste dans l'URL correspond à un artiste connu de Last.fm.

**Flux principal :**
1. L'utilisateur navigue vers `/artist/<nom-url-encodé>`.
2. La page appelle `fetchArtistByName(name)` et `fetchArtistSpotifyData(name)` en parallèle.
3. La photo (TheAudioDB), le nom, le compteur de listeners, les top tracks et la discographie sont affichés.
4. L'utilisateur peut naviguer vers un album via la section "Top Tracks" ou "Albums".

**Flux alternatifs :**
- Artiste inconnu → `ErrorBanner` "Artiste introuvable."
- Pas de photo → initiale du nom sur fond neutre.
- Pas de top tracks → section "Top Tracks" masquée.
- Pas d'albums → section "Albums" masquée.

### CU-002 — Ajout aux favoris

**Flux :**
1. L'utilisateur clique sur `HeartButton`.
2. Si non authentifié → redirection `/login`.
3. Si authentifié → bascule favori (ajout ou suppression), animation burst de particules si ajout.

### CU-003 — Navigation vers un album

**Flux :** Clic sur un track (section Top Tracks) ou une pochette (section Albums) → redirection vers `/album/<encodeAlbumSlug(artistName, albumName)>`.

---

## Composants impliqués

| Composant | Rôle |
|-----------|------|
| `ArtistTopTracks` | Liste top tracks avec rang, art, stats, HeartButton par track |
| `ArtistAlbums` | Grille discographie avec pochette, nom, année |
| `HeartButton` | Bouton cœur favori (artist) avec animation burst |
| `BackButton` | Retour page précédente (haut-gauche) |
| `ErrorBanner` | Affichage erreur artiste introuvable |
| `ScrollAnimator` | Réinitialise les animations scroll au montage |
| `HistoriqueTracker` | Enregistre la visite dans l'historique |

---

## Dépendances

- **`src/lib/artist-service.ts`** — `fetchArtistByName`, `fetchArtistSpotifyData` (Last.fm + TheAudioDB)
- **`src/lib/music-types.ts`** — `LastfmArtist`, `ArtistTopTrack`, `ArtistAlbum`
- **`src/lib/favourite-utils.ts`** — `buildFavouriteId("artist", name)`
- **`src/lib/album-utils.ts`** — `encodeAlbumSlug(artist, album)` pour les liens
- **`next.config.mjs`** — domaines images autorisés : `lastfm.freetls.fastly.net`, `www.theaudiodb.com`, `r2.theaudiodb.com`
- **Variable d'env** — `LASTFM_API_KEY` (serveur uniquement)
