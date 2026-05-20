# Art source layout (example)

This folder is **committed** as documentation only. Real masters go in the gitignored sibling:

**`../art-source/portraits/`** (repo root, not tracked by git)

Mirror the same paths under both trees:

```
portraits/
  base/
    deck1/     # SVG courts, e.g. base01-jack-clubs-jack.svg
    deck2/
  computerScience/
    deck1/     # PNG courts + jokers per portraitManifest.ts
    deck2/
  westernPhilosophy/
    deck1/
    deck2/
  mathematics/
    deck1/
    deck2/
```

## Filename rules

- Themed courts and jokers: see **`src/content/portraitManifest.ts`** (`file` field for each entry).
- Base courts: `base01-` / `base02-` prefixes with rank and suit in the name (SVG).

## Next steps

Read **`docs/ART_PIPELINE.md`** for sizes (medium 520px, small 160px, WebP) and the full workflow.

After dropping masters into `art-source/portraits/`, run **`pnpm run generate:portraits`** once that script exists (Phase 2).
