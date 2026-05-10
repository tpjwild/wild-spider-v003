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

/** One joker sitting on the shelf after being dealt from stock */
export type ShelfJoker = {
  card: JokerCard;
};

export type FoundationIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
      foundationIndex: FoundationIndex;
      /** If source column had a newly flipped card after pickup */
      revealedWasFaceUp: boolean;
    }
  | {
      type: "deal";
      /** Each stock pop in order; tableauColumn null means joker went to shelf */
      entries: { card: Card; tableauColumn: number | null }[];
    };

export type GameConfig = {
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
  /** Number of times undo was invoked (each costs -1 score) */
  undoCount: number;
  /** Player actions only (used for undo); does not include implicit system events */
  history: HistoryEntry[];
};

export type MoveTableauArgs = {
  fromColumn: number;
  /** Index in column of the highest face-up card being moved (top of selection) */
  startIndex: number;
  toColumn: number;
};

export type MoveToFoundationArgs = {
  fromColumn: number;
  foundationIndex: FoundationIndex;
};
