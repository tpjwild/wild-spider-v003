"use client";

import { useEffect, useMemo } from "react";
import { CopySeedIcon } from "@/components/game/CopySeedIcon";
import { deckPairs } from "@/content/deckPairs";
import { applyDealEntriesProgress } from "@/engine/deal";
import { applyInitialDealEntriesProgress } from "@/engine/initialDeal";
import { computeScore } from "@/engine/scoring";
import { formatScore } from "@/lib/formatScore";
import { normalizeNumberOfSuits } from "@/lib/numberOfSuits";
import type { GameState } from "@/engine/types";
import type { DealAnimationState } from "@/state/gameStore";
import { useGameStore } from "@/state/gameStore";

function effectiveGameForSummary(
  game: GameState | null,
  dealAnimation: DealAnimationState | null,
): GameState | null {
  if (!game) return null;
  if (!dealAnimation) return game;
  if (dealAnimation.kind === "stock") {
    return applyDealEntriesProgress(game, dealAnimation.entries, dealAnimation.landedCount);
  }
  return applyInitialDealEntriesProgress(game, dealAnimation.entries, dealAnimation.landedCount);
}

function deckPairLabel(deckPairId: string): string {
  const p = deckPairs.find((d) => d.id === deckPairId);
  return p ? `${p.name} (${p.pairCode})` : deckPairId;
}

function isTextEntryElement(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;
  const t = (el as HTMLInputElement).type;
  return !["button", "submit", "reset", "checkbox", "radio", "file", "hidden"].includes(t);
}

export function EndGameDialog() {
  const open = useGameStore((s) => s.endGameOpen);
  const cancel = useGameStore((s) => s.cancelEndGame);
  const confirm = useGameStore((s) => s.confirmEndGame);
  const game = useGameStore((s) => s.game);
  const dealAnimation = useGameStore((s) => s.dealAnimation);

  const snapshot = useMemo(
    () => effectiveGameForSummary(game, dealAnimation),
    [game, dealAnimation],
  );

  const scoreText = useMemo(() => {
    if (!snapshot) return "—";
    return formatScore(computeScore(snapshot).total);
  }, [snapshot]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancel();
        return;
      }
      if (e.key !== "Enter" && e.code !== "NumpadEnter") return;
      if (e.repeat) return;
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (isTextEntryElement(t)) return;
      const onPrimaryOk = t.closest('[data-testid="end-game-confirm"]');
      const activeBtn = t.closest("button");
      if (activeBtn && !onPrimaryOk) return;
      e.preventDefault();
      e.stopPropagation();
      confirm();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, cancel, confirm]);

  if (!open) return null;

  const cfg = snapshot?.config;

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-default items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-game-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div
        className="w-full max-w-md cursor-default rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="end-game-title" className="text-lg font-semibold text-zinc-100">
          End game
        </h2>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Final score</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-50">{scoreText}</p>
          </div>

          {cfg ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Game</p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-zinc-300">
                <dt className="text-zinc-500">Columns</dt>
                <dd className="font-mono text-zinc-100">{cfg.columns}</dd>
                <dt className="text-zinc-500">Deals</dt>
                <dd className="font-mono text-zinc-100">{cfg.deals}</dd>
                <dt className="text-zinc-500">Suits (tableau)</dt>
                <dd className="font-mono text-zinc-100">{normalizeNumberOfSuits(cfg.numberOfSuits)}</dd>
                <dt className="text-zinc-500">Deck pair</dt>
                <dd className="text-zinc-100">{deckPairLabel(cfg.deckPairId)}</dd>
                <dt className="text-zinc-500">Jokers</dt>
                <dd className="font-mono text-zinc-100">{cfg.jokerCount}</dd>
                <dt className="self-start pt-0.5 text-zinc-500">Seed</dt>
                <dd className="min-w-0">
                  <span className="inline-flex min-w-0 items-start gap-1.5">
                    <span className="min-w-0 break-all font-mono text-xs text-emerald-100/90">{cfg.seed}</span>
                    <button
                      type="button"
                      className="-m-0.5 shrink-0 cursor-pointer rounded p-0.5 text-emerald-200/90 hover:bg-white/10 hover:text-emerald-50"
                      aria-label="Copy seed to clipboard"
                      data-testid="end-game-copy-seed"
                      onClick={() => {
                        void navigator.clipboard?.writeText(cfg.seed).catch(() => {
                          /* ignore — e.g. non-secure context */
                        });
                      }}
                    >
                      <CopySeedIcon />
                    </button>
                  </span>
                </dd>
              </dl>
            </div>
          ) : (
            <p className="text-zinc-500">No active game state.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            className="cursor-pointer rounded border border-white/20 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            className="cursor-pointer rounded bg-red-900/80 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-red-800"
            data-testid="end-game-confirm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
