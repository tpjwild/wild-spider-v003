import { EFFECT_DEFINITIONS } from "@/content/effectDefinitions";
import { getDeckPairById, DEFAULT_DECK_PAIR_ID } from "@/content/deckPairs";
import { rankChar, isRegular } from "@/engine/cards";
import type { Rank, RegularCard } from "@/engine/types";
import { EFFECT_EXTRA_COLUMN } from "@/content/effectDefinitions";
import { cardEffectKey } from "@/engine/effects";
import {
  findExtraColumnLinkByParent,
  getDealColumnIndices,
  isExtraChildColumn,
} from "@/engine/extraColumn";
import type {
  AppliedEffect,
  Card,
  FoundationIndex,
  GameState,
  PlacedCard,
  Suit,
} from "@/engine/types";
import { cardHasTransparentEffectInColumn } from "@/lib/cardEffectsUi";
import { deckBackColorLabel } from "@/lib/deckBackStyle";
import { deckNumFromRegularCardId } from "@/lib/deckCardArt";

const SUIT_PLURAL_NAME: Record<Suit, string> = {
  S: "Spades",
  C: "Clubs",
  D: "Diamonds",
  H: "Hearts",
};

const HIDDEN = "—";
const NONE_EFFECTS = "—";

export type TableauNamePlateModel = {
  /** e.g. `King of Spades: Karl Marx - Modern Deck (Blue)` or empty when identity hidden. */
  heading: string;
  cardEffects: string;
  columnEffects: string;
  /** Face-card (J/Q/K) set line; blank when not a court. */
  set: string;
  setPower: string;
  isFaceCard: boolean;
  /** Column badge holder hover: centered heading + column effects only. */
  columnHolderInspect?: boolean;
};

export type TableauNamePlateSource =
  | { kind: "card"; columnIndex: number; cardIndex: number }
  | { kind: "columnHolder"; columnIndex: number }
  | { kind: "foundation"; foundationIndex: FoundationIndex };

function formatAppliedEffectList(list: readonly AppliedEffect[]): string {
  if (list.length === 0) return NONE_EFFECTS;
  return list
    .map((entry) => {
      const label = EFFECT_DEFINITIONS[entry.effect].label;
      return entry.movesRemaining !== null ? `${label} (${entry.movesRemaining})` : label;
    })
    .join(", ");
}

function dealRootColumnIndex(state: GameState, columnIndex: number): number {
  let i = columnIndex;
  while (i > 0 && isExtraChildColumn(state, i)) {
    i -= 1;
  }
  return i;
}

function extraChildChainDepth(state: GameState, columnIndex: number): number {
  let depth = 0;
  let i = columnIndex;
  while (isExtraChildColumn(state, i)) {
    depth += 1;
    i -= 1;
  }
  return depth;
}

/**
 * Deal column ordinal label with extra-child chain suffixes (e.g. Column 01, Column 01.01).
 */
export function columnDisplayLabel(state: GameState, columnIndex: number): string {
  const root = dealRootColumnIndex(state, columnIndex);
  const dealCols = getDealColumnIndices(state);
  const rootOrdinal = dealCols.indexOf(root);
  const base =
    rootOrdinal >= 0
      ? String(rootOrdinal + 1).padStart(2, "0")
      : String(columnIndex + 1).padStart(2, "0");
  const depth = extraChildChainDepth(state, columnIndex);
  if (depth === 0) return `Column ${base}`;
  return `Column ${base}.${String(depth).padStart(2, "0")}`;
}

function formatCardEffectsForNamePlate(game: GameState, card: Card): string {
  const key = cardEffectKey(card);
  return formatAppliedEffectList(game.cardEffects[key] ?? []);
}

function formatColumnEffectsForNamePlate(game: GameState, columnIndex: number): string {
  const jokerEffects = game.columnEffects[columnIndex] ?? [];
  const parts: string[] = jokerEffects.map((entry) => {
    const label = EFFECT_DEFINITIONS[entry.effect].label;
    return entry.movesRemaining !== null ? `${label} (${entry.movesRemaining})` : label;
  });
  const ownLink = findExtraColumnLinkByParent(game, columnIndex);
  if (ownLink) {
    parts.push(`${EFFECT_DEFINITIONS[EFFECT_EXTRA_COLUMN].label} (${ownLink.movesRemaining})`);
  }
  return parts.length > 0 ? parts.join(", ") : NONE_EFFECTS;
}

function rankDisplayName(rank: Rank): string {
  if (rank === 1) return "Ace";
  if (rank === 11) return "Jack";
  if (rank === 12) return "Queen";
  if (rank === 13) return "King";
  return rankChar(rank);
}

function suitPluralName(deckPairId: string, suit: Suit): string {
  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  const theme = pair?.suitThemes.find((t) => t.suit === suit);
  return theme?.name ?? SUIT_PLURAL_NAME[suit];
}

function deckDisplaySuffix(deckPairId: string, card: Card): string {
  if (!isRegular(card)) return HIDDEN;
  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  const deckNum = deckNumFromRegularCardId(card.id);
  const deck = pair?.decks[deckNum - 1];
  if (!deck) return HIDDEN;
  return `${deck.name} (${deckBackColorLabel(deck.color)})`;
}

function canRevealIdentity(
  game: GameState,
  columnIndex: number,
  placed: PlacedCard,
): boolean {
  return (
    placed.faceUp ||
    cardHasTransparentEffectInColumn(game, columnIndex, placed.card)
  );
}

