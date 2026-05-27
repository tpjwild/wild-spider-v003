import { describe, expect, it } from "vitest";
import { allJokersInDeckPair } from "@/content/deckPairs";
import {
  EFFECT_TRANSPARENT,
  getPowerDefinition,
  JOKER_POWER_2_KINGS_TRANSPARENT,
  JOKER_POWER_CARD_SWAP,
  JOKER_POWER_EXTRA_COLUMN,
  JOKER_POWER_FOUNDATION_RETURN,
  JOKER_POWER_SELECTED_CARD_TRANSPARENT,
  JOKER_POWER_SELECTED_CARD_WILD,
  JOKER_POWER_SELECTED_COLUMN_TRANSPARENT,
  JOKER_POWER_SELECTED_COLUMN_WILD,
  normalizePowerId,
  normalizeShelfJoker,
  powers,
} from "@/content/powerDefinitions";
import { EFFECT_WILD } from "@/content/effectDefinitions";
import { addColumnEffect, appliedEffect, tickEffectDurationsOnTargetCommit } from "@/engine/effects";
import { applyExtraColumn } from "@/engine/extraColumn";
import { buildDoubleDeck, buildJokers } from "@/engine/cards";
import {
  cardEffectKey,
  cardEffectsForCard,
  hasCardEffect,
} from "@/engine/effects";
import {
  triggerImmediatePower,
  triggerTargetedColumnPower,
  triggerTargetedPower,
  undo,
} from "@/engine/game";
import {
  applyMakeAllKingsTransparent,
  applyMakeCardTransparent,
  applyMakeTwoKingsTransparent,
  createShelfJokerEntry,
  isValidBlackJokerCardTarget,
  isValidTargetedCardTarget,
  isValidTargetedColumnTarget,
} from "@/engine/powers";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import type { GameState, PowerId, ShelfJoker } from "@/engine/types";

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: {
      columns: 4,
      deals: 6,
      deckPairId: "computerScience",
      seed: "powers-test",
      jokerCount: 4,
    },
    columns: [[], [], [], []],
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf: [],
    cardEffects: {},
    columnEffects: {},
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
    ...overrides,
  };
}

function kingsInDeck() {
  return buildDoubleDeck().filter((c) => c.rank === 13);
}

describe("applyMakeAllKingsTransparent", () => {
  it("adds transparent to every King in tableau, foundation, and stock", () => {
    const [k0, k1, k2] = kingsInDeck();
    let state = baseState({
      columns: [[{ card: k0!, faceUp: true }], [], [], []],
      foundation: [[{ card: k1!, faceUp: true }], [], [], [], [], [], [], []],
      stock: [k2!],
    });
    const applied = applyMakeAllKingsTransparent(state);
    state = applied.state;
    expect(applied.cardEffectsAdded).toHaveLength(8);
    for (const k of kingsInDeck()) {
      expect(hasCardEffect(state, k, EFFECT_TRANSPARENT)).toBe(true);
    }
  });

  it("is idempotent for kings already transparent", () => {
    const k = kingsInDeck()[0]!;
    const key = cardEffectKey(k);
    const state = baseState({
      columns: [[{ card: k, faceUp: false }], [], [], []],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
    });
    const applied = applyMakeAllKingsTransparent(state);
    expect(applied.cardEffectsAdded.length).toBe(7);
    expect(hasCardEffect(applied.state, k, EFFECT_TRANSPARENT)).toBe(true);
  });
});

describe("applyMakeCardTransparent", () => {
  it("adds transparent to a single card", () => {
    const d = buildDoubleDeck();
    const card = d.find((c) => c.rank === 5)!;
    const state = baseState({
      columns: [[{ card, faceUp: false }], [], [], []],
    });
    const applied = applyMakeCardTransparent(state, card);
    expect(applied.cardEffectsAdded).toHaveLength(1);
    expect(hasCardEffect(applied.state, card, EFFECT_TRANSPARENT)).toBe(true);
  });
});

describe("legacy power ids", () => {
  it("normalizes renamed power ids for lookup and shelf entries", () => {
    expect(normalizePowerId("jokerRedAllKingsTransparent")).toBe("jokerAllKingsTransparent");
    expect(normalizePowerId("jokerBlackCardTransparent")).toBe("jokerSelectedCardTransparent");
    expect(getPowerDefinition("jokerRedAllKingsTransparent").triggerClass).toBe("immediate");
    const legacy = normalizeShelfJoker({
      card: buildJokers(1)[0]!,
      slot: 1,
      powerId: "jokerRedAllKingsTransparent" as never,
      chargesRemaining: 2,
    });
    expect(legacy.powerId).toBe("jokerAllKingsTransparent");
  });
});

