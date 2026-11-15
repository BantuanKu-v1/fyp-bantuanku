import type { EligibilityCondition } from "../../types/eligibility";

// Dynamic threshold values supplied by a trusted source
export type EligibilityThresholds = Readonly<
    Record<string, number | null | undefined>
>;

// Resolve either a static value or a dynamic threshold
export function resolveExpectedValue(
    condition: EligibilityCondition,
    thresholds: EligibilityThresholds
): EligibilityCondition["value"] {
  // A condition must not define both a static value and threshold reference
  if (condition.value !== undefined && condition.thresholdRef !== undefined) {
    return undefined;
  }

  // Resolve dynamic threshold like PGK
  if (condition.thresholdRef !== undefined) {
    const threshold = thresholds[condition.thresholdRef];

    if (typeof threshold !== "number" || !Number.isFinite(threshold)) {
      return undefined;
    }

    return threshold;
  }

  return condition.value;
}
