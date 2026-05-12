"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CardView } from "@/components/game/CardView";
import { dimensions, shelfHorizontalStepPx } from "@/constants/dimensions";
import { timings } from "@/constants/timings";
import { applyDealEntriesProgress, leadStockIndicesForUpcomingDeals } from "@/engine/deal";
import { applyInitialDealEntriesProgress } from "@/engine/initialDeal";
import type { Card, GameState, InitialDealEntry } from "@/engine/types";
import { playSound, playSoundAsync, prepareSound, stopPlayingSound } from "@/lib/playSound";
import type {
  DealAnimationState,
  InitialDealAnimationState,
  StockDealAnimationState,
} from "@/state/gameStore";
import { useGameStore } from "@/state/gameStore";

const {
  cardWidth: cw,
  cardHeight: ch,
  stockCardOffset: so,
  stockMaxVisibleLayers,
  shelfHorizontalPad,
  shelfVerticalPad,
  tableauColumnCardOffset: off,
} = dimensions;

type FlyPayload = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  card: Card;
  durationMs: number;
  /** Face-up on the flying card (initial deal exposes column tops). */
  faceUp: boolean;
  /** Entry index; must match `dealAnimation.landedCount` when this flight’s land is applied. */
  landedCountAtFlightStart: number;
};

/**
 * Stock deal: `from` uses `landedCountForFrom` so overlapping flights leave the **current** stock top (DOM-aligned).
 * `to` uses `flightIndex` (predictive) so destinations match the column/shelf after prior cards of this deal land.
 */
function measureStockDealFly(
  baseGame: GameState,
  anim: StockDealAnimationState,
  flightIndex: number,
  landedCountForFrom: number,
): FlyPayload | null {
  if (typeof document === "undefined") return null;

  const { entries } = anim;
  const entry = entries[flightIndex];
  if (!entry) return null;

  const partialFrom = applyDealEntriesProgress(baseGame, entries, landedCountForFrom);
  const partialTo = applyDealEntriesProgress(baseGame, entries, flightIndex);

  const stockStack = document.querySelector<HTMLElement>("[data-stock-stack]");
  if (!stockStack) return null;
  const sr = stockStack.getBoundingClientRect();
  const cols = partialFrom.columns.length;
  const leads = leadStockIndicesForUpcomingDeals(partialFrom.stock, cols, stockMaxVisibleLayers);
  const shown = Math.max(1, leads.length);
  const fromX = sr.left;
  const fromY = sr.top + (shown - 1) * so;

  const durationMs = entry.tableauColumn === null ? timings.cardJokerDealDuration : timings.cardDealDuration;

  if (entry.tableauColumn !== null) {
    const col = entry.tableauColumn;
    const stackEl = document.querySelector<HTMLElement>(`[data-tableau-stack="${col}"]`);
    if (!stackEl) return null;
    const tr = stackEl.getBoundingClientRect();
    const depth = partialTo.columns[col]!.length;
    return {
      from: { x: fromX, y: fromY },
      to: { x: tr.left, y: tr.top + depth * off },
      card: entry.card,
      durationMs,
      faceUp: false,
      landedCountAtFlightStart: flightIndex,
    };
  }

  const shelfStack = document.querySelector<HTMLElement>("[data-shelf-stack]");
  let rr = shelfStack?.getBoundingClientRect();
  if (!shelfStack || !rr || (rr.width === 0 && rr.height === 0)) {
    const shelf = document.querySelector<HTMLElement>("[data-testid=\"shelf\"]");
    if (!shelf) return null;
    const sr0 = shelf.getBoundingClientRect();
    rr = new DOMRect(
      sr0.left + shelfHorizontalPad,
      sr0.top + shelfVerticalPad,
      Math.max(0, sr0.width - 2 * shelfHorizontalPad),
      ch,
    );
  }
  const n = partialTo.shelf.length;
  const shelfStep = shelfHorizontalStepPx();
  return {
    from: { x: fromX, y: fromY },
    to: { x: rr.left + n * shelfStep, y: rr.top },
    card: entry.card,
    durationMs,
    faceUp: false,
    landedCountAtFlightStart: flightIndex,
  };
}

