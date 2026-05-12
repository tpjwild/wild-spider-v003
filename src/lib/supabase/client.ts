import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;

function readUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function readAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/** True when URL/key look like a real project (not template placeholders). */
export function isSupabaseConfigured(): boolean {
  const url = readUrl();
  const key = readAnonKey();
  if (!url || !key) return false;
  if (url.includes("your-project")) return false;
  if (key === "your-anon-key") return false;
  return true;
}

/** Browser Supabase client; null when env is missing (local smoke tests without a project). */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (browserClient === undefined) {
    browserClient = createClient(readUrl()!, readAnonKey()!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
