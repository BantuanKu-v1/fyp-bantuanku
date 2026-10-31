import type { EligibilityRule } from "../../src/types/eligibility";

export const bweRules: EligibilityRule[] = [
  {
    id: "BWE-001",
    programCode: "BWE",
    name: "Standard Eligibility",
    description: "Standard BWE preliminary eligibility.",
    outcome: "potentially_eligible",

    conditions: {
      operator: "AND",
      conditions: [
        {
          id: "BWE-001-C01",
          field: "citizenship",
          operator: "eq",
          value: "Malaysian",
          description: "Applicant must be Malaysian.",
        },
        {
          id: "BWE-001-C02",
          field: "residenceCountry",
          operator: "eq",
          value: "Malaysia",
          description: "Applicant must reside in Malaysia.",
        },
        {
          id: "BWE-001-C03",
          field: "ageByBirthYear",
          operator: "gte",
          value: 60,
          description: "Applicant must be at least 60 by birth year.",
        },
        {
          operator: "OR",
          conditions: [
            {
              id: "BWE-001-C04",
              field: "monthlyHouseholdIncome",
              operator: "lte",
              value: 1236,
              description: "Household income must not exceed RM1,236.",
            },
            {
              id: "BWE-001-C05",
              field: "perCapitaHouseholdIncome",
              operator: "lte",
              value: 348,
              description: "Per-capita income must not exceed RM348.",
            },
          ],
        },
        {
          id: "BWE-001-C06",
          field: "residesInExcludedInstitution",
          operator: "eq",
          value: false,
          description: "Applicant must not reside in an excluded institution.",
        },
      ],
    },
  },

  {
    id: "BWE-002",
    programCode: "BWE",
    name: "Elderly Without Children Special Consideration",
    description: "Special consideration requiring JKM verification.",
    outcome: "manual_verification",
    requiresManualVerification: true,

    conditions: {
      operator: "AND",
      conditions: [
        {
          id: "BWE-002-C01",
          field: "citizenship",
          operator: "eq",
          value: "Malaysian",
          description: "Applicant must be Malaysian.",
        },
        {
          id: "BWE-002-C02",
          field: "residenceCountry",
          operator: "eq",
          value: "Malaysia",
          description: "Applicant must reside in Malaysia.",
        },
        {
          id: "BWE-002-C03",
          field: "ageByBirthYear",
          operator: "gte",
          value: 60,
          description: "Applicant must be at least 60 by birth year.",
        },
        {
          id: "BWE-002-C04",
          field: "hasChildren",
          operator: "eq",
          value: false,
          description: "Applicant has no children.",
        },
        {
          id: "BWE-002-C05",
          field: "dependsOnFamilyOrCaregiver",
          operator: "eq",
          value: true,
          description: "Applicant depends on family or caregiver.",
        },
        {
          id: "BWE-002-C06",
          field: "familyOrCaregiverIncomeExceedsPgk",
          operator: "eq",
          value: true,
          description: "Family or caregiver income exceeds PGK.",
        },
        {
          id: "BWE-002-C07",
          field: "residesInExcludedInstitution",
          operator: "eq",
          value: false,
          description: "Applicant must not reside in an excluded institution.",
        },
      ],
    },
  },

  {
    id: "BWE-003",
    programCode: "BWE",
    name: "No Preliminary Match",
    description: "Neither BWE qualifying rule matches.",
    outcome: "potentially_ineligible",

    conditions: {
      operator: "AND",
      conditions: [
        {
          not: {
            operator: "OR",
            conditions: [
              { ruleMatched: "BWE-001" },
              { ruleMatched: "BWE-002" },
            ],
          },
        },
      ],
    },
  },
];
