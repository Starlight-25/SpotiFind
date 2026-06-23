# Auth & Favoris Supabase — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un système de comptes email/mot de passe (Supabase Auth) et persister les favoris utilisateur dans une table Supabase, en remplacement du localStorage.

**Architecture:** `FavouritesContext` est réécrit pour appeler Supabase directement côté client (interface publique inchangée). Un middleware Next.js protège `/favourites`. Après login, une modal propose d'importer les favoris localStorage existants.

**Tech Stack:** `@supabase/supabase-js`, `@supabase/ssr`, Next.js 14 App Router, Tailwind CSS, TypeScript strict.

---

## Fichiers

| Action | Fichier | Rôle |
|--------|---------|------|
| Créer | `src/lib/supabase.ts` | Client Supabase browser (singleton) |
| Créer | `src/middleware.ts` | Protection route `/favourites`, refresh session |
| Modifier | `src/contexts/FavouritesContext.tsx` | Remplace localStorage par Supabase, ajoute `isAuthenticated` + `userEmail` |
| Créer | `src/components/ImportFavouritesModal.tsx` | Modal "importer tes favoris locaux ?" |
| Créer | `src/app/login/page.tsx` | Wrapper Suspense pour la page login |
| Créer | `src/app/login/LoginForm.tsx` | Formulaire login client |
| Créer | `src/app/signup/page.tsx` | Page inscription client |
| Créer | `src/components/AuthHeader.tsx` | Bouton connexion / email + déconnexion |
| Modifier | `src/app/layout.tsx` | Ajoute `<AuthHeader />` |
| Modifier | `src/components/HeartButton.tsx` | Redirect `/login` si non authentifié |
| Modifier | `.env.example` | Documente les vars Supabase |

> **Note importante :** `artist` est toujours stocké comme `""` (chaîne vide) dans la DB quand il est `undefined` côté client — jamais `NULL`. Cela garantit le bon fonctionnement de la contrainte `UNIQUE(user_id, kind, name, artist)` en PostgreSQL (deux `NULL` seraient considérés distincts).

---

## Task 1: Installer les dépendances Supabase

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Installer les packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Expected output: packages ajoutés à `node_modules`, `package.json` mis à jour avec les deux dépendances.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add @supabase/supabase-js and @supabase/ssr"
```

---

## Task 2: Créer le client Supabase browser

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Créer `src/lib/supabase.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

`createBrowserClient` gère la déduplication en interne — appelé plusieurs fois dans la même session, il retourne le même client.

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat(auth): add Supabase browser client"
```

---

## Task 3: Créer le middleware de protection des routes

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Créer `src/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/favourites")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/favourites/:path*"],
};
```

- [ ] **Step 2: Vérifier que `npm run build` ne lève pas d'erreur TypeScript**

```bash
npm run lint
```

Expected: aucune erreur ESLint.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(auth): add middleware to protect /favourites route"
```

---

## Task 4: Réécrire FavouritesContext avec Supabase

**Files:**
- Modify: `src/contexts/FavouritesContext.tsx`

L'interface publique est étendue avec `isAuthenticated: boolean` et `userEmail: string | null`. Toutes les méthodes existantes (`toggle`, `remove`, `isFavourite`) conservent exactement les mêmes signatures.

- [ ] **Step 1: Réécrire `src/contexts/FavouritesContext.tsx`**

```typescript
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { FavouriteItem } from "@/lib/music-types";
import { buildFavouriteId } from "@/lib/favourite-utils";
import { createClient } from "@/lib/supabase";

interface FavouritesContextValue {
  favourites: FavouriteItem[];
  ready: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  isFavourite: (id: string) => boolean;
  toggle: (item: FavouriteItem) => void;
  remove: (id: string) => void;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

type DbRow = {
  kind: string;
  name: string;
  artist: string | null;
  image_url: string | null;
  href: string;
  added_at: string;
};

function dbRowToFavouriteItem(row: DbRow): FavouriteItem {
  const kind = row.kind as FavouriteItem["kind"];
  const artist = row.artist || undefined;
  return {
    id: buildFavouriteId(kind, row.name, artist),
    kind,
    name: row.name,
    artist,
    imageUrl: row.image_url ?? undefined,
    href: row.href,
    addedAt: new Date(row.added_at).getTime(),
  };
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  async function loadFavourites(userId: string) {
    const { data } = await supabase
      .from("favourites")
      .select("kind, name, artist, image_url, href, added_at")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    if (data) setFavourites(data.map(dbRowToFavouriteItem));
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadFavourites(user.id);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await loadFavourites(u.id);
      } else {
        setFavourites([]);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFavourite = useCallback(
    (id: string) => favourites.some((f) => f.id === id),
    [favourites]
  );

  const toggle = useCallback(
    (item: FavouriteItem) => {
      if (!user) return;
      const already = favourites.some((f) => f.id === item.id);

      // Optimistic update
      setFavourites((prev) =>
        already
          ? prev.filter((f) => f.id !== item.id)
          : [{ ...item, addedAt: Date.now() }, ...prev]
      );

      if (already) {
        supabase
          .from("favourites")
          .delete()
          .eq("user_id", user.id)
          .eq("kind", item.kind)
          .eq("name", item.name)
          .eq("artist", item.artist ?? "");
      } else {
        supabase.from("favourites").insert({
          user_id: user.id,
          kind: item.kind,
          name: item.name,
          artist: item.artist ?? "",
          image_url: item.imageUrl ?? null,
          href: item.href,
        });
      }
    },
    [user, favourites, supabase]
  );

  const remove = useCallback(
    (id: string) => {
      if (!user) return;
      const item = favourites.find((f) => f.id === id);
      if (!item) return;

      setFavourites((prev) => prev.filter((f) => f.id !== id));

      supabase
        .from("favourites")
        .delete()
        .eq("user_id", user.id)
        .eq("kind", item.kind)
        .eq("name", item.name)
        .eq("artist", item.artist ?? "");
    },
    [user, favourites, supabase]
  );

  return (
    <FavouritesContext.Provider
      value={{
        favourites,
        ready,
        isAuthenticated: !!user,
        userEmail: user?.email ?? null,
        isFavourite,
        toggle,
        remove,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavouritesContext(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx)
    throw new Error("useFavouritesContext must be used inside FavouritesProvider");
  return ctx;
}
```

