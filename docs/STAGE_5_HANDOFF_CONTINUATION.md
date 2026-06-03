# Stage 5 handoff — continuation (powers UI + set powers)

**Supersedes** the “codebase reality” table in [STAGE_5_HANDOFF.md](./STAGE_5_HANDOFF.md) for implementation status as of the continuation handoff. Product rules: **[WILD_SPIDER_SPEC.md](./WILD_SPIDER_SPEC.md)** (sections **Sets**, **Powers**, **Effects**, **Shelf**, Game View).

Build checklist (if present): `.cursor/plans/wild_spider_phased_build_9d78c4e6.plan.md` — Stage 5.

**Set powers slice:** Phases 0–7 of the set-powers implementation plan are **done** in code (alignment, shelf UI, triggers, undo, E2E). Per-suit unique set powers and achievement gating remain future work.

---

## Set powers (implemented)

| Area | Location | Status |
|------|----------|--------|
| Types + persistence | `ShelfEntry`, `ShelfSetPower`, `alignedSetKeys`, `gameStorage` migration | Done |
| Alignment | `src/engine/setAlignment.ts` (tableau J–Q–K stack, foundation K–Q–J pile) | Done |
| Create on move/deal + undo | `applyNewSetAlignments`, `setPowersAdded` on history, `undoSetPowersAdded` | Done |
| Catalog authoring | `themedSets()` / `baseSets()` per suit in `deckPair*.ts` | Done |
| Trigger + charge | Same handlers / `triggerTargetedPower` / `armedPowerIdForShelf` set branch | Done |
| Shelf UI | `ShelfStrip` jokers \| gap \| sets; `SetPowerShelfCard` | Done |
| Name plates | Shelf set hover; tableau **Set power** when aligned | Done |
| Tests | `setAlignment.test.ts`, `setPowers.test.ts`, `SetPowerShelfCard.test.tsx`, `ShelfStrip.test.tsx`, `e2e/set-powers.spec.ts` | Done |

**Shipped default (all suits, all pairs):** `POWER_SELECTED_CARD_TRANSPARENT` (Veiled glimpse), **10** charges, duration **5** moves.

**Key files:** `src/engine/setPowers.ts`, `src/lib/setPowerUi.ts`, `src/components/game/SetPowerShelfCard.tsx`, `src/content/setPowers.ts`, `e2e/fixtures/setPowersGame.ts`.

---

## What was completed (engine + content)

### Engine state and behavior

| Area | Location | Status |
|------|----------|--------|
| Card/column effects on `GameState` | `src/engine/types.ts` — `cardEffects`, `columnEffects` | Done |
| `ShelfJoker` | `slot`, `powerId`, `chargesRemaining` (default 3) | Done |
| History | `HistoryEntry` type `power_trigger`; undo restores effects + charge | `src/engine/history.ts` |
| Apply transparent | All 8 Kings by card id; single card targeted | `src/engine/powers/handlers.ts` |
| Trigger + charge | `triggerImmediatePower`, `triggerTargetedPower` | `handlers.ts` → `game.ts` appends history |
| Shelf on deal | `createShelfJokerEntry(deckPairId, card)` | `deal.ts`, `setup.ts`, `initialDeal.ts` |
| Persisted saves | `normalizeStoredGameState` fills missing fields | `src/lib/gameStorage.ts` |
| Unit tests | Handlers, charges, undo, catalog `powerId` | `src/engine/powers/powers.test.ts` |

Public power API: **`import { … } from "@/engine/powers"`** (re-exported from `src/engine/index.ts`).

### Content layout (single registry)

| Path | Role |
|------|------|
| `src/content/gameContent.ts` | `GAME_CONTENT = { deckPairs, powerDefinitions }` + re-exports |
| `src/content/deckPairs.ts` | Full deck-pair catalog (~900 lines) |
| `src/content/powerDefinitions.ts` | `POWER_DEFINITIONS`, `POWER_*`, `getPowerDefinition` |
| `src/content/portraitManifest.ts` | Themed portrait **files** only (courts + jokers) |

**Removed shims:** `src/constants/deckPairs.ts`, `powers.ts`, `portraitManifest.ts` — import from `@/content/...` or `@/constants` barrel (`deckPairs` / `powers` re-export from content).

### Joker catalog authoring

Each themed joker is defined with **explicit** `name`, `bio`, `powerId` (not from manifest):

```typescript
jokers: themedJokers({
  pairId: "computerScience",
  deck: 1,
  jokers: [
    { name: "Ada Lovelace", bio: "…", powerId: POWER_ALL_KINGS_TRANSPARENT },
    // slots 1–4 → portrait files from manifest by `${pairId}:${deck}:${slot}`
  ],
}),
```

`themedSets({ pairId, deck, sets: { S: { jName, jBio, …, powerId, initialCharges, initialDuration }, … } })` builds court `faces` + per-suit `setPowers` in one place.

- **`name`** comes from catalog only (`def.name`); manifest `name` on jokers is unused.
- **`powerId`** is per joker in the tuple/object (today all themed pairs: slots 1–2 red, 3–4 black).
- **`powerIdForJokerSlot` was deleted** — no slot→power inference at runtime.

Helpers: `jokerDefinitionForInGameId(pairId, jokerId)`, `allJokersInDeckPair(pairId)`.

### Power definitions (behavior metadata)

