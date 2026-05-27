export type Suit = "C" | "D" | "H" | "S";

/** 1 = Ace … 13 = King */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type RegularCard = {
  kind: "regular";
  /** Stable id across the two decks (0..103) */
  id: number;
  suit: Suit;
  rank: Rank;
};

export type JokerCard = {
  kind: "joker";
  /** 0 .. numJokers-1 */
  id: number;
};

export type Card = RegularCard | JokerCard;

export type PlacedCard = {
  card: Card;
  faceUp: boolean;
};

/** Card and column effect ids (applied by powers / set powers). */
export type EffectId =
  | "transparent"
  | "wild"
  | "halfWild"
  | "skip1"
  | "skip2"
  /** Badge / name plate only; Extra Column topology is in {@link GameState.extraColumnLinks}. */
  | "extraColumn";

/** One applied effect instance; {@link movesRemaining} null means permanent. */
export type AppliedEffect = {
  effect: EffectId;
  /** null = permanent; number = moves remaining before expiry (ticks on player moves, not power trigger). */
  movesRemaining: number | null;
};

/** Stable key for {@link GameState.cardEffects} (regular id or joker id). */
export type CardEffectKey = string;

/** Joker portrait slot 1–4 within a deck (red = 1–2, black = 3–4). */
export type JokerPortraitSlot = 1 | 2 | 3 | 4;

/** Registry power ids for joker / set powers. */
export type PowerId =
  | "jokerAllKingsTransparent"
  | "jokerSelectedCardTransparent"
  | "jokerSelectedCardWild"
  | "jokerSelectedCardHalfWild"
  | "jokerSelectedColumnWild"
  | "jokerSelectedColumnHalfWild"
  | "jokerSelectedColumnTransparent"
  | "jokerSelectedCardSkip1"
  | "jokerSelectedCardSkip2"
  | "jokerSelectedColumnSkip1"
  | "jokerSelectedColumnSkip2"
  | "jokerTwoKingsTransparent"
  | "jokerExtraColumn"
  | "jokerFoundationReturn"
  | "jokerCardSwap";

/** One joker sitting on the shelf after being dealt from stock */
export type ShelfJoker = {
  card: JokerCard;
  /** Portrait slot 1–4 when placed (drives art and {@link powerId}). */
  slot: JokerPortraitSlot;
  powerId: PowerId;
  chargesRemaining: number;
};

export type FoundationIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** One animated step during new-game initial deal; `tableauColumn` null means joker flies to shelf (formatted-seed early jokers). */
export type InitialDealEntry = {
  card: Card;
  tableauColumn: number | null;
  faceUp: boolean;
};

import type { ExtraColumnTopologySnapshot } from "./extraColumnTopology";

/** Snapshot of a card slot before a card-swap power (for undo). */
export type CardSlotSnapshot =
  | { zone: "tableau"; columnIndex: number; index: number; placed: PlacedCard }
  | { zone: "stock"; stockIndex: number; card: Card };

export type HistoryEntry =
  | {
      type: "move_tableau";
      fromCol: number;
      toCol: number;
      /** Index in fromCol where the moved run started */
      startIndex: number;
      count: number;
      /** Face-up state of card at startIndex-1 before the forward move (before flip) */
      revealedWasFaceUp: boolean;
    }
  | {
      type: "move_to_foundation";
      fromCol: number;
      /** Index in fromCol where the moved run started (same as tableau). */
      startIndex: number;
      count: number;
      foundationIndex: FoundationIndex;
      /** Face-up state of card at startIndex-1 before the forward move (before flip) */
      revealedWasFaceUp: boolean;
    }
  | {
      type: "deal";
      /** Each stock pop in order; tableauColumn null means joker went to shelf */
      entries: { card: Card; tableauColumn: number | null }[];
    }
  | {
      type: "power_trigger";
      shelfIndex: number;
      chargesBefore: number;
      /** Effects added by this trigger (for undo). */
      cardEffectsAdded: { key: CardEffectKey; effect: EffectId }[];
      columnEffectsAdded: { columnIndex: number; effect: EffectId }[];
      /** Present when Extra Column (or future structural column powers) changes tableau topology. */
      extraColumnTopologyBefore?: ExtraColumnTopologySnapshot;
      /** Foundation Return: card returned from foundation to tableau. */
      foundationReturnUndo?: {
        foundationIndex: FoundationIndex;
        toColumn: number;
        placed: PlacedCard;
      };
      /** Card Swap: slots exchanged (restore by writing snapshots back). */
      cardSwapUndo?: {
        slotA: CardSlotSnapshot;
        slotB: CardSlotSnapshot;
      };
    };

/** Timed parent → child link; child column is always at parentColumnIndex + 1 after remap. */
export type ExtraColumnLink = {
  parentColumnIndex: number;
  movesRemaining: number;
};

export type ColumnFlagsEntry = { isExtraChild: true };

export type GameConfig = {
  /** Initial deal width only; {@link GameState.columns} may grow with Extra Column. */
  columns: number;
  deals: number;
  deckPairId: string;
  /** String seed; same seed produces same deal order */
  seed: string;
  /** 0..4 jokers, all start in stock after shuffle */
  jokerCount: number;
};

export type GameState = {
  config: GameConfig;
  columns: PlacedCard[][];
  /** Eight piles, each ascending same suit from Ace; empty accepts any Ace */
  foundation: PlacedCard[][];
  /** Bottom = index 0, top = last; dealing pops from top */
  stock: Card[];
  shelf: ShelfJoker[];
  /** Per-card effects keyed by {@link cardEffectKey}. */
  cardEffects: Record<CardEffectKey, AppliedEffect[]>;
  /** Per-tableau-column effects (column index → effect list). */
  columnEffects: Record<number, AppliedEffect[]>;
  /** Active Extra Column parent links (child at parent + 1). */
  extraColumnLinks: ExtraColumnLink[];
  /** Per-column flags (extra-child columns inserted by Extra Column power). */
  columnFlags: Record<number, ColumnFlagsEntry>;
  /** Number of times undo was invoked (each costs -1 score) */
  undoCount: number;
  /** Player actions only (used for undo); does not include implicit system events */
  history: HistoryEntry[];
  /**
   * When present, canonical order of initial-deal flights (tableau + optional shelf jokers).
   * Omitted from persisted saves; used only when constructing a new game before the deal animation runs.
   */
  initialDealFlightPlan?: InitialDealEntry[];
};

export type MoveTableauArgs = {
  fromColumn: number;
  /** Index in column of the highest face-up card being moved (top of selection) */
  startIndex: number;
  toColumn: number;
};

export type MoveToFoundationArgs = {
  fromColumn: number;
  /** Index in column of the highest face-up card in the run being moved (top of selection). */
  startIndex: number;
  foundationIndex: FoundationIndex;
};
