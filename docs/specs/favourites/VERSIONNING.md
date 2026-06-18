# Versionning — Favoris

| Version | Date       | Composants modifiés | Description | Auteur |
|---------|------------|---------------------|-------------|--------|
| 0.1.0   | 2026-06-17 | spec-fonctionnel.md | Création DRAFT par rétro-ingénierie — squelette, règles métier déduites, zones d'incertitude | retro-documenter |
| 0.2.0   | 2026-06-18 | spec-technique.md, music-types.ts, favourite-utils.ts, useFavourites.ts, HeartButton.tsx, TrackList.tsx, ArtistTopTracks.tsx | Implémentation couche logique favourites : type FavouriteItem, buildFavouriteId, hook useFavourites (localStorage clé spotifind_favourites), HeartButton toggle ; intégration HeartButton dans ArtistTopTracks et TrackList (avec props albumArtist/albumImageUrl/albumHref) | update-writer |
| 0.3.0   | 2026-06-18 | spec-technique.md, ScrollAnimator.tsx, ArtistTopTracks.tsx, favourites/page.tsx, globals.css | Animation au scroll : composant ScrollAnimator (IntersectionObserver + direction awareness + rAF) ; classe scroll-fade-in sur les rows ArtistTopTracks ; remplacement de l'IntersectionObserver inline de favourites/page.tsx par <ScrollAnimator deps={[favourites, ready]} /> ; règles CSS .scroll-fade-in/.visible dans globals.css | update-writer |
