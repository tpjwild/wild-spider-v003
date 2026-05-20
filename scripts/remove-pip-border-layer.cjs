/**
 * Removes <g id="Layer_x0020_1"> (or Layer_X0020_1) from pip SVGs under public/gameArt/shared/cards/.
 * Run: node scripts/remove-pip-border-layer.cjs
 */
const { readFileSync, writeFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");
const { JSDOM } = require("jsdom");

const sharedDir = join(__dirname, "..", "public", "gameArt", "shared", "cards");
const pipName = /^(?:[2-9]|10|A)[CDHS]\.svg$/;

let updated = 0;
let skipped = 0;

for (const name of readdirSync(sharedDir)) {
  if (!pipName.test(name)) continue;
  const filePath = join(sharedDir, name);
  const text = readFileSync(filePath, "utf8");
  const dom = new JSDOM(text, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const el =
    doc.getElementById("Layer_x0020_1") ?? doc.getElementById("Layer_X0020_1");
  if (!el) {
    console.warn(`skip (no layer): ${name}`);
    skipped++;
    continue;
  }
  el.remove();
  let out = dom.serialize();
  out = out.replace(/<svg:svg\b/g, "<svg").replace(/<\/svg:svg>/g, "</svg>");
  writeFileSync(filePath, out, "utf8");
  updated++;
}

console.log(`Removed Layer_x0020_1 from ${updated} file(s).${skipped ? ` Skipped ${skipped}.` : ""}`);
