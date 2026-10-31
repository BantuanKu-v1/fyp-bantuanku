import {
  AidProgramCode,
  EligibilityCondition,
  EligibilityConditionResult,
  EligibilityExpression,
  EligibilityFacts,
  EligibilityResult,
  EligibilityRule,
  EligibilityRuleGroup,
  EligibilityRuleResult,
  EligibilityStatus,
} from "../../types/eligibility";
import { EligibilityThresholds, evaluateEligibilityCondition } from "./eligibilityConditions";

type EvaluationState = boolean | null;

// Internal result for evaluating an eligibility expression
interface ExpressionEvaluation {
  matched: EvaluationState;
  conditions: EligibilityConditionResult[];
}

// Working memory stores the results of evaluated rules
interface EvaluationContext {
  facts: EligibilityFacts;
  thresholds: EligibilityThresholds;
  workingMemory: Map<string, ExpressionEvaluation>;
}

// Identify a nested rule group
function isRuleGroup(
    expression: EligibilityExpression
): expression is EligibilityRuleGroup {
  return "conditions" in expression;
}

// Identify a NOT expression
function isNotExpression(
    expression: EligibilityExpression
): expression is Extract<EligibilityExpression, { not: unknown }> {
  return "not" in expression;
}

// Identify a rule reference
function isRuleReference(
    expression: EligibilityExpression
): expression is Extract<
    EligibilityExpression,
    { ruleMatched: string }
> {
  return "ruleMatched" in expression;
}

