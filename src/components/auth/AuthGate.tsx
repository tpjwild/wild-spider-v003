"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

function AuthStatusShell({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1419] text-zinc-400">
      {message}
    </div>
  );
}

/**
 * When Supabase is configured, requires a signed-in user (except bypass).
 * Redirects unauthenticated visitors to `/login`.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { bypass, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Hydration gate: avoid redirect mismatch before client mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot mount flag
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || bypass || loading) return;
    if (user) return;
    const next = encodeURIComponent(pathname || "/");
    router.replace(`/login?next=${next}`);
  }, [mounted, bypass, loading, user, router, pathname]);

  if (!mounted) {
    return <AuthStatusShell message="Checking session…" />;
  }

  if (bypass) {
    return <>{children}</>;
  }

  if (loading) {
    return <AuthStatusShell message="Checking session…" />;
  }

  if (!user) {
    return <AuthStatusShell message="Redirecting to login…" />;
  }

  return <>{children}</>;
}
