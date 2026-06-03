import { getDeckPairById, setPowerDefinitionForSet } from "@/content/deckPairs";
import { getPowerDefinition } from "@/content/powerDefinitions";
import { deckBackColorLabel } from "@/lib/deckBackStyle";
import type { ShelfEntry, ShelfJoker, ShelfSetPower, SetKey, Suit } from "@/engine/types";

const SUIT_PLURAL_NAME: Record<Suit, string> = {
  S: "Spades",
  C: "Clubs",
  D: "Diamonds",
  H: "Hearts",
};

function deckShortLabel(deckName: string): string {
  return deckName.endsWith(" Deck") ? deckName.slice(0, -" Deck".length) : deckName;
}

export function setKeyFromSuitDeck(deckNum: 1 | 2, suit: Suit): SetKey {
  return `${deckNum}-${suit}`;
}

export function parseSetKey(setKey: SetKey): { deckNum: 1 | 2; suit: Suit } {
  const dash = setKey.indexOf("-");
  return {
    deckNum: Number(setKey.slice(0, dash)) as 1 | 2,
    suit: setKey.slice(dash + 1) as Suit,
  };
}

export function isShelfJoker(entry: ShelfEntry): entry is ShelfJoker {
  return entry.kind === "joker";
}

export function isShelfSetPower(entry: ShelfEntry): entry is ShelfSetPower {
  return entry.kind === "set";
}

export function partitionShelf(shelf: readonly ShelfEntry[]): {
  jokers: ShelfJoker[];
  sets: ShelfSetPower[];
} {
  const jokers: ShelfJoker[] = [];
  const sets: ShelfSetPower[] = [];
  for (const entry of shelf) {
    if (entry.kind === "joker") jokers.push(entry);
    else sets.push(entry);
  }
  return { jokers, sets };
}

/** Left offset (px) for a shelf entry at flat {@link shelfIndex} (partition: jokers then sets). */
export function shelfEntryLayoutLeftPx(
  shelfIndex: number,
  shelf: readonly ShelfEntry[],
  step: number,
  gapPx: number,
  cardWidth: number,
): number {
  const entry = shelf[shelfIndex];
  if (!entry) return 0;
  const jokerCount = shelf.filter(isShelfJoker).length;
  const setCount = shelf.length - jokerCount;
  if (entry.kind === "joker") {
    return shelfIndex * step;
  }
  const setIndex = shelfIndex - jokerCount;
  if (jokerCount <= 0) {
    return setIndex * step;
  }
  const gap = setCount > 0 ? gapPx : 0;
  const setBlockLeft = (jokerCount - 1) * step + cardWidth + gap;
  return setBlockLeft + setIndex * step;
}

/** Total inner width of the shelf strip; {@link gapPx} is edge-to-edge between last joker and first set. */
export function shelfStripInnerWidthPx(
  shelf: readonly ShelfEntry[],
  step: number,
  gapPx: number,
  cardWidth: number,
): number {
  const n = shelf.length;
  if (n <= 0) return cardWidth;
  const jokerCount = shelf.filter(isShelfJoker).length;
  const setCount = n - jokerCount;
  const jokerSpan = jokerCount > 0 ? cardWidth + (jokerCount - 1) * step : 0;
  const setSpan = setCount > 0 ? cardWidth + (setCount - 1) * step : 0;
  const gap = jokerCount > 0 && setCount > 0 ? gapPx : 0;
  return jokerSpan + gap + setSpan;
}

/** Shelf name plate power line: append catalog duration when the applied effect is timed. */
export function formatShelfPowerDisplayName(
  powerName: string,
  initialDuration: number | null | undefined,
): string {
  if (initialDuration == null || initialDuration <= 0) return powerName;
  const unit = initialDuration === 1 ? "move" : "moves";
  return `${powerName} (${initialDuration} ${unit})`;
}

/** Shelf name plate: deck + suit theme (matches tableau set line family). */
export function shelfSetDisplayLabels(
  deckPairId: string,
  entry: ShelfSetPower,
): { setName: string; powerName: string } | null {
  const pair = getDeckPairById(deckPairId);
  const deck = pair?.decks[entry.deckNum - 1];
  const themeRow = pair?.suitThemes.find((t) => t.suit === entry.suit);
  const catalog = setPowerDefinitionForSet(deckPairId, entry.deckNum, entry.suit);
  if (!deck || !catalog) return null;
  const color = deckBackColorLabel(deck.color);
  const suit = SUIT_PLURAL_NAME[entry.suit];
  const theme = (themeRow?.name ?? suit).replace(/ & /g, " and ");
  const setName = `${color} Deck ${suit} - ${deckShortLabel(deck.name)} ${theme}`;
  const power = getPowerDefinition(catalog.powerId);
  const powerName = formatShelfPowerDisplayName(power.name, catalog.initialDuration);
  return { setName, powerName };
}
