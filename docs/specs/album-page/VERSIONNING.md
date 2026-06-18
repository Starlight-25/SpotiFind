# Versioning — album-page

| Version | Date       | Composants modifiés                                                  | Description                                                                 | Auteur           |
|---------|------------|----------------------------------------------------------------------|-----------------------------------------------------------------------------|------------------|
| 0.1.0   | 2026-06-17 | `music-types.ts`, `album-utils.ts`, `album-utils.test.ts`, `album-service.ts` | Couche lib album : types `LastfmTrackDetail` / `AlbumDetail`, utilitaires de slug URL, service Last.fm (`fetchAlbumByName`, `fetchAlbumForTrack`), tests unitaires slug | update-writer |
| 0.2.0   | 2026-06-17 | `album/[id]/page.tsx`, `AlbumHero.tsx`, `TrackRow.tsx`, `TrackList.tsx`, `SearchResults.tsx` | Couche UI album : page Server Component, composants `AlbumHero` / `TrackList` / `TrackRow`, `TrackCard` et `AlbumCard` cliquables dans `SearchResults` | update-writer |
| 0.3.0   | 2026-06-18 | `TrackList.tsx`, `TrackRow.tsx`, `globals.css` | Animation d'entrée échelonnée sur la tracklist : keyframes `trackFadeIn` (opacity + translateY), classe `.track-enter` avec `--track-delay` CSS custom property (40 ms/piste, max 600 ms) ; séparateurs migrés vers `divide-y divide-border` sur `TrackList` | update-writer |
