const SKIP_CLOUD_GAME_AUTOLOAD_KEY = "wild-spider-skip-cloud-game-autoload-v1";

/**
 * Call from logout with whether the user still had an in-progress game (any cards on the board / stock / shelf).
 * When `false` (cleared board after End Game, or no game), the next login will not auto-apply the server save.
 * When `true`, the next login uses normal cloud bootstrap if a save exists.
 *
 * Uses **localStorage** (not sessionStorage) so the flag survives new-tab logins and typical auth redirects.
 */
export function recordLogoutHadInProgressGame(hadInProgress: boolean): void {
  if (typeof window === "undefined") return;
  if (hadInProgress) localStorage.removeItem(SKIP_CLOUD_GAME_AUTOLOAD_KEY);
  else localStorage.setItem(SKIP_CLOUD_GAME_AUTOLOAD_KEY, "1");
}

/** True if the next successful bootstrap should skip auto-loading the server game (do not remove the flag). */
export function peekSkipCloudGameAutoload(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SKIP_CLOUD_GAME_AUTOLOAD_KEY) === "1";
}

export function clearSkipCloudGameAutoload(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SKIP_CLOUD_GAME_AUTOLOAD_KEY);
}
