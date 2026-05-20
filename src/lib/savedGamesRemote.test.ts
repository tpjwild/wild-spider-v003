import { describe, expect, it, vi } from "vitest";
import { newGame } from "@/engine/game";
import { DEFAULT_DECK_PAIR_ID } from "@/content/deckPairs";
import { stripEphemeralGameState } from "@/engine/initialDeal";
import { fetchSavedGame, upsertSavedGame } from "./savedGamesRemote";

function makeGame() {
  return stripEphemeralGameState(
    newGame({
      columns: 4,
      deals: 5,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "04-005-BAS-11111111111111",
      jokerCount: 0,
    }),
  );
}

describe("savedGamesRemote", () => {
  it("fetchSavedGame returns parsed state from row", async () => {
    const g = makeGame();
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { state: g }, error: null }),
        }),
      }),
    });
    const client = { from } as never;
    const loaded = await fetchSavedGame(client, "user-1");
    expect(loaded).not.toBeNull();
    expect(loaded!.config.seed).toBe(g.config.seed);
    expect(from).toHaveBeenCalledWith("saved_games");
  });

  it("upsertSavedGame writes denormalized columns and state json", async () => {
    const g = makeGame();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    const client = { from } as never;
    await upsertSavedGame(client, "user-2", g);
    expect(upsert).toHaveBeenCalledTimes(1);
    const [row, opts] = upsert.mock.calls[0]!;
    expect(opts).toEqual({ onConflict: "user_id" });
    expect(row.user_id).toBe("user-2");
    expect(row.seed).toBe(g.config.seed);
    expect(row.columns).toBe(g.config.columns);
    expect(row.deals).toBe(g.config.deals);
    expect(row.deck_pair_id).toBe(g.config.deckPairId);
    expect(row.joker_count).toBe(g.config.jokerCount);
    expect(row.state).toEqual(g);
    expect(row.history).toEqual(g.history);
  });
});