describe("deckPairs joker catalog", () => {
  it("defines powerId on every themed joker", () => {
    const list = allJokersInDeckPair("computerScience");
    expect(list).toHaveLength(8);
    for (const j of list) {
      expect(j.powerId).toBeDefined();
      expect(j.initialCharges).toBeGreaterThan(0);
    }
    expect(list.find((j) => j.name === "John Backus")?.powerId).toBe(
      JOKER_POWER_FOUNDATION_RETURN,
    );
    expect(list.find((j) => j.name === "Guido van Rossum")?.powerId).toBe(JOKER_POWER_CARD_SWAP);
    expect(list.find((j) => j.name === "John Backus")?.initialCharges).toBe(5);
    expect(list.find((j) => j.name === "Guido van Rossum")?.initialCharges).toBe(5);
  });

  it("mathematics deck still uses default slot powers", () => {
    const list = allJokersInDeckPair("mathematics");
    for (const j of list) {
      if (j.index <= 2) {
        expect(j.powerId).toBe("jokerAllKingsTransparent");
      } else {
        expect(j.powerId).toBe("jokerSelectedCardTransparent");
      }
    }
  });
});

describe("createShelfJokerEntry", () => {
  it("assigns powerId from deck pair catalog", () => {
    const jokers = buildJokers(4);
    const red = createShelfJokerEntry("computerScience", jokers[0]!);
    const black = createShelfJokerEntry("computerScience", jokers[2]!);
    expect(red.slot).toBeLessThanOrEqual(2);
    expect(red.powerId).toBe(allJokersInDeckPair("computerScience")[0]!.powerId);
    expect(black.slot).toBeGreaterThanOrEqual(3);
    expect(black.powerId).toBe(allJokersInDeckPair("computerScience")[2]!.powerId);
    expect(red.chargesRemaining).toBe(allJokersInDeckPair("computerScience")[0]!.initialCharges);
  });
});

describe("triggerImmediatePower", () => {
  it("consumes a charge, applies kings transparent, and records history", () => {
    const joker = buildJokers(1)[0]!;
    const shelfEntry = createShelfJokerEntry("computerScience", joker);
    const chargesBefore = shelfEntry.chargesRemaining;
    const kings = kingsInDeck();
    const state = baseState({
      columns: [[{ card: kings[0]!, faceUp: true }], [], [], []],
      shelf: [shelfEntry],
    });
    const after = triggerImmediatePower(state, 0);
    expect(after).not.toBeNull();
    expect(after!.shelf[0]!.chargesRemaining).toBe(chargesBefore - 1);
    expect(hasCardEffect(after!, kings[0]!, EFFECT_TRANSPARENT)).toBe(true);
    expect(after!.history).toHaveLength(1);
    expect(after!.history[0]!.type).toBe("power_trigger");
  });

  it("undo restores charge and removes transparent from kings", () => {
    const joker = buildJokers(1)[0]!;
    const shelfEntry = createShelfJokerEntry("computerScience", joker);
    const k = kingsInDeck()[0]!;
    const state = baseState({
      columns: [[{ card: k, faceUp: true }], [], [], []],
      shelf: [shelfEntry],
    });
    const after = triggerImmediatePower(state, 0)!;
    const restored = undo(after)!;
    expect(restored.shelf[0]!.chargesRemaining).toBe(shelfEntry.chargesRemaining);
    expect(hasCardEffect(restored, k, EFFECT_TRANSPARENT)).toBe(false);
    expect(restored.history).toHaveLength(0);
    expect(restored.undoCount).toBe(1);
  });
});

