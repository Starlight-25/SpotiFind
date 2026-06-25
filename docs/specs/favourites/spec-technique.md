# Spec Technique — Favoris

| Champ   | Valeur              |
|---------|---------------------|
| Module  | favourites          |
| Version | 0.6.3               |
| Date    | 2026-06-25          |
| Auteur  | update-writer       |
| Statut  | En cours            |

---

## Stack utilisée

- **Langage :** TypeScript 5 (strict mode)
- **Framework :** Next.js 14 App Router — composants Client (`"use client"`)
- **Persistance :** `localStorage` navigateur (phase actuelle) → migration Supabase en cours (voir section Auth)
- **Auth :** Supabase Auth via `@supabase/ssr` — sessions cookie HTTP-only, middleware Next.js
- **State :** React `useState` / `useEffect` / `useCallback` — pas de store global

---

## Fichiers implémentés

| Fichier | Rôle |
|---------|------|
| `src/lib/music-types.ts` | Types `FavouriteItem` et `FavouriteKind` |
| `src/lib/favourite-utils.ts` | Utilitaire `buildFavouriteId()` |
| `src/hooks/useFavourites.ts` | Hook React `useFavourites()` |
| `src/components/HeartButton.tsx` | Client Component bouton toggle favori |
| `src/components/TrackList.tsx` | Modifié — passe le contexte album à `TrackRow` |
| `src/components/ArtistTopTracks.tsx` | Modifié — intègre `HeartButton` par ligne de top track |

---

## Types

### `FavouriteKind` (`src/lib/music-types.ts`)

```ts
export type FavouriteKind = "track" | "album" | "artist";
```

### `FavouriteItem` (`src/lib/music-types.ts`)

```ts
export interface FavouriteItem {
  id: string;          // ID stable construit par buildFavouriteId()
  kind: FavouriteKind;
  name: string;
  artist?: string;     // absent pour les favoris de type "artist"
  imageUrl?: string;
  href: string;        // URL de destination (page album ou artiste)
  addedAt: number;     // timestamp Unix ms (Date.now())
}
```

---

## Utilitaire `buildFavouriteId` (`src/lib/favourite-utils.ts`)

Construit un ID stable pour un favori, utilisé comme clé de déduplication dans le tableau localStorage.

**Signature :**
```ts
buildFavouriteId(kind: FavouriteItem["kind"], name: string, artist?: string): string
```

**Format de l'ID généré :**
- Avec artiste : `"<kind>:<artist>:<name>"` (ex : `"track:Daft Punk:Harder Better Faster Stronger"`)
- Sans artiste : `"<kind>:<name>"` (ex : `"artist:Daft Punk"`)

---

## Hook `useFavourites` (`src/hooks/useFavourites.ts`)

Hook React Client-side. Lit et écrit dans `localStorage` de manière réactive.

**Clé localStorage :** `"spotifind_favourites"`

**API exposée :**

| Propriété / Méthode | Type | Description |
|---------------------|------|-------------|
| `favourites` | `FavouriteItem[]` | Liste courante des favoris |
| `ready` | `boolean` | `false` pendant le premier rendu SSR (hydratation), `true` après `useEffect` |
| `isFavourite(id)` | `(id: string) => boolean` | Teste si un item est déjà favori par son `id` |
| `toggle(item)` | `(item: FavouriteItem) => void` | Ajoute si absent, retire si présent |
| `remove(id)` | `(id: string) => void` | Retire un favori par son `id` |

**Comportement :**
- Lecture initiale dans `useEffect` (jamais en SSR) — évite les erreurs hydratation Next.js.
- `ready` passe à `true` après la lecture initiale. `HeartButton` s'appuie sur ce flag pour éviter un flash d'état incorrect.
- Lecture et écriture enveloppées dans `try/catch` : si `localStorage` est indisponible (mode privé restrictif, quota dépassé), le hook se dégrade silencieusement sans erreur (`favourites` reste `[]`).

---

## Composant `HeartButton` (`src/components/HeartButton.tsx`)

Client Component. Affiche un bouton cœur SVG 15×15 toggleable.

**Props :** `Omit<FavouriteItem, "addedAt">` — tous les champs de `FavouriteItem` sauf `addedAt` (injecté automatiquement au moment du `toggle` via `Date.now()`).

**Comportement :**
- `e.preventDefault()` + `e.stopPropagation()` sur le click — permet d'intégrer le bouton dans un `<Link>` sans déclencher la navigation.
- Affichage conditionnel au flag `ready` — aucun état actif affiché avant hydratation (`ready === false`).
- Couleur active : `text-red-400` (cœur plein rouge). Couleur inactive : `text-muted` avec hover `text-foreground`.
- SVG inliné — pas de dépendance à une lib d'icônes.
- **Redirection si non authentifié (ajout session 2026-06-23) :** si `useFavourites()` expose `isAuthenticated === false`, le handler de click court-circuite le `toggle` et appelle `router.push("/login")` via `next/navigation`. L'utilisateur est redirigé vers la page de connexion sans modification des favoris. `isAuthenticated` est fourni par `FavouritesContext` (réécrit pour intégrer la session Supabase).

