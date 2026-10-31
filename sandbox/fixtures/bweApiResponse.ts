import type { JkmEligibilityApiResponse } from "../../src/adapters/jkmEligibilityAdapter";

export const bweApiResponse: JkmEligibilityApiResponse = {
  success: true,

  data: {
    programCode: "BWE",
    programName: "Bantuan Warga Emas",
    version: 1,
    updatedAt: "2026-10-01",

    criteria: {
      schemaVersion: 1,
      programCode: "BWE",
      source: "JKM Mock API",
      scope: "Preliminary eligibility assessment",

      rules: [
        {
          ruleCode: "BWE-001",
          name: "Standard Preliminary Eligibility",
          result: "preliminary_match",

          conditions: {
            all: [
              {
                field: "applicant.citizenship",
                operator: "eq",
                value: "Malaysian",
              },
              {
                field: "applicant.residenceCountry",
                operator: "eq",
                value: "Malaysia",
              },
              {
                field: "applicant.ageByBirthYear",
                operator: "gte",
                value: 60,
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
                field: "applicant.residesInExcludedInstitution",
                operator: "eq",
                value: false,
              },
            ],
          },
        },

        {
          ruleCode: "BWE-002",
          name: "Special Consideration",
          result: "further_assessment_required",

          conditions: {
            all: [
              {
                field: "applicant.citizenship",
                operator: "eq",
                value: "Malaysian",
              },
              {
                field: "applicant.residenceCountry",
                operator: "eq",
                value: "Malaysia",
              },
              {
                field: "applicant.ageByBirthYear",
                operator: "gte",
                value: 60,
              },
              {
                field: "applicant.hasChildren",
                operator: "eq",
                value: false,
              },
              {
                field: "applicant.dependsOnFamilyOrCaregiver",
                operator: "eq",
                value: true,
              },
              {
                field:
                    "applicant.familyOrCaregiverIncomeExceedsApplicablePGK",
                operator: "eq",
                value: true,
              },
              {
                field: "applicant.residesInExcludedInstitution",
                operator: "eq",
                value: false,
              },
            ],
          },
        },

        {
          ruleCode: "BWE-003",
          name: "No Preliminary Match",
          result: "no_preliminary_match",

          conditions: {
            not: {
              any: [
                {
                  ruleMatched: "BWE-001",
                },
                {
                  ruleMatched: "BWE-002",
                },
              ],
            },
          },
        },
      ],
    },
  },
};