describe("triggerTargetedPower", () => {
  it("applies transparent to one face-down tableau card", () => {
    const d = buildDoubleDeck();
    const card = d.find((c) => c.rank === 4)!;
    const blackJoker = buildJokers(4)[2]!;
    const shelfEntry = createShelfJokerEntry("computerScience", blackJoker);
    const chargesBefore = shelfEntry.chargesRemaining;
    const shelf: ShelfJoker[] = [shelfEntry];
    const state = baseState({
      columns: [[{ card, faceUp: false }], [], [], []],
      shelf,
    });
    const after = triggerTargetedPower(state, 0, card, { tableauFaceDown: true });
    expect(after).not.toBeNull();
    expect(hasCardEffect(after!, card, EFFECT_TRANSPARENT)).toBe(true);
    expect(after!.shelf[0]!.chargesRemaining).toBe(chargesBefore - 1);
  });

  it("rejects cards that already have transparent without spending a charge", () => {
    const d = buildDoubleDeck();
    const card = d.find((c) => c.rank === 4)!;
    const key = cardEffectKey(card);
    const blackJoker = buildJokers(4)[2]!;
    const shelfEntry = createShelfJokerEntry("computerScience", blackJoker);
    const chargesBefore = shelfEntry.chargesRemaining;
    const shelf: ShelfJoker[] = [shelfEntry];
    const state = baseState({
      columns: [[{ card, faceUp: false }], [], [], []],
      shelf,
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
    });
    const after = triggerTargetedPower(state, 0, card, { tableauFaceDown: true });
    expect(after).toBeNull();
    expect(state.shelf[0]!.chargesRemaining).toBe(chargesBefore);
  });

  it("rejects invalid targets without spending a charge", () => {
    const d = buildDoubleDeck();
    const card = d.find((c) => c.rank === 4)!;
    const blackJoker = buildJokers(4)[2]!;
    const shelfEntry = createShelfJokerEntry("computerScience", blackJoker);
    const chargesBefore = shelfEntry.chargesRemaining;
    const shelf: ShelfJoker[] = [shelfEntry];
    const state = baseState({
      columns: [[{ card, faceUp: true }], [], [], []],
      shelf,
    });
    const after = triggerTargetedPower(state, 0, card, {});
    expect(after).toBeNull();
    expect(state.shelf[0]!.chargesRemaining).toBe(chargesBefore);
  });
});

describe("isValidTargetedCardTarget", () => {
  it("returns false when the card already has transparent", () => {
    const d = buildDoubleDeck();
    const card = d.find((c) => c.rank === 4)!;
    const key = cardEffectKey(card);
    const state = baseState({
      columns: [[{ card, faceUp: false }], [], [], []],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
    });
    expect(
      isValidTargetedCardTarget(state, JOKER_POWER_SELECTED_CARD_TRANSPARENT, card, {
        tableauFaceDown: true,
      }),
    ).toBe(false);
    expect(
      isValidBlackJokerCardTarget(state, card, { tableauFaceDown: true }),
    ).toBe(false);
  });

  it("returns true for face-down tableau without transparent yet", () => {
    const d = buildDoubleDeck();
    const card = d.find((c) => c.rank === 4)!;
    const state = baseState({
      columns: [[{ card, faceUp: false }], [], [], []],
    });
    expect(
      isValidTargetedCardTarget(state, JOKER_POWER_SELECTED_CARD_TRANSPARENT, card, {
        tableauFaceDown: true,
      }),
    ).toBe(true);
  });
});

describe("cardEffectsForCard", () => {
  it("returns empty when no effects", () => {
    const d = buildDoubleDeck()[0]!;
    const state = baseState();
    expect(cardEffectsForCard(state, d)).toEqual([]);
  });
});

function shelfWithPower(powerId: PowerId, chargesRemaining = 3): ShelfJoker {
  const joker = buildJokers(1)[0]!;
  return { card: joker, slot: 3, powerId, chargesRemaining };
}

/** Shelf entry whose catalog row matches `powerId` (western philosophy joker ids). */
function shelfWithWesternPhilosophyPower(powerId: PowerId): ShelfJoker {
  const jokerIdByPower: Partial<Record<PowerId, number>> = {
    jokerAllKingsTransparent: 0,
    jokerTwoKingsTransparent: 1,
    jokerSelectedCardTransparent: 2,
    jokerSelectedCardWild: 3,
    jokerSelectedCardSkip1: 4,
    jokerExtraColumn: 5,
    jokerSelectedCardSkip2: 6,
    jokerSelectedColumnTransparent: 7,
  };
  const jokerId = jokerIdByPower[powerId] ?? 0;
  return createShelfJokerEntry("westernPhilosophy", { kind: "joker", id: jokerId });
}

