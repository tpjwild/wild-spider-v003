"use client";

import { useEffect, useRef } from "react";
import { GameShell } from "@/components/game/GameShell";
import { fetchSavedGame } from "@/lib/savedGamesRemote";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchUserSettings } from "@/lib/userSettingsRemote";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGameStore } from "@/state/gameStore";

export function GameApp() {
  const { bypass, loading: authLoading, user } = useAuth();
  const hydrated = useGameStore((s) => s.hydrated);
  const hydrateLocalOnly = useGameStore((s) => s.hydrateLocalOnly);
  const hydrateFromLocalAfterAuth = useGameStore((s) => s.hydrateFromLocalAfterAuth);
  const applyCloudBootstrap = useGameStore((s) => s.applyCloudBootstrap);
  const setUserSettings = useGameStore((s) => s.setUserSettings);
  const bootstrapRun = useRef(0);

  useEffect(() => {
    if (authLoading) return;

    if (bypass || !isSupabaseConfigured()) {
      hydrateLocalOnly();
      return;
    }

    if (!user) {
      return;
    }

    const userId = user.id;
    const runId = ++bootstrapRun.current;
    let cancelled = false;

    useGameStore.setState({ hydrated: false });

    (async () => {
      const client = getSupabaseBrowserClient();
      if (!client) {
        if (cancelled || runId !== bootstrapRun.current) return;
        hydrateFromLocalAfterAuth();
        return;
      }
      try {
        const [cloud, settings] = await Promise.all([
          fetchSavedGame(client, userId),
          fetchUserSettings(client, userId),
        ]);
        if (cancelled || runId !== bootstrapRun.current) return;
        setUserSettings({ confirmSave: settings.confirm_save });
        if (cloud) {
          applyCloudBootstrap(cloud);
        } else {
          hydrateFromLocalAfterAuth();
        }
      } catch {
        if (cancelled || runId !== bootstrapRun.current) return;
        hydrateFromLocalAfterAuth();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, bypass, user?.id, hydrateLocalOnly, hydrateFromLocalAfterAuth, applyCloudBootstrap, setUserSettings]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] text-zinc-400">
        Loading…
      </div>
    );
  }

  return <GameShell />;
}
