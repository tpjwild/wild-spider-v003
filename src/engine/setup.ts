import { buildDoubleDeck, buildJokers, isJoker } from "./cards";
import {
  createMulberry32,
  hashSeedToUint32,
  shuffleInPlace,
} from "./seededRng";
import { buildInitialDealFlightPlanFromFinalColumns } from "./initialDeal";
import { tableauDealColumnOrder } from "./tableauDealLayout";
import type {
  Card,
  GameConfig,
  GameState,
  InitialDealEntry,
  JokerCard,
  PlacedCard,
  RegularCard,
  ShelfJoker,
} from "./types";
import { emptyExtraColumnState } from "./extraColumnState";
import { emptyEffectsState } from "./effects";
import { createShelfJokerEntry } from "./powers";
import { FORMATTED_JOKER_INSERT_BACK_FRACTION } from "@/constants/formattedJokerDeal";
import { parseFormattedGameSeed } from "@/lib/formattedGameSeed";
import type { ParsedFormattedGameSeed } from "@/lib/formattedGameSeed";
import { maxJokersInPlayForDeckPair } from "@/content/deckPairs";

const MAX_COLUMNS = 10;
const MIN_DEALS = 5;
/** Max jokers in a deck pair: 4 per deck × 2 decks (spec). */
const MAX_JOKERS = 8;

export class InvalidGameConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidGameConfigError";
  }
}

export function validateGameConfig(config: GameConfig): void {
  if (config.columns < 1 || config.columns > MAX_COLUMNS) {
    throw new InvalidGameConfigError(
      `columns must be 1..${MAX_COLUMNS}, got ${config.columns}`,
    );
  }
  if (config.deals < MIN_DEALS) {
    throw new InvalidGameConfigError(
      `deals must be at least ${MIN_DEALS}, got ${config.deals}`,
    );
  }
  if (config.jokerCount < 0 || config.jokerCount > MAX_JOKERS) {
    throw new InvalidGameConfigError(
      `jokerCount must be 0..${MAX_JOKERS}, got ${config.jokerCount}`,
    );
  }
  const maxForPair = maxJokersInPlayForDeckPair(config.deckPairId);
  if (config.jokerCount > maxForPair) {
    throw new InvalidGameConfigError(
      `jokerCount must be 0..${maxForPair} for this deck pair, got ${config.jokerCount}`,
    );
  }
  if (config.columns * config.deals > 104) {
    throw new InvalidGameConfigError(
      `columns*deals (${config.columns * config.deals}) cannot exceed 104`,
    );
  }
}

/**
 * Tableau receives 104 − columns×deals regular cards (two decks).
 * Jokers are extra: they are shuffled into the stock together with the remaining
 * `columns × deals` regular cards (total stock size = columns×deals + jokerCount).
 * This matches a full 104-card deal into tableau + stock; jokers do not remove
 * additional cards from the tableau (they only inflate the stock pile).
 */
export function tableauCardCount(config: GameConfig): number {
  return 104 - config.columns * config.deals;
}

/**
 * Jokers are shuffled (Fisher–Yates, seed `${shuffleKey}:jokerOrder`), then up to one per distinct
 * slot in the trailing {@link FORMATTED_JOKER_INSERT_BACK_FRACTION} of the shuffled 104 regular order
 * (slot indices from `${shuffleKey}:jokerSlots`). Any remaining jokers are returned for the caller to
 * place at the bottom of the stock.
 */
