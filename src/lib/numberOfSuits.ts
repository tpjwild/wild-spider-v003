import type { NumberOfSuits } from "@/engine/types";

export function normalizeNumberOfSuits(value: unknown): NumberOfSuits {
  if (value === 1 || value === 2 || value === 4) return value;
  return 4;
}

export function numberOfSuitsGameBarLabel(numberOfSuits: NumberOfSuits): string {
  return String(numberOfSuits);
}