function isFaceCard(card: Card): boolean {
  return isRegular(card) && card.rank >= 11 && card.rank <= 13;
}

function personName(deckPairId: string, card: RegularCard): string | null {
  const deckNum = deckNumFromRegularCardId(card.id);
  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  const row = pair?.decks[deckNum - 1]?.faces.find(
    (f) => f.suit === card.suit && f.rank === card.rank,
  );
  return row?.name ?? null;
}

function setLine(deckPairId: string, card: RegularCard): string {
  const deckPart = deckDisplaySuffix(deckPairId, card);
  const themeName = suitPluralName(deckPairId, card.suit);
  const suitName = SUIT_PLURAL_NAME[card.suit];
  return `${deckPart} - ${themeName} (${suitName})`;
}

function setPowerLine(): string {
  return HIDDEN;
}

function formatHeading(deckPairId: string, card: Card): string {
  if (!isRegular(card)) return HIDDEN;
  const rankSuit = `${rankDisplayName(card.rank)} of ${SUIT_PLURAL_NAME[card.suit]}`;
  const deckPart = deckDisplaySuffix(deckPairId, card);
  if (card.rank >= 11 && card.rank <= 13) {
    const person = personName(deckPairId, card);
    if (person) {
      return `${rankSuit}: ${person} - ${deckPart}`;
    }
  }
  return `${rankSuit} - ${deckPart}`;
}

function tableauNamePlateHeading(
  deckPairId: string,
  game: GameState,
  columnIndex: number,
  placed: PlacedCard,
): string {
  const { card } = placed;
  if (!isRegular(card)) return "";
  if (canRevealIdentity(game, columnIndex, placed)) {
    return formatHeading(deckPairId, card);
  }
  return deckDisplaySuffix(deckPairId, card);
}

export function tableauNamePlateFromCard(
  game: GameState,
  columnIndex: number,
  placed: PlacedCard,
): TableauNamePlateModel {
  const { card } = placed;
  const deckPairId = game.config.deckPairId;
  const reveal = canRevealIdentity(game, columnIndex, placed);
  const faceCard = isFaceCard(card);

  return {
    heading: tableauNamePlateHeading(deckPairId, game, columnIndex, placed),
    cardEffects: formatCardEffectsForNamePlate(game, card),
    columnEffects: formatColumnEffectsForNamePlate(game, columnIndex),
    set: reveal && faceCard && isRegular(card) ? setLine(deckPairId, card) : "",
    setPower: reveal && faceCard ? setPowerLine() : "",
    isFaceCard: faceCard,
  };
}

/** Foundation top card; no column effects on foundation. */
export function tableauNamePlateFromFoundationCard(
  game: GameState,
  placed: PlacedCard,
): TableauNamePlateModel {
  const { card } = placed;
  const deckPairId = game.config.deckPairId;
  const faceCard = isFaceCard(card);

  return {
    heading: isRegular(card) ? formatHeading(deckPairId, card) : "",
    cardEffects: formatCardEffectsForNamePlate(game, card),
    columnEffects: NONE_EFFECTS,
    set: faceCard && isRegular(card) ? setLine(deckPairId, card) : "",
    setPower: faceCard ? setPowerLine() : "",
    isFaceCard: faceCard,
  };
}

/** @deprecated Prefer {@link columnDisplayLabel} with game state. */
export function tableauColumnHolderHeading(game: GameState, columnIndex: number): string {
  return columnDisplayLabel(game, columnIndex);
}

export function tableauNamePlateFromColumnHolder(
  game: GameState,
  columnIndex: number,
): TableauNamePlateModel {
  return {
    heading: columnDisplayLabel(game, columnIndex),
    cardEffects: "",
    columnEffects: formatColumnEffectsForNamePlate(game, columnIndex),
    set: "",
    setPower: "",
    isFaceCard: false,
    columnHolderInspect: true,
  };
}

export function tableauNamePlateForSource(
  game: GameState,
  source: TableauNamePlateSource,
): TableauNamePlateModel | null {
  if (source.kind === "columnHolder") {
    return tableauNamePlateFromColumnHolder(game, source.columnIndex);
  }
  if (source.kind === "foundation") {
    const pile = game.foundation[source.foundationIndex];
    if (!pile?.length) return null;
    return tableauNamePlateFromFoundationCard(game, pile[pile.length - 1]!);
  }
  const col = game.columns[source.columnIndex];
  if (!col) return null;
  const placed = col[source.cardIndex];
  if (!placed) return null;
  return tableauNamePlateFromCard(game, source.columnIndex, placed);
}

/** Resolve a tableau card to an inspect source (for shift-inspect pin). */
export function tableauInspectSourceForCard(
  game: GameState,
  card: Card,
): TableauNamePlateSource | null {
  for (let columnIndex = 0; columnIndex < game.columns.length; columnIndex++) {
    const col = game.columns[columnIndex]!;
    const cardIndex = col.findIndex(
      (p) => p.card.kind === card.kind && p.card.id === card.id,
    );
    if (cardIndex >= 0) {
      return { kind: "card", columnIndex, cardIndex };
    }
  }
  for (let foundationIndex = 0; foundationIndex < game.foundation.length; foundationIndex++) {
    const pile = game.foundation[foundationIndex]!;
    const top = pile.length > 0 ? pile[pile.length - 1] : undefined;
    if (top && top.card.kind === card.kind && top.card.id === card.id) {
      return { kind: "foundation", foundationIndex: foundationIndex as FoundationIndex };
    }
  }
  return null;
}