describe("power registry", () => {
  it("every power has a non-empty name and description", () => {
    for (const def of powers) {
      expect(def.name.trim().length).toBeGreaterThan(0);
      expect(def.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("defines all new joker powers", () => {
    expect(getPowerDefinition(JOKER_POWER_SELECTED_CARD_WILD).appliesEffect).toBe(EFFECT_WILD);
    expect(getPowerDefinition(JOKER_POWER_2_KINGS_TRANSPARENT).triggerClass).toBe("immediate");
    expect(getPowerDefinition(JOKER_POWER_SELECTED_COLUMN_WILD).targetKinds).toContain(
      "tableauColumn",
    );
    expect(getPowerDefinition(JOKER_POWER_EXTRA_COLUMN).triggerClass).toBe("targeted");
    expect(getPowerDefinition(JOKER_POWER_EXTRA_COLUMN).targetKinds).toContain("tableauColumn");
    expect(getPowerDefinition(JOKER_POWER_FOUNDATION_RETURN).targetKinds).toContain(
      "foundationSlot",
    );
    expect(getPowerDefinition(JOKER_POWER_CARD_SWAP).targetKinds).toContain("deckPopupCard");
  });

  it("western philosophy Sartre catalog row is Extra Column", () => {
    const sartre = allJokersInDeckPair("westernPhilosophy")[5];
    expect(sartre?.name).toBe("Jean-Paul Sartre");
    expect(sartre?.powerId).toBe(JOKER_POWER_EXTRA_COLUMN);
    expect(sartre?.initialCharges).toBe(10);
    expect(sartre?.initialDuration).toBe(10);
  });
});

describe("applyMakeTwoKingsTransparent", () => {
  it("applies transparent to exactly two kings", () => {
    const kings = kingsInDeck();
    const state = baseState({
      stock: [kings[0]!, kings[1]!],
      columns: [[{ card: kings[2]!, faceUp: true }], [], [], []],
    });
    const applied = applyMakeTwoKingsTransparent(state);
    expect(applied.cardEffectsAdded).toHaveLength(2);
    const affected = kings.filter((k) => hasCardEffect(applied.state, k, EFFECT_TRANSPARENT));
    expect(affected).toHaveLength(2);
  });
});

describe("triggerTargetedPower — card effects", () => {
  it("applies wild to a face-up tableau card", () => {
    const card = buildDoubleDeck().find((c) => c.rank === 9)!;
    const state = baseState({
      config: {
        columns: 4,
        deals: 6,
        deckPairId: "westernPhilosophy",
        seed: "powers-test",
        jokerCount: 4,
      },
      columns: [[{ card, faceUp: true }], [], [], []],
      shelf: [shelfWithWesternPhilosophyPower(JOKER_POWER_SELECTED_CARD_WILD)],
    });
    const after = triggerTargetedPower(state, 0, card, { tableauCard: true });
    expect(after).not.toBeNull();
    expect(hasCardEffect(after!, card, EFFECT_WILD)).toBe(true);
  });
});

describe("triggerTargetedColumnPower", () => {
  it("applies transparent to a tableau column", () => {
    const card = buildDoubleDeck().find((c) => c.rank === 7)!;
    const state = baseState({
      config: {
        columns: 4,
        deals: 6,
        deckPairId: "westernPhilosophy",
        seed: "powers-test",
        jokerCount: 4,
      },
      columns: [[{ card, faceUp: false }], [], [], []],
      shelf: [shelfWithWesternPhilosophyPower(JOKER_POWER_SELECTED_COLUMN_TRANSPARENT)],
    });
    const after = triggerTargetedColumnPower(state, 0, 0);
    expect(after).not.toBeNull();
    expect(after!.columnEffects[0]).toEqual([appliedEffect(EFFECT_TRANSPARENT)]);
    expect(hasCardEffect(after!, card, EFFECT_TRANSPARENT)).toBe(false);
  });

  it("undo restores column effect", () => {
    const state = baseState({
      config: {
        columns: 4,
        deals: 6,
        deckPairId: "westernPhilosophy",
        seed: "powers-test",
        jokerCount: 4,
      },
      columns: [[], [], [], []],
      shelf: [shelfWithWesternPhilosophyPower(JOKER_POWER_SELECTED_COLUMN_TRANSPARENT)],
    });
    const after = triggerTargetedColumnPower(state, 0, 1)!;
    const restored = undo(after)!;
    expect(restored.columnEffects[1]).toBeUndefined();
  });
});

describe("isValidTargetedColumnTarget", () => {
  it("rejects column that already has the effect", () => {
    const state = baseState({
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
    });
    expect(
      isValidTargetedColumnTarget(state, JOKER_POWER_SELECTED_COLUMN_WILD, 0),
    ).toBe(false);
  });

  it("targeted commit ticks existing timed column effect but not newly added one", () => {
    const state = baseState({
      columnEffects: { 0: [appliedEffect(EFFECT_WILD, 3)] },
    });
    const { state: withCol, added } = addColumnEffect(state, 1, EFFECT_WILD, 7);
    expect(added).not.toBeNull();
    const after = tickEffectDurationsOnTargetCommit(withCol, {
      columnEffectsAdded: [added!],
    });
    expect(after.columnEffects[0]![0]!.movesRemaining).toBe(2);
    expect(after.columnEffects[1]![0]!.movesRemaining).toBe(7);
  });

  it("allows deal, chain-parent, and leaf extra-child columns for Extra Column", () => {
    const state = baseState({
      columnFlags: { 1: { isExtraChild: true }, 2: { isExtraChild: true } },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 1, movesRemaining: 5 },
      ],
    });
    expect(isValidTargetedColumnTarget(state, JOKER_POWER_EXTRA_COLUMN, 0)).toBe(true);
    expect(isValidTargetedColumnTarget(state, JOKER_POWER_EXTRA_COLUMN, 1)).toBe(true);
    expect(isValidTargetedColumnTarget(state, JOKER_POWER_EXTRA_COLUMN, 2)).toBe(true);
  });
});

describe("tickEffectDurationsOnTargetCommit — extra column links", () => {
  it("ticks reparented link 5 to 4 but not new outer link at 10", () => {
    const state = baseState({
      columns: [[], [], []],
      columnFlags: { 1: { isExtraChild: true } },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 5 }],
    });
    const applied = applyExtraColumn(state, 0, 10)!;
    const after = tickEffectDurationsOnTargetCommit(applied.state, {
      extraColumnLinkParentsAdded: [applied.newLinkParentIndex],
    });
    expect(after.extraColumnLinks).toEqual([
      { parentColumnIndex: 0, movesRemaining: 10 },
      { parentColumnIndex: 1, movesRemaining: 4 },
    ]);
  });
});

