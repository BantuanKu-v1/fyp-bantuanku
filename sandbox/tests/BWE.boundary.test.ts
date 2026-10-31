import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type { EligibilityFacts, EligibilityStatus } from "../../src/types/eligibility";
import { bweRules } from "../fixtures/bweRules";

type RuleMatchState = boolean | null;

interface BoundaryTestCase {
  id: string;
  name: string;
  overrides: Partial<EligibilityFacts>;
  expectedStatus: EligibilityStatus;
  expectedRuleStates: Record<string, RuleMatchState>;
}

function createEligibleFacts(
    overrides: Partial<EligibilityFacts> = {}
): EligibilityFacts {
  return {
    // Personal information
    age: 65,
    ageByBirthYear: 65,
    citizenship: "Malaysian",
    residenceCountry: "Malaysia",
    state: null,
    maritalStatus: null,

    // Financial information
    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: 1000,
    householdSize: 2,
    perCapitaHouseholdIncome: 500,

    // Household information
    numberOfDependents: null,
    numberOfEligibleChildren: null,
    hasChildren: true,
    hasEligibleChildren: null,
    isFullTimeStudent: null,

    // Welfare assistance information
    receivesJkmMonthlyAssistance: null,
    isJkmTargetGroup: null,

    // Health and disability information
    isOku: null,
    okuRegistered: null,
    hasChronicIllness: null,
    isBedridden: null,
    requiresContinuousTreatment: null,
    continuousTreatmentMonths: null,

    // Living arrangements
    residesInJkmInstitution: null,
    residesInExcludedCareCentre: null,
    residesInExcludedInstitution: false,
    livesWithFamilyOrCaregiver: null,
    dependsOnFamilyOrCaregiver: false,
    familyOrCaregiverIncomeExceedsPgk: null,

    // Caregiver and patient information
    applicantIsPatient: null,
    applicantIsCaregiver: null,
    patientCitizenship: null,
    patientResidenceCountry: null,
    patientIsOku: null,
    patientHasChronicIllness: null,
    patientIsBedridden: null,
    patientRequiresContinuousTreatment: null,
    patientContinuousTreatmentMonths: null,
    hasCaregiver: null,
    caregiverCitizenship: null,
    caregiverProvidesIntensiveCare: null,

    // Medical and assistive equipment information
    hasMedicalOrJkmRecommendation: null,
    requestedAssistiveEquipment: null,
    estimatedEquipmentCost: null,
    hasHospitalReferral: null,

    // External verification information
    socioeconomicAssessmentRequired: null,
    medicalAssessmentRequired: null,

    // JKM-specific assessment information
    baAdditionalCircumstancesRequireReview: null,
    batRecommendationOrEquipmentRequiresReview: null,
    batSpecialConsiderationRequested: null,
    bptMedicalOrCaregiverReviewRequired: null,

    ...overrides,
  };
}

// Test cases
const boundaryTestCases: BoundaryTestCase[] = [
    // Age boundaries
  {
    id: "BWE-BT-001",
    name: "Age 59 - Below Minimum",

    overrides: {
      age: 59,
      ageByBirthYear: 59,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  {
    id: "BWE-BT-002",
    name: "Age 60 - Exact Minimum",

    overrides: {
      age: 60,
      ageByBirthYear: 60,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-003",
    name: "Age 61 - Above Minimum",

    overrides: {
      age: 61,
      ageByBirthYear: 61,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  // Household income boundaries
  // Per-capita income is held above RM348 to isolate the monthly household income condition
  {
    id: "BWE-BT-004",
    name: "Household Income RM1,235",

    overrides: {
      monthlyHouseholdIncome: 1235,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-005",
    name: "Household Income RM1,236",

    overrides: {
      monthlyHouseholdIncome: 1236,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-006",
    name: "Household Income RM1,237",

    overrides: {
      monthlyHouseholdIncome: 1237,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  // Per-capita income boundaries
  // Household income is held above RM1,236 to isolate the per-capita income condition
  {
    id: "BWE-BT-007",
    name: "Per-Capita Income RM347",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 347,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-008",
    name: "Per-Capita Income RM348",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 348,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-009",
    name: "Per-Capita Income RM349",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 349,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  // Citizenship
  {
    id: "BWE-BT-010",
    name: "Non-Malaysian Applicant",

    overrides: {
      citizenship: "Non-Malaysian",
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  {
    id: "BWE-BT-011",
    name: "Unknown Citizenship",

    overrides: {
      citizenship: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": false,
      "BWE-003": null,
    },
  },

  // Residence
  {
    id: "BWE-BT-012",
    name: "Applicant Resides Outside Malaysia",

    overrides: {
      residenceCountry: "Singapore",
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  {
    id: "BWE-BT-013",
    name: "Unknown Residence Country",

    overrides: {
      residenceCountry: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": false,
      "BWE-003": null,
    },
  },

  // Institution status
  {
    id: "BWE-BT-014",
    name: "Applicant Resides In Excluded Institution",

    overrides: {
      residesInExcludedInstitution: true,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  {
    id: "BWE-BT-015",
    name: "Unknown Institution Status",

    overrides: {
      residesInExcludedInstitution: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": false,
      "BWE-003": null,
    },
  },

  // INCOME OR LOGIC Income OR logic
  {
    id: "BWE-BT-016",
    name: "Low Household Income, High Per-Capita Income",

    overrides: {
      monthlyHouseholdIncome: 1000,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-017",
    name: "High Household Income, Low Per-Capita Income",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 300,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-018",
    name: "Both Income Conditions Fail",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  // Missing information
  {
    id: "BWE-BT-019",
    name: "Household Income Missing, Per-Capita Income Qualifies",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: 300,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-020",
    name: "Household Income Missing, Per-Capita Income Fails",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": false,
      "BWE-003": null,
    },
  },

  {
    id: "BWE-BT-021",
    name: "Both Income Values Missing",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": false,
      "BWE-003": null,
    },
  },

  // Rule dependencies
  {
    id: "BWE-BT-022",
    name: "BWE-003 Must Be False When BWE-001 Matches",

    overrides: {
      monthlyHouseholdIncome: 1000,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-BT-023",
    name: "BWE-003 Must Be True When Both Qualifying Rules Fail",

    overrides: {
      age: 45,
      ageByBirthYear: 45,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  {
    id: "BWE-BT-024",
    name: "BWE-003 Must Remain Unknown When BWE-001 Is Unknown",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": false,
      "BWE-003": null,
    },
  },
];

// AUTOMATED BOUNDARY TESTS Automated boundary tests
describe("BantuanKu - BWE Boundary Testing", () => {
  test.each(boundaryTestCases)(
      "$id - $name",
      ({
         overrides,
         expectedStatus,
         expectedRuleStates,
       }) => {
        const facts = createEligibleFacts(overrides);

        const result = evaluateProgramEligibility(
            "BWE",
            bweRules,
            facts
        );

        expect(result.status).toBe(expectedStatus);

        for (const [ruleId, expectedState] of Object.entries(
            expectedRuleStates
        )) {
          const ruleResult = result.ruleResults.find(
              (rule) => rule.ruleId === ruleId
          );

          expect(ruleResult).toBeDefined();

          expect(ruleResult?.matched).toBe(expectedState);
        }

        const expectedMatchedRuleIds = Object.entries(
            expectedRuleStates
        )
            .filter(([, matched]) => matched === true)
            .map(([ruleId]) => ruleId);

        expect(result.matchedRuleIds).toEqual(
            expectedMatchedRuleIds
        );

        expect(result.ruleResults).toHaveLength(3);
      }
  );
});
