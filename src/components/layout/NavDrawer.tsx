"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Game" },
  { href: "/achievements", label: "Achievements" },
  { href: "/decks", label: "Decks" },
  { href: "/hof", label: "Hall of Fame" },
  { href: "/settings", label: "Settings" },
] as const;

export function NavDrawer({ open, onRequestClose }: { open: boolean; onRequestClose: () => void }) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 cursor-default bg-black/50"
        aria-label="Close navigation menu"
        onClick={onRequestClose}
      />
      <nav
        id="app-nav-drawer"
        className="fixed left-0 top-0 z-[60] flex h-full w-[min(18rem,88vw)] flex-col gap-1 border-r border-white/10 bg-zinc-950 py-4 pl-4 pr-3 shadow-2xl"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Navigate</p>
        <ul className="mt-2 flex flex-col gap-0.5 text-sm">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`block rounded px-3 py-2 hover:bg-white/10 ${active ? "bg-white/10 text-emerald-100" : "text-zinc-200"}`}
                  onClick={onRequestClose}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
