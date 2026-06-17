# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) · Versioning : [SemVer](https://semver.org/lang/fr/).

---

## [Unreleased]

### Added

- **album-page — couche lib** : types `LastfmTrackDetail` et `AlbumDetail` dans `music-types.ts` ; utilitaires de slug URL `encodeAlbumSlug` / `decodeAlbumSlug` dans `album-utils.ts` (séparateur `|||`, URL-safe) ; service Last.fm `fetchAlbumByName` et `fetchAlbumForTrack` dans `album-service.ts` (normalisation tracklist mono-piste) ; tests unitaires `album-utils.test.ts` (4 cas)
- **album-page — couche UI** : page dynamique `/album/[id]` (Server Component), composants `AlbumHero` (pochette 200×200 + métadonnées), `TrackList` (tracklist complète), `TrackRow` (rang, titre, durée formatée M:SS) ; navigation depuis `SearchResults` : `TrackCard` et `AlbumCard` désormais cliquables via `<Link>` vers `/album/[slug]` (avec `?isTrack=1` pour les pistes)

### Changed

### Fixed

### Removed

### BDD
