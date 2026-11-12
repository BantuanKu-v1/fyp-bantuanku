import type {
  EligibilityCondition,
  EligibilityExpression,
  EligibilityFacts,
  EligibilityOperator, EligibilityRule, EligibilityRuleGroup,
  EligibilityValue
} from "../types/eligibility";
import { SUPPORTED_ELIGIBILITY_OPERATORS } from "../constants/eligibility";

// Map government API fields to eligibility facts
export type EligibilityFieldMap = Readonly<Record<string, keyof EligibilityFacts>>;

// Configuration supplied by each government-specific adapter
export interface ExpressionAdapterOptions {
  fieldMap: EligibilityFieldMap;
  source: string;
  allowThresholdRef?: boolean;
}

// Check whether a value is a plain object
export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

// Check whether a value is a supported scalar
export function isEligibilityValue(value: unknown): value is EligibilityValue {
  return (
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
  );
}

// Validate comparison operators
function isEligibilityOperator(value: unknown): value is EligibilityOperator {
  return (
      typeof value === "string" &&
      SUPPORTED_ELIGIBILITY_OPERATORS.some(
          (operator) => operator === value
      )
  );
}

// Convert a government API field condition into an internal condition
function adaptFieldCondition(
    input: Record<string, unknown>,
    conditionId: string,
    options: ExpressionAdapterOptions
): EligibilityCondition {
  const { field, operator, value } = input;

  if (
      Object.keys(input).length !== 3 ||
      typeof field !== "string" ||
      !Object.prototype.hasOwnProperty.call(options.fieldMap, field)
  ) {
    throw new Error(`Unsupported ${options.source} eligibility field: ${String(field)}`);
  }

  if (!isEligibilityOperator(operator)) {
    throw new Error(`Unsupported ${options.source} operator: ${String(operator)}`);
  }

  const mappedField = options.fieldMap[field];
  const description = `${field} ${operator}`;

  if (isRecord(value)) {
    if (
        !options.allowThresholdRef ||
        Object.keys(value).length !== 1 ||
        typeof value.thresholdRef !== "string" ||
        !value.thresholdRef.trim() ||
        !["lt", "lte", "gt", "gte"].includes(operator)
    ) {
      throw new Error(`Invalid threshold reference: ${conditionId}`);
    }

    return {
      id: conditionId,
      field: mappedField,
      operator,
      thresholdRef: value.thresholdRef,
      description,
    };
  }

  // List comparisons
  if (operator === "in" || operator === "not_in") {
    if (
        !Array.isArray(value) ||
        value.length === 0 ||
        !value.every(isEligibilityValue)
    ) {
      throw new Error(`Invalid list comparison: ${conditionId}`);
    }

    return {
      id: conditionId,
      field: mappedField,
      operator,
      value,
      description,
    };
  }

  // Static scalar comparisons
  if (!isEligibilityValue(value)) {
    throw new Error(`Invalid comparison value: ${conditionId}`);
  }

  return {
    id: conditionId,
    field: mappedField,
    operator,
    value,
    description,
  };
}

// Recursively convert government eligibility expressions
export function adaptEligibilityExpression(
    input: unknown,
    path: string,
    options: ExpressionAdapterOptions
): EligibilityExpression {
  if (!isRecord(input)) {
    throw new Error(`Invalid ${options.source} eligibility expression: ${path}`);
  }

  // AND
  if (Object.prototype.hasOwnProperty.call(input, "all")) {
    if (
        Object.keys(input).length !== 1 ||
        !Array.isArray(input.all) ||
        input.all.length === 0
    ) {
      throw new Error(`Invalid ALL expression: ${path}`);
    }

    return {
      operator: "AND",
      conditions: input.all.map((item, index) =>
        adaptEligibilityExpression(item, `${path}.all.${index}`, options)
      ),
    };
  }

  // OR
  if (Object.prototype.hasOwnProperty.call(input, "any")) {
    if (
        Object.keys(input).length !== 1 ||
        !Array.isArray(input.any) ||
        input.any.length === 0
    ) {
      throw new Error(`Invalid ANY expression: ${path}`);
    }

    return {
      operator: "OR",
      conditions: input.any.map((item, index) =>
        adaptEligibilityExpression(item, `${path}.any.${index}`, options)
      ),
    };
  }

  // NOT
  if (Object.prototype.hasOwnProperty.call(input, "not")) {
    if (Object.keys(input).length !== 1) {
      throw new Error(`Invalid NOT expression: ${path}`);
    }

    return {
      not: adaptEligibilityExpression(
          input.not,
          `${path}.not`,
          options
      ),
    };
  }

  // Reference to another eligibility rule
  if (Object.prototype.hasOwnProperty.call(input, "ruleMatched")) {
    if (
        Object.keys(input).length !== 1 ||
        typeof input.ruleMatched !== "string" ||
        !input.ruleMatched.trim()
    ) {
      throw new Error(`Invalid rule reference: ${path}`);
    }

    return {
      ruleMatched: input.ruleMatched,
    };
  }

  // Individual field condition
  return adaptFieldCondition(input, path, options);
}

// Ensure every eligibility rule has a group as its root expression
export function normalizeEligibilityRuleGroup(
    expression: EligibilityExpression
): EligibilityRuleGroup {
  if ("conditions" in expression) {
    return expression;
  }

  return {
    operator: "AND",
    conditions: [expression],
  };
}

// Collect referenced rule IDs from an eligibility expression
function collectRuleReferences(
    expression: EligibilityExpression,
    references: Set<string>
): void {
  if ("ruleMatched" in expression) {
    references.add(expression.ruleMatched);
    return;
  }

  if ("not" in expression) {
    collectRuleReferences(
        expression.not,
        references
    );
    return;
  }

  if ("conditions" in expression) {
    for (const condition of expression.conditions) {
      collectRuleReferences(
          condition,
          references
      );
    }
  }
}

// Validate rule references and reject circular dependencies
export function validateEligibilityRuleDependencies(
    rules: EligibilityRule[],
    source: string
): void {
  const ruleMap = new Map(
      rules.map((rule) => [rule.id, rule])
  );

  // Reject duplicate rule IDs
  if (ruleMap.size !== rules.length) {
    throw new Error(`Duplicate ${source} eligibility rule codes detected`);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(ruleId: string): void {
    if (visiting.has(ruleId)) {
      throw new Error(`Circular ${source} rule dependency detected: ${ruleId}`);
    }

    if (visited.has(ruleId)) {
      return;
    }

    const rule = ruleMap.get(ruleId);

    if (!rule) {
      throw new Error(`Unknown ${source} rule reference: ${ruleId}`);
    }

    visiting.add(ruleId);

    const references = new Set<string>();

    collectRuleReferences(
        rule.conditions,
        references
    );

    for (const reference of references) {
      visit(reference);
    }

    visiting.delete(ruleId);
    visited.add(ruleId);
  }

  for (const rule of rules) {
    visit(rule.id);
  }
}
