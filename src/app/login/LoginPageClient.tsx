"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type Mode = "login" | "signup" | "reset";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { bypass, loading, user } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const client = useMemo(() => getSupabaseBrowserClient(), []);

  const goAfterAuth = useCallback(() => {
    const safe = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
    router.replace(safe);
  }, [router, nextPath]);

  useEffect(() => {
    if (bypass || loading) return;
    if (user) goAfterAuth();
  }, [bypass, loading, user, goAfterAuth]);

  if (bypass) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 bg-[#0f1419] px-6 text-zinc-200">
        <h1 className="text-center text-xl font-semibold tracking-[0.18em] text-emerald-50">WILD SPIDER</h1>
        <p className="text-center text-sm text-zinc-400">
          Supabase URL/key are not configured. Start the game at the home page without signing in.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-emerald-800 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700"
        >
          Continue to game
        </Link>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 bg-[#0f1419] px-6 text-zinc-200">
        <h1 className="text-center text-xl font-semibold tracking-[0.18em] text-emerald-50">WILD SPIDER</h1>
        <p className="text-center text-sm text-zinc-400">
          Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (see `.env.example`).
        </p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!client) {
      setError("Supabase client is not available.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "reset") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { error: err } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${origin}/auth/reset`,
        });
        if (err) throw err;
        setMessage("Check your email for a password reset link.");
        setMode("login");
      } else if (mode === "signup") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error: err } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${origin}/` },
        });
        if (err) throw err;
        if (data.session) {
          goAfterAuth();
        } else {
          setMessage("Account created. If email confirmation is required, check your inbox before signing in.");
        }
      } else {
        const { error: err } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        goAfterAuth();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] text-zinc-400">
        {loading ? "Loading…" : "Redirecting…"}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-[#0f1419] px-6 py-12 text-zinc-200">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-[0.18em] text-emerald-50">WILD SPIDER</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {mode === "login" && "Sign in to save and resume your game."}
          {mode === "signup" && "Create an account."}
          {mode === "reset" && "We will email you a reset link."}
        </p>
      </div>

      <div className="flex gap-2 rounded-lg border border-white/10 bg-zinc-900/80 p-1 text-xs">
        <button
          type="button"
          className={`flex-1 rounded-md px-2 py-2 font-medium ${mode === "login" ? "bg-emerald-900/80 text-emerald-50" : "text-zinc-400"}`}
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
        >
          Login
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-2 py-2 font-medium ${mode === "signup" ? "bg-emerald-900/80 text-emerald-50" : "text-zinc-400"}`}
          onClick={() => {
            setMode("signup");
            setError(null);
            setMessage(null);
          }}
        >
          Sign up
        </button>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-zinc-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-600"
          />
        </div>
        {mode !== "reset" ? (
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-zinc-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-600"
            />
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300/90">{message}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset email"}
        </button>
      </form>

      {mode === "login" ? (
        <button
          type="button"
          className="w-full text-center text-xs text-emerald-200/80 underline-offset-2 hover:underline"
          onClick={() => {
            setMode("reset");
            setError(null);
            setMessage(null);
          }}
        >
          Forgot password?
        </button>
      ) : null}
    </div>
  );
}
