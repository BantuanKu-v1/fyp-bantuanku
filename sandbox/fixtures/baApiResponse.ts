import type { JkmEligibilityApiResponse } from "../../src/adapters/jkmEligibilityAdapter";

export const baApiResponse = {
  success: true,

  data: {
    programCode: "BA",
    programName: "Bantuan Am Persekutuan",
    version: 1,
    updatedAt: "2026-10-01T00:00:00.000Z",

    criteria: {
      schemaVersion: 1,
      programCode: "BA",

      rules: [
        {
          ruleCode: "BA-001",
          name: "Preliminary Eligibility Match",
          result: "preliminary_match",

          conditions: {
            all: [
              {
                field: "applicant.citizenship",
                operator: "eq",
                value: "Malaysian",
              },
              {
                field: "applicant.residenceState",
                operator: "in",
                value: [
                  "Kuala Lumpur",
                  "Putrajaya",
                  "Labuan",
                ],
              },
              {
                any: [
                  {
                    field: "household.monthlyIncome",
                    operator: "lte",
                    value: 1236,
                  },
                  {
                    field: "household.monthlyPerCapitaIncome",
                    operator: "lte",
                    value: 348,
                  },
                ],
              },
              {
                field:
                    "applicant.receivesOtherJKMMonthlyAssistance",
                operator: "eq",
                value: false,
              },
            ],
          },

          assessmentNotes:
              "Preliminary eligibility match. Subject to further JKM assessment.",
        },
        {
          ruleCode: "BA-002",
          name: "Additional Circumstances Review",
          result: "further_assessment_required",

          conditions: {
            all: [
              {
                field:
                    "assessment.baAdditionalCircumstancesRequireReview",
                operator: "eq",
                value: true,
              },
            ],
          },

          assessmentNotes:
              "Additional circumstances require JKM assessment.",
        },
        {
          ruleCode: "BA-003",
          name: "No Preliminary Eligibility Match",
          result: "no_preliminary_match",

          conditions: {
            all: [
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

          assessmentNotes:
              "No preliminary eligibility rule matched.",
        },
      ],
    },
  },
} satisfies JkmEligibilityApiResponse;
