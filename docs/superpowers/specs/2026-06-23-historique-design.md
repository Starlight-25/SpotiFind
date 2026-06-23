# Design — Système d'historique

> Date : 2026-06-23
> Branche : feat/historique
> Statut : approuvé

## Objectif

Ajouter un historique de navigation persistant en localStorage. L'utilisateur peut retrouver les artistes, albums et recherches récents sur une page dédiée `/historique`.

## Stockage

- **Mécanisme :** localStorage (même approche que les favoris)
- **Clé :** `spotifind_historique`
- **Max :** 20 entrées — la 21ème supprime la plus ancienne
- **Doublons :** si une entrée existe déjà, elle remonte en tête de liste

## Type de données

```ts
type HistoriqueItem = {
  id: string              // ex: "artist:Daft Punk", "album:Homework|||Daft Punk", "search:punk"
  kind: "artist" | "album" | "search"
  label: string           // nom affiché à l'utilisateur
  href: string            // lien vers la page correspondante
  imageUrl?: string       // pochette ou photo (optionnel)
  visitedAt: number       // timestamp Date.now()
}
```

## Architecture

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `src/contexts/HistoriqueContext.tsx` | Context React + Provider (pattern identique à FavouritesContext) |
| `src/hooks/useHistorique.ts` | Hook `useHistorique()` — re-export du context |
| `src/app/historique/page.tsx` | Page dédiée `/historique` |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/app/layout.tsx` | Ajout de `<HistoriqueProvider>` autour des children |
| `src/app/artist/[id]/page.tsx` | Appel `addToHistorique` au chargement de la page artiste |
| `src/app/album/[id]/page.tsx` | Appel `addToHistorique` au chargement de la page album |
| `src/hooks/useSearch.ts` | Appel `addToHistorique` lors d'une recherche |

## Comportement

- **Ajout :** automatique à chaque visite d'artiste, album, ou recherche lancée
- **Tri :** du plus récent au plus ancien (`visitedAt` desc)
- **Doublons :** mise à jour du `visitedAt` + remontée en tête
- **Limite :** si > 20 entrées, supprimer la plus ancienne (`visitedAt` le plus petit)
- **Page `/historique` :** liste des entrées + bouton "Vider l'historique"

## API du Context

```ts
interface HistoriqueContextValue {
  historique: HistoriqueItem[]
  ready: boolean
  add: (item: Omit<HistoriqueItem, "visitedAt">) => void
  clear: () => void
}
```
