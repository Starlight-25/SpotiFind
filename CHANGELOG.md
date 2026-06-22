# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) · Versioning : [SemVer](https://semver.org/lang/fr/).

---

## [Unreleased]

### Added

- **search — autocomplétion** : `SearchBar.tsx` enrichi d'un dropdown d'autocomplétion — fetch debounced 200ms vers `/api/search` ; affichage de 3 artistes (lien page artiste), 2 titres (remplit la recherche), 2 albums (lien page album) ; navigation clavier ↑↓ / Enter / Escape ; fermeture au clic extérieur ; thumbnails + badge de type (Artiste / Titre / Album) ; utilise `encodeAlbumSlug` pour les liens albums

- **ui — toggle dark/light mode** : nouveau Client Component `ThemeToggle` (`src/components/ThemeToggle.tsx`) — bouton flottant positionné en bas à gauche, bascule la classe `.dark` sur `<html>` ; persistance dans `localStorage` (clé `spotifind_theme`) ; respect du `prefers-color-scheme` au premier chargement ; importé et rendu dans `src/app/layout.tsx` ; variables CSS dark ajoutées dans `src/app/globals.css` (`.dark { --background, --foreground, --muted, --border, --surface }`)

- **home — albums rock en parallèle** : deuxième appel `tag.getTopAlbums` (tag=rock, limit=10) lancé en parallèle du fetch pop existant dans `src/app/api/home/route.ts` ; nouvelle fonction utilitaire `parseAlbums` mutualisée ; réponse JSON enrichie avec le champ `albumsRock: HomeAlbum[]` ; type `HomeCharts` mis à jour dans `src/hooks/useHomeCharts.ts` ; nouvelle section "Trending Albums — Rock" rendue dans `HomeCharts.tsx` avec animation `scroll-fade-in` sur chaque carte

### Changed

- **search — augmentation des limites Last.fm** : `track.search` et `album.search` passent de 5 à 20 résultats par requête (`limit=20` dans `lastfmSearch`) ; `artist.search` conserve `limit=5`

### Added

- **search — scroll snap + barre de progression sur `ArtistScroller`** : `scroll-snap-type: x mandatory` posé sur le conteneur du carousel artistes ; `scroll-snap-align: start` posé sur chaque `ArtistCard` via la classe Tailwind arbitraire `[scroll-snap-align:start]` dans `SearchResults` ; nouvel état `progress` (`useState<number>`, 0–1) mis à jour dans le handler `onScroll` via `scrollLeft / (scrollWidth - clientWidth)` ; barre de progression (`div bg-foreground`, largeur inline `progress * 100%`) rendue uniquement quand le contenu est en overflow réel (`fadeLeft || fadeRight`)

- **album-page — animation d'entrée tracklist** : keyframes `trackFadeIn` (opacity 0→1 + translateY 10px→0, 0.35 s ease) et classe `.track-enter` dans `globals.css` ; chaque `TrackRow` est rendu dans un wrapper `<div class="track-enter">` portant `--track-delay` (40 ms/piste, plafond 600 ms) posé inline dans `TrackList` ; séparateurs entre lignes migrés de `border-b border-border last:border-0` sur `TrackRow` vers `divide-y divide-border` sur le conteneur `TrackList`

- **favourites — couche logique (localStorage)** : type `FavouriteItem` + `FavouriteKind` dans `music-types.ts` ; utilitaire `buildFavouriteId(kind, name, artist?)` dans `favourite-utils.ts` (format ID stable `"<kind>:<artist>:<name>"`) ; hook `useFavourites()` dans `hooks/useFavourites.ts` (clé localStorage `spotifind_favourites`, API : `favourites`, `isFavourite`, `toggle`, `remove`, `ready`) ; `HeartButton` Client Component (bouton cœur SVG 15×15 toggleable, évite flash hydratation via flag `ready`) ; intégration `HeartButton` dans `ArtistTopTracks` (à droite de la colonne auditeurs) ; props `albumArtist`, `albumImageUrl`, `albumHref` ajoutées à `TrackList` pour passer le contexte album à chaque `TrackRow`

- **artist-page — top tracks + albums** : `fetchArtistTopTracks()` (Last.fm `artist.getTopTracks`, limit=10) et `fetchArtistAlbums()` (Spotify search artist → albums triés par `release_date` desc) dans `artist-service.ts` ; composant `ArtistTopTracks` (liste numérotée avec playcount formaté) ; composant `ArtistAlbums` (grille cliquable via `<Link>` vers `/album/[encodeAlbumSlug]`, cover Spotify + année) ; page `/artist/[id]` mise à jour avec fetch parallèle (`Promise.all`) des trois sources et rendu des deux nouvelles sections

