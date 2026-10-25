import {
  EligibilityCondition,
  EligibilityConditionResult,
  EligibilityFacts,
  EligibilityOperator
} from "../../types/eligibility";

type EligibilityValue = string | number | boolean;

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

// Compare an applicant's value against a condition
function compareValue(
    actualValue: EligibilityValue,
    operator: EligibilityOperator,
    expectedValue: EligibilityCondition["value"]
): boolean | null {
  switch (operator) {
    case "eq":
      return actualValue === expectedValue;

    case "neq":
      return actualValue !== expectedValue;

    case "gt":
      return (
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue > expectedValue
      );

    case "gte":
      return (
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue >= expectedValue
      );

    case "lt":
      return (
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue < expectedValue
      );

    case "lte":
      return (
          typeof actualValue === "number" &&
          typeof expectedValue === "number" &&
          actualValue <= expectedValue
      );

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
    facts: EligibilityFacts
): EligibilityConditionResult {
  const actualValue = facts[condition.field];

  if (isMissingValue(actualValue)) {
    return {
      conditionId: condition.id,
      field: condition.field,
      passed: null,
      description: condition.description,
    };
  }

  const passed = compareValue(
      actualValue as EligibilityValue,
      condition.operator,
      condition.value
  );

  return {
    conditionId: condition.id,
    field: condition.field,
    passed,
    description: condition.description
  };
}
