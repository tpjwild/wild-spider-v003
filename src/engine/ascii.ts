import { isRegular, rankChar } from "./cards";
import type { GameState } from "./types";

function cardShort(c: import("./types").Card): string {
  if (c.kind === "joker") return `Jk${c.id}`;
  return `${rankChar(c.rank)}${c.suit}`;
}

/** One-line debug view of tableau + stock counts (for tests / REPL) */
export function gameToAscii(state: GameState): string {
  const lines: string[] = [];
  lines.push(`seed=${state.config.seed} cols=${state.config.columns} deals=${state.config.deals} jokers=${state.config.jokerCount}`);
  lines.push(`stock=${state.stock.length} shelf=${state.shelf.length} undos=${state.undoCount}`);
  state.columns.forEach((col, i) => {
    const parts = col.map((p) => {
      const ch = cardShort(p.card);
      return p.faceUp ? ch : `(${ch})`;
    });
    lines.push(`C${i}: ${parts.join(" ")}`);
  });
  for (let f = 0; f < 8; f++) {
    const p = state.foundation[f]!;
    if (p.length === 0) continue;
    const top = p[p.length - 1]!.card;
    lines.push(`F${f}: ${isRegular(top) ? cardShort(top) : "?"} (${p.length})`);
  }
  return lines.join("\n");
}