function insertJokersInBackFraction(
  deck104: RegularCard[],
  jokers: readonly JokerCard[],
  shuffleKey: string,
): { ordered: Card[]; overflowJokers: JokerCard[] } {
  const n = deck104.length;
  const jCount = jokers.length;
  if (jCount === 0) {
    return { ordered: [...deck104], overflowJokers: [] };
  }

  const F = FORMATTED_JOKER_INSERT_BACK_FRACTION;
  if (F <= 0 || F > 1) {
    throw new InvalidGameConfigError(
      `FORMATTED_JOKER_INSERT_BACK_FRACTION must be in (0, 1], got ${F}`,
    );
  }

  const firstEligible = Math.floor(n * (1 - F));
  const eligibleCount = n - firstEligible;
  const slotsToUse = Math.min(jCount, eligibleCount);

  const pool = Array.from({ length: eligibleCount }, (_, i) => i + firstEligible);
  const rngSlots = createMulberry32(hashSeedToUint32(`${shuffleKey}:jokerSlots`));
  for (let pick = 0; pick < slotsToUse; pick++) {
    const j = pick + Math.floor(rngSlots() * (eligibleCount - pick));
    const tmp = pool[pick]!;
    pool[pick] = pool[j]!;
    pool[j] = tmp;
  }
  const slots = pool.slice(0, slotsToUse).sort((a, b) => a - b);

  const jokersShuffled = [...jokers];
  const rngOrder = createMulberry32(hashSeedToUint32(`${shuffleKey}:jokerOrder`));
  shuffleInPlace(jokersShuffled, rngOrder);

  const out: Card[] = [];
  let jokerIdx = 0;
  for (let i = 0; i < deck104.length; i++) {
    if (jokerIdx < slots.length && slots[jokerIdx] === i) {
      out.push(jokersShuffled[jokerIdx]!);
      jokerIdx++;
    }
    out.push(deck104[i]!);
  }
  const overflowJokers = jokersShuffled.slice(slotsToUse);
  return { ordered: out, overflowJokers };
}

function createInitialStateFormatted(
  config: GameConfig,
  parsed: ParsedFormattedGameSeed,
): GameState {
  if (
    parsed.columns !== config.columns ||
    parsed.deals !== config.deals ||
    parsed.deckPairId !== config.deckPairId
  ) {
    throw new InvalidGameConfigError(
      "formatted seed does not match columns, deals, or deck pair",
    );
  }

  const tCount = tableauCardCount(config);
  if (tCount < 0) {
    throw new InvalidGameConfigError("negative tableau count");
  }

  const rngMain = createMulberry32(hashSeedToUint32(parsed.shuffleKey));
  const deck = buildDoubleDeck();
  shuffleInPlace(deck, rngMain);

  const jokers = buildJokers(config.jokerCount);
  const { ordered, overflowJokers } = insertJokersInBackFraction(deck, jokers, parsed.shuffleKey);

  const columns: PlacedCard[][] = Array.from(
    { length: config.columns },
    () => [],
  );

  const tableauDealCol = tableauDealColumnOrder(config.columns, tCount);

  let placedRegular = 0;
  const stockCards: Card[] = [];
  const shelf: ShelfJoker[] = [];
  const flightPlan: InitialDealEntry[] = [];
  for (let stream = 0; stream < ordered.length; stream++) {
    const card = ordered[stream]!;
    if (card.kind === "regular" && placedRegular < tCount) {
      const col = tableauDealCol[placedRegular]!;
      columns[col]!.push({ card, faceUp: false });
      flightPlan.push({ card, tableauColumn: col, faceUp: false });
      placedRegular++;
    } else if (isJoker(card) && placedRegular < tCount) {
      /** Would appear before the initial tableau is full — same as dealing a joker from stock: goes to shelf. */
      shelf.push(createShelfJokerEntry(config.deckPairId, card));
      flightPlan.push({ card, tableauColumn: null, faceUp: false });
    } else {
      stockCards.push(card);
    }
  }

  /** Jokers that did not fit in the back-fraction slots: bottom of stock (dealt last — see reverse below). */
  for (const j of overflowJokers) {
    stockCards.push(j);
  }

  /** `dealFromStock` pops from the end of `stock` as the pile top; pushes above are pack-top → bottom, so reverse. */
  stockCards.reverse();

  for (let c = 0; c < config.columns; c++) {
    const pile = columns[c]!;
    if (pile.length > 0) {
      for (let i = 0; i < pile.length; i++) {
        pile[i]!.faceUp = i === pile.length - 1;
      }
    }
  }

  for (let fi = 0; fi < flightPlan.length; fi++) {
    const e = flightPlan[fi]!;
    if (e.tableauColumn === null) continue;
    const col = e.tableauColumn;
    let rowCount = 0;
    for (let j = 0; j < fi; j++) {
      if (flightPlan[j]!.tableauColumn === col) rowCount++;
    }
    flightPlan[fi] = { ...e, faceUp: columns[col]![rowCount]!.faceUp };
  }

  const foundation = Array.from({ length: 8 }, () => [] as PlacedCard[]);

  return {
    config: { ...config, seed: parsed.canonical },
    columns,
    foundation,
    stock: stockCards,
    shelf,
    ...emptyEffectsState(),
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
    initialDealFlightPlan: flightPlan,
  };
}