| `powerId` (persisted) | TS constant (examples) | Class | Effect |
|-----------------------|-------------------------|--------|--------|
| `jokerAllKingsTransparent` | `POWER_ALL_KINGS_TRANSPARENT` | immediate | `transparent` on all Kings |
| `jokerSelectedCardTransparent` | `POWER_SELECTED_CARD_TRANSPARENT` | targeted | `transparent` on one valid target (jokers **and** set powers) |

Target validation (engine): `isValidBlackJokerCardTarget(state, card, { tableauFaceDown, inStockPopup, deckPopupFaceDown })` — must match actual game state.

---

## Not done yet (UI + polish)

| Area | Status |
|------|--------|
| **Per-suit set powers** | All suits share Veiled glimpse (10 / 5); unique powers per deck pair deferred |
| **Achievement-gated set unlocks** | Stage 6 — spec rules only |
| **Set shelf Card details** | Shift+inspect dialog for set cards not implemented (optional) |
| **`CardView`** | `displayMode="transparent"` may still use **gradient veil** in some paths — verify against spec |
| **Spec doc paths** | Prefer `src/content/deckPairs/` over legacy `src/constants/deckPairs.ts` mentions |

---

## Recommended build order (from here)

1. **Read effects from state in UI** — helper: `cardEffectsForCard(game, card)` / `hasCardEffect(…, "transparent")`; pass `effectCount` into tableau, `DeckPopup`, `StockPopup` (not foundation, not stock pile widget).
2. **`CardView`** — when card has `transparent` and face-down (or stock popup cell): use `deckPopupFaceDown` overlay path, not gradient `transparent` mode; face-up + effect → badge only.
3. **`CardEffectBadges`** — threshold `> 2`; tooltips TBD.
4. **`gameStore`** — actions: `triggerShelfPower(shelfIndex)`, `commitTargetedPower(card, context)`, cancel targeting; call `triggerImmediatePower` / `triggerTargetedPower` from `@/engine/game`.
5. **`ShelfStrip`** — double-click shelf item; show `chargesRemaining`; disable/depleted at 0.
6. **`GameShell`** — pointer modes `PowerTarget` / `ValidPowerTarget`; deck/stock bar hover opens popups while targeting; Escape cancels without charge.
7. **One power end-to-end** — red joker immediate in UI first, then black targeted + undo in UI.
8. **E2E** — joker powers + **`e2e/set-powers.spec.ts`** (align, trigger, undo).
9. **Per-suit set power content** — replace uniform Veiled glimpse in `deckPair*.ts` when design is ready.

---

## Pitfalls (easy to miss)

1. **Engine `JokerCard.id` vs catalog** — Runtime joker is `{ kind: "joker", id: 0..n-1 }`. Catalog row is `jokerDefinitionForInGameId(pairId, id)` = `list[id % list.length]`. **Shelf** stores `powerId` from catalog when joker lands; triggers use `shelf[i].powerId`, not raw id.
2. **Kings transparent in state** — Effect is on all 8 King **ids** even if not in play; foundation kings have effect in state but **no** badge/overlay per spec.
3. **Undo** — Power trigger counts as a move; `undo()` in `game.ts` uses `undoLastEntry` (increments `undoCount`).
4. **Base pair** — `jokers: []`; no shelf powers for Base.
5. **Portrait manifest** — Keys use `deck` 1|2: `${pairId}:${deck}:${slot}` for jokers; `${pairId}:${deck}:${suit}:${rank}` for courts. Court **names** come from `themedSets` / `baseSets` catalog input; portrait **files** from manifest.
6. **Authored joker names vs art** — Catalog names (e.g. “Ada Lovelace” on CS deck 1 slot 1) may not match portrait filenames (e.g. Konrad Zuse) until content is aligned intentionally.

---

## Key files (quick map)

```
src/content/
  gameContent.ts          # GAME_CONTENT entry point
  deckPairs/              # deck pairs, themedJokers/themedSets builders
  powerDefinitions.ts     # POWER_DEFINITIONS
  portraitManifest.ts     # file paths (+ unused court/joker names for courts)

src/engine/
  types.ts                # GameState effects, ShelfEntry, HistoryEntry
  setAlignment.ts         # aligned set detection
  setPowers.ts            # shelf set instances, undo hook
  effects.ts              # cardEffectKey, add/remove effects
  game.ts                 # triggerImmediatePower, triggerTargetedPower, undo
  powers/
    handlers.ts           # all joker power logic (single file)
    index.ts              # public exports
    powers.test.ts

src/components/game/
  CardView.tsx            # needs transparent effect wiring
  CardEffectBadges.tsx    # threshold + real badges
  ShelfStrip.tsx          # jokers + set powers, trigger UX
  SetPowerShelfCard.tsx   # composite set shelf card
  GameShell.tsx           # targeting mode
  TableauColumn.tsx       # effectCount from state
  DeckPopup.tsx / StockPopup.tsx
```

---

## Tests

```bash
npm test
npm run test:e2e -- e2e/set-powers.spec.ts
npx tsc --noEmit
```

Set-power unit and E2E coverage added with the set-powers slice; older handoff rows above may still describe pre-UI gaps for jokers/effects.

---

## Open decisions (unchanged defaults)

1. Card effect badge threshold: **> 2** (match spec **Effects**).
2. Effect id string: **`transparent`** on `EffectId`.
3. Foundation/stock pile: no transparent visual, no badges (effect may exist on kings in foundation).

---

## First message for a new agent

See the **Initial prompt** block in the continuation chat or copy from the handoff message the user was given.
