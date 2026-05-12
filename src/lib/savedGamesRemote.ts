import { stripEphemeralGameState } from "@/engine/initialDeal";
import type { GameState } from "@/engine/types";
import { parseStoredGameState } from "@/lib/gameStorage";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedGameRow = {
  user_id: string;
  seed: string;
  columns: number;
  deals: number;
  deck_pair_id: string;
  joker_count: number;
  state: unknown;
  history: unknown;
  updated_at: string;
};

export async function fetchSavedGame(client: SupabaseClient, userId: string): Promise<GameState | null> {
  const { data, error } = await client
    .from("saved_games")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.state === undefined || data.state === null) return null;
  return parseStoredGameState(data.state);
}

export async function upsertSavedGame(client: SupabaseClient, userId: string, game: GameState): Promise<void> {
  const stripped = stripEphemeralGameState(game);
  const cfg = stripped.config;
  const row = {
    user_id: userId,
    seed: cfg.seed,
    columns: cfg.columns,
    deals: cfg.deals,
    deck_pair_id: cfg.deckPairId,
    joker_count: cfg.jokerCount,
    state: stripped,
    history: stripped.history,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from("saved_games").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}
