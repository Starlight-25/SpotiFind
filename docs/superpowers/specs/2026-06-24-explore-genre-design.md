# Design — Explore par genre

> Date : 2026-06-24
> Branche : feat/explore-genre
> Statut : approuvé

## Objectif

Une page `/explore` qui affiche une grille mosaïque 3×3 de pochettes d'albums selon un genre musical choisi. L'utilisateur peut mettre des albums en favori, simuler une lecture, et rafraîchir la grille.

## Page et navigation

- **Route :** `/explore`
- **Accès :** bouton boussole (🧭) dans le header de la home, à gauche (à côté du bouton historique)
- **Rendu :** Client Component

## Sélecteur de genre

- 8 genres fixes en chips cliquables : Pop, Rock, Hip-Hop, Electronic, Jazz, Classical, R&B, Metal
- Un seul genre actif à la fois
- Genre actif : chip en vert fluo (`#1DB954`)
- Genre par défaut au chargement : Pop

## Grille 3×3

- 9 pochettes d'albums carrées, uniformes
- Source : Last.fm `tag.getTopAlbums(tag, limit=9, page=N)`
- Au hover : overlay sombre avec titre + artiste
- Chargement : skeleton placeholder pendant le fetch

## Interactions

| Action | Comportement |
|---|---|
| Clic simple | Toggle favori — bordure verte + icône 💚 sur la pochette |
| Double-clic | Simulation lecture — animation pulse 1s sur la pochette (pas d'audio, Last.fm ne fournit pas d'extraits) |
| Bouton Rafraîchir | Tire une page aléatoire (1–5) pour afficher 9 autres albums du même genre |

## Architecture

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `src/app/api/explore/route.ts` | Route Handler — proxy Last.fm `tag.getTopAlbums` |
| `src/app/explore/page.tsx` | Page `/explore` (Client Component) |
| `src/components/GenreChips.tsx` | Chips de sélection de genre |
| `src/components/AlbumMosaic.tsx` | Grille 3×3 de pochettes |
| `src/components/MosaicCard.tsx` | Carte individuelle (pochette + interactions) |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/components/HomeContent.tsx` | Ajout bouton 🧭 dans le header |

## API

`GET /api/explore?genre=rock&page=2`

Réponse :
```json
{
  "albums": [
    { "name": "...", "artist": "...", "imageUrl": "..." }
  ]
}
```

Appel Last.fm : `tag.getTopAlbums`, `tag=<genre>`, `limit=9`, `page=<page>`, format JSON.

## Favoris

Réutilise le `FavouritesContext` existant. Un album de la grille est favorisé avec :
- `kind: "album"`
- `id: buildFavouriteId("album", albumName, artistName)`
- `href: /album/<encodeAlbumSlug(artist, name)>`
