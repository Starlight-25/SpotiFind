"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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

  const supabase = useMemo(() => createClient(), []);

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
    async (item: FavouriteItem) => {
      if (!user) return;
      const already = favourites.some((f) => f.id === item.id);

      setFavourites((prev) =>
        already
          ? prev.filter((f) => f.id !== item.id)
          : [{ ...item, addedAt: Date.now() }, ...prev]
      );

      if (already) {
        const { error } = await supabase
          .from("favourites")
          .delete()
          .eq("user_id", user.id)
          .eq("kind", item.kind)
          .eq("name", item.name)
          .eq("artist", item.artist ?? "");
        if (error) console.error("[favourites] delete error:", error);
      } else {
        const { error } = await supabase.from("favourites").insert({
          user_id: user.id,
          kind: item.kind,
          name: item.name,
          artist: item.artist ?? "",
          image_url: item.imageUrl ?? null,
          href: item.href,
        });
        if (error) console.error("[favourites] insert error:", error);
      }
    },
    [user, favourites, supabase]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      const item = favourites.find((f) => f.id === id);
      if (!item) return;

      setFavourites((prev) => prev.filter((f) => f.id !== id));

      const { error } = await supabase
        .from("favourites")
        .delete()
        .eq("user_id", user.id)
        .eq("kind", item.kind)
        .eq("name", item.name)
        .eq("artist", item.artist ?? "");
      if (error) console.error("[favourites] remove error:", error);
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
