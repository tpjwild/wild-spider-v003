"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_DECK_PAIR_ID, deckPairs, maxJokersInPlayForDeckPair } from "@/content/deckPairs";
import {
  formatFormattedGameSeed,
  getPairCodeForDeckId,
  newRandomShuffleKey,
  parseFormattedGameSeed,
} from "@/lib/formattedGameSeed";
import { validateGameConfig } from "@/engine/setup";
import type { GameConfig, NumberOfSuits } from "@/engine/types";
import { normalizeNumberOfSuits } from "@/lib/numberOfSuits";
import {
  decodeShareableGameSetup,
  SHAREABLE_SETUP_PREFIX,
} from "@/lib/shareableGameSetup";
import { loadLastNewGameDefaults } from "@/lib/gameStorage";
import { useGameStore } from "@/state/gameStore";

const defaultColumns = 8;
const defaultDeals = 6;
const defaultJokers = 0;
const defaultNumberOfSuits: NumberOfSuits = 4;
const maxJokersCap = 8;

function seedFieldError(trim: string, jokerCount: number, numberOfSuits: NumberOfSuits): string | null {
  if (!trim) return null;
  const ws = decodeShareableGameSetup(trim);
  if (ws) {
    try {
      validateGameConfig({ ...ws, jokerCount, numberOfSuits });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid configuration";
    }
  }
  const p = parseFormattedGameSeed(trim);
  if (p) {
    try {
      validateGameConfig({
        columns: p.columns,
        deals: p.deals,
        deckPairId: p.deckPairId,
        seed: p.canonical,
        jokerCount,
        numberOfSuits: p.numberOfSuits,
      });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid configuration";
    }
  }
  if (trim.startsWith(SHAREABLE_SETUP_PREFIX)) {
    return "Invalid ws1 replay code.";
  }
  return "Invalid seed — use CC-DDD-S-XXX-SSSSSSSSSSSSSS (S = 1, 2, or 4 suits; hyphens required) or a valid ws1: replay code.";
}

