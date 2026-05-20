"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GameApp } from "@/components/game/GameApp";
import { colors } from "@/constants/colors";
import { NavDrawer } from "@/components/layout/NavDrawer";

function subpageViewTitle(pathname: string): string {
  if (pathname === "/achievements") return "Achievements";
  if (pathname === "/decks") return "Decks";
  if (pathname === "/hof") return "Hall of Fame";
  if (pathname === "/settings") return "Settings";
  return "Wild Spider";
}

function subpageMainBackground(pathname: string): string {
  if (pathname === "/decks") return colors.decksListViewBackground;
  return colors.surface;
}

/**
 * Authenticated shell: {@link GameApp} stays mounted (hidden off `/`) so returning to the game
 * does not re-run bootstrap. Subpages get the shared title bar and nav drawer.
 */
export function AuthAppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isGame = pathname === "/";
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target;
      if (t instanceof HTMLElement && t.closest('[aria-modal="true"]')) return;
      setNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  const viewTitle = subpageViewTitle(pathname);
  const mainBg = subpageMainBackground(pathname);

  return (
    <>
      <div className={isGame ? "contents" : "hidden"} aria-hidden={!isGame}>
        <GameApp />
      </div>

      <div
        className={isGame ? "hidden" : "flex min-h-[100dvh] flex-col"}
        style={{ backgroundColor: mainBg, color: colors.text }}
        aria-hidden={isGame}
      >
        <div
          className="sticky top-0 z-40 shrink-0 border-b border-black/25 shadow-[0_6px_16px_rgba(0,0,0,0.28)]"
          style={{ backgroundColor: mainBg }}
        >
          <header
            className="flex min-w-0 items-center gap-2 border-b border-black/20 px-2 py-2 sm:px-3"
            style={{ backgroundColor: colors.titleBar }}
          >
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded p-2 text-emerald-200/80 hover:bg-white/10"
              aria-label="Open navigation menu"
              aria-expanded={navOpen}
              aria-controls="app-nav-drawer"
              onClick={() => setNavOpen((o) => !o)}
            >
              ☰
            </button>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-emerald-50 sm:text-base">
              <span className="tracking-[0.14em]">WILD SPIDER</span>
              <span className="font-normal tracking-normal">: {viewTitle}</span>
            </h1>
          </header>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <NavDrawer open={navOpen} onRequestClose={() => setNavOpen(false)} />
      </div>
    </>
  );
}
