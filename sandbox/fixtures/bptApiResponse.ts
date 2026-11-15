import type { JkmEligibilityApiResponse } from "../../src/adapters/jkmEligibilityAdapter";

export const bptApiResponse: JkmEligibilityApiResponse = {
  success: true,

  data: {
    programCode: "BPT",
    programName: "Bantuan Penjagaan OKU Terlantar / Pesakit Kronik Terlantar",
    version: 1,
    updatedAt: "2026-10-24 14:42:40",

    criteria: {
      schemaVersion: 1,
      programCode: "BPT",
      source: "BantuanKu V1.0 program specification",
      scope: "preliminary_guidance_only",
      thresholdNotes:
          "Monthly household income maximum RM5,000; patient/caregiver category dependent.",

      rules: [
        {
          ruleCode: "BPT-001",
          name: "Caregiver of Bedridden Patient",
          result: "preliminary_match",
          assessmentNotes:
              "Caregiver and medical circumstances require JKM assessment.",

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
                field: "applicant.isCaregiverOfPatient",
                operator: "eq",
                value: true,
              },
              {
                field: "patient.isBedridden",
                operator: "eq",
                value: true,
              },
              {
                any: [
                  {
                    field: "patient.isOKU",
                    operator: "eq",
                    value: true,
                  },
                  {
                    field: "patient.hasChronicIllness",
                    operator: "eq",
                    value: true,
                  },
                ],
              },
              {
                field: "caregiver.providesIntensiveCare",
                operator: "eq",
                value: true,
              },
              {
                field: "household.monthlyIncome",
                operator: "lte",
                value: 5000,
              },
            ],
          },
        },

        {
          ruleCode: "BPT-002",
          name: "Non-Bedridden Chronic Patient",
          result: "preliminary_match",
          assessmentNotes:
              "Medical confirmation and duration require verification.",

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
                field: "applicant.isPatient",
                operator: "eq",
                value: true,
              },
              {
                field: "patient.isBedridden",
                operator: "eq",
                value: false,
              },
              {
                field: "patient.hasChronicIllness",
                operator: "eq",
                value: true,
              },
              {
                field: "patient.requiresContinuousTreatment",
                operator: "eq",
                value: true,
              },
              {
                field: "patient.continuousTreatmentMonths",
                operator: "gte",
                value: 3,
              },
              {
                field: "household.monthlyIncome",
                operator: "lte",
                value: 5000,
              },
            ],
          },
        },

        {
          ruleCode: "BPT-003",
          name: "Bedridden Patient Without Eligible Malaysian Caregiver",
          result: "preliminary_match",
          assessmentNotes:
              "Potential match in patient's own name; caregiver arrangement requires JKM assessment.",

          conditions: {
            all: [
              {
                field: "patient.citizenship",
                operator: "eq",
                value: "Malaysian",
              },
              {
                field: "patient.residenceCountry",
                operator: "eq",
                value: "Malaysia",
              },
              {
                field: "patient.isBedridden",
                operator: "eq",
                value: true,
              },
              {
                any: [
                  {
                    field: "patient.isOKU",
                    operator: "eq",
                    value: true,
                  },
                  {
                    field: "patient.hasChronicIllness",
                    operator: "eq",
                    value: true,
                  },
                ],
              },
              {
                any: [
                  {
                    field: "patient.hasCaregiver",
                    operator: "eq",
                    value: false,
                  },
                  {
                    field: "caregiver.citizenship",
                    operator: "neq",
                    value: "Malaysian",
                  },
                ],
              },
              {
                field: "household.monthlyIncome",
                operator: "lte",
                value: 5000,
              },
            ],
          },
        },

        {
          ruleCode: "BPT-004",
          name: "Further Assessment Required",
          result: "further_assessment_required",
          assessmentNotes:
              "JKM reviews medical/caregiver evidence.",

          conditions: {
            all: [
              {
                any: [
                  {
                    ruleMatched: "BPT-001",
                  },
                  {
                    ruleMatched: "BPT-002",
                  },
                  {
                    ruleMatched: "BPT-003",
                  },
                ],
              },
              {
                field: "assessment.bptMedicalOrCaregiverReviewRequired",
                operator: "eq",
                value: true,
              },
            ],
          },
        },

        {
          ruleCode: "BPT-005",
          name: "No Preliminary Match",
          result: "no_preliminary_match",

          conditions: {
            not: {
              any: [
                {
                  ruleMatched: "BPT-001",
                },
                {
                  ruleMatched: "BPT-002",
                },
                {
                  ruleMatched: "BPT-003",
                },
              ],
            },
          },
        },
      ],
    },
  },
};
