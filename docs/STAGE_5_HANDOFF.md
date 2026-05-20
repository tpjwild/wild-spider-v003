# Stage 5 handoff (powers)

Authoritative product rules: **[WILD_SPIDER_SPEC.md](./WILD_SPIDER_SPEC.md)** (sections **Powers**, **Effects**, Game View tableau/deck/stock popups). Build checklist: **[wild_spider_phased_build plan](../.cursor/plans/wild_spider_phased_build_9d78c4e6.plan.md)** — Stage 5.

This file captures **implementation order**, **codebase reality**, and **decisions from design chat** that are easy to miss if you only read the spec.

---

## Product summary (joker slice first)

### Two powers in the initial registry

| Registry role | Joker slots | Class | Charges | Effect |
|---------------|-------------|-------|---------|--------|
| Red | **1–2** per deck (`joker-red01` / `joker-red02` in art) | **Immediate** | **3** per shelf instance | Apply **transparent** to **every King** (rank 13), all suits, both decks, every zone in `GameState`. |
| Black | **3–4** per deck (`joker-black01` / `joker-black02`) | **Targeted** | **3** per shelf instance | Apply **transparent** to **one** card: face-down on **tableau**; **any** card in **Stock popup**; **any** card in **Deck popup** that is **not** face-up (`deckPopupFaceDown` cells). |

Slot mapping: `src/constants/portraitManifest.ts` keys `${pairId}:${deckNum}:1..4` — slots 1–2 are red filenames, 3–4 black. Helper: `gameArtPaths.sharedJokerFramePathFromPortraitBasename` uses `joker-red` vs `joker-black`.

**Base** deck pair has **no** jokers. Themed pairs only.

### Effects (cards vs columns)

- Powers apply **effects** to a **card** or a **tableau column** (column effects are for later powers; joker slice is mostly card effects).
- **Column badges:** badge holder above each column (`TableauColumnBadgeHolder`, `dimensions.tableauColumnBadgeHolderHeight` = 30, `tableauColumnBadgeHolderGapPx` = 10).
- **Card badges** on: tableau card, **Deck popup**, **Stock popup** — **not** foundation, **not** the face-down **stock pile** widget in the main game view.
- **>2 effects** → single count badge + tooltips (align `CardEffectBadges` with spec; it currently uses `>3`).

### Transparent effect (rendering)

When a card has the **transparent** effect:

| Surface | Behaviour |
|---------|-----------|
| Tableau, **face down** | Face art + card-back image at **`deckPopupFaceDownBackOpacity`** (0.5) — same as `deckPopupFaceDown` in `CardView`. |
| **Stock popup** | Same face + semi-transparent back. |
| Tableau **face up**, Deck popup **face-up** cells | **Badge only** — no face+back overlay. |
| **Foundation**, **stock pile** widget | No transparent overlay, **no** effect badges (effect may still exist on kings in foundation for undo/state). |

**Do not flip** cards with powers.

### Targeting UX (black joker)

- Double-click shelf joker/set instance to trigger.
- **Targeted:** invalid click or **Escape** → cancel, **no charge**.
- Valid commit → consume charge, counts as a **move**; undo restores charge + effects.
- In **Power Target** mode, **hover** **Deck** / **Stock** on the game bar **opens** that popup for targeting (spec + plan).

The generic **Powers** list still mentions column badge / shelf as targets for *some* powers; **black joker transparent** must **not** expose those — use per-power `targetType` in the registry.

### Set alignment (later in Stage 5, not joker slice)

**Aligned** = same suit + same deck (ids 0–51 = deck 1, 52–103 = deck 2):

- **Tableau:** Jack on Queen on King (J above Q above K in column).
- **Foundation:** King on Queen on Jack (K on top of pile).

First alignment per set per game → set power instance on shelf. Multiple alignments on one move → multiple instances; order unspecified.

### Out of scope for first slice

- Set power definitions (TBD).
- Achievement-gated joker unlocks / charge upgrades (Stage 6) — use all jokers that shuffle into stock today.
- Per-joker unlock filtering in Decks catalog.

---

## Recommended build order

**Do not** stop after an empty `powers.ts` — wire **engine state** first or in the same PR.

1. **Engine types** — effects on cards (by stable card key) and columns; extend shelf type (`powerId`, `chargesRemaining`, joker **slot** 1–4); `HistoryEntry` for power trigger (+ targeting if needed); undo restores effects and charges.
2. **`src/constants/powers.ts`** + **`src/engine/powers/<effectKey>.ts`** — `makeAllKingsTransparent`, `makeCardTransparent` (names TBD); apply + undo round-trips.
3. **When a joker lands on the shelf** — assign `powerId` from slot (1–2 red, 3–4 black), `chargesRemaining: 3`.
4. **Rendering** — `CardView` / popups: transparent effect uses face+back where spec says; badges via `CardEffectBadges` / column holder `effectCount`.
5. **gameStore + GameShell** — double-click shelf, pointer modes (`PowerTarget`, `ValidPowerTarget`), deck/stock hover opens popups while targeting.
6. **Set alignment** detector + set power shelf items + more handlers.
7. Tests per plan (unit handlers, charges, alignment, Playwright immediate + targeted + undo).

---

## Codebase reality (as of handoff)

| Area | Status |
|------|--------|
| `src/constants/powers.ts` | Empty placeholder |
| `src/engine/powers/` | Does not exist |
| `ShelfJoker` in `types.ts` | Only `{ card: JokerCard }` |
| `GameState` | No effect fields |
| `HistoryEntry` | No power entries |
| `CardView` `transparent` mode | **Gradient veil** (~0.45) — **wrong** vs spec; use `DeckPopupFaceDownBackOverlay` pattern when effect + face-down |
| `CardEffectBadges` | Placeholder; count when `effectCount > 3` |
| `TableauColumnBadgeHolder` | UI shell; always `effectCount={0}` |
| `ShelfStrip` | Jokers only; no set powers, no double-click powers, no charge badges |
| Joker engine identity | `{ kind: "joker", id: 0..n-1 }` — art uses `id % jokerList.length`; **power mapping must use registry slot when placed on shelf** |

---

## Related prior work (not Stage 5)

- **Decks view:** `/decks` opens `DeckCatalogPopup` (all face-up browse); no `/decks/[id]` details route.
- **`AuthAppChrome`:** `GameApp` stays mounted off `/` (hidden) so returning to Game does not re-bootstrap.

---

## Open decisions (defaults if unspecified)

1. **Card effect badge threshold:** Use **>2** everywhere (match column rule in **Effects**).
2. **Effect ids:** e.g. `transparent` string on card/column effect lists.
3. **Kings on foundation:** Effect in state applies; UI shows normal face-up, no badge (per **Effects**).

---

## First chat checklist for the agent

1. Read **Effects** and Stage 5 in **WILD_SPIDER_SPEC.md**.
2. Read this file.
3. Read Stage 5 in `.cursor/plans/wild_spider_phased_build_9d78c4e6.plan.md`.
4. Implement **slice 1:** engine types + `powers.ts` + two effect handlers + tests; then shelf `powerId`/charges on deal-to-shelf; then minimal trigger + transparent rendering for one power end-to-end before set alignment.
