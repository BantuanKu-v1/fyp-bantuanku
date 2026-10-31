import { describe, expect, test } from "@jest/globals";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type {
  EligibilityFacts,
  EligibilityStatus,
} from "../../src/types/eligibility";
import { baRules } from "../fixtures/baRules";

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
    age: null,
    ageByBirthYear: null,
    citizenship: "Malaysian",
    residenceCountry: "Malaysia",
    state: "Kuala Lumpur",
    maritalStatus: null,

    // Financial information
    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: 1000,
    householdSize: 2,
    perCapitaHouseholdIncome: 500,

    // Household information
    numberOfDependents: null,
    numberOfEligibleChildren: null,
    hasChildren: null,
    hasEligibleChildren: null,
    isFullTimeStudent: null,

    // Welfare assistance information
    receivesJkmMonthlyAssistance: false,
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
    residesInExcludedInstitution: null,
    livesWithFamilyOrCaregiver: null,
    dependsOnFamilyOrCaregiver: null,
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
    baAdditionalCircumstancesRequireReview: false,
    batRecommendationOrEquipmentRequiresReview: null,
    batSpecialConsiderationRequested: null,
    bptMedicalOrCaregiverReviewRequired: null,

    ...overrides,
  };
}

const boundaryTestCases: BoundaryTestCase[] = [
  // Per-capita income is above RM348 to isolate this condition.
  {
    id: "BA-BT-001",
    name: "Household Income RM1,235",

    overrides: {
      monthlyHouseholdIncome: 1235,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-002",
    name: "Household Income RM1,236 - Exact Limit",

    overrides: {
      monthlyHouseholdIncome: 1236,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-003",
    name: "Household Income RM1,237 - Above Limit",

    overrides: {
      monthlyHouseholdIncome: 1237,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": false,
      "BA-003": true,
    },
  },

  // Household income is above RM1,236 to isolate this condition.
  {
    id: "BA-BT-004",
    name: "Per-Capita Income RM347",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 347,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-005",
    name: "Per-Capita Income RM348 - Exact Limit",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 348,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-006",
    name: "Per-Capita Income RM349 - Above Limit",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 349,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": false,
      "BA-003": true,
    },
  },
  // Citizenship
  {
    id: "BA-BT-007",
    name: "Malaysian Applicant",

    overrides: {
      citizenship: "Malaysian",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-008",
    name: "Non-Malaysian Applicant",

    overrides: {
      citizenship: "Non-Malaysian",
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": false,
      "BA-003": true,
    },
  },

  {
    id: "BA-BT-009",
    name: "Unknown Citizenship",

    overrides: {
      citizenship: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": false,
      "BA-003": null,
    },
  },
  // Residence state
  {
    id: "BA-BT-010",
    name: "Residence in Kuala Lumpur",

    overrides: {
      state: "Kuala Lumpur",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-011",
    name: "Residence in Putrajaya",

    overrides: {
      state: "Putrajaya",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-012",
    name: "Residence in Labuan",

    overrides: {
      state: "Labuan",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-013",
    name: "Residence Outside Eligible Territories",

    overrides: {
      state: "Selangor",
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": false,
      "BA-003": true,
    },
  },

  {
    id: "BA-BT-014",
    name: "Unknown Residence State",

    overrides: {
      state: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": false,
      "BA-003": null,
    },
  },
  // Existing JKM monthly assistance
  {
    id: "BA-BT-015",
    name: "Applicant Does Not Receive JKM Monthly Assistance",

    overrides: {
      receivesJkmMonthlyAssistance: false,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-016",
    name: "Applicant Receives JKM Monthly Assistance",

    overrides: {
      receivesJkmMonthlyAssistance: true,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": false,
      "BA-003": true,
    },
  },

  {
    id: "BA-BT-017",
    name: "Unknown JKM Monthly Assistance Status",

    overrides: {
      receivesJkmMonthlyAssistance: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": false,
      "BA-003": null,
    },
  },
  // Income OR logic
  {
    id: "BA-BT-018",
    name: "Low Household Income, High Per-Capita Income",

    overrides: {
      monthlyHouseholdIncome: 1000,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-019",
    name: "High Household Income, Low Per-Capita Income",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 300,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-020",
    name: "Both Income Conditions Fail",

    overrides: {
      monthlyHouseholdIncome: 1500,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": false,
      "BA-003": true,
    },
  },
  // Missing information
  {
    id: "BA-BT-021",
    name: "Household Income Missing, Per-Capita Qualifies",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: 300,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-022",
    name: "Household Income Missing, Per-Capita Fails",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": false,
      "BA-003": null,
    },
  },

  {
    id: "BA-BT-023",
    name: "Both Income Values Missing",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": false,
      "BA-003": null,
    },
  },
  // Manual verification
  {
    id: "BA-BT-024",
    name: "Additional Circumstances Require Review",

    overrides: {
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 1000,
      baAdditionalCircumstancesRequireReview: true,
    },

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": true,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-025",
    name: "Additional Circumstances Status Unknown",

    overrides: {
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 1000,
      baAdditionalCircumstancesRequireReview: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": null,
      "BA-003": null,
    },
  },
  // Rule dependencies
  {
    id: "BA-BT-026",
    name: "BA-003 Must Be False When BA-001 Matches",

    overrides: {
      monthlyHouseholdIncome: 1000,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },

  {
    id: "BA-BT-027",
    name: "BA-003 Must Remain Unknown When BA-001 Is Unknown",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": false,
      "BA-003": null,
    },
  },
];

// Automated boundary tests
describe("BantuanKu - BA Boundary Testing", () => {
  test.each(boundaryTestCases)(
      "$id - $name",
      ({
         overrides,
         expectedStatus,
         expectedRuleStates,
       }) => {
        const facts = createEligibleFacts(overrides);

        const result = evaluateProgramEligibility(
            "BA",
            baRules,
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