- **scroll animation — composant `ScrollAnimator`** : nouveau Client Component réutilisable (`src/components/ScrollAnimator.tsx`) — monte un `IntersectionObserver` sur tous les éléments `.scroll-fade-in` avec direction awareness (CSS custom property `--slide-from` posée dynamiquement) et timing via `requestAnimationFrame` ; classe `scroll-fade-in` ajoutée sur chaque row de `ArtistTopTracks` et sur chaque card de `ArtistAlbums` ; `<ScrollAnimator />` injecté dans la page `/artist/[id]` (Server Component) et dans `/favourites` (remplace l'`IntersectionObserver` inline, `deps={[favourites, ready]}`) ; règles CSS `.scroll-fade-in` / `.scroll-fade-in.visible` ajoutées dans `globals.css`

### Changed

- **artist-page — refonte `artist-service.ts`** : `fetchArtistTopTracks` (Last.fm) et `fetchArtistAlbums` (Spotify search) remplacés par `fetchArtistSpotifyData(name)` qui effectue les deux fetches Spotify en parallèle (`top-tracks?market=FR` + `albums?include_groups=album,single&limit=50`) après résolution de l'ID artiste via `artist:name` search ; les erreurs sont désormais loguées via `console.error` au lieu d'être avalées silencieusement
- **artist-page — `ArtistTopTrack` type** : suppression de `playcount`, ajout de `imageUrl: string | null` et `albumName: string | null` (source Spotify au lieu de Last.fm)
- **artist-page — composant `ArtistTopTracks`** : affichage de la pochette album (40×40), du nom de l'album ; chaque track est désormais un `<Link>` vers `/album/[encodeAlbumSlug(artistName, track.albumName)]` ; prop `artistName` ajoutée
- **artist-page — enrichissement fallback Last.fm** : `fetchLastfmTopTracks` appelle désormais `track.getInfo` en parallèle (10 appels) pour enrichir chaque titre avec la vraie pochette d'album et le nom d'album (au lieu de retourner des images vides) ; ajout de `fetchLastfmTopAlbums` via `artist.getTopAlbums` comme fallback albums quand Spotify retourne 0 résultats ; ajout de `pickLastfmImage` pour filtrer le placeholder Last.fm (`2a96cbd8b46e442fc41c2b86b821562f`) ; `fetchArtistSpotifyData` déclenche le fallback Last.fm albums si Spotify retourne un tableau vide
- **artist-page — enrichissement dates albums via TheAudioDB** : suppression de `parseLastfmDate` et `fetchLastfmAlbumInfo` (approche `album.getInfo` Last.fm abandonnée — `releasedate` non fiable) ; ajout de `fetchAudioDbYears(artist)` qui appelle `https://www.theaudiodb.com/api/v1/json/2/discography.php?s={artist}` (clé publique `"2"` hardcodée — seule clé supportant l'endpoint `discography.php`) et retourne une `Map<string, string>` (nom album lowercase → `"YYYY-01-01"`) ; refonte de `fetchLastfmTopAlbums(name)` : deux appels parallèles Last.fm `artist.getTopAlbums` + TheAudioDB `discography.php`, cross-référence des noms pour assigner les années, tri du plus récent au plus ancien (albums sans date en fin de liste) ; correction des 3 points de retour anticipé dans `fetchArtistSpotifyData` (searchRes.ok false, artistId undefined, catch) : tous appellent désormais `fetchLastfmTopAlbums` en parallèle avec `fetchLastfmTopTracks` au lieu de retourner `albums: []`
- **artist-page — composant `ArtistAlbums`** : `releaseYear(date)` gère désormais les dates vides (retourne `""` au lieu de crasher sur `date.slice(0,4)` pour une chaîne vide)
- **album-page — couche lib** : types `LastfmTrackDetail` et `AlbumDetail` dans `music-types.ts` ; utilitaires de slug URL `encodeAlbumSlug` / `decodeAlbumSlug` dans `album-utils.ts` (séparateur `|||`, URL-safe) ; service Last.fm `fetchAlbumByName` et `fetchAlbumForTrack` dans `album-service.ts` (normalisation tracklist mono-piste) ; tests unitaires `album-utils.test.ts` (4 cas)
- **album-page — couche UI** : page dynamique `/album/[id]` (Server Component), composants `AlbumHero` (pochette 200×200 + métadonnées), `TrackList` (tracklist complète), `TrackRow` (rang, titre, durée formatée M:SS) ; navigation depuis `SearchResults` : `TrackCard` et `AlbumCard` désormais cliquables via `<Link>` vers `/album/[slug]` (avec `?isTrack=1` pour les pistes)

### Changed

- **artist-page — enrichissement colonne auditeurs** : ajout du champ `listeners: string | null` dans l'interface `ArtistTopTrack` (`music-types.ts`) ; `fetchLastfmTopTracks` mappe désormais `t.listeners` depuis la réponse `artist.getTopTracks` Last.fm (Spotify conserve `listeners: null`) ; composant `ArtistTopTracks` affiche une colonne "X auditeurs" (format `fr-FR` via `toLocaleString`) visible à partir de `md` ; page `/artist/[id]` élargie de `max-w-2xl` à `max-w-5xl` ; grille `ArtistAlbums` passée de `grid-cols-2 sm:grid-cols-3` à `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5` ; test `artist-service.test.ts` mis à jour (`listeners: null` dans l'objet attendu)

### Fixed

### Removed

### BDD