describe("triggerTargetedColumnPower — extra column", () => {
  it("inserts child column and link when Sartre shelf entry targets a deal column", () => {
    const state = baseState({
      config: {
        columns: 4,
        deals: 6,
        deckPairId: "westernPhilosophy",
        seed: "sartre-extra-column",
        jokerCount: 4,
      },
      shelf: [shelfWithWesternPhilosophyPower(JOKER_POWER_EXTRA_COLUMN)],
    });
    const after = triggerTargetedColumnPower(state, 0, 0);
    expect(after).not.toBeNull();
    expect(after!.columns).toHaveLength(5);
    expect(after!.columns[1]).toEqual([]);
    expect(after!.columnFlags[1]).toEqual({ isExtraChild: true });
    expect(after!.extraColumnLinks).toEqual([{ parentColumnIndex: 0, movesRemaining: 10 }]);
    expect(after!.shelf[0]!.chargesRemaining).toBe(9);
    expect(after!.history).toHaveLength(1);
    expect(after!.history[0]).toMatchObject({
      type: "power_trigger",
      shelfIndex: 0,
      chargesBefore: 10,
      extraColumnTopologyBefore: expect.objectContaining({
        columns: state.columns,
        extraColumnLinks: [],
      }),
    });
  });

  it("returns null when catalog duration is missing", () => {
    const state = baseState({
      shelf: [
        {
          card: { kind: "joker", id: 0 },
          slot: 1,
          powerId: JOKER_POWER_EXTRA_COLUMN,
          chargesRemaining: 3,
        },
      ],
    });
    expect(triggerTargetedColumnPower(state, 0, 0)).toBeNull();
  });
});

describe("triggerTargetedColumnPower — extra column undo", () => {
  it("restores topology and charge on undo", () => {
    const d = buildDoubleDeck();
    const card = d[0]!;
    const state = baseState({
      columns: [[{ card, faceUp: true }], [], []],
      shelf: [
        {
          card: { kind: "joker", id: 0 },
          slot: 1,
          powerId: JOKER_POWER_EXTRA_COLUMN,
          chargesRemaining: 2,
        },
      ],
    });
    const applied = applyExtraColumn(state, 0, 10)!;
    const withHistory: GameState = {
      ...applied.state,
      history: [
        {
          type: "power_trigger",
          shelfIndex: 0,
          chargesBefore: 2,
          cardEffectsAdded: [],
          columnEffectsAdded: [],
          extraColumnTopologyBefore: {
            columns: state.columns.map((c) => c.map((p) => ({ ...p }))),
            columnEffects: {},
            columnFlags: {},
            extraColumnLinks: [],
          },
        },
      ],
    };
    const restored = undo(withHistory)!;
    expect(restored.columns).toHaveLength(3);
    expect(restored.extraColumnLinks).toEqual([]);
    expect(restored.shelf[0]!.chargesRemaining).toBe(2);
  });
});
