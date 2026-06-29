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
      <div className="photo-reveal w-full max-w-sm p-8 rounded-xl border border-border bg-surface">
        <h1 className="reveal-ltr text-2xl font-bold mb-6">Connexion</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="reveal-ltr text-sm text-muted" style={{ animationDelay: "0.35s" }}>
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
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="reveal-ltr text-sm text-muted" style={{ animationDelay: "0.55s" }}>
                Mot de passe
              </label>
              <Link
                href="/forgot-password"
                className="reveal-rtl text-xs text-muted hover:text-foreground transition-colors"
                style={{ animationDelay: "0.55s" }}
              >
                Mot de passe oublié ?
              </Link>
            </div>
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
            className="bubble-reveal mt-2 py-2 rounded-lg bg-spotify text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ animationDelay: "0.75s" }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="fade-up mt-4 text-sm text-center text-muted" style={{ animationDelay: "0.95s" }}>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-foreground hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
