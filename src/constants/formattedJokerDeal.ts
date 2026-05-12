/**
 * Formatted-seed setup only: after the 104 regular cards are shuffled, jokers are inserted
 * immediately before regulars at distinct indices in the **trailing** portion of that order,
 * up to one joker per eligible index. Any jokers that do not fit are appended to the **bottom**
 * of the stock (dealt last).
 *
 * `0.5` = last 50% of indices (for 104 cards, indices 52–103 — same as the previous “back half” rule).
 */
export const FORMATTED_JOKER_INSERT_BACK_FRACTION = 0.5;
