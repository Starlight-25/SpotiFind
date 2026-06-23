"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm p-8 rounded-xl border border-border bg-surface flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Email envoyé</h1>
          <p className="text-sm text-muted">
            Un lien de réinitialisation a été envoyé à{" "}
            <span className="text-foreground">{email}</span>. Vérifie ta boîte
            mail.
          </p>
          <Link
            href="/login"
            className="text-sm text-center text-muted hover:text-foreground transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm p-8 rounded-xl border border-border bg-surface">
        <h1 className="text-2xl font-bold mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-muted mb-6">
          Saisis ton email pour recevoir un lien de réinitialisation.
        </p>
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
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2 rounded-lg bg-spotify text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-muted">
          <Link href="/login" className="text-foreground hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