export function NewGameDialog() {
  const open = useGameStore((s) => s.newGameOpen);
  const startGame = useGameStore((s) => s.startGame);
  const closeNewGame = useGameStore((s) => s.closeNewGame);
  const lastError = useGameStore((s) => s.lastError);
  const clearError = useGameStore((s) => s.clearError);

  const [columns, setColumns] = useState(defaultColumns);
  const [deals, setDeals] = useState(defaultDeals);
  const [seed, setSeed] = useState("");
  const [jokers, setJokers] = useState(defaultJokers);
  const [deckPairId, setDeckPairId] = useState(DEFAULT_DECK_PAIR_ID);
  const [numberOfSuits, setNumberOfSuits] = useState<NumberOfSuits>(defaultNumberOfSuits);

  const columnsInputRef = useRef<HTMLInputElement>(null);
  const fieldsRef = useRef({
    columns: defaultColumns,
    deals: defaultDeals,
    seed: "",
    jokers: defaultJokers,
    deckPairId: DEFAULT_DECK_PAIR_ID,
    numberOfSuits: defaultNumberOfSuits,
  });

  const seedTrim = seed.trim();
  const hasSeedText = seedTrim.length > 0;
  const parsedFormatted = useMemo(
    () => (hasSeedText ? parseFormattedGameSeed(seedTrim) : null),
    [hasSeedText, seedTrim],
  );
  const ws1Config = useMemo(() => {
    if (!hasSeedText) return null;
    if (parsedFormatted) return null;
    return decodeShareableGameSetup(seedTrim);
  }, [hasSeedText, seedTrim, parsedFormatted]);

  const effective = useMemo(() => {
    if (parsedFormatted) {
      return {
        columns: parsedFormatted.columns,
        deals: parsedFormatted.deals,
        deckPairId: parsedFormatted.deckPairId,
        numberOfSuits: parsedFormatted.numberOfSuits,
      };
    }
    if (ws1Config) {
      return {
        columns: ws1Config.columns,
        deals: ws1Config.deals,
        deckPairId: ws1Config.deckPairId,
        numberOfSuits: normalizeNumberOfSuits(ws1Config.numberOfSuits),
      };
    }
    return { columns, deals, deckPairId, numberOfSuits };
  }, [parsedFormatted, ws1Config, columns, deals, deckPairId, numberOfSuits]);

  const product = effective.columns * effective.deals;
  const layoutProductInvalid = product > 104;
  const maxJokersForPair = Math.min(maxJokersCap, maxJokersInPlayForDeckPair(effective.deckPairId));
  const jokersInRange = Math.min(jokers, maxJokersForPair);
  const seedErr = useMemo(
    () => seedFieldError(seedTrim, jokersInRange, effective.numberOfSuits),
    [seedTrim, jokersInRange, effective.numberOfSuits],
  );
  const startDisabled =
    layoutProductInvalid || (hasSeedText && seedErr != null);

  const buildAndStart = useCallback(() => {
    try {
      const st = seed.trim();
      const j = fieldsRef.current.jokers;
      let cfg: GameConfig;

      if (!st) {
        const pairCode = getPairCodeForDeckId(fieldsRef.current.deckPairId);
        if (!pairCode) {
          return;
        }
        const shuffleKey = newRandomShuffleKey();
        const fullSeed = formatFormattedGameSeed(
          fieldsRef.current.columns,
          fieldsRef.current.deals,
          fieldsRef.current.numberOfSuits,
          pairCode,
          shuffleKey,
        );
        cfg = {
          columns: fieldsRef.current.columns,
          deals: fieldsRef.current.deals,
          deckPairId: fieldsRef.current.deckPairId,
          seed: fullSeed,
          jokerCount: j,
          numberOfSuits: fieldsRef.current.numberOfSuits,
        };
      } else {
        const ws = decodeShareableGameSetup(st);
        if (ws) {
          cfg = { ...ws, jokerCount: j };
        } else {
          const p = parseFormattedGameSeed(st);
          if (!p) return;
          cfg = {
            columns: p.columns,
            deals: p.deals,
            deckPairId: p.deckPairId,
            seed: p.canonical,
            jokerCount: j,
            numberOfSuits: p.numberOfSuits,
          };
        }
      }

      validateGameConfig(cfg);
      clearError();
      startGame(cfg);
    } catch {
      /* validateGameConfig — should not happen when startDisabled is false */
    }
  }, [seed, clearError, startGame]);

  useEffect(() => {
    fieldsRef.current = {
      columns: effective.columns,
      deals: effective.deals,
      seed,
      jokers: jokersInRange,
      deckPairId: effective.deckPairId,
      numberOfSuits: effective.numberOfSuits,
    };
  }, [effective.columns, effective.deals, effective.deckPairId, effective.numberOfSuits, seed, jokersInRange]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      const last = loadLastNewGameDefaults();
      if (last) {
        const pairOk = deckPairs.some((p) => p.id === last.deckPairId);
        setColumns(last.columns);
        setDeals(last.deals);
        setDeckPairId(pairOk ? last.deckPairId : DEFAULT_DECK_PAIR_ID);
        setJokers(last.jokerCount);
        setNumberOfSuits(normalizeNumberOfSuits(last.numberOfSuits));
        setSeed("");
      } else {
        setSeed("");
        setColumns(defaultColumns);
        setDeals(defaultDeals);
        setJokers(defaultJokers);
        setDeckPairId(DEFAULT_DECK_PAIR_ID);
        setNumberOfSuits(defaultNumberOfSuits);
      }
      columnsInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeNewGame();
        return;
      }

      if (e.key !== "Enter" && e.key !== "NumpadEnter") return;
      if (e.isComposing) return;

      const panel = document.querySelector('[data-testid="new-game-dialog"]');
      if (!panel) return;

      const t = e.target;
      const inPanel = t instanceof Node && panel.contains(t);
      const looseRoot =
        t === document.body || t === document.documentElement;
      if (!inPanel && !looseRoot) return;

      if (t instanceof HTMLButtonElement && t.type === "submit") return;

      const st = fieldsRef.current.seed.trim();
      const j = fieldsRef.current.jokers;
      const c = fieldsRef.current.columns;
      const d = fieldsRef.current.deals;
      const pair = fieldsRef.current.deckPairId;
      const suits = fieldsRef.current.numberOfSuits;

      if (st) {
        const err = seedFieldError(st, j, suits);
        if (err) return;
        if (fieldsRef.current.columns * fieldsRef.current.deals > 104) return;
      } else {
        if (c * d > 104) return;
      }

      e.preventDefault();
      try {
        if (!st) {
          const pairCode = getPairCodeForDeckId(pair);
          if (!pairCode) return;
          const shuffleKey = newRandomShuffleKey();
          const fullSeed = formatFormattedGameSeed(c, d, suits, pairCode, shuffleKey);
          validateGameConfig({
            columns: c,
            deals: d,
            deckPairId: pair,
            seed: fullSeed,
            jokerCount: j,
            numberOfSuits: suits,
          });
          clearError();
          startGame({
            columns: c,
            deals: d,
            deckPairId: pair,
            seed: fullSeed,
            jokerCount: j,
            numberOfSuits: suits,
          });
          return;
        }
        const ws = decodeShareableGameSetup(st);
        if (ws) {
          const cfg = { ...ws, jokerCount: j };
          validateGameConfig(cfg);
          clearError();
          startGame(cfg);
          return;
        }
        const p = parseFormattedGameSeed(st);
        if (!p) return;
        const cfg: GameConfig = {
          columns: p.columns,
          deals: p.deals,
          deckPairId: p.deckPairId,
          seed: p.canonical,
          jokerCount: j,
          numberOfSuits: p.numberOfSuits,
        };
        validateGameConfig(cfg);
        clearError();
        startGame(cfg);
      } catch {
        /* validateGameConfig threw */
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, closeNewGame, clearError, startGame]);

  if (!open) return null;

  const tryStartGame = () => {
    if (startDisabled) return;
    buildAndStart();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tryStartGame();
  };

  const layoutFieldsDisabled = hasSeedText;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-game-title"
      onClick={() => closeNewGame()}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl"
        data-testid="new-game-dialog"
      >
        <h2 id="new-game-title" className="text-lg font-semibold text-zinc-100">
          New game
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Seed format <span className="font-mono">CC-DDD-S-XXX-SSSSSSSSSSSSSS</span> (hyphens required): columns,
          deals, suits (1, 2, or 4), stable deck code (see list), then 14-digit shuffle key. Older seeds without{" "}
          <span className="font-mono">S</span> default to 4 suits. Leave blank for a random shuffle with the options
          you set. Joker count is always editable. Legacy{" "}
          <span className="font-mono">ws1:</span> codes still work. Return starts the game (same as Start Game).
          Press Escape or click outside to cancel.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-400">
            Columns (1–10)
            <input
              ref={columnsInputRef}
              type="number"
              min={1}
              max={10}
              value={effective.columns}
              disabled={layoutFieldsDisabled}
              onChange={(e) => setColumns(Number(e.target.value))}
              className="mt-1 w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="new-game-columns"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Deals (≥ 5)
            <input
              type="number"
              min={5}
              max={104}
              value={effective.deals}
              disabled={layoutFieldsDisabled}
              onChange={(e) => setDeals(Number(e.target.value))}
              className="mt-1 w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="new-game-deals"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Suits (tableau)
            <select
              value={effective.numberOfSuits}
              disabled={layoutFieldsDisabled}
              onChange={(e) => setNumberOfSuits(Number(e.target.value) as NumberOfSuits)}
              className="mt-1 w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="new-game-suits"
            >
              <option value={4}>4 — normal suits</option>
              <option value={2}>2 — half-wild (red/black)</option>
              <option value={1}>1 — wild (any suit)</option>
            </select>
          </label>
          <label className="col-span-2 text-xs text-zinc-400">
            Seed (optional)
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="mt-1 w-full rounded border border-white/20 bg-black/40 px-2 py-1 font-mono text-sm text-zinc-100"
              placeholder="e.g. 08-006-4-BAS-12345678901234"
              data-testid="new-game-seed"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Jokers in stock (0–{maxJokersForPair}) — temporary control
            <input
              type="number"
              min={0}
              max={maxJokersForPair}
              value={jokersInRange}
              onChange={(e) =>
                setJokers(Math.min(maxJokersForPair, Math.max(0, Number(e.target.value) || 0)))
              }
              className="mt-1 w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              data-testid="new-game-jokers"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Deck pair
            <select
              value={effective.deckPairId}
              disabled={layoutFieldsDisabled}
              onChange={(e) => setDeckPairId(e.target.value)}
              className="mt-1 w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="new-game-deck-pair"
            >
              {deckPairs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.pairCode})
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          Joker count is capped by the deck pair (Base has none; themed pairs allow up to eight). This spinner is
          temporary until unlocks set the count.
        </p>

        <p className="mt-2 text-xs text-zinc-500">
          Current: {effective.columns} × {effective.deals} = {product}{" "}
          {product > 104 ? "(invalid)" : "✓"}
        </p>

        {hasSeedText && seedErr ? (
          <p className="mt-2 text-xs text-red-400">{seedErr}</p>
        ) : null}
        {!hasSeedText && layoutProductInvalid ? (
          <p className="mt-2 text-xs text-red-400">columns × deals cannot exceed 104</p>
        ) : null}
        {lastError && (!hasSeedText || !seedErr) ? (
          <p className="mt-2 text-xs text-red-400">{lastError}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => closeNewGame()}
            className="cursor-pointer rounded border border-white/20 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={startDisabled}
            className="cursor-pointer rounded bg-amber-600 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="new-game-start"
          >
            Start Game
          </button>
        </div>
      </form>
    </div>
  );
}
