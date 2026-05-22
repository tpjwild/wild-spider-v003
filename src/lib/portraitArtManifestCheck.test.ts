import { describe, expect, it } from "vitest";
import {
  checkPortraitArtOnDisk,
  collectExpectedPortraitFiles,
  formatPortraitArtCheckFailures,
  portraitArtManifestCheckPasses,
} from "@/lib/portraitArtManifestCheck";

describe("portraitArtManifestCheck", () => {
  it("collects themed courts, jokers, and base SVG courts", () => {
    const expected = collectExpectedPortraitFiles();
    expect(expected.length).toBeGreaterThan(100);
    expect(expected.some((e) => e.pairId === "base" && e.basename.endsWith(".svg"))).toBe(true);
    expect(expected.some((e) => e.pairId === "mathematics" && e.basename.endsWith(".webp"))).toBe(
      true,
    );
  });

  it("every manifest basename exists under portraits and portraits-small", () => {
    const result = checkPortraitArtOnDisk();
    const missing = result.issues.filter((i) => i.kind === "missing");
    const legacy = result.issues.filter((i) => i.kind === "legacy-raster");

    expect(
      missing,
      missing.length ? formatPortraitArtCheckFailures({ ...result, issues: missing, orphanPaths: [] }) : undefined,
    ).toEqual([]);
    expect(
      legacy,
      legacy.length ? formatPortraitArtCheckFailures({ ...result, issues: legacy, orphanPaths: [] }) : undefined,
    ).toEqual([]);
    expect(
      result.orphanPaths,
      result.orphanPaths.length
        ? `orphans:\n${result.orphanPaths.join("\n")}\nRun pnpm run generate:portraits after updating the manifest, or remove stray files.`
        : undefined,
    ).toEqual([]);
    expect(portraitArtManifestCheckPasses()).toBe(true);
  });
});
