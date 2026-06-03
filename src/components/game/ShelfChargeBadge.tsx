import { colors } from "@/constants/colors";

export function ShelfChargeBadge({ chargesRemaining }: { chargesRemaining: number }) {
  const depleted = chargesRemaining <= 0;
  return (
    <div
      className="pointer-events-none absolute left-0.5 top-0.5 z-40 flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[9px] font-bold"
      style={{
        backgroundColor: depleted
          ? colors.shelfChargeBadgeDepletedBackground
          : colors.shelfChargeBadgeBackground,
        color: depleted ? colors.shelfChargeBadgeDepletedText : colors.shelfChargeBadgeText,
        boxShadow: `0 0 0 1px ${
          depleted ? colors.shelfChargeBadgeDepletedRing : colors.shelfChargeBadgeRing
        }`,
      }}
      aria-hidden
    >
      {chargesRemaining}
    </div>
  );
}
