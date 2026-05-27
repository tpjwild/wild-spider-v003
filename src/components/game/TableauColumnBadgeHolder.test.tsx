import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { TableauColumnBadgeHolder } from "@/components/game/TableauColumnBadgeHolder";
import { TableauInspectProvider } from "@/components/game/TableauInspectContext";
import { EFFECT_EXTRA_COLUMN, EFFECT_WILD } from "@/content/effectDefinitions";
import { colors } from "@/constants/colors";
import type { EffectBadgeEntry } from "@/lib/effectBadgeEntries";

function renderHolder(ui: ReactElement) {
  return render(<TableauInspectProvider>{ui}</TableauInspectProvider>);
}

describe("TableauColumnBadgeHolder", () => {
  it("renders Extra Column icon on parent with link", () => {
    const entries: EffectBadgeEntry[] = [
      { effectId: EFFECT_EXTRA_COLUMN, scope: "column" },
    ];
    const { container } = renderHolder(
      <TableauColumnBadgeHolder columnIndex={0} entries={entries} columnDurationTicks={10} />,
    );
    const glyph = container.querySelector("[data-effect-badge-glyph]");
    expect(glyph).toBeTruthy();
    expect(screen.getByTestId("effect-duration-timer")).toHaveTextContent("10");
    expect(screen.getByTestId("effect-duration-timer")).toHaveAttribute(
      "data-effect-duration-scope",
      "column",
    );
  });

  it("renders green strip without child link timer on extra-child column", () => {
    const { container } = renderHolder(
      <TableauColumnBadgeHolder
        columnIndex={1}
        entries={[{ effectId: EFFECT_WILD, scope: "column" }]}
        columnDurationTicks={3}
        isExtraChildColumn
      />,
    );
    const holder = container.querySelector("[data-testid='tableau-column-badge-holder']");
    expect(holder).toHaveAttribute("data-extra-child-column", "true");
    expect(holder).toHaveStyle({
      backgroundColor: colors.tableauExtraChildBadgeHolderBackground,
    });
    expect(container.querySelector("[data-testid='extra-column-link-timer']")).toBeNull();
    expect(screen.getByTestId("effect-duration-timer")).toHaveTextContent("3");
  });
});
