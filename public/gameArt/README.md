# Game art (optional)

Bitmap and vector art under `public/gameArt/` is **optional**. The UI uses CSS fallbacks when files are missing or fail to load:

- **Card backs** — blue/red gradient only (no bitmap fallback chain).
- **A–10** — optional full-card SVG faces in `shared/cards/` (`AS.svg` … `10H.svg`); if missing or failing to load, corner typography only.
- **Courts and jokers** — if **both** the portrait **and** frame load successfully, art is shown; otherwise the same corner typography style as light cards is used (jokers show **JOKER** in the corners).

## Shared (all pairs)

Paths are defined in `src/constants/sharedDeckAssets.ts` and `src/constants/gameArtPaths.ts`. When present, place files here:

- `shared/backs/back-deck1.png`, `shared/backs/back-deck2.png` — card backs  
- `shared/cards/AS.svg` … `shared/cards/10H.svg` — pip card faces (rank letter + suit letter `S` `C` `D` `H`). Vector-playing-cards exports often include a border group `Layer_x0020_1`; the repo script `scripts/remove-pip-border-layer.cjs` removes it from those filenames if you re-import art.
- `shared/frames/jack-spades-frame.svg`, … `king-hearts-frame.svg`, `joker-red-frame.svg`, `joker-black-frame.svg` — overlay on face cards and jokers (one SVG per rank/suit or joker colour variant).

## Per pair (courts and jokers)

Portrait files live under `public/gameArt/portraits/<pairId>/deck1/` and `deck2/`. Filenames and display names are listed in `src/constants/portraitManifest.ts` for themed pairs; **Base** uses `base01-jack-clubs-jack.svg` style names (SVG courts, no jokers).

Current pair ids: `base`, `computerScience`, `westernPhilosophy`, `mathematics`.

Adding a new deck pair is done by editing `deckPairs.ts`, extending the portrait manifest when needed, and dropping the corresponding files under `public/gameArt/` when art is ready.
