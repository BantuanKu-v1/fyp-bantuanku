import type { EligibilityRule } from "../../src/types/eligibility";

export const baRules: EligibilityRule[] = [
  {
    id: "BA-001",
    programCode: "BA",
    name: "Preliminary Eligibility Match",
    description: "Standard BA preliminary eligibility.",
    outcome: "potentially_eligible",
    governmentOutcome: "preliminary_match",

    conditions: {
      operator: "AND",
      conditions: [
        {
          id: "BA-001.all.0",
          field: "citizenship",
          operator: "eq",
          value: "Malaysian",
          description: "applicant.citizenship eq",
        },
        {
          id: "BA-001.all.1",
          field: "state",
          operator: "in",
          value: [
            "Kuala Lumpur",
            "Putrajaya",
            "Labuan",
          ],
          description: "applicant.residenceState in",
        },
        {
          operator: "OR",
          conditions: [
            {
              id: "BA-001.all.2.any.0",
              field: "monthlyHouseholdIncome",
              operator: "lte",
              value: 1236,
              description: "household.monthlyIncome lte",
            },
            {
              id: "BA-001.all.2.any.1",
              field: "perCapitaHouseholdIncome",
              operator: "lte",
              value: 348,
              description:
                  "household.monthlyPerCapitaIncome lte",
            },
          ],
        },
        {
          id: "BA-001.all.3",
          field: "receivesJkmMonthlyAssistance",
          operator: "eq",
          value: false,
          description:
              "applicant.receivesOtherJKMMonthlyAssistance eq",
        },
      ],
    },

    outcomeDescription:
        "Preliminary eligibility match. Subject to further JKM assessment.",
  },
  {
    id: "BA-002",
    programCode: "BA",
    name: "Additional Circumstances Review",
    description: "Additional Circumstances Review",
    outcome: "manual_verification",
    governmentOutcome: "further_assessment_required",
    requiresManualVerification: true,

    conditions: {
      operator: "AND",
      conditions: [
        {
          id: "BA-002.all.0",
          field: "baAdditionalCircumstancesRequireReview",
          operator: "eq",
          value: true,
          description:
              "assessment.baAdditionalCircumstancesRequireReview eq",
        },
      ],
    },

    outcomeDescription:
        "Additional circumstances require JKM assessment.",
  },
  {
    id: "BA-003",
    programCode: "BA",
    name: "No Preliminary Eligibility Match",
    description: "No Preliminary Eligibility Match",
    outcome: "potentially_ineligible",
    governmentOutcome: "no_preliminary_match",

    conditions: {
      operator: "AND",
      conditions: [
        {
          not: {
            ruleMatched: "BA-001",
          },
        },
        {
          not: {
            ruleMatched: "BA-002",
          },
        },
      ],
    },

    outcomeDescription:
        "No preliminary eligibility rule matched.",
  },
];

export const BA_EXPECTED_RULE_IDS = [
  "BA-001",
  "BA-002",
  "BA-003",
] as const;

export function validateBaRules(
    rules: EligibilityRule[] = baRules
): boolean {
  const actualIds = rules.map((rule) => rule.id);

  return (
      rules.length === BA_EXPECTED_RULE_IDS.length &&
      BA_EXPECTED_RULE_IDS.every((id) =>
          actualIds.includes(id)
      )
  );
}
