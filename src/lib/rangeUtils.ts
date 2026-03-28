import type { NumberRange } from "../app/types";

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getRangeCount(range: NumberRange): number {
  return Math.max(0, range.end - range.start + 1);
}
