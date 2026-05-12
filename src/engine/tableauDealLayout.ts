/**
 * Tableau initial deal when `t` regular cards fill `n` columns with unequal heights:
 * - `q = floor(t/n)` cards in every column; `r = t % n` columns get one extra (`q+1`).
 * - Which columns get the extra: evenly spaced from index 0 to n−1; a single extra goes to the centre column (left-biased when even); see {@link tableauExtraColumnIndices}.
 * - Deal order: `q` full left-to-right rounds over all columns, then one card each to the tall columns in increasing index.
 */

/** Sorted column indices (length `r`) that receive `floor(t/n)+1` cards when `t` cards go into `n` columns. */
export function tableauExtraColumnIndices(n: number, r: number): number[] {
  if (r <= 0 || n < 1) return [];
  if (r > n) {
    throw new Error(`tableauExtraColumnIndices: r (${r}) cannot exceed n (${n})`);
  }
  if (r === 1) {
    return [Math.floor((n - 1) / 2)];
  }
  const denom = r - 1;
  const out: number[] = [];
  for (let k = 0; k < r; k++) {
    out.push(Math.floor((k * (n - 1)) / denom));
  }
  return out;
}

/**
 * For each deal step `0 … t−1`, the tableau column index that receives the next card
 * (bottom-up pile order matches push order).
 */
export function tableauDealColumnOrder(n: number, t: number): number[] {
  if (t <= 0 || n < 1) return [];
  const q = Math.floor(t / n);
  const r = t % n;
  const tall = tableauExtraColumnIndices(n, r);
  const order: number[] = [];
  for (let i = 0; i < q * n; i++) {
    order.push(i % n);
  }
  for (const c of tall) {
    order.push(c);
  }
  if (order.length !== t) {
    throw new Error(
      `tableauDealColumnOrder: internal length mismatch (got ${order.length}, expected ${t})`,
    );
  }
  return order;
}