/** New game / restart: cards fly from the stock (single visible back matches {@link StockPile} initial-deal mode). */
function measureInitialDealFly(
  baseGame: GameState,
  anim: InitialDealAnimationState,
  flightIndex: number,
): FlyPayload | null {
  if (typeof document === "undefined") return null;

  const { entries } = anim;
  const entry = entries[flightIndex];
  if (!entry) return null;

  const partialTo = applyInitialDealEntriesProgress(baseGame, entries, flightIndex);

  const stockStack = document.querySelector<HTMLElement>("[data-stock-stack]");
  if (!stockStack) return null;
  const sr = stockStack.getBoundingClientRect();
  const shown = 1;
  const fromX = sr.left;
  const fromY = sr.top + (shown - 1) * so;

  const durationMs =
    entry.tableauColumn === null ? timings.cardJokerDealDuration : timings.cardDealDuration;

  if (entry.tableauColumn !== null) {
    const col = entry.tableauColumn;
    const stackEl = document.querySelector<HTMLElement>(`[data-tableau-stack="${col}"]`);
    if (!stackEl) return null;
    const tr = stackEl.getBoundingClientRect();
    const depth = partialTo.columns[col]!.length;
    return {
      from: { x: fromX, y: fromY },
      to: { x: tr.left, y: tr.top + depth * off },
      card: entry.card,
      durationMs,
      faceUp: entry.faceUp,
      landedCountAtFlightStart: flightIndex,
    };
  }

  const shelfStack = document.querySelector<HTMLElement>("[data-shelf-stack]");
  let rr = shelfStack?.getBoundingClientRect();
  if (!shelfStack || !rr || (rr.width === 0 && rr.height === 0)) {
    const shelf = document.querySelector<HTMLElement>("[data-testid=\"shelf\"]");
    if (!shelf) return null;
    const sr0 = shelf.getBoundingClientRect();
    rr = new DOMRect(
      sr0.left + shelfHorizontalPad,
      sr0.top + shelfVerticalPad,
      Math.max(0, sr0.width - 2 * shelfHorizontalPad),
      ch,
    );
  }
  const n = partialTo.shelf.length;
  const shelfStep = shelfHorizontalStepPx();
  return {
    from: { x: fromX, y: fromY },
    to: { x: rr.left + n * shelfStep, y: rr.top },
    card: entry.card,
    durationMs,
    faceUp: false,
    landedCountAtFlightStart: flightIndex,
  };
}

/** Initial deal: only flights that place the face-up column top (`InitialDealEntry.faceUp`). Stock deal: every card. */
function shouldScheduleDealFlipSound(anim: DealAnimationState, flightIndex: number): boolean {
  if (anim.kind === "stock") return true;
  const e = anim.entries[flightIndex] as InitialDealEntry | undefined;
  if (!e || e.tableauColumn === null) return false;
  return e.faceUp;
}

function measureDealFly(
  baseGame: GameState,
  anim: DealAnimationState,
  flightIndex: number,
  landedCountForFrom: number,
): FlyPayload | null {
  if (anim.kind === "stock") {
    return measureStockDealFly(baseGame, anim, flightIndex, landedCountForFrom);
  }
  return measureInitialDealFly(baseGame, anim, flightIndex);
}

type ActiveFlight = FlyPayload & { entryIndex: number; session: number };

/**
 * Per-card deal flights: **cardDealDelay** is **start-to-start** (card *k* starts at *k × delay*).
 * Multiple cards may fly at once if delay &lt; duration. Completions may finish out of order; land order is serialized.
 * `cardFlipped` for deals is scheduled mid-flight via {@link timings.cardFlippedDuringDealProgress}.
 */
