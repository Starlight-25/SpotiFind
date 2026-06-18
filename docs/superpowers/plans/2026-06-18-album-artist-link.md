# Album Artist Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le nom de l'artiste dans la page album cliquable, redirigeant vers `/artist/[id]`.

**Architecture:** Modification unique de `AlbumHero.tsx` — remplacer le `<p>` texte par un `<Link>` Next.js. La route `/artist/[id]` utilise `decodeURIComponent(params.id)` comme nom, donc l'URL cible est `/artist/${encodeURIComponent(artist)}`.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS

---

### Task 1: Rendre le nom de l'artiste cliquable dans AlbumHero

**Files:**
- Modify: `src/components/AlbumHero.tsx`

- [ ] **Step 1: Ouvrir le fichier et noter l'état actuel**

Le `<p>` à modifier est à la ligne 37 de `src/components/AlbumHero.tsx` :
```tsx
<p className="text-lg text-muted mt-1 truncate">{artist}</p>
```

- [ ] **Step 2: Ajouter l'import Link**

En tête de fichier, après `import Image from "next/image";`, ajouter :
```tsx
import Link from "next/link";
```

- [ ] **Step 3: Remplacer le `<p>` par un `<Link>`**

Remplacer :
```tsx
<p className="text-lg text-muted mt-1 truncate">{artist}</p>
```
Par :
```tsx
<Link
  href={`/artist/${encodeURIComponent(artist)}`}
  className="text-lg text-muted mt-1 truncate hover:text-foreground hover:underline transition-colors"
>
  {artist}
</Link>
```

- [ ] **Step 4: Vérifier le rendu**

Lancer le serveur de dev :
```bash
npm run dev
```
Naviguer vers une page album (ex : `http://localhost:3000/album/[un-slug-valide]`) et vérifier que le nom de l'artiste est souligné au hover et redirige bien vers `/artist/[nom-artiste]`.

- [ ] **Step 5: Lancer le lint**

```bash
npm run lint
```
Expected : aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/components/AlbumHero.tsx
git commit -m "feat(album-page): rendre le nom de l'artiste cliquable vers sa page"
```
