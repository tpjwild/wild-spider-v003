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
  createShelfJokerEntry,
  cardAlreadyHasTargetedPowerEffect,
  columnAlreadyHasTargetedPowerEffect,
  isValidBlackJokerCardTarget,
  isValidTargetedCardTarget,
  isValidTargetedColumnTarget,
  jokerPortraitSlotForCard,
  restoreShelfCharge,
  syncShelfJokerPowerFromCatalog,
  triggerImmediatePower,
  triggerTargetedColumnPower,
  triggerTargetedPower,
  type AppliedCardEffect,
  type AppliedColumnEffect,
  type BlackJokerTargetContext,
  type PowerTriggerResult,
} from "./handlers";
