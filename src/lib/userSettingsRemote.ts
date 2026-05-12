import type { SupabaseClient } from "@supabase/supabase-js";

export type UserSettingsRow = {
  sound_enabled: boolean;
  confirm_save: boolean;
};

export async function fetchUserSettings(client: SupabaseClient, userId: string): Promise<UserSettingsRow> {
  const { data, error } = await client
    .from("user_settings")
    .select("sound_enabled, confirm_save")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return { sound_enabled: true, confirm_save: true };
  }
  return {
    sound_enabled: Boolean(data.sound_enabled),
    confirm_save: data.confirm_save !== false,
  };
}
