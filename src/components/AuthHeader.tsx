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
            aria-label="Déconnexion"
            title="Déconnexion"
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </>
      ) : (
        <Link
          href="/login"
          aria-label="Connexion"
          title="Connexion"
          className="text-muted hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        </Link>
      )}
    </div>
  );
}
