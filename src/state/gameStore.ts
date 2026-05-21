import { create } from "zustand";
import { stockVisibleDealCapForLayout } from "@/constants/dimensions";
import {
  moveTableau,
  moveToFoundation,
  newGame,
  triggerImmediatePower,
  triggerTargetedPower,
  undo,
  type BlackJokerTargetContext,
} from "@/engine/game";
import { getPowerDefinition } from "@/content/powerDefinitions";
import { canDealFromStock, dealFromStock, leadStockIndicesForUpcomingDeals } from "@/engine/deal";
import {
  buildInitialDealEntries,
  initialDealAnimationBase,
  stripEphemeralGameState,
} from "@/engine/initialDeal";
import { isValidSameSuitDescendingRun } from "@/engine/moves";
import { createEmptyBoardShell, gameHasAnyCards, validateGameConfig } from "@/engine/setup";
import type { Card, FoundationIndex, GameConfig, GameState } from "@/engine/types";
import type { InitialDealEntry } from "@/engine/types";
import {
  clearGameState,
  loadGameState,
  resolvedGameConfigForEmptyShell,
  saveGameState,
  saveLastNewGameDefaults,
} from "@/lib/gameStorage";
import { playSound } from "@/lib/playSound";
import {
  schedulePreloadStockDealFaces,
  scheduleTableauPortraitPreload,
} from "@/lib/preloadPortraitArt";

export type StockDealAnimationState = {
  kind: "stock";
  entries: { card: Card; tableauColumn: number | null }[];
  landedCount: number;
  finalGame: GameState;
  /**
   * For each upcoming full deal (same order as {@link leadStockIndicesForUpcomingDeals}), the card whose back
   * colour represents that deal’s first pop — captured from pre-deal stock so lower backs stay fixed while the
   * current deal animates (joker draws already reflected in the lead simulation).
   */
  frozenUpcomingLeadCards: Card[];
};

export type InitialDealAnimationState = {
  kind: "initial";
  entries: InitialDealEntry[];
  landedCount: number;
  finalGame: GameState;
  /**
   * Stock pile shows one back at `stock[length - 1 - min(stockRevealDepth, length - 1)]`.
   * Increments with each card after `cardDealt` audio starts and the flight is queued (see `DealAnimationLayer`).
   */
  stockRevealDepth: number;
};

export type DealAnimationState = StockDealAnimationState | InitialDealAnimationState;

/** Black (targeted) joker armed; charge spent only after {@link GameStore.commitTargetedPower}. */
export type PowerTargetingState = {
  shelfIndex: number;
};

export type GameStore = {
  game: GameState | null;
  hydrated: boolean;
  newGameOpen: boolean;
  endGameOpen: boolean;
  /** True after local moves until a successful cloud save or cloud load. */
  dirtySinceCloudSave: boolean;
  /** From `user_settings.confirm_save` (default true). */
  confirmSaveEnabled: boolean;
  sessionKey: number;
  lastError: string | null;
  /** Pre-deal snapshot + flight plan; `game` stays pre-deal until the last card lands. */
  dealAnimation: DealAnimationState | null;
  /** Incremented when a stock-deal animation starts; UI schedules flights from this so `landedCount` bumps do not clear timers. */
  dealAnimSession: number;
  /** Targeted joker power awaiting a card/column/shelf click (no charge consumed yet). */
  powerTargeting: PowerTargetingState | null;
  hydrateLocalOnly: () => void;
  hydrateFromLocalAfterAuth: () => void;
  applyCloudBootstrap: (game: GameState) => void;
  setUserSettings: (partial: { confirmSave: boolean }) => void;
  markCloudSaveComplete: () => void;
  resetForLogout: () => void;
  openNewGame: () => void;
  closeNewGame: () => void;
  startGame: (config: GameConfig) => void;
  restart: () => void;
  openEndGame: () => void;
  cancelEndGame: () => void;
  confirmEndGame: () => void;
  undoMove: () => void;
  tryDeal: () => boolean;
  /** Skip remaining deal flights (Escape); commits `finalGame` and clears `dealAnimation`. */
  skipDealAnimation: () => void;
  /** Called when a deal flight motion completes (bumps landed or commits `finalGame`; `cardFlipped` for deals is timed in `DealAnimationLayer`). */
  advanceDealAfterFlight: (landedCountBeforeThisFlight: number) => void;
  tryMoveTableau: (fromColumn: number, startIndex: number, toColumn: number) => boolean;
  tryMoveToFoundation: (fromColumn: number, foundationIndex: FoundationIndex) => boolean;
  /** Double-click shelf joker / set power: immediate applies now; targeted enters {@link powerTargeting}. */
  triggerShelfPower: (shelfIndex: number) => boolean;
  commitTargetedPower: (card: Card, targetContext: BlackJokerTargetContext) => boolean;
  cancelPowerTargeting: () => void;
  clearError: () => void;
};

