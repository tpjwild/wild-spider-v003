import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { CourtFaceRank } from "@/constants/gameArtPaths";
import { baseCourtPortraitBasename } from "@/constants/gameArtPaths";
import { THEMED_COURT_PORTRAITS, THEMED_JOKER_PORTRAITS } from "@/content/portraitManifest";
import type { Suit } from "@/engine/types";

const SUITS: readonly Suit[] = ["C", "D", "H", "S"];
const COURT_RANKS: readonly CourtFaceRank[] = [11, 12, 13];

const LEGACY_RASTER_EXT = [".png", ".jpg", ".jpeg"] as const;

export type PortraitTier = "medium" | "small";

export type ExpectedPortraitFile = {
  pairId: string;
  deck: 1 | 2;
  basename: string;
  /** Human-readable id for error output (manifest key or base court label). */
  source: string;
};

export type PortraitArtCheckIssue =
  | { kind: "missing"; tier: PortraitTier; path: string; source: string }
  | { kind: "legacy-raster"; path: string; webpSibling: string };

export type PortraitArtCheckResult = {
  expectedCount: number;
  issues: PortraitArtCheckIssue[];
  /** Shipped portrait files under public/ not referenced by the manifest (both tiers). */
  orphanPaths: string[];
};

function shippedPortraitDir(repoRoot: string, tier: PortraitTier, pairId: string, deck: 1 | 2): string {
  const folder = tier === "medium" ? "portraits" : "portraits-small";
  return join(repoRoot, "public", "gameArt", folder, pairId, `deck${deck}`);
}

function shippedPortraitPath(
  repoRoot: string,
  tier: PortraitTier,
  pairId: string,
  deck: 1 | 2,
  basename: string,
): string {
  return join(shippedPortraitDir(repoRoot, tier, pairId, deck), basename);
}

/** Every court/joker basename the app references, plus all base SVG courts. */
export function collectExpectedPortraitFiles(): ExpectedPortraitFile[] {
  const out: ExpectedPortraitFile[] = [];

  for (const [key, entry] of Object.entries(THEMED_COURT_PORTRAITS)) {
    const [pairId, deckStr] = key.split(":");
    const deck = Number(deckStr) as 1 | 2;
    out.push({ pairId, deck, basename: entry.file, source: `THEMED_COURT_PORTRAITS[${key}]` });
  }

  for (const [key, entry] of Object.entries(THEMED_JOKER_PORTRAITS)) {
    const [pairId, deckStr] = key.split(":");
    const deck = Number(deckStr) as 1 | 2;
    out.push({ pairId, deck, basename: entry.file, source: `THEMED_JOKER_PORTRAITS[${key}]` });
  }

  for (const deck of [1, 2] as const) {
    for (const suit of SUITS) {
      for (const rank of COURT_RANKS) {
        const basename = baseCourtPortraitBasename(deck, rank, suit);
        out.push({
          pairId: "base",
          deck,
          basename,
          source: `base court deck${deck} ${suit} rank ${rank}`,
        });
      }
    }
  }

  return out;
}

function listPortraitFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...listPortraitFilesRecursive(full));
    } else if (ent.isFile() && !ent.name.startsWith(".")) {
      out.push(full);
    }
  }
  return out;
}

function findLegacyRasterDuplicates(repoRoot: string): PortraitArtCheckIssue[] {
  const issues: PortraitArtCheckIssue[] = [];
  for (const folder of ["portraits", "portraits-small"] as const) {
    const root = join(repoRoot, "public", "gameArt", folder);
    if (!existsSync(root)) continue;
    for (const filePath of listPortraitFilesRecursive(root)) {
      const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
      if (!LEGACY_RASTER_EXT.includes(ext as (typeof LEGACY_RASTER_EXT)[number])) continue;
      const webpPath = `${filePath.slice(0, -ext.length)}.webp`;
      if (existsSync(webpPath)) {
        issues.push({
          kind: "legacy-raster",
          path: filePath,
          webpSibling: webpPath,
        });
      }
    }
  }
  return issues;
}

function collectOrphanShippedPortraits(
  repoRoot: string,
  expected: ExpectedPortraitFile[],
): string[] {
  const expectedRel = new Set<string>();
  for (const { pairId, deck, basename } of expected) {
    expectedRel.add(`portraits/${pairId}/deck${deck}/${basename}`);
    expectedRel.add(`portraits-small/${pairId}/deck${deck}/${basename}`);
  }

  const orphans: string[] = [];
  for (const folder of ["portraits", "portraits-small"] as const) {
    const root = join(repoRoot, "public", "gameArt", folder);
    for (const filePath of listPortraitFilesRecursive(root)) {
      const rel = `${folder}/${filePath.slice(root.length + 1).split("\\").join("/")}`;
      if (!expectedRel.has(rel)) orphans.push(join("public", "gameArt", rel));
    }
  }
  return orphans.sort();
}

/**
 * Verify committed shipped portrait trees match `portraitManifest.ts` and base court naming.
 * Does not read gitignored `art-source/`.
 */
export function checkPortraitArtOnDisk(repoRoot: string = process.cwd()): PortraitArtCheckResult {
  const expected = collectExpectedPortraitFiles();
  const issues: PortraitArtCheckIssue[] = [];

  for (const { pairId, deck, basename, source } of expected) {
    for (const tier of ["medium", "small"] as const) {
      const path = shippedPortraitPath(repoRoot, tier, pairId, deck, basename);
      if (!existsSync(path)) {
        issues.push({ kind: "missing", tier, path, source });
      }
    }
  }

  issues.push(...findLegacyRasterDuplicates(repoRoot));

  return {
    expectedCount: expected.length,
    issues,
    orphanPaths: collectOrphanShippedPortraits(repoRoot, expected),
  };
}

export function formatPortraitArtCheckFailures(result: PortraitArtCheckResult): string {
  const lines: string[] = [];
  for (const issue of result.issues) {
    if (issue.kind === "missing") {
      const tierLabel = issue.tier === "medium" ? "portraits" : "portraits-small";
      lines.push(`missing ${tierLabel}: ${issue.path} (${issue.source})`);
    } else {
      lines.push(`legacy raster alongside WebP: ${issue.path} (remove; use ${issue.webpSibling})`);
    }
  }
  for (const orphan of result.orphanPaths) {
    lines.push(`orphan shipped file (not in manifest): ${orphan}`);
  }
  return lines.join("\n");
}

/** @returns true when every expected file exists and there are no legacy duplicates or orphans. */
export function portraitArtManifestCheckPasses(repoRoot: string = process.cwd()): boolean {
  const result = checkPortraitArtOnDisk(repoRoot);
  return result.issues.length === 0 && result.orphanPaths.length === 0;
}
