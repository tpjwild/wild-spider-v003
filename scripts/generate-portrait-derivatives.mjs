/**
 * Build medium + small portrait derivatives from gitignored masters in art-source/.
 *
 *   art-source/portraits/  →  public/gameArt/portraits/         (520px WebP)
 *                         →  public/gameArt/portraits-small/   (160px WebP)
 *   SVG masters are copied unchanged to both output trees.
 *
 * Run: pnpm run generate:portraits
 *      pnpm run generate:portraits -- --pair computerScience
 *      pnpm run generate:portraits -- --dry-run
 *      pnpm run generate:portraits -- --prune-legacy-rasters
 */
import { copyFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const SOURCE_ROOT = join(REPO_ROOT, "art-source", "portraits");
const MEDIUM_ROOT = join(REPO_ROOT, "public", "gameArt", "portraits");
const SMALL_ROOT = join(REPO_ROOT, "public", "gameArt", "portraits-small");

const MEDIUM_WIDTH = 520;
const SMALL_WIDTH = 160;
const WEBP_QUALITY = 82;

const RASTER_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const LEGACY_RASTER_EXT = new Set([".png", ".jpg", ".jpeg"]);

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const pruneLegacyRasters = argv.includes("--prune-legacy-rasters");
  const pairIdx = argv.indexOf("--pair");
  const pairFilter = pairIdx >= 0 ? argv[pairIdx + 1] : null;
  if (pairIdx >= 0 && !pairFilter) {
    console.error("Usage: --pair <pairId>  (e.g. computerScience)");
    process.exit(1);
  }
  return { dryRun, pairFilter, pruneLegacyRasters };
}

async function pathExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walkFiles(full)));
    } else if (ent.isFile() && !ent.name.startsWith(".")) {
      out.push(full);
    }
  }
  return out;
}

function webpBasename(filePath) {
  const ext = extname(filePath).toLowerCase();
  const base = filePath.slice(0, -ext.length);
  return `${base}.webp`;
}

async function ensureDir(filePath, dryRun) {
  const dir = dirname(filePath);
  if (dryRun) return;
  await mkdir(dir, { recursive: true });
}

async function writeRasterVariant(inputPath, outputPath, width, dryRun) {
  await ensureDir(outputPath, dryRun);
  if (dryRun) return;
  await sharp(inputPath)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputPath);
}

async function copySvg(inputPath, outputPath, dryRun) {
  await ensureDir(outputPath, dryRun);
  if (dryRun) return;
  await copyFile(inputPath, outputPath);
}

/** Remove legacy PNG/JPEG from shipped trees when a matching .webp exists (Phase 3 migration). */
async function pruneLegacyRasterFiles({ dryRun, pairFilter }) {
  let removed = 0;
  for (const root of [MEDIUM_ROOT, SMALL_ROOT]) {
    if (!(await pathExists(root))) continue;
    for (const filePath of await walkFiles(root)) {
      const rel = relative(root, filePath);
      const relPosix = rel.split(sep).join("/");
      if (pairFilter && !relPosix.startsWith(`${pairFilter}/`)) continue;

      const ext = extname(filePath).toLowerCase();
      if (!LEGACY_RASTER_EXT.has(ext)) continue;

      const webpPath = webpBasename(filePath);
      if (!(await pathExists(webpPath))) {
        console.warn(`skip prune (no webp): ${relative(REPO_ROOT, filePath)}`);
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] prune ${relative(REPO_ROOT, filePath)}`);
      } else {
        await unlink(filePath);
      }
      removed++;
    }
  }
  return removed;
}

async function main() {
  const { dryRun, pairFilter, pruneLegacyRasters } = parseArgs(process.argv.slice(2));

  if (pruneLegacyRasters) {
    const removed = await pruneLegacyRasterFiles({ dryRun, pairFilter });
    console.log(`${dryRun ? "dry-run: would prune" : "pruned"} ${removed} legacy raster(s).`);
    if (!dryRun && removed > 0) {
      console.log("Update portraitManifest.ts to .webp basenames if not already done.");
    }
  }

  if (!(await pathExists(SOURCE_ROOT))) {
    if (pruneLegacyRasters) return;
    console.error(`Missing source folder: ${SOURCE_ROOT}`);
    console.error("Copy masters into art-source/portraits/ (see docs/ART_PIPELINE.md).");
    process.exit(1);
  }

  const allFiles = await walkFiles(SOURCE_ROOT);
  const stats = { rasterMedium: 0, rasterSmall: 0, svgCopied: 0, skipped: 0 };

  for (const inputPath of allFiles) {
    const rel = relative(SOURCE_ROOT, inputPath);
    const relPosix = rel.split(sep).join("/");

    if (pairFilter && !relPosix.startsWith(`${pairFilter}/`)) {
      stats.skipped++;
      continue;
    }

    const ext = extname(inputPath).toLowerCase();

    if (ext === ".svg") {
      const mediumOut = join(MEDIUM_ROOT, rel);
      const smallOut = join(SMALL_ROOT, rel);
      if (dryRun) {
        console.log(`[dry-run] copy svg → ${relative(REPO_ROOT, mediumOut)}`);
        console.log(`[dry-run] copy svg → ${relative(REPO_ROOT, smallOut)}`);
      } else {
        await copySvg(inputPath, mediumOut, dryRun);
        await copySvg(inputPath, smallOut, dryRun);
      }
      stats.svgCopied++;
      continue;
    }

    if (!RASTER_EXT.has(ext)) {
      console.warn(`skip (unsupported type): ${relPosix}`);
      stats.skipped++;
      continue;
    }

    const mediumOut = webpBasename(join(MEDIUM_ROOT, rel));
    const smallOut = webpBasename(join(SMALL_ROOT, rel));

    if (dryRun) {
      console.log(`[dry-run] medium ${relative(REPO_ROOT, mediumOut)}`);
      console.log(`[dry-run] small  ${relative(REPO_ROOT, smallOut)}`);
    } else {
      await writeRasterVariant(inputPath, mediumOut, MEDIUM_WIDTH, dryRun);
      await writeRasterVariant(inputPath, smallOut, SMALL_WIDTH, dryRun);
    }
    stats.rasterMedium++;
    stats.rasterSmall++;
  }

  const label = dryRun ? "dry-run complete" : "done";
  console.log(
    `${label}: ${stats.rasterMedium} raster(s) → WebP, ${stats.svgCopied} svg cop(ies), ${stats.skipped} skipped.`,
  );
  if (!dryRun && stats.rasterMedium > 0) {
    console.log(`Medium → ${relative(REPO_ROOT, MEDIUM_ROOT)} (${MEDIUM_WIDTH}px)`);
    console.log(`Small  → ${relative(REPO_ROOT, SMALL_ROOT)} (${SMALL_WIDTH}px)`);
    console.log("Run with --prune-legacy-rasters to delete shipped PNG/JPEG when matching .webp exists.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