function clearPowerTargeting(): Pick<GameStore, "powerTargeting"> {
  return { powerTargeting: null };
}

function maybePlayRevealSound(next: GameState) {
  const h = next.history[next.history.length - 1];
  if (!h) return;
  if (h.type === "move_tableau" && h.startIndex > 0 && !h.revealedWasFaceUp) {
    playSound("cardFlipped");
    return;
  }
  if (h.type === "move_to_foundation" && !h.revealedWasFaceUp) {
    playSound("cardFlipped");
  }
}

function persistGameStateLocal(state: GameState) {
  saveGameState(state);
  useGameStore.setState({ dirtySinceCloudSave: true });
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  hydrated: false,
  newGameOpen: false,
  endGameOpen: false,
  dirtySinceCloudSave: false,
  confirmSaveEnabled: true,
  sessionKey: 0,
  lastError: null,
  dealAnimation: null,
  dealAnimSession: 0,
  powerTargeting: null,

  clearError: () => set({ lastError: null }),

  setUserSettings: (partial) => {
    if (partial.confirmSave !== undefined) {
      set({ confirmSaveEnabled: partial.confirmSave });
    }
  },

  markCloudSaveComplete: () => set({ dirtySinceCloudSave: false }),

  resetForLogout: () =>
    set({
      game: null,
      newGameOpen: false,
      endGameOpen: false,
      lastError: null,
      dealAnimation: null,
      dealAnimSession: 0,
      powerTargeting: null,
      dirtySinceCloudSave: false,
      hydrated: false,
      sessionKey: get().sessionKey + 1,
    }),

  hydrateLocalOnly: () => {
    const loaded = loadGameState();
    if (loaded) {
      saveLastNewGameDefaults(loaded.config);
      set({
        hydrated: true,
        game: loaded,
        newGameOpen: false,
        lastError: null,
        dealAnimation: null,
        dealAnimSession: 0,
        powerTargeting: null,
        dirtySinceCloudSave: Boolean(loaded),
      });
      scheduleTableauPortraitPreload(loaded.config.deckPairId);
    } else {
      const cfg = resolvedGameConfigForEmptyShell();
      const shell = createEmptyBoardShell(cfg);
      set({
        hydrated: true,
        game: shell,
        newGameOpen: false,
        lastError: null,
        dealAnimation: null,
        dealAnimSession: 0,
        powerTargeting: null,
        dirtySinceCloudSave: false,
        sessionKey: get().sessionKey + 1,
      });
    }
  },

  hydrateFromLocalAfterAuth: () => {
    const loaded = loadGameState();
    if (loaded) {
      saveLastNewGameDefaults(loaded.config);
      set({
        hydrated: true,
        game: loaded,
        newGameOpen: false,
        lastError: null,
        dealAnimation: null,
        dealAnimSession: 0,
        powerTargeting: null,
        dirtySinceCloudSave: Boolean(loaded),
      });
      scheduleTableauPortraitPreload(loaded.config.deckPairId);
    } else {
      const cfg = resolvedGameConfigForEmptyShell();
      const shell = createEmptyBoardShell(cfg);
      set({
        hydrated: true,
        game: shell,
        newGameOpen: false,
        lastError: null,
        dealAnimation: null,
        dealAnimSession: 0,
        powerTargeting: null,
        dirtySinceCloudSave: false,
        sessionKey: get().sessionKey + 1,
      });
    }
  },

  applyCloudBootstrap: (loaded) => {
    saveLastNewGameDefaults(loaded.config);
    saveGameState(loaded);
    set({
      hydrated: true,
      game: loaded,
      newGameOpen: false,
      sessionKey: get().sessionKey + 1,
      lastError: null,
      dealAnimation: null,
      dealAnimSession: 0,
      powerTargeting: null,
      dirtySinceCloudSave: false,
    });
    scheduleTableauPortraitPreload(loaded.config.deckPairId);
  },

  openNewGame: () => set({ newGameOpen: true, lastError: null }),

  closeNewGame: () => {
    const { game } = get();
    set({ newGameOpen: !game, lastError: null });
  },

  startGame: (config: GameConfig) => {
    try {
      validateGameConfig(config);
      saveLastNewGameDefaults(config);
      const raw = newGame(config);
      const entries = buildInitialDealEntries(raw);
      const finalGame = stripEphemeralGameState(raw);
      if (entries.length === 0) {
        set({
          game: finalGame,
          newGameOpen: false,
          sessionKey: get().sessionKey + 1,
          lastError: null,
          dealAnimation: null,
          dealAnimSession: 0,
          powerTargeting: null,
        });
        persistGameStateLocal(finalGame);
        playSound("cardDealt");
        scheduleTableauPortraitPreload(config.deckPairId);
        return;
      }
      const base = initialDealAnimationBase(finalGame, entries);
      set({
        game: base,
        newGameOpen: false,
        sessionKey: get().sessionKey + 1,
        lastError: null,
        powerTargeting: null,
        dealAnimation: {
          kind: "initial",
          entries,
          landedCount: 0,
          finalGame,
          stockRevealDepth: 0,
        },
        dealAnimSession: get().dealAnimSession + 1,
      });
      scheduleTableauPortraitPreload(config.deckPairId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid configuration";
      set({ lastError: msg });
    }
  },

  restart: () => {
    const { game } = get();
    if (!game) return;
    saveLastNewGameDefaults(game.config);
    const raw = newGame(game.config);
    const entries = buildInitialDealEntries(raw);
    const finalGame = stripEphemeralGameState(raw);
    if (entries.length === 0) {
      set({
        game: finalGame,
        sessionKey: get().sessionKey + 1,
        lastError: null,
        dealAnimation: null,
        dealAnimSession: 0,
        powerTargeting: null,
      });
      persistGameStateLocal(finalGame);
      playSound("cardDealt");
      scheduleTableauPortraitPreload(game.config.deckPairId);
      return;
    }
    const base = initialDealAnimationBase(finalGame, entries);
    set({
      game: base,
      sessionKey: get().sessionKey + 1,
      lastError: null,
      powerTargeting: null,
      dealAnimation: {
        kind: "initial",
        entries,
        landedCount: 0,
        finalGame,
        stockRevealDepth: 0,
      },
      dealAnimSession: get().dealAnimSession + 1,
    });
    scheduleTableauPortraitPreload(game.config.deckPairId);
  },

  openEndGame: () => {
    const { game, dealAnimation } = get();
    if (!game || dealAnimation) return;
    if (!gameHasAnyCards(game)) return;
    set({ endGameOpen: true });
  },

  cancelEndGame: () => set({ endGameOpen: false }),

  confirmEndGame: () => {
    const { game } = get();
    set({
      game: game ? createEmptyBoardShell(game.config) : null,
      endGameOpen: false,
      newGameOpen: false,
      lastError: null,
      dealAnimation: null,
      dealAnimSession: 0,
      powerTargeting: null,
      dirtySinceCloudSave: false,
      sessionKey: get().sessionKey + 1,
    });
    clearGameState();
  },

  undoMove: () => {
    const { game, dealAnimation } = get();
    if (dealAnimation) return;
    if (!game) return;
    const next = undo(game);
    if (!next) return;
    set({ game: next, ...clearPowerTargeting() });
    persistGameStateLocal(next);
  },

  tryDeal: () => {
    const { game, dealAnimation } = get();
    if (dealAnimation) return false;
    if (!game) return false;
    if (!canDealFromStock(game)) return false;
    const r = dealFromStock(game);
    if (!r) return false;
    const finalGame: GameState = {
      ...r.state,
      history: [...game.history, r.history],
    };
    const h = r.history;
    if (h.type !== "deal") return false;
    const { entries } = h;
    const preStock = game.stock;
    const leadIdx = leadStockIndicesForUpcomingDeals(
      preStock,
      game.columns.length,
      stockVisibleDealCapForLayout(game.config.deals),
    );
    const frozenUpcomingLeadCards = leadIdx.map((idx) => preStock[idx]!);
    set({
      dealAnimation: {
        kind: "stock",
        entries,
        landedCount: 0,
        finalGame,
        frozenUpcomingLeadCards,
      },
      dealAnimSession: get().dealAnimSession + 1,
    });
    schedulePreloadStockDealFaces(game.config.deckPairId, entries);
    return true;
  },

  skipDealAnimation: () => {
    const { dealAnimation } = get();
    if (!dealAnimation) return;
    const finalGame = dealAnimation.finalGame;
    set({
      game: finalGame,
      dealAnimation: null,
      dealAnimSession: get().dealAnimSession + 1,
    });
    persistGameStateLocal(finalGame);
  },

  advanceDealAfterFlight: (landedCountBeforeThisFlight) => {
    const da = get().dealAnimation;
    if (!da || da.landedCount !== landedCountBeforeThisFlight) return;
    const nextLanded = da.landedCount + 1;
    if (nextLanded >= da.entries.length) {
      set({ game: da.finalGame, dealAnimation: null });
      persistGameStateLocal(da.finalGame);
    } else {
      set({ dealAnimation: { ...da, landedCount: nextLanded } });
    }
  },

  tryMoveTableau: (fromColumn, startIndex, toColumn) => {
    const { game, dealAnimation } = get();
    if (dealAnimation) return false;
    if (!game) return false;
    const next = moveTableau(game, { fromColumn, startIndex, toColumn });
    if (!next) return false;
    set({ game: next, ...clearPowerTargeting() });
    persistGameStateLocal(next);
    maybePlayRevealSound(next);
    return true;
  },

  tryMoveToFoundation: (fromColumn, foundationIndex) => {
    const { game, dealAnimation } = get();
    if (dealAnimation) return false;
    if (!game) return false;
    const next = moveToFoundation(game, { fromColumn, foundationIndex });
    if (!next) return false;
    set({ game: next, ...clearPowerTargeting() });
    persistGameStateLocal(next);
    maybePlayRevealSound(next);
    return true;
  },

  triggerShelfPower: (shelfIndex) => {
    const { game, dealAnimation, powerTargeting } = get();
    if (dealAnimation || !game) return false;
    const entry = game.shelf[shelfIndex];
    if (!entry || entry.chargesRemaining <= 0) return false;

    const def = getPowerDefinition(entry.powerId);
    if (def.triggerClass === "targeted") {
      if (powerTargeting?.shelfIndex === shelfIndex) {
        set(clearPowerTargeting());
        return true;
      }
      set({ powerTargeting: { shelfIndex }, lastError: null });
      return true;
    }

    const next = triggerImmediatePower(game, shelfIndex);
    if (!next) return false;
    set({ game: next, ...clearPowerTargeting(), lastError: null });
    persistGameStateLocal(next);
    return true;
  },

  commitTargetedPower: (card, targetContext) => {
    const { game, dealAnimation, powerTargeting } = get();
    if (dealAnimation || !game || !powerTargeting) return false;
    const next = triggerTargetedPower(
      game,
      powerTargeting.shelfIndex,
      card,
      targetContext,
    );
    if (!next) return false;
    set({ game: next, ...clearPowerTargeting(), lastError: null });
    persistGameStateLocal(next);
    return true;
  },

  cancelPowerTargeting: () => {
    if (!get().powerTargeting) return;
    set(clearPowerTargeting());
  },
}));

/** Whether a face-up card at `cardIndex` can begin a tableau drag. */
export function canDragFromTableau(state: GameState, columnIndex: number, cardIndex: number): boolean {
  const col = state.columns[columnIndex];
  if (!col || cardIndex < 0 || cardIndex >= col.length) return false;
  if (!col[cardIndex]!.faceUp) return false;
  return isValidSameSuitDescendingRun(col, cardIndex);
}
