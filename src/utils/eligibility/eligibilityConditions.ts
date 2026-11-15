import {
  EligibilityCondition,
  EligibilityConditionResult,
  EligibilityFacts,
  EligibilityOperator,
  EligibilityValue,
} from "../../types/eligibility";
import { resolveExpectedValue } from "./eligibilityThresholds";
import type { EligibilityThresholds } from "./eligibilityThresholds";

// Check whether an eligibility value is missing or invalid
function isMissingValue(
    value: EligibilityFacts[keyof EligibilityFacts]
): boolean {
  return (
      value === null ||
      value === undefined ||
      (typeof value === "number" && !Number.isFinite(value)) ||
      (typeof value === "string" && value.trim() === "")
  );
}

// Compare an applicant's value against an expected value
function compareValue(
    actualValue: EligibilityValue,
    operator: EligibilityOperator,
    expectedValue: EligibilityCondition["value"]
): boolean | null {
  switch (operator) {
    case "eq":
      return typeof expectedValue === typeof actualValue &&
      !Array.isArray(expectedValue)
          ? actualValue === expectedValue
          : null;

    case "neq":
      return typeof expectedValue === typeof actualValue &&
      !Array.isArray(expectedValue)
          ? actualValue !== expectedValue
          : null;

    case "gt":
      return typeof actualValue === "number" &&
      typeof expectedValue === "number"
          ? actualValue > expectedValue
          : null;

    case "gte":
      return typeof actualValue === "number" &&
      typeof expectedValue === "number"
          ? actualValue >= expectedValue
          : null;

    case "lt":
      return typeof actualValue === "number" &&
      typeof expectedValue === "number"
          ? actualValue < expectedValue
          : null;

    case "lte":
      return typeof actualValue === "number" &&
      typeof expectedValue === "number"
          ? actualValue <= expectedValue
          : null;

    case "in":
      return Array.isArray(expectedValue)
          ? expectedValue.includes(actualValue)
          : null;

    case "not_in":
      return Array.isArray(expectedValue)
          ? !expectedValue.includes(actualValue)
          : null;

    default:
      return null;
  }
}

// Evaluate an individual eligibility condition
export function evaluateEligibilityCondition(
    condition: EligibilityCondition,
    facts: EligibilityFacts,
    thresholds: EligibilityThresholds = {}
): EligibilityConditionResult {
  const actualValue = facts[condition.field];

  // Missing applicant information cannot be evaluated
  if (isMissingValue(actualValue)) {
    return {
      conditionId: condition.id,
      field: condition.field,
      passed: null,
      description: condition.description,
      reason: "missing_information",
    };
  }

  const expectedValue = resolveExpectedValue(condition, thresholds);

  // Missing or unresolved comparison values remain unknown
  if (expectedValue === undefined) {
    return {
      conditionId: condition.id,
      field: condition.field,
      passed: null,
      description: condition.description,
      reason: "missing_threshold",
    };
  }

  // Invalid numeric comparison values must not be evaluated
  if (
      typeof expectedValue === "number" &&
      !Number.isFinite(expectedValue)
  ) {
    return {
      conditionId: condition.id,
      field: condition.field,
      passed: null,
      description: condition.description,
      reason: "cannot_evaluate",
    };
  }

  const passed = compareValue(
      actualValue as EligibilityValue,
      condition.operator,
      expectedValue
  );

  return {
    conditionId: condition.id,
    field: condition.field,
    passed,
    description: condition.description,
    ...(passed === null ? { reason: "cannot_evaluate" as const} : {}),
  };
}
