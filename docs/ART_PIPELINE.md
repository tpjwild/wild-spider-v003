# Portrait art pipeline

High-resolution portrait **masters** live outside git. Shipped **medium** and **small** derivatives live under `public/gameArt/` and are committed so Vercel and other clones work without running the generator.

See also **[public/gameArt/README.md](../public/gameArt/README.md)** for how the game loads art.

---

## Conventions (locked)

| Role | Location | Max width | Format | Used in UI |
|------|----------|-----------|--------|------------|
| **Source** | `art-source/portraits/<pairId>/deck{n}/` | original export | PNG/JPEG (gitignored) | Not served |
| **Medium** | `public/gameArt/portraits/<pairId>/deck{n}/` | **520px** | **WebP** (quality **82**) | Card details popup |
| **Small** | `public/gameArt/portraits-small/<pairId>/deck{n}/` | **160px** | **WebP** (quality **82**) | Tableau, foundation, deck popup cells |

- **Basenames** match `src/content/portraitManifest.ts` and `deckPairs.ts` (extension may change `.png` → `.webp` after generation).
- **Base** court portraits are **SVG**; the generator copies them unchanged into both output trees (no resize).
- **Shared** pip faces, frames, and backs stay under `public/gameArt/shared/` (not part of this portrait pipeline).

Current themed pair ids: `computerScience`, `westernPhilosophy`, `mathematics`. Base pair id: `base`.

---

## Folder layout

```
art-source/                          # gitignored — your masters only
  portraits/
    <pairId>/
      deck1/
      deck2/

public/gameArt/                      # committed — shipped assets
  portraits/                         # medium (generated)
  portraits-small/                   # small (generated, Phase 2+)
  shared/                            # backs, pip SVGs, frames (unchanged)
```

Committed template (no binaries): **`art-source.example/`** mirrors the path rules.

---

## Workflow: new or updated portraits

1. Export masters into **`art-source/portraits/<pairId>/deck{n}/`** using the filenames from `portraitManifest.ts` (or the naming pattern documented there).
2. Update **`src/content/portraitManifest.ts`** and **`src/content/deckPairs.ts`** when adding a new pair or new faces.
3. Run **`pnpm run generate:portraits`** (script added in Phase 2) to refresh `public/gameArt/portraits/` and `public/gameArt/portraits-small/`.
4. **Commit** only changes under `public/gameArt/` (and code/manifest). **Do not** commit `art-source/`.
5. Spot-check in dev and after deploy (first flip on tableau, card details popup).

Keep a backup of `art-source/` outside this repo (Drive, etc.); clones do not include gitignored masters.

---

## One-time migration (existing repo)

If large PNGs still live only under `public/gameArt/portraits/`:

1. Copy them into **`art-source/portraits/`** (same paths). A local copy command:

   ```bash
   mkdir -p art-source/portraits
   cp -R public/gameArt/portraits/. art-source/portraits/
   ```

2. After Phase 2 generator exists, run **`pnpm run generate:portraits`** and commit the smaller WebP outputs.
3. Remove obsolete multi-megabyte PNGs from `public/gameArt/portraits/` once WebP medium/small are verified.

Until the generator runs, the app keeps using whatever is already under `public/gameArt/portraits/`.

---

## Phase checklist

- [x] **Phase 1** — `art-source/` gitignored, `docs/ART_PIPELINE.md`, `art-source.example/`
- [ ] **Phase 2** — `sharp` + `scripts/generate-portrait-derivatives.mjs` + `pnpm run generate:portraits`
- [ ] **Phase 3** — Migrate `public/` to generated WebP; drop huge PNGs from git
- [ ] **Phase 4** — `portraitThumbPath` / `gameArtPortraitThumbUrl` in code; CardView vs CardDetails paths
- [ ] **Phase 5** — Optional non-blocking thumb preload at game start
- [ ] **Phase 6** — CI/manifest check (optional)
