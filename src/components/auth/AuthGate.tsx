"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * When Supabase is configured, requires a signed-in user (except bypass).
 * Redirects unauthenticated visitors to `/login`.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { bypass, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (bypass || loading) return;
    if (user) return;
    const next = encodeURIComponent(pathname || "/");
    router.replace(`/login?next=${next}`);
  }, [bypass, loading, user, router, pathname]);

  if (bypass) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] text-zinc-400">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] text-zinc-400">
        Redirecting to login…
      </div>
    );
  }

  return <>{children}</>;
}