---

## Intégrations dans les composants existants

### `TrackList` (`src/components/TrackList.tsx`)

Props ajoutées :

| Prop | Type | Description |
|------|------|-------------|
| `albumArtist` | `string` (optionnel) | Artiste de l'album — transmis au `FavouriteItem` de chaque track |
| `albumImageUrl` | `string` (optionnel) | URL de la pochette album |
| `albumHref` | `string` (optionnel) | URL de la page album (destination du `href` dans `FavouriteItem`) |

Quand `albumArtist` et `albumHref` sont fournis, chaque `TrackRow` reçoit un `favouriteItem` construit via `buildFavouriteId("track", track.name, albumArtist)`.

### `ArtistTopTracks` (`src/components/ArtistTopTracks.tsx`)

`HeartButton` ajouté à droite de la colonne auditeurs sur chaque ligne. Le `href` pointe vers la page album si `track.albumName` est défini, sinon vers la page artiste. Classe `scroll-fade-in` appliquée sur chaque row (`<Link>` et `<div>` de fallback) pour l'animation au scroll via `ScrollAnimator`.

---

## Format de stockage localStorage

La clé `"spotifind_favourites"` contient un tableau JSON de `FavouriteItem[]` :

```json
[
  {
    "id": "track:Daft Punk:Harder Better Faster Stronger",
    "kind": "track",
    "name": "Harder Better Faster Stronger",
    "artist": "Daft Punk",
    "imageUrl": "https://...",
    "href": "/album/Daft%20Punk|||Discovery",
    "addedAt": 1750252800000
  }
]
```

---

## Tests prévus

Aucun test unitaire écrit pour cette session (hook + composants UI). À prévoir :

| Fichier de test | Cas à couvrir |
|----------------|---------------|
| `src/lib/favourite-utils.test.ts` | `buildFavouriteId` avec et sans `artist`, formats de sortie |
| `src/hooks/useFavourites.test.ts` | `toggle` (ajoute / retire), `remove`, `isFavourite`, comportement si `localStorage` indisponible |

---

---

## Composant `ScrollAnimator` (`src/components/ScrollAnimator.tsx`)

Client Component réutilisable. Monte un `IntersectionObserver` sur tous les éléments portant la classe `.scroll-fade-in` présents dans le DOM au moment du montage, puis lors de chaque changement de `deps`.

**Props :**

| Prop | Type | Description |
|------|------|-------------|
| `deps` | `unknown[]` (optionnel) | Tableau de dépendances — si fourni, l'observateur est remonté à chaque changement (pattern identique à `useEffect`) |

**Comportement :**
- `requestAnimationFrame` utilisé pour le timing : l'observateur est créé dans la frame suivante, garantissant que les éléments sont dans le DOM avant observation.
- Observation continue : l'`IntersectionObserver` observe chaque `.scroll-fade-in` sans `unobserve`. La classe `.visible` est ajoutée à l'entrée dans le viewport et retirée à la sortie, ce qui fait rejouer l'animation `scrollFadeIn` à chaque re-entrée.
- Threshold : `0.08` — l'animation se déclenche dès que 8% de l'élément est visible dans le viewport.
- Fallback viewport : un second `requestAnimationFrame` active immédiatement les éléments `.scroll-fade-in` déjà visibles si le callback `IntersectionObserver` tarde à se déclencher (corrige les albums invisibles au chargement initial).
- Cleanup : `cancelAnimationFrame` + `observer.disconnect()` au démontage.
- Produit aucun DOM rendu (`return null`) — effet de bord uniquement.
- La logique `--slide-from` (direction awareness) a été supprimée : elle provoquait des conflits avec React qui remettait à jour `transitionDelay` inline et relançait la cascade CSS pendant que l'animation était en cours.

**CSS associé (`src/app/globals.css`) :**

```css
@keyframes scrollFadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.scroll-fade-in {
  opacity: 0;
}
.scroll-fade-in.visible {
  animation: scrollFadeIn 0.45s ease forwards;
}
```

L'animation par `@keyframes` remplace l'ancienne approche `transition: opacity/transform`. Ce changement résout le problème où React, en mettant à jour `transitionDelay` en style inline sur un élément déjà visible, relançait la transition depuis zéro.

**Intégration dans `/favourites` (`src/app/favourites/page.tsx`) :**