// Combine evaluation states using AND logic
function evaluateAnd(
    states: EvaluationState[]
): EvaluationState {
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
function evaluateOr(
    states: EvaluationState[]
): EvaluationState {
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

// Negate a three-valued evaluation state
function evaluateNot(
    state: EvaluationState
): EvaluationState {
  if (state === null) {
    return null;
  }

  return !state;
}

// Remove duplicate condition results
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

// Collect rule dependencies from nested expressions
function collectRuleDependencies(
    expression: EligibilityExpression,
    dependencies: Set<string>
): void {
  if (isRuleReference(expression)) {
    dependencies.add(expression.ruleMatched);
    return;
  }

  if (isNotExpression(expression)) {
    collectRuleDependencies(
        expression.not,
        dependencies
    );
    return;
  }

  if (isRuleGroup(expression)) {
    for (const condition of expression.conditions) {
      collectRuleDependencies(
          condition,
          dependencies
      );
    }
  }
}

// Recursively evaluate nested expressions using working memory
function evaluateExpression(
    expression: EligibilityExpression,
    context: EvaluationContext
): ExpressionEvaluation {
  // AND / OR group
  if (isRuleGroup(expression)) {
    const results = expression.conditions.map(
        (item) => evaluateExpression(item, context)
    );

    const states = results.map(
        (result) => result.matched
    );

    return {
      matched:
          expression.operator === "AND"
              ? evaluateAnd(states)
              : evaluateOr(states),

      conditions: results.flatMap(
          (result) => result.conditions
      ),
    };
  }

  // NOT expression
  if (isNotExpression(expression)) {
    const result = evaluateExpression(
        expression.not,
        context
    );

    return {
      matched: evaluateNot(result.matched),
      conditions: result.conditions,
    };
  }

  // Rule reference: read a previously derived result
  if (isRuleReference(expression)) {
    const referencedResult =
        context.workingMemory.get(
            expression.ruleMatched
        );

    if (!referencedResult) {
      return {
        matched: null,
        conditions: [],
      };
    }

    return {
      matched: referencedResult.matched,
      conditions: [],
    };
  }

  // Individual eligibility condition
  const conditionResult =
      evaluateEligibilityCondition(
          expression as EligibilityCondition,
          context.facts,
          context.thresholds
      );

  return {
    matched: conditionResult.passed,
    conditions: [conditionResult],
  };
}

// Convert an evaluated expression into a public rule result
function buildRuleResult(
    rule: EligibilityRule,
    evaluation: ExpressionEvaluation
): EligibilityRuleResult {
  const matchedConditions =
      evaluation.conditions.filter(
          (condition) => condition.passed === true
      );

  const unmetConditions =
      evaluation.conditions.filter(
          (condition) => condition.passed === false
      );

  const missingInformation =
      evaluation.conditions.filter(
          (condition) => condition.passed === null
      );

  return {
    ruleId: rule.id,
    programCode: rule.programCode,
    matched: evaluation.matched,
    outcome: rule.outcome,

    matchedConditions: uniqueConditions(
        matchedConditions
    ),

    unmetConditions: uniqueConditions(
        unmetConditions
    ),

    missingInformation: uniqueConditions(
        missingInformation
    ),
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

  const hasManualVerification = matchedRules.some(
      (result) => {
        const rule = rules.find(
            (item) => item.id === result.ruleId
        );

        return (
            result.outcome === "manual_verification" ||
            rule?.requiresManualVerification === true
        );
      }
  );

  const hasPreliminaryMatch = matchedRules.some(
      (result) =>
          result.outcome === "potentially_eligible"
  );

  const hasPreliminaryIneligibility =
      matchedRules.some(
          (result) =>
              result.outcome === "potentially_ineligible"
      );

  // Contradictory government outcomes require review
  if (
      hasPreliminaryMatch &&
      hasPreliminaryIneligibility
  ) {
    return "manual_verification";
  }

  // A matched rule requiring further assessment
  if (hasManualVerification) {
    return "manual_verification";
  }

  // A matched preliminary eligibility rule
  if (hasPreliminaryMatch) {
    return "potentially_eligible";
  }

  // A matched preliminary ineligibility rule
  if (hasPreliminaryIneligibility) {
    return "potentially_ineligible";
  }

  // No conclusive matching rule
  return "insufficient_information";
}

// Forward chaining: evaluate rules in dependency order
function runForwardChaining(
    rules: EligibilityRule[],
    facts: EligibilityFacts,
    thresholds: EligibilityThresholds
): EligibilityRuleResult[] {
  const context: EvaluationContext = {
    facts,
    thresholds,
    workingMemory: new Map(),
  };

  const ruleMap = new Map(
      rules.map((rule) => [rule.id, rule])
  );

  // Prevent duplicate rule IDs
  if (ruleMap.size !== rules.length) {
    throw new Error(
        "Duplicate eligibility rule IDs detected"
    );
  }

  // Identify dependencies for every rule
  const dependencies = new Map<
      string,
      Set<string>
  >();

  for (const rule of rules) {
    const ruleDependencies = new Set<string>();

    collectRuleDependencies(
        rule.conditions,
        ruleDependencies
    );

    // Reject references to unknown rules
    for (const dependency of ruleDependencies) {
      if (!ruleMap.has(dependency)) {
        throw new Error(
            `Unknown eligibility rule reference: ${dependency}`
        );
      }
    }

    dependencies.set(
        rule.id,
        ruleDependencies
    );
  }

  // Track rules that have not yet been evaluated
  const pending = new Set(
      rules.map((rule) => rule.id)
  );

  const results = new Map<
      string,
      EligibilityRuleResult
  >();

  // Continue until all rules have been evaluated
  while (pending.size > 0) {
    let progressMade = false;

    for (const rule of rules) {
      if (!pending.has(rule.id)) {
        continue;
      }

      const ruleDependencies =
          dependencies.get(rule.id) ??
          new Set<string>();

      // Only evaluate a rule after its dependencies
      const dependenciesResolved = [
        ...ruleDependencies,
      ].every((dependency) =>
          context.workingMemory.has(dependency)
      );

      if (!dependenciesResolved) {
        continue;
      }

      // Evaluate the rule once
      const evaluation = evaluateExpression(
          rule.conditions,
          context
      );

      // Store the derived result in working memory
      context.workingMemory.set(
          rule.id,
          evaluation
      );

      // Reuse the evaluation to build the public result
      const result = buildRuleResult(
          rule,
          evaluation
      );

      results.set(
          rule.id,
          result
      );

      pending.delete(rule.id);
      progressMade = true;
    }

    // No progress indicates circular dependencies
    if (!progressMade) {
      throw new Error(
          "Circular eligibility rule dependency detected"
      );
    }
  }

  // Return results in the original rule order
  return rules.map((rule) => {
    const result = results.get(rule.id);

    if (!result) {
      throw new Error(
          `Missing evaluation result for rule: ${rule.id}`
      );
    }

    return result;
  });
}

// Evaluate an individual eligibility rule
export function evaluateEligibilityRule(
    rule: EligibilityRule,
    facts: EligibilityFacts,
    thresholds: EligibilityThresholds = {}
): EligibilityRuleResult {
  const results = runForwardChaining(
      [rule],
      facts,
      thresholds
  );

  return results[0];
}

// Generate the final eligibility assessment for a program
export function evaluateProgramEligibility(
    programCode: AidProgramCode,
    rules: EligibilityRule[],
    facts: EligibilityFacts,
    thresholds: EligibilityThresholds = {}
): EligibilityResult {
  // Only evaluate rules belonging to the requested program
  const programRules = rules.filter(
      (rule) => rule.programCode === programCode
  );

  if (programRules.length === 0) {
    throw new Error(`No eligibility rules available for program: ${programCode}`);
  }

  // Execute the forward-chaining inference process
  const ruleResults = runForwardChaining(
      programRules,
      facts,
      thresholds
  );

  const matchedRuleIds = ruleResults
      .filter(
          (result) => result.matched === true
      )
      .map(
          (result) => result.ruleId
      );

  const matchedConditions = uniqueConditions(
      ruleResults.flatMap(
          (result) => result.matchedConditions
      )
  );

  const unmetConditions = uniqueConditions(
      ruleResults.flatMap(
          (result) => result.unmetConditions
      )
  );

  // Only unresolved rules contribute to missing information
  const missingInformation = uniqueConditions(
      ruleResults
          .filter(
              (result) => result.matched === null
          )
          .flatMap(
              (result) => result.missingInformation
          )
  );

  const manualVerification = programRules
      .filter((rule) => {
        const result = ruleResults.find(
            (item) => item.ruleId === rule.id
        );

        return (
            result?.matched === true &&
            (
                rule.requiresManualVerification === true ||
                rule.outcome === "manual_verification"
            )
        );
      })
      .map(
          (rule) =>
              rule.outcomeDescription ??
              rule.description
      );

  return {
    programCode,

    status: determineEligibilityStatus(
        programRules,
        ruleResults
    ),

    matchedRuleIds,
    ruleResults,
    matchedConditions,
    unmetConditions,
    missingInformation,
    manualVerification,
  };
}
