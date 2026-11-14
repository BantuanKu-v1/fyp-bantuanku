import type { JkmEligibilityApiResponse } from "../../src/adapters/jkmEligibilityAdapter";

export const batApiResponse: JkmEligibilityApiResponse = {
  success: true,

  data: {
    programCode: "BAT",
    programName: "Bantuan Alat Sokong / Alat Tiruan",
    version: 1,
    updatedAt: "2026-10-24 14:42:40",

    criteria: {
      schemaVersion: 1,
      programCode: "BAT",
      source: "BantuanKu V1.0 program specification",
      scope: "preliminary_guidance_only",
      thresholdNotes:
          "Poor PGK thresholds differ from Hardcore Poor PGK and are not numerically specified in the supplied BAT document. Unresolved threshold references must yield unknown, not false.",

      rules: [
        {
          ruleCode: "BAT-001",
          name: "Preliminary Eligibility",
          result: "preliminary_match",
          assessmentNotes:
              "Resolve applicable Poor PGK thresholds before numeric evaluation; target group and recommendation require assessment.",

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
                field: "applicant.isJKMTargetGroup",
                operator: "eq",
                value: true,
              },
              {
                any: [
                  {
                    field: "household.monthlyIncome",
                    operator: "lte",
                    value: {
                      thresholdRef: "BAT_POOR_HOUSEHOLD_PGK",
                    },
                  },
                  {
                    field: "household.monthlyPerCapitaIncome",
                    operator: "lte",
                    value: {
                      thresholdRef: "BAT_POOR_PER_CAPITA_PGK",
                    },
                  },
                ],
              },
              {
                field: "application.hasApplicableMedicalOrJKMRecommendation",
                operator: "eq",
                value: true,
              },
            ],
          },
        },

        {
          ruleCode: "BAT-002",
          name: "Further Assessment Required",
          result: "further_assessment_required",
          assessmentNotes:
              "JKM reviews recommendation, equipment suitability, cost and documents.",

          conditions: {
            all: [
              {
                ruleMatched: "BAT-001",
              },
              {
                field: "assessment.batRecommendationOrEquipmentRequiresReview",
                operator: "eq",
                value: true,
              },
            ],
          },
        },

        {
          ruleCode: "BAT-003",
          name: "Higher Approval Required",
          result: "further_approval_required",
          assessmentNotes:
              "Higher-level approval is required; not an eligibility approval.",

          conditions: {
            all: [
              {
                ruleMatched: "BAT-001",
              },
              {
                field: "application.equipmentCost",
                operator: "gt",
                value: 10000,
              },
              {
                field: "application.equipmentCost",
                operator: "lte",
                value: 20000,
              },
            ],
          },
        },

        {
          ruleCode: "BAT-004",
          name: "Special Consideration",
          result: "further_assessment_required",
          assessmentNotes:
              "Only flags a case for KPKM consideration; does not decide whether it merits consideration.",

          conditions: {
            all: [
              {
                not: {
                  ruleMatched: "BAT-001",
                },
              },
              {
                field: "assessment.batSpecialConsiderationRequested",
                operator: "eq",
                value: true,
              },
            ],
          },
        },

        {
          ruleCode: "BAT-005",
          name: "No Preliminary Match",
          result: "no_preliminary_match",

          conditions: {
            all: [
              {
                not: {
                  ruleMatched: "BAT-001",
                },
              },
              {
                not: {
                  ruleMatched: "BAT-004",
                },
              },
            ],
          },
        },
      ],
    },
  },
};
