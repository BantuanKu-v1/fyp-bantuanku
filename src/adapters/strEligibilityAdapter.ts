import {
  EligibilityFacts,
  EligibilityRule,
  EligibilityStatus
} from "../types/eligibility";
import type { StrEligibilityApiResponse } from "../services/api";
import {
  adaptEligibilityExpression,
  isRecord,
  normalizeEligibilityRuleGroup,
  validateEligibilityRuleDependencies
} from "./eligibilityExpressionAdapter";

const STR_FIELD_MAP = {
  "applicant.citizenship": "citizenship",
  "applicant.residenceCountry": "residenceCountry",
  "applicant.age": "age",
  "applicant.monthlyPersonalIncome": "monthlyPersonalIncome",
  "applicant.maritalStatus": "maritalStatus",
  "applicant.isFullTimeIptaIptsStudent": "isFullTimeIptaIptsStudent",
  "applicant.okuRegistered": "okuRegistered",
  "household.monthlyIncome": "monthlyHouseholdIncome",
  "household.numberOfEligibleChildren": "numberOfEligibleChildren",
} as const satisfies Record<string, keyof EligibilityFacts>;

const STR_EXPRESSION_OPTIONS = {
  fieldMap: STR_FIELD_MAP,
  source: "STR",
  allowThresholdRef: false,
} as const;

const STR_OUTCOME_MAP = {
  preliminary_match: "potentially_eligible",
  no_preliminary_match: "potentially_ineligible",
} as const satisfies Record<string, EligibilityStatus>;

type StrOutcome = keyof typeof STR_OUTCOME_MAP;

export function adaptStrEligibilityResponse(response: StrEligibilityApiResponse): EligibilityRule[] {
  if (
      !response ||
      typeof response !== "object" || !response.success || !response.data ||
      !response.data.criteria
  ) {
    throw new Error("Invalid STR eligibility API response: missing success, data, or criteria");
  }

  const { data } = response;
  const criteria = data.criteria;

  if (
      data.programCode !== "STR" ||
      criteria.programCode !== "STR" ||
      criteria.schemaVersion !== 1 ||
      !Array.isArray(criteria.rules)
  ) {
    throw new Error("Invalid STR eligibility criteria");
  }

  if (
      data.schemeYear !== 2026 ||
      (criteria.schemeYear !== undefined &&
        criteria.schemeYear !== 2026)
  ) {
    throw new Error("Unsupported STR scheme year");
  }

  const rules: EligibilityRule[] = criteria.rules.map(
      (rawRule) => {
        if (!isRecord(rawRule)) {
          throw new Error("Invalid STR rule");
        }

        const {
          ruleCode,
          name,
          result,
          conditions,
          assessmentNotes,
        } = rawRule;

        if (
            typeof ruleCode !== "string" ||
            !ruleCode.trim() ||
            typeof name !== "string" ||
            !name.trim() ||
            typeof result !== "string" ||
            !Object.prototype.hasOwnProperty.call(STR_OUTCOME_MAP, result) ||
            (assessmentNotes !== undefined && typeof assessmentNotes !== "string")
        ) {
          throw new Error("Invalid STR rule metadata");
        }

        const outcome = STR_OUTCOME_MAP[result as StrOutcome];

        return {
          id: ruleCode,
          programCode: "STR",
          name,
          conditions: normalizeEligibilityRuleGroup(
              adaptEligibilityExpression(
                  conditions,
                  ruleCode,
                  STR_EXPRESSION_OPTIONS
              )
          ),
          outcome,
          governmentOutcome: result,
          description: assessmentNotes ?? name,
          outcomeDescription: assessmentNotes,
          requiresManualVerification: false,
        };
      }
  );

  validateEligibilityRuleDependencies(rules, "STR");

  return rules;
}
