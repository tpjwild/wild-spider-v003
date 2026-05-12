"use client";

import { colors } from "@/constants/colors";
import { CopySeedIcon } from "@/components/game/CopySeedIcon";
import { computeScore } from "@/engine/scoring";
import { formatScore } from "@/lib/formatScore";
import type { GameState } from "@/engine/types";

export function GameBar({
  game,
  /** When true, seed is hidden until the initial deal animation finishes (new game / restart). */
  deferSeedDisplay = false,
}: {
  game: GameState;
  deferSeedDisplay?: boolean;
}) {
  const score = formatScore(computeScore(game).total);
  const moves = game.history.length;
  const seed = game.config.seed;
  const seedShown = deferSeedDisplay ? null : seed;

  return (
    <header
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2 border-b border-black/20 px-3 py-2 text-sm"
      data-testid="game-bar"
      style={{ backgroundColor: colors.gameBar }}
    >
      <div className="flex min-w-0 items-center justify-self-start text-emerald-100/85">
        <span data-testid="game-seed" className="inline-flex min-w-0 items-center gap-1.5">
          Seed{" "}
          <span
            className={`min-w-0 break-all font-mono ${deferSeedDisplay ? "text-emerald-200/50" : "text-emerald-50"}`}
          >
            {seedShown ?? "—"}
          </span>
          <button
            type="button"
            disabled={deferSeedDisplay}
            className="-m-0.5 shrink-0 cursor-pointer rounded p-0.5 text-emerald-200/90 hover:bg-white/10 hover:text-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-emerald-200/90"
            aria-label="Copy seed to clipboard"
            title={deferSeedDisplay ? "Seed shown after the deal finishes" : "Copy seed"}
            data-testid="copy-seed"
            onClick={() => {
              if (deferSeedDisplay) return;
              void navigator.clipboard?.writeText(seed).catch(() => {
                /* ignore — e.g. non-secure context */
              });
            }}
          >
            <CopySeedIcon />
          </button>
        </span>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-4 text-emerald-100/85">
        <span data-testid="game-moves">
          Moves <span className="text-emerald-50">{moves}</span>
        </span>
        <span data-testid="game-score">
          Score <span className="text-emerald-50">{score}</span>
        </span>
      </div>

      <div className="flex justify-end justify-self-end gap-2">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded border border-emerald-950/40 px-3 py-1 text-xs text-emerald-200/40"
          title="Deck popup — Stage 4"
        >
          Deck
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded border border-emerald-950/40 px-3 py-1 text-xs text-emerald-200/40"
          title="Stock popup — Stage 4"
        >
          Stock
        </button>
      </div>
    </header>
  );
}
