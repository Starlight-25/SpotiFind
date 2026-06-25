# Versioning — Recherche Globale

| Version | Date | Composants modifiés | Description | Auteur |
|---------|------|---------------------|-------------|--------|
| 0.1.0 | 2026-06-17 | spec-technique.md, spec-fonctionnel.md | Création initiale par rétro-ingénierie | retro-documenter |
| 0.2.0 | 2026-06-18 | spec-technique.md | Scroll snap CSS natif sur `ArtistScroller` + barre de progression dynamique (`progress` state) sur le carousel artistes ; `scroll-snap-align:start` sur `ArtistCard` via `SearchResults` | update-writer |
| 0.2.1 | 2026-06-18 | spec-technique.md | Augmentation des limites de résultats Last.fm : `track.search` et `album.search` passent de 5 à 20 résultats par requête | update-writer |
| 0.2.2 | 2026-06-25 | spec-technique.md | Réduction `artist.search` de 10 → 5 résultats (explicite) pour limiter les appels `enrichArtistThumb` TheAudioDB à 5 par requête | update-writer |
