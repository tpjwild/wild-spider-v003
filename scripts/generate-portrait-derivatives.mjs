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
 */
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
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

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const pairIdx = argv.indexOf("--pair");
  const pairFilter = pairIdx >= 0 ? argv[pairIdx + 1] : null;
  if (pairIdx >= 0 && !pairFilter) {
    console.error("Usage: --pair <pairId>  (e.g. computerScience)");
    process.exit(1);
  }
  return { dryRun, pairFilter };
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

async function main() {
  const { dryRun, pairFilter } = parseArgs(process.argv.slice(2));

  if (!(await pathExists(SOURCE_ROOT))) {
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
    console.log("App still uses .png paths until Phase 4; remove old PNGs in Phase 3 after verification.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
