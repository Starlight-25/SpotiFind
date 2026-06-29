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
        <div className="photo-reveal w-full max-w-sm p-8 rounded-xl border border-border bg-surface flex flex-col gap-4">
          <h1 className="reveal-ltr text-2xl font-bold">Email sent</h1>
          <p className="fade-up text-sm text-muted" style={{ animationDelay: "0.35s" }}>
            A reset link has been sent to{" "}
            <span className="text-foreground">{email}</span>. Check your inbox.
          </p>
          <Link
            href="/login"
            className="fade-up text-sm text-center text-muted hover:text-foreground transition-colors"
            style={{ animationDelay: "0.55s" }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="photo-reveal w-full max-w-sm p-8 rounded-xl border border-border bg-surface">
        <h1 className="reveal-ltr text-2xl font-bold mb-2">Forgot password</h1>
        <p className="reveal-ltr text-sm text-muted mb-6" style={{ animationDelay: "0.35s" }}>
          Enter your email to receive a reset link.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="reveal-ltr text-sm text-muted" style={{ animationDelay: "0.55s" }}>
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
            className="bubble-reveal mt-2 py-2 rounded-lg bg-spotify text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ animationDelay: "0.75s" }}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p className="fade-up mt-4 text-sm text-center text-muted" style={{ animationDelay: "0.95s" }}>
          <Link href="/login" className="text-foreground hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