/** Creates initial game: shuffled tableau, stock (regular remainder + jokers shuffled together), empty foundation, history empty */
export function createInitialState(config: GameConfig): GameState {
  validateGameConfig(config);
  const parsed = parseFormattedGameSeed(config.seed.trim());
  if (parsed) {
    return createInitialStateFormatted(config, parsed);
  }

  const tCount = tableauCardCount(config);
  if (tCount < 0) {
    throw new InvalidGameConfigError("negative tableau count");
  }

  const rngMain = createMulberry32(hashSeedToUint32(config.seed));
  const deck = buildDoubleDeck();
  shuffleInPlace(deck, rngMain);

  const columns: PlacedCard[][] = Array.from(
    { length: config.columns },
    () => [],
  );

  const dealCol = tableauDealColumnOrder(config.columns, tCount);
  for (let i = 0; i < tCount; i++) {
    const col = dealCol[i]!;
    const card = deck[i]!;
    columns[col]!.push({ card, faceUp: false });
  }

  for (let c = 0; c < config.columns; c++) {
    const pile = columns[c]!;
    if (pile.length > 0) {
      for (let i = 0; i < pile.length; i++) {
        pile[i]!.faceUp = i === pile.length - 1;
      }
    }
  }

  const remainder = deck.slice(tCount);
  const jokers = buildJokers(config.jokerCount);
  const stockCards = [...remainder, ...jokers];
  const rngStock = createMulberry32(
    hashSeedToUint32(`${config.seed}:stock`) ^ (config.columns * 31 + config.deals),
  );
  shuffleInPlace(stockCards, rngStock);

  const foundation = Array.from({ length: 8 }, () => [] as PlacedCard[]);

  return {
    config,
    columns,
    foundation,
    stock: stockCards,
    shelf: [],
    ...emptyEffectsState(),
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
    initialDealFlightPlan: buildInitialDealFlightPlanFromFinalColumns(columns),
  };
}

/** True if any card is on the tableau, foundation, stock, or shelf (used for save / End Game gating). */
export function gameHasAnyCards(state: GameState): boolean {
  if (state.stock.length > 0 || state.shelf.length > 0) return true;
  if (state.columns.some((c) => c.length > 0)) return true;
  if (state.foundation.some((f) => f.length > 0)) return true;
  return false;
}

/**
 * Cleared-board layout: same {@link GameConfig} as the ended game, all regions empty, no history.
 * Used after **End Game** so the shelf, foundation row, and stock pile stay visible until **New Game** or **Restart**.
 */
export function createEmptyBoardShell(config: GameConfig): GameState {
  validateGameConfig(config);
  const n = config.columns;
  return {
    config,
    columns: Array.from({ length: n }, () => [] as PlacedCard[]),
    foundation: Array.from({ length: 8 }, () => [] as PlacedCard[]),
    stock: [],
    shelf: [],
    ...emptyEffectsState(),
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
  };
}
