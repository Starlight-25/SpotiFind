# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) · Versioning : [SemVer](https://semver.org/lang/fr/).

---

## [Unreleased]

### Added

- **artist-page — top tracks + albums** : `fetchArtistTopTracks()` (Last.fm `artist.getTopTracks`, limit=10) et `fetchArtistAlbums()` (Spotify search artist → albums triés par `release_date` desc) dans `artist-service.ts` ; composant `ArtistTopTracks` (liste numérotée avec playcount formaté) ; composant `ArtistAlbums` (grille cliquable via `<Link>` vers `/album/[encodeAlbumSlug]`, cover Spotify + année) ; page `/artist/[id]` mise à jour avec fetch parallèle (`Promise.all`) des trois sources et rendu des deux nouvelles sections

### Changed

- **artist-page — refonte `artist-service.ts`** : `fetchArtistTopTracks` (Last.fm) et `fetchArtistAlbums` (Spotify search) remplacés par `fetchArtistSpotifyData(name)` qui effectue les deux fetches Spotify en parallèle (`top-tracks?market=FR` + `albums?include_groups=album,single&limit=50`) après résolution de l'ID artiste via `artist:name` search ; les erreurs sont désormais loguées via `console.error` au lieu d'être avalées silencieusement
- **artist-page — `ArtistTopTrack` type** : suppression de `playcount`, ajout de `imageUrl: string | null` et `albumName: string | null` (source Spotify au lieu de Last.fm)
- **artist-page — composant `ArtistTopTracks`** : affichage de la pochette album (40×40), du nom de l'album ; chaque track est désormais un `<Link>` vers `/album/[encodeAlbumSlug(artistName, track.albumName)]` ; prop `artistName` ajoutée
- **artist-page — enrichissement fallback Last.fm** : `fetchLastfmTopTracks` appelle désormais `track.getInfo` en parallèle (10 appels) pour enrichir chaque titre avec la vraie pochette d'album et le nom d'album (au lieu de retourner des images vides) ; ajout de `fetchLastfmTopAlbums` via `artist.getTopAlbums` comme fallback albums quand Spotify retourne 0 résultats ; ajout de `pickLastfmImage` pour filtrer le placeholder Last.fm (`2a96cbd8b46e442fc41c2b86b821562f`) ; `fetchArtistSpotifyData` déclenche le fallback Last.fm albums si Spotify retourne un tableau vide
- **artist-page — composant `ArtistAlbums`** : `releaseYear(date)` gère désormais les dates vides (retourne `""` au lieu de crasher sur `date.slice(0,4)` pour une chaîne vide)
- **album-page — couche lib** : types `LastfmTrackDetail` et `AlbumDetail` dans `music-types.ts` ; utilitaires de slug URL `encodeAlbumSlug` / `decodeAlbumSlug` dans `album-utils.ts` (séparateur `|||`, URL-safe) ; service Last.fm `fetchAlbumByName` et `fetchAlbumForTrack` dans `album-service.ts` (normalisation tracklist mono-piste) ; tests unitaires `album-utils.test.ts` (4 cas)
- **album-page — couche UI** : page dynamique `/album/[id]` (Server Component), composants `AlbumHero` (pochette 200×200 + métadonnées), `TrackList` (tracklist complète), `TrackRow` (rang, titre, durée formatée M:SS) ; navigation depuis `SearchResults` : `TrackCard` et `AlbumCard` désormais cliquables via `<Link>` vers `/album/[slug]` (avec `?isTrack=1` pour les pistes)

### Changed

### Fixed

### Removed

### BDD
