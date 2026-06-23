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
