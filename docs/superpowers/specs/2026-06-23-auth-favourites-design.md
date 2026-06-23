# Design — Système de comptes & favoris persistés (Supabase)

> Date : 2026-06-23  
> Feature : `feat/auth-supabase-favourites`  
> Approche retenue : Supabase Auth + table `favourites` avec RLS

---

## Contexte

SpotiFind stockait les favoris uniquement en localStorage — aucun compte utilisateur, aucune persistance cross-device. L'objectif est d'ajouter un système de comptes email/mot de passe via Supabase Auth, avec les favoris (artistes et titres) persistés en base de données.

---

## Base de données

### Table `favourites`

```sql
create table favourites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  kind        text not null check (kind in ('track', 'artist', 'album')),
  name        text not null,
  artist      text,
  image_url   text,
  href        text not null,
  added_at    timestamptz default now() not null,
  unique (user_id, kind, name, artist)
);

alter table favourites enable row level security;

create policy "user_owns_favourites" on favourites
  for all using (auth.uid() = user_id);
```

### Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Auth

- **Provider :** Supabase Auth — email + mot de passe uniquement
- **Sessions :** gérées automatiquement par `@supabase/ssr` via cookies HTTP-only
- **Middleware :** `src/middleware.ts` protège `/favourites` — redirect `/login` si non connecté
- **HeartButton :** redirect `/login` si l'utilisateur clique sans être connecté

---

## Pages

| Route | Fichier | Description |
|-------|---------|-------------|
| `/login` | `src/app/login/page.tsx` | Formulaire email + mdp, lien vers `/signup` |
| `/signup` | `src/app/signup/page.tsx` | Formulaire email + mdp + confirmation |

**Flow connexion :**
1. Saisie email + mdp → Supabase Auth valide
2. Succès → redirect vers la page précédente (ou `/` par défaut)
3. Si des favoris localStorage existent → affichage `ImportFavouritesModal`

**Flow migration localStorage :**
Après login, si `localStorage.getItem("spotifind_favourites")` contient des items :
- Modal : *"Tu as X favoris locaux. Les importer dans ton compte ?"*
- Oui → upsert dans Supabase + vider localStorage
- Non → vider localStorage sans importer

---

## FavouritesContext

Le context est réécrit pour appeler Supabase à la place de localStorage. L'interface publique reste **identique** — aucun composant consommateur n'est modifié.

| Méthode | Ancien comportement | Nouveau comportement |
|---------|--------------------|--------------------|
| Init | `JSON.parse(localStorage)` | `supabase.from('favourites').select()` |
| `toggle(item)` | `localStorage.setItem` | `INSERT` ou `DELETE` Supabase |
| `remove(id)` | `localStorage.setItem` | `DELETE` Supabase |
| `isFavourite(id)` | check tableau local | check tableau local (déjà en mémoire) |

Le context écoute `onAuthStateChange` — recharge les favoris si l'utilisateur se connecte ou déconnecte en cours de session.

---

## Header

Ajout de `AuthHeader` dans `src/app/layout.tsx` :
- Non connecté → bouton "Connexion" → `/login`
- Connecté → email de l'utilisateur + bouton "Déconnexion"

---

## Fichiers

### Nouveaux
```
src/lib/supabase.ts
src/middleware.ts
src/app/login/page.tsx
src/app/signup/page.tsx
src/components/AuthHeader.tsx
src/components/ImportFavouritesModal.tsx
```

### Modifiés
```
src/contexts/FavouritesContext.tsx     — remplace localStorage par Supabase
src/app/layout.tsx                     — ajout AuthHeader
src/components/HeartButton.tsx         — redirect /login si non connecté
.env.example                           — ajout vars Supabase
```

### Inchangés
Tous les composants de favoris, hooks, pages artiste/album, Route Handlers API.

---

## Dépendances à installer

```bash
npm install @supabase/supabase-js @supabase/ssr
```
