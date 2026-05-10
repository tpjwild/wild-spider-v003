import { buildDoubleDeck, buildJokers } from "./cards";
import {
  createMulberry32,
  hashSeedToUint32,
  shuffleInPlace,
} from "./seededRng";
import type { GameConfig, GameState, PlacedCard } from "./types";

const MAX_COLUMNS = 10;
const MIN_DEALS = 5;
const MAX_JOKERS = 4;

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

/** Creates initial game: shuffled tableau, stock (regular remainder + jokers shuffled together), empty foundation, history empty */
export function createInitialState(config: GameConfig): GameState {
  validateGameConfig(config);
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

  for (let i = 0; i < tCount; i++) {
    const col = i % config.columns;
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
    undoCount: 0,
    history: [],
  };
}