- [ ] **Step 2: Vérifier le lint**

```bash
npm run lint
```

Expected: aucune erreur (le commentaire `eslint-disable` sur le `useEffect` est intentionnel — `loadFavourites` est défini dans le corps du composant et ne doit pas être dans les deps pour éviter une boucle infinie).

- [ ] **Step 3: Commit**

```bash
git add src/contexts/FavouritesContext.tsx
git commit -m "feat(auth): rewrite FavouritesContext to use Supabase instead of localStorage"
```

---

## Task 5: Créer ImportFavouritesModal

**Files:**
- Create: `src/components/ImportFavouritesModal.tsx`

- [ ] **Step 1: Créer `src/components/ImportFavouritesModal.tsx`**

```typescript
"use client";

interface Props {
  count: number;
  onDecision: (importThem: boolean) => void;
}

export default function ImportFavouritesModal({ count, onDecision }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm p-8 rounded-xl border border-border bg-surface flex flex-col gap-4">
        <h2 className="text-xl font-bold">Favoris locaux détectés</h2>
        <p className="text-muted text-sm">
          Tu as {count} favori{count > 1 ? "s" : ""} sauvegardé
          {count > 1 ? "s" : ""} sur cet appareil. Veux-tu les importer dans
          ton compte ?
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => onDecision(true)}
            className="flex-1 py-2 rounded-lg bg-spotify text-white font-medium hover:opacity-90 transition-opacity"
          >
            Importer
          </button>
          <button
            onClick={() => onDecision(false)}
            className="flex-1 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
          >
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ImportFavouritesModal.tsx
git commit -m "feat(auth): add ImportFavouritesModal component"
```

---

## Task 6: Créer la page login

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/LoginForm.tsx`

- [ ] **Step 1: Créer `src/app/login/LoginForm.tsx`**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { FavouriteItem } from "@/lib/music-types";
import ImportFavouritesModal from "@/components/ImportFavouritesModal";

const STORAGE_KEY = "spotifind_favourites";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localFavourites, setLocalFavourites] = useState<FavouriteItem[] | null>(
    null
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as FavouriteItem[];
        if (items.length > 0) {
          setLocalFavourites(items);
          setLoading(false);
          return;
        }
      }
    } catch {}

    const redirect = searchParams.get("redirect") ?? "/";
    router.push(redirect);
  };

  const handleImportDecision = async (importThem: boolean) => {
    if (importThem && localFavourites) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("favourites").upsert(
          localFavourites.map((item) => ({
            user_id: user.id,
            kind: item.kind,
            name: item.name,
            artist: item.artist ?? "",
            image_url: item.imageUrl ?? null,
            href: item.href,
          })),
          { onConflict: "user_id,kind,name,artist" }
        );
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    const redirect = searchParams.get("redirect") ?? "/";
    router.push(redirect);
  };

  if (localFavourites) {
    return (
      <ImportFavouritesModal
        count={localFavourites.length}
        onDecision={handleImportDecision}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm p-8 rounded-xl border border-border bg-surface">
        <h1 className="text-2xl font-bold mb-6">Connexion</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-spotify transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-muted">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-spotify transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2 rounded-lg bg-spotify text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-muted">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-foreground hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Créer `src/app/login/page.tsx`**

```typescript
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

`useSearchParams()` dans un Client Component exige une Suspense boundary en Next.js 14 App Router. Le wrapper `Suspense` ici satisfait cette exigence.

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx src/app/login/LoginForm.tsx
git commit -m "feat(auth): add /login page with localStorage import modal"
```

---

## Task 7: Créer la page signup

**Files:**
- Create: `src/app/signup/page.tsx`

- [ ] **Step 1: Créer `src/app/signup/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm p-8 rounded-xl border border-border bg-surface">
        <h1 className="text-2xl font-bold mb-6">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-spotify transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-muted">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-spotify transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="confirm" className="text-sm text-muted">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-spotify transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2 rounded-lg bg-spotify text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-muted">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/signup/page.tsx
