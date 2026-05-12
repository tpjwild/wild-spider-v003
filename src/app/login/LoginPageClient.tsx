"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type Mode = "login" | "signup" | "reset";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="flex min-h-0 flex-1 flex-col justify-center px-6 py-12 text-zinc-200">
        <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-4">
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
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center px-6 py-12 text-zinc-200">
        <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-4">
          <h1 className="text-center text-xl font-semibold tracking-[0.18em] text-emerald-50">WILD SPIDER</h1>
          <p className="text-center text-sm text-zinc-400">
            Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (see `.env.example`).
          </p>
        </div>
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
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-zinc-400">
        {loading ? "Loading…" : "Redirecting…"}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center px-6 py-12 text-zinc-200">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
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
              setShowPassword(false);
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
              setShowPassword(false);
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
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-white/15 bg-zinc-950 py-2 pl-3 pr-11 text-sm text-zinc-100 outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
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
              setShowPassword(false);
            }}
          >
            Forgot password?
          </button>
        ) : null}
      </div>
    </div>
  );
}
