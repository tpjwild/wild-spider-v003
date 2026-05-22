/**
 * CI / pre-commit: verify shipped portrait files match portraitManifest.ts.
 *
 * Run: pnpm run check:portraits
 * Same checks as src/lib/portraitArtManifestCheck.test.ts (via vitest).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const result = spawnSync(
  "pnpm",
  ["exec", "vitest", "run", "src/lib/portraitArtManifestCheck.test.ts"],
  { cwd: REPO_ROOT, stdio: "inherit", shell: process.platform === "win32" },
);

process.exit(result.status ?? 1);
