"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    void client.auth.getSession();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Supabase is not configured.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await client.auth.updateUser({ password });
      if (err) throw err;
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 bg-[#0f1419] px-6 text-zinc-200">
        <p className="text-sm text-zinc-400">Supabase is not configured.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-[#0f1419] px-6 py-12 text-zinc-200">
      <h1 className="text-lg font-semibold text-emerald-50">Set a new password</h1>
      <p className="text-sm text-zinc-400">Use the link from your email to reach this page, then choose a new password.</p>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="pw1" className="block text-xs text-zinc-400">
            New password
          </label>
          <input
            id="pw1"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="pw2" className="block text-xs text-zinc-400">
            Confirm password
          </label>
          <input
            id="pw2"
            type="password"
            autoComplete="new-password"
            required
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="mt-1 w-full rounded border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
