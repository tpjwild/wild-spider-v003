/**
 * Power behavior API (joker + set powers). Content metadata: `@/content/gameContent`.
 */
export {
  applyCardEffect,
  applyColumnEffect,
  applyMakeAllKingsTransparent,
  applyMakeCardTransparent,
  applyMakeTwoKingsTransparent,
  canTriggerImmediatePower,
  appendShelfJoker,
  createShelfJokerEntry,
  normalizeShelfPartition,
  cardAlreadyHasTargetedPowerEffect,
  columnAlreadyHasTargetedPowerEffect,
  isValidBlackJokerCardTarget,
  isValidTargetedCardTarget,
  isValidTargetedColumnTarget,
  jokerPortraitSlotForCard,
  restoreShelfCharge,
  syncShelfJokerPowerFromCatalog,
  syncShelfEntryPowerFromCatalog,
  syncShelfSetPowerFromCatalog,
  triggerCardSwapPower,
  triggerImmediatePower,
  triggerTargetedColumnPower,
  triggerTargetedFoundationPower,
  triggerTargetedPower,
  type AppliedCardEffect,
  type AppliedColumnEffect,
  type BlackJokerTargetContext,
  type PowerTriggerResult,
} from "./handlers";
export {
  isValidCardSwapTarget,
  isValidFoundationReturnTarget,
} from "./cardMoves";