L'`IntersectionObserver` inline précédemment écrit directement dans `useEffect` de la page a été remplacé par `<ScrollAnimator deps={[favourites, ready]} />`. Les dépendances passées garantissent que l'observateur est remonté après hydratation (`ready === true`) et après chaque mise à jour de la liste des favoris.

**Intégration dans `/artist/[id]` (`src/app/artist/[id]/page.tsx`) :**

`<ScrollAnimator />` ajouté dans le layout serveur (sans `deps`) — l'observateur est monté une seule fois au chargement de la page. Les éléments `.scroll-fade-in` dans `ArtistTopTracks` et `ArtistAlbums` sont animés automatiquement.

---

---

## Auth et protection de route (session 2026-06-23)

### Middleware Next.js (`src/middleware.ts`)

Intercepte toutes les requêtes vers `/favourites` et sous-routes. Si l'utilisateur n'est pas authentifié, redirige vers `/login?redirect=/favourites`.

**Comportement :**
- Crée un client Supabase server-side via `createServerClient` (`@supabase/ssr`) à chaque requête.
- Lit et propage les cookies de session via `getAll` / `setAll` sur `request.cookies` et `supabaseResponse.cookies`.
- Appelle `supabase.auth.getUser()` — vérification serveur (pas de JWT local uniquement).
- Si `user === null` et pathname commence par `/favourites` → redirect `NextResponse.redirect` vers `/login?redirect=<pathname>`.
- Retourne `supabaseResponse` dans tous les cas pour propager les cookies de session mis à jour.

**Matcher :** `["/favourites/:path*"]`

**Variables d'environnement requises :**

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon Supabase |

### Client Supabase browser (`src/lib/supabase.ts`)

Exporte `createClient()` — factory retournant un `SupabaseClient` browser via `createBrowserClient` (`@supabase/ssr`). Utilisé par les composants Client pour les opérations auth (login, signup, logout) et les requêtes futures à la table `favourites`.

```ts
export function createClient(): SupabaseClient
```

---

## Composant `ImportFavouritesModal` (`src/components/ImportFavouritesModal.tsx`)

Client Component (`"use client"`). Affiche une modal de décision post-connexion demandant à l'utilisateur s'il souhaite importer ses favoris `localStorage` dans son compte Supabase.

**Props :**

| Prop | Type | Description |
|------|------|-------------|
| `count` | `number` | Nombre de favoris localStorage détectés — affiché dans le message de la modal |
| `onDecision` | `(importThem: boolean) => void` | Callback appelé avec `true` (importer) ou `false` (ignorer) quand l'utilisateur fait son choix |

**Comportement :**
- Affiché après une connexion réussie si des favoris localStorage existent (`count > 0`).
- Présente deux actions : importer les favoris dans le compte Supabase, ou les ignorer.
- Ne pilote pas la logique d'import elle-même — délègue la décision au parent via `onDecision`.

---

## Pages auth (`/login` et `/signup`)

### Page `/login` (`src/app/login/page.tsx` + `src/app/login/LoginForm.tsx`)

- `login/page.tsx` : Server Component wrapper — encapsule `LoginForm` dans un `<Suspense>` (requis pour `useSearchParams` dans un Client Component sous Next.js App Router).
- `LoginForm.tsx` : Client Component (`"use client"`). Formulaire email + mot de passe.

