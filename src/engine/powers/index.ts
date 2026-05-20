/**
 * Power behavior API (joker + set powers). Content metadata: `@/content/gameContent`.
 */
export {
  applyMakeAllKingsTransparent,
  applyMakeCardTransparent,
  canTriggerImmediatePower,
  createShelfJokerEntry,
  cardAlreadyHasTargetedPowerEffect,
  columnAlreadyHasTargetedPowerEffect,
  isValidBlackJokerCardTarget,
  isValidTargetedCardTarget,
  jokerPortraitSlotForCard,
  restoreShelfCharge,
  triggerImmediatePower,
  triggerTargetedPower,
  type AppliedCardEffect,
  type BlackJokerTargetContext,
  type PowerTriggerResult,
} from "./handlers";