git commit -m "feat(auth): add /signup page"
```

---

## Task 8: Créer AuthHeader et mettre à jour le layout

**Files:**
- Create: `src/components/AuthHeader.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Créer `src/components/AuthHeader.tsx`**

```typescript
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFavouritesContext } from "@/contexts/FavouritesContext";
import { createClient } from "@/lib/supabase";

export default function AuthHeader() {
  const { isAuthenticated, userEmail, ready } = useFavouritesContext();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!ready) return null;

  return (
    <div className="fixed top-4 right-16 z-50 flex items-center gap-3">
      {isAuthenticated ? (
        <>
          <span className="text-sm text-muted truncate max-w-[160px]">
            {userEmail}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Déconnexion
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Connexion
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modifier `src/app/layout.tsx`** — ajouter `<AuthHeader />` dans `FavouritesProvider`

```typescript
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FavouritesProvider } from "@/contexts/FavouritesContext";
import { AudioAnalyserProvider } from "@/contexts/AudioAnalyserContext";
import AudioPulseButton from "@/components/AudioPulseButton";
import ThemeToggle from "@/components/ThemeToggle";
import WaveShader from "@/components/WaveShader";
import AuthHeader from "@/components/AuthHeader";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SpotiFind",
  description: "Explore music with the Spotify API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AudioAnalyserProvider>
          <FavouritesProvider>
            <div className="container-app">
              {children}
            </div>
            <AuthHeader />
            <AudioPulseButton />
            <ThemeToggle />
            <WaveShader side="left" />
            <WaveShader side="right" />
          </FavouritesProvider>
        </AudioAnalyserProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthHeader.tsx src/app/layout.tsx
git commit -m "feat(auth): add AuthHeader with login/logout to layout"
```

---

## Task 9: Mettre à jour HeartButton

**Files:**
- Modify: `src/components/HeartButton.tsx`

- [ ] **Step 1: Modifier `src/components/HeartButton.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFavourites } from "@/hooks/useFavourites";
import type { FavouriteItem } from "@/lib/music-types";

type HeartButtonProps = Omit<FavouriteItem, "addedAt">;

const PARTICLES = [
  { tx:  0,   ty: -24, w: 5, h: 5, color: "#f43f5e" },
  { tx:  17,  ty: -17, w: 4, h: 4, color: "#ec4899" },
  { tx:  24,  ty:   0, w: 5, h: 5, color: "#a855f7" },
  { tx:  17,  ty:  17, w: 3, h: 3, color: "#f43f5e" },
  { tx:  0,   ty:  24, w: 5, h: 5, color: "#ec4899" },
  { tx: -17,  ty:  17, w: 4, h: 4, color: "#f43f5e" },
  { tx: -24,  ty:   0, w: 3, h: 3, color: "#a855f7" },
  { tx: -17,  ty: -17, w: 5, h: 5, color: "#ec4899" },
];

export default function HeartButton(props: HeartButtonProps) {
  const { isFavourite, toggle, ready, isAuthenticated } = useFavourites();
  const active = ready && isFavourite(props.id);
  const [bursting, setBursting] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const willBeActive = !active;
    toggle({ ...props, addedAt: Date.now() });
    if (willBeActive) {
      setBursting(true);
      setTimeout(() => setBursting(false), 650);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`relative flex-shrink-0 transition-colors ${
        active ? "text-red-400" : "text-muted hover:text-foreground"
      }`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={bursting ? "heart-pop" : ""}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {bursting && PARTICLES.map((p, i) => (
        <span
          key={i}
          className="heart-particle"
          style={{
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            "--p-delay": `${i * 15}ms`,
            width: p.w,
            height: p.h,
            marginLeft: -p.w / 2,
            marginTop: -p.h / 2,
            background: p.color,
          } as React.CSSProperties}
        />
      ))}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeartButton.tsx
git commit -m "feat(auth): redirect to /login on HeartButton click when unauthenticated"
```

---

## Task 10: Mettre à jour .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Mettre à jour `.env.example`**

```
LASTFM_API_KEY=
THEAUDIODB_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore(config): document Supabase env vars in .env.example"
```

---

## Vérification finale

- [ ] Lancer `npm run dev` et vérifier :
  - [ ] `/` s'affiche sans erreur
  - [ ] Clic sur un cœur sans être connecté → redirect `/login`
  - [ ] `/login` : formulaire fonctionne, connexion redirige vers `/`
  - [ ] `/signup` : création de compte fonctionne
  - [ ] Une fois connecté : clic cœur → favori sauvegardé en DB (vérifiable dans Supabase Table Editor)
  - [ ] `/favourites` sans être connecté → redirect `/login`
  - [ ] `/favourites` connecté → liste des favoris depuis Supabase
  - [ ] Déconnexion via AuthHeader → favoris vidés, redirect `/`