**Flux de connexion :**
1. `supabase.auth.signInWithPassword({ email, password })` via `createClient()`.
2. Si la connexion réussit, lit `localStorage["spotifind_favourites"]`.
3. Si des favoris localStorage existent (longueur > 0), monte `ImportFavouritesModal` (count = nombre d'items) et suspend la navigation.
4. `handleImportDecision(importThem: boolean)` :
   - Si `true` : appelle `supabase.from("favourites").upsert(...)` avec `onConflict: "user_id,kind,name,artist"` pour éviter les doublons. Colonnes écrites : `user_id`, `kind`, `name`, `artist`, `image_url`, `href`.
   - Dans les deux cas : `localStorage.removeItem(STORAGE_KEY)` puis `router.push(redirect ?? "/")`.
5. Si aucun favori localStorage → `router.push(redirect ?? "/")` immédiatement.

**Paramètre URL :** `?redirect=<pathname>` — lu via `useSearchParams()`, utilisé pour rediriger après connexion.

### Page `/signup` (`src/app/signup/page.tsx`)

Client Component (`"use client"`). Formulaire de création de compte email + mot de passe.

**Champs :** email, mot de passe (minLength=6), confirmation mot de passe (minLength=6).

**Validation côté client :** comparaison `password !== confirm` avant appel Supabase. Si non correspondent → affiche `"Les mots de passe ne correspondent pas."` sans appel réseau.

**Flux :**
1. `supabase.auth.signUp({ email, password })` via `createClient()`.
2. Si erreur → affiche `error.message` dans un `<p className="text-red-400">`.
3. Si succès → `router.push("/")`.

**Lien de navigation :** lien vers `/login` ("Déjà un compte ?") via `<Link>`.

---

## Table Supabase `favourites` (schéma inféré)

La logique d'upsert dans `LoginForm.tsx` révèle les colonnes utilisées :

| Colonne | Type inféré | Description |
|---------|-------------|-------------|
| `user_id` | `uuid` (FK → auth.users) | Propriétaire du favori |
| `kind` | `text` | Type : `"track"`, `"album"`, `"artist"` |
| `name` | `text` | Nom du titre / album / artiste |
| `artist` | `text` | Artiste (chaîne vide si absent) |
| `image_url` | `text` (nullable) | URL de la pochette |
| `href` | `text` | URL de destination dans l'app |

Contrainte unique inférée : `(user_id, kind, name, artist)` — utilisée comme clé de déduplication dans l'upsert.

> Le DDL exact (migrations Supabase) n'est pas versioné dans ce dépôt. Schéma à vérifier dans la console Supabase du projet.

---

## Flow mot de passe oublié / réinitialisation (session 2026-06-23)

Implémenté sur la branche `feat/auth-supabase-favourites`. Repose sur le PKCE flow Supabase et une route handler Next.js dédiée.

### Route handler PKCE (`src/app/auth/callback/route.ts`)

Route `GET /auth/callback` côté serveur. Échange le `code` PKCE reçu en query param contre une session Supabase via `supabase.auth.exchangeCodeForSession(code)`. Redirige ensuite vers le paramètre `?next=` (ou `/` par défaut).

Utilisé comme `redirectTo` pour le reset de mot de passe : Supabase envoie un email avec un lien pointant vers `/auth/callback?next=/reset-password`, ce qui établit la session avant de rediriger l'utilisateur vers le formulaire de nouveau mot de passe.

### Page "Mot de passe oublié" (`src/app/forgot-password/page.tsx`)

Client Component (`"use client"`). Formulaire à un champ (email).

**Flux :**
1. Appel `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/auth/callback?next=/reset-password })`.
2. Affiche un message de confirmation après envoi ("Vérifiez votre boîte mail").
3. Pas de redirect — l'utilisateur reste sur la page de confirmation.

### Page "Réinitialisation du mot de passe" (`src/app/reset-password/page.tsx` + `src/app/reset-password/ResetPasswordForm.tsx`)

- `reset-password/page.tsx` : Server Component wrapper — encapsule `ResetPasswordForm` dans un `<Suspense>`.
- `ResetPasswordForm.tsx` : Client Component (`"use client"`).

**Flux :**
1. Vérifie la session via `supabase.auth.getUser()` — la session a été établie par `/auth/callback`.
2. Si pas de session (accès direct sans token valide) → affiche un message d'erreur.
3. Sinon affiche le formulaire : champ "nouveau mot de passe".
4. Appelle `supabase.auth.updateUser({ password })` à la soumission.
5. Redirige vers `/` après mise à jour réussie.

### Lien depuis LoginForm

`src/app/login/LoginForm.tsx` — ajout d'un lien "Mot de passe oublié ?" pointant vers `/forgot-password`, positionné sous le formulaire.

---

## Lien cœur dans le header de `HomeContent` (`src/components/HomeContent.tsx`)

Le header de la homepage expose un lien cœur (`<Link>`) vers la page des favoris, positionné en haut à droite.

**Comportement de redirection conditionnel (session 2026-06-23) :**

- `isAuthenticated` est lu depuis `useFavourites()` (exposé par `FavouritesContext`).
- Si `isAuthenticated === true` : `href="/favourites"` — navigation directe vers la page des favoris.
- Si `isAuthenticated === false` : `href="/login?redirect=/favourites"` — redirige vers la page de connexion avec paramètre `?redirect=` pour retour post-login automatique.

Ce comportement complète le middleware Next.js (protection serveur) en ajoutant une redirection côté client dès le clic sur l'icône, avant même que la requête vers `/favourites` ne soit émise.

**Badge compteur :**
- `count` est calculé depuis `favourites.length` — masqué si `ready === false` (avant hydratation) pour éviter un flash.
- Le badge rouge (chiffre) est visible uniquement si `count > 0`.
- Le SVG cœur est plein (`fill="currentColor"`) si `count > 0`, vide (`fill="none"`) sinon.

---

## Points non implémentés (périmètre branche)

- Support type `"album"` et `"artist"` dans `HeartButton` (seul `"track"` est intégré pour l'instant)
- La classe `scroll-fade-in` n'est pas encore appliquée aux cards de la page `/favourites` elle-même
- `FavouritesContext` non encore migré de localStorage vers Supabase
- `AuthHeader` non encore créé
- `HeartButton` modifié pour redirect `/login` si non connecté (implémenté, session 2026-06-23)
