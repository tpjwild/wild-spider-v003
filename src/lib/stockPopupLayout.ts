import { isJoker } from "@/engine/cards";
import type { Card, JokerCard, RegularCard } from "@/engine/types";

export type StockPopupLayout = {
  /** Jokers still in the stock, ordered by deal simulation (rounds top-to-bottom within each round’s pops), then remainder pass. */
  jokers: readonly JokerCard[];
  /** Each row is one deal round: up to `columns` regular cards in tableau column order (0 … columns−1). */
  dealRows: readonly (readonly RegularCard[])[];
};

/**
 * Partitions the current stock for the Stock Popup: jokers in a single top row; each full deal round
 * as a row of regular cards (same pop order as {@link dealFromStock}). Remaining cards after the last
 * full round are flushed: all jokers append to `jokers`, remaining regulars chunked by `columns`.
 */
export function stockPopupLayout(stock: readonly Card[], columns: number): StockPopupLayout {
  const jokers: JokerCard[] = [];
  const dealRows: RegularCard[][] = [];

  if (columns < 1) {
    for (const c of stock) {
      if (isJoker(c)) jokers.push(c);
    }
    return { jokers, dealRows };
  }

  const st = [...stock];

  while (st.length > 0) {
    const snapshot = [...st];
    const row: RegularCard[] = [];
    const roundJokers: JokerCard[] = [];
    let failed = false;

    for (let col = 0; col < columns; col++) {
      let placed = false;
      while (!placed) {
        const card = st.pop();
        if (card === undefined) {
          failed = true;
          break;
        }
        if (isJoker(card)) roundJokers.push(card);
        else {
          row.push(card);
          placed = true;
        }
      }
      if (failed) break;
    }

    if (failed) {
      st.length = 0;
      st.push(...snapshot);
      flushRemainderStock(st, columns, jokers, dealRows);
      break;
    }

    while (st.length > 0 && isJoker(st[st.length - 1]!)) {
      const j = st.pop()!;
      if (isJoker(j)) roundJokers.push(j);
    }

    jokers.push(...roundJokers);
    if (row.length > 0) dealRows.push(row);
  }

  return { jokers, dealRows };
}

/** After a failed full round, assign all remaining jokers and chunk remaining regulars into final rows. */
function flushRemainderStock(
  st: Card[],
  columns: number,
  jokers: JokerCard[],
  dealRows: RegularCard[][],
): void {
  const fromTop = [...st].reverse();
  for (const c of fromTop) {
    if (isJoker(c)) jokers.push(c);
  }
  const regs = fromTop.filter((c): c is RegularCard => !isJoker(c));
  for (let i = 0; i < regs.length; i += columns) {
    dealRows.push(regs.slice(i, i + columns));
  }
  st.length = 0;
}
