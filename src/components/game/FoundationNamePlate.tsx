"use client";

import { colors } from "@/constants/colors";
import { dimensions } from "@/constants/dimensions";
import type { TableauNamePlateModel } from "@/lib/tableauNamePlate";

const { foundationNamePlateGapPx, foundationNamePlateHeightPx } = dimensions;

function PlateRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="w-full min-w-0 text-[10px] leading-tight">
      <span style={{ color: colors.textMuted }}>{label}: </span>
      <span className="break-words" style={{ color: colors.text }}>
        {value}
      </span>
    </div>
  );
}

function PlateColumn({ rows }: { rows: readonly { label: string; value: string }[] }) {
  const visible = rows.filter((r) => r.value);
  if (visible.length === 0) return <div className="min-w-0" aria-hidden />;
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {visible.map((row) => (
        <PlateRow key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  );
}

export function FoundationNamePlate({ model }: { model: TableauNamePlateModel | null }) {
  const hasText =
    model != null &&
    (model.heading.length > 0 ||
      model.cardEffects !== "—" ||
      model.columnEffects !== "—" ||
      model.set.length > 0);
  const showSetColumn = model?.isFaceCard ?? false;
  const columnHolderOnly = model?.columnHolderInspect === true;

  return (
    <div
      className="foundation-name-plate-scroll flex w-full min-h-0 flex-col rounded-md border border-white/15 px-2 py-1"
      style={{
        marginTop: foundationNamePlateGapPx,
        height: foundationNamePlateHeightPx,
        backgroundColor: colors.foundationNamePlateBackground,
      }}
      data-testid="foundation-name-plate"
      data-has-text={hasText ? "true" : "false"}
      aria-hidden={!hasText}
      aria-live="polite"
    >
      {model ? (
        <div className="flex w-full min-w-0 flex-col gap-1">
          {model.heading ? (
            <div
              className="w-full break-words text-center text-xs font-semibold leading-tight"
              style={{ color: colors.text }}
              data-testid="foundation-name-plate-heading"
            >
              {model.heading}
            </div>
          ) : null}
          {columnHolderOnly ? (
            <div
              className="w-full text-center text-[10px] leading-tight"
              data-testid="foundation-name-plate-column-effects"
            >
              <span style={{ color: colors.textMuted }}>Column Effects: </span>
              <span className="break-words" style={{ color: colors.text }}>
                {model.columnEffects}
              </span>
            </div>
          ) : (
            <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-3 text-left">
              <PlateColumn
                rows={[
                  { label: "Card Effects", value: model.cardEffects },
                  { label: "Column Effects", value: model.columnEffects },
                ]}
              />
              {showSetColumn ? (
                <PlateColumn
                  rows={[
                    { label: "Set", value: model.set },
                    { label: "Set Power", value: model.setPower },
                  ]}
                />
              ) : (
                <div className="min-w-0" aria-hidden />
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
