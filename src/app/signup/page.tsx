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
      setError("Passwords do not match.");
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
      <div className="photo-reveal w-full max-w-sm p-8 rounded-xl border border-border bg-surface">
        <h1 className="reveal-ltr text-2xl font-bold mb-6">Create an account</h1>
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
            <label htmlFor="password" className="reveal-ltr text-sm text-muted" style={{ animationDelay: "0.55s" }}>
              Password
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
            <label htmlFor="confirm" className="reveal-ltr text-sm text-muted" style={{ animationDelay: "0.75s" }}>
              Confirm password
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
            className="bubble-reveal mt-2 py-2 rounded-lg bg-spotify text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ animationDelay: "0.95s" }}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="fade-up mt-4 text-sm text-center text-muted" style={{ animationDelay: "1.15s" }}>
          Already have an account?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
