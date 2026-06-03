import { validateGameConfig } from "@/engine/setup";
import type { GameConfig } from "@/engine/types";
import { normalizeNumberOfSuits } from "@/lib/numberOfSuits";

/** Clipboard / paste prefix for v1 encoded setup (plain game seeds must not start with this exact prefix). */
export const SHAREABLE_SETUP_PREFIX = "ws1:";

function base64UrlEncodeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecodeUtf8(b64url: string): string {
  const pad = b64url.length % 4 === 0 ? "" : "=".repeat(4 - (b64url.length % 4));
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

type ShareablePayloadV1 = {
  v: 1;
  seed: string;
  columns: number;
  deals: number;
  jokerCount: number;
  deckPairId: string;
  numberOfSuits?: number;
};

/** One-line string (e.g. for sharing): includes seed and full layout so the same deal can be reconstructed when pasted into New Game. */
export function encodeShareableGameSetup(config: GameConfig): string {
  validateGameConfig(config);
  const payload: ShareablePayloadV1 = {
    v: 1,
    seed: config.seed,
    columns: config.columns,
    deals: config.deals,
    jokerCount: config.jokerCount,
    deckPairId: config.deckPairId,
    numberOfSuits: normalizeNumberOfSuits(config.numberOfSuits),
  };
  return SHAREABLE_SETUP_PREFIX + base64UrlEncodeUtf8(JSON.stringify(payload));
}

/** Returns full game config if `raw` is a valid v1 share string; otherwise null (including plain seeds). */
export function decodeShareableGameSetup(raw: string): GameConfig | null {
  const t = raw.trim();
  if (!t.startsWith(SHAREABLE_SETUP_PREFIX)) return null;
  const b64 = t.slice(SHAREABLE_SETUP_PREFIX.length);
  if (b64.length === 0) return null;
  try {
    const json: unknown = JSON.parse(base64UrlDecodeUtf8(b64));
    if (!json || typeof json !== "object") return null;
    const o = json as Record<string, unknown>;
    if (o.v !== 1) return null;
    const cfg: GameConfig = {
      seed: String(o.seed),
      columns: Number(o.columns),
      deals: Number(o.deals),
      jokerCount: Number(o.jokerCount),
      deckPairId: String(o.deckPairId),
      numberOfSuits: normalizeNumberOfSuits(o.numberOfSuits),
    };
    validateGameConfig(cfg);
    return cfg;
  } catch {
    return null;
  }
}
