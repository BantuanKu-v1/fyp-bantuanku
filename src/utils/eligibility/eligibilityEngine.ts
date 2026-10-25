import {
  AidProgramCode,
  EligibilityCondition,
  EligibilityConditionResult,
  EligibilityFacts, EligibilityResult, EligibilityRule,
  EligibilityRuleGroup, EligibilityRuleResult, EligibilityStatus
} from "../../types/eligibility";
import { evaluateEligibilityCondition } from "./eligibilityConditions";

type EvaluationState = boolean | null;

// Internal result for evaluating a rule group
interface RuleGroupEvaluation {
  matched: EvaluationState;
  conditions: EligibilityConditionResult[];
}

// Identify whether an item is a nested rule group
function isRuleGroup(
    item: EligibilityCondition | EligibilityRuleGroup
): item is EligibilityRuleGroup {
  return "conditions" in item;
}

// Combine evaluation states using AND logic
function evaluateAnd(states: EvaluationState[]): EvaluationState {
  if (states.length === 0) {
    return null;
  }

  if (states.includes(false)) {
    return false;
  }

  if (states.includes(null)) {
    return null;
  }

  return true;
}

// Combine evaluation states using OR logic
function evaluateOr(states: EvaluationState[]): EvaluationState {
  if (states.length === 0) {
    return null;
  }

  if (states.includes(true)) {
    return true;
  }

  if (states.includes(null)) {
    return null;
  }

  return false;
}

// Recursively evaluate a group of conditions
function evaluateRuleGroup(
    group: EligibilityRuleGroup,
    facts: EligibilityFacts
): RuleGroupEvaluation {
  const states: EvaluationState[] = [];
  const conditions: EligibilityConditionResult[] = [];

  for (const item of group.conditions) {
    if (isRuleGroup(item)) {
      const nestedResult = evaluateRuleGroup(item, facts);

      states.push(nestedResult.matched);
      conditions.push(...nestedResult.conditions);
    } else {
      const conditionResult = evaluateEligibilityCondition(item, facts);

      states.push(conditionResult.passed);
      conditions.push(conditionResult);
    }
  }

  return {
    matched:
      group.operator === "AND"
        ? evaluateAnd(states)
        : evaluateOr(states),
    conditions,
  };
}

// Remove duplicate conditions results
function uniqueConditions(
    conditions: EligibilityConditionResult[]
): EligibilityConditionResult[] {
  const seen = new Set<string>();

  return conditions.filter((condition) => {
    if (seen.has(condition.conditionId)) {
      return false;
    }

    seen.add(condition.conditionId);
    return true;
  });
}

// Evaluate an individual eligibility rule
export function evaluateEligibilityRule(
    rule: EligibilityRule,
    facts: EligibilityFacts
): EligibilityRuleResult {
  const evaluation = evaluateRuleGroup(rule.conditions, facts);

  const matchedConditions = evaluation.conditions.filter(
      (condition) => condition.passed === true
  );

  const unmetConditions = evaluation.conditions.filter(
      (condition) => condition.passed === false
  );

  const missingInformation = evaluation.conditions.filter(
      (condition) => condition.passed === null
  );

  return {
    ruleId: rule.id,
    programCode: rule.programCode,
    matched: evaluation.matched,
    outcome: rule.outcome,
    matchedConditions: uniqueConditions(matchedConditions),
    unmetConditions: uniqueConditions(unmetConditions),
    missingInformation: uniqueConditions(missingInformation),
  };
}

// Determine the final eligibility status
function determineEligibilityStatus(
    rules: EligibilityRule[],
    ruleResults: EligibilityRuleResult[]
): EligibilityStatus {
  const matchedRules = ruleResults.filter(
      (result) => result.matched === true
  );

  // A matched ineligibility rule takes priority
  if (
      matchedRules.some(
          (result) => result.outcome === "potentially_ineligible"
      )
  ) {
    return "potentially_ineligible";
  }

  // A matched rule requiring manual verification
  if (
      matchedRules.some((result) => {
        const rule = rules.find((item) => item.id === result.ruleId);

        return (
            result.outcome === "manual_verification" ||
            rule?.requiresManualVerification === true
        );
      })
  ) {
    return "manual_verification";
  }

  // A matched eligibility rule
  if (
      matchedRules.some(
          (result) => result.outcome === "potentially_eligible"
      )
  ) {
    return "potentially_eligible";
  }

  // A matched insufficient-information rule
  if (
      matchedRules.some(
          (result) => result.outcome === "insufficient_information"
      )
  ) {
    return "insufficient_information";
  }

  // Missing information prevents a conclusive assessment
  if (ruleResults.some((result) => result.matched === null)) {
    return "insufficient_information";
  }

  // No rules matched
  return "insufficient_information";
}

// Generate the final eligibility assessment for a program
export function evaluateProgramEligibility(
    programCode: AidProgramCode,
    rules: EligibilityRule[],
    facts: EligibilityFacts
): EligibilityResult {
  // Only evaluate rules belonging to the requested program
  const programRules = rules.filter(
      (rule) => rule.programCode === programCode
  );

  const ruleResults = programRules.map((rule) =>
    evaluateEligibilityRule(rule, facts)
  );

  const matchedRuleIds = ruleResults
      .filter((result) => result.matched === true)
      .map((result) => result.ruleId);

  const matchedConditions = uniqueConditions(
      ruleResults.flatMap((result) => result.matchedConditions)
  );

  const unmetConditions = uniqueConditions(
      ruleResults.flatMap((result) => result.unmetConditions)
  );

  const missingInformation = uniqueConditions(
      ruleResults.flatMap((result) => result.missingInformation)
  );

  const manualVerification = programRules
      .filter((rule) => {
        const result = ruleResults.find(
            (item) => item.ruleId === rule.id
        );

        return (
            result?.matched === true &&
            (rule.requiresManualVerification === true || rule.outcome === "manual_verification")
        );
      })
      .map((rule) => rule.outcomeDescription ?? rule.description);

  return {
    programCode,
    status: determineEligibilityStatus(programRules, ruleResults),
    matchedRuleIds,
    ruleResults,
    matchedConditions,
    unmetConditions,
    missingInformation,
    manualVerification,
  };
}