export function DealAnimationLayer() {
  const game = useGameStore((s) => s.game);
  const dealAnimation = useGameStore((s) => s.dealAnimation);
  const dealAnimSession = useGameStore((s) => s.dealAnimSession);
  const advanceDealAfterFlight = useGameStore((s) => s.advanceDealAfterFlight);

  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
  const pendingCompletionsRef = useRef(new Set<number>());
  const dealScheduleTimerIdsRef = useRef<number[]>([]);
  const dealFlipSoundTimerIdsRef = useRef(new Map<number, number>());

  const tryDrainCompletions = useCallback(() => {
    while (true) {
      const da = useGameStore.getState().dealAnimation;
      if (!da) return;
      const k = da.landedCount;
      if (!pendingCompletionsRef.current.has(k)) return;
      pendingCompletionsRef.current.delete(k);
      advanceDealAfterFlight(k);
    }
  }, [advanceDealAfterFlight]);

  const onFlightComplete = useCallback(
    (entryIndex: number) => {
      setActiveFlights((prev) => prev.filter((f) => f.entryIndex !== entryIndex));
      pendingCompletionsRef.current.add(entryIndex);
      tryDrainCompletions();
    },
    [tryDrainCompletions],
  );

  /** When the deal animation ends, clear overlays (do not tie flight timers to `dealAnimation` — `landedCount` updates would cancel pending starts). */
  useEffect(() => {
    if (dealAnimation != null) return;
    stopPlayingSound("cardDealt");
    stopPlayingSound("cardFlipped");
    for (const tid of dealFlipSoundTimerIdsRef.current.values()) {
      window.clearTimeout(tid);
    }
    dealFlipSoundTimerIdsRef.current.clear();
    pendingCompletionsRef.current.clear();
    queueMicrotask(() => setActiveFlights([]));
  }, [dealAnimation]);

  /**
   * Schedule all card flights start-to-start. Depends on `dealAnimSession` only so `landedCount` bumps during the
   * deal do not re-run this effect and clear remaining timeouts.
   */
  useEffect(() => {
    if (!game) return;

    const da = useGameStore.getState().dealAnimation;
    if (!da || da.landedCount !== 0) return;
    const { entries } = da;
    if (entries.length === 0) return;

    const flipTimers = dealFlipSoundTimerIdsRef.current;

    stopPlayingSound("cardDealt");
    for (const tid of flipTimers.values()) {
      window.clearTimeout(tid);
    }
    flipTimers.clear();
    pendingCompletionsRef.current.clear();
    queueMicrotask(() => setActiveFlights([]));

    const startCadence = timings.cardDealDelay;
    const session = dealAnimSession;

    dealScheduleTimerIdsRef.current = [];
    let cancelled = false;

    void (async () => {
      await prepareSound("cardDealt");
      if (cancelled) return;
      for (let i = 0; i < entries.length; i++) {
        const tid = window.setTimeout(() => {
          void (async () => {
            const g = useGameStore.getState().game;
            const d = useGameStore.getState().dealAnimation;
            if (!g || !d) return;
            const landedForFrom = d.landedCount;
            const payload = measureDealFly(g, d, i, landedForFrom);
            if (!payload) return;
            await playSoundAsync("cardDealt");
            if (useGameStore.getState().dealAnimSession !== session) return;
            if (!useGameStore.getState().dealAnimation) return;
            const dAfter = useGameStore.getState().dealAnimation;
            if (dAfter?.kind === "initial") {
              useGameStore.setState((s) => {
                const cur = s.dealAnimation;
                if (!cur || cur.kind !== "initial") return s;
                return { dealAnimation: { ...cur, stockRevealDepth: i + 1 } };
              });
            }
            setActiveFlights((prev) => [...prev, { ...payload, entryIndex: i, session }]);
            if (shouldScheduleDealFlipSound(d, i)) {
              const delayMs = Math.max(
                0,
                Math.round(
                  payload.durationMs * timings.cardFlippedDuringDealProgress,
                ),
              );
              const flipTid = window.setTimeout(() => {
                flipTimers.delete(i);
                playSound("cardFlipped");
              }, delayMs);
              flipTimers.set(i, flipTid);
            }
          })();
        }, i * startCadence);
        dealScheduleTimerIdsRef.current.push(tid);
      }
    })();

    return () => {
      cancelled = true;
      for (const t of dealScheduleTimerIdsRef.current) window.clearTimeout(t);
      dealScheduleTimerIdsRef.current = [];
      for (const tid of flipTimers.values()) {
        window.clearTimeout(tid);
      }
      flipTimers.clear();
    };
  }, [game, dealAnimSession]);

  if (typeof document === "undefined" || activeFlights.length === 0) return null;

  return createPortal(
    <>
      {activeFlights.map((f) => {
        const dx = f.to.x - f.from.x;
        const dy = f.to.y - f.from.y;
        return (
          <motion.div
            key={`deal-fly-${f.session}-${f.entryIndex}-${f.card.kind}-${f.card.id}`}
            className="pointer-events-none fixed"
            style={{ left: f.from.x, top: f.from.y, width: cw, height: ch, zIndex: 100 + f.entryIndex }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: dx, y: dy, opacity: 1 }}
            transition={{ duration: f.durationMs / 1000, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => {
              onFlightComplete(f.entryIndex);
            }}
          >
            <CardView placed={{ card: f.card, faceUp: f.faceUp }} />
          </motion.div>
        );
      })}
    </>,
    document.body,
  );
}
