import { describe, expect, test } from "@jest/globals";
import { adaptJkmEligibilityResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type {
  EligibilityFacts,
  EligibilityStatus,
} from "../../src/types/eligibility";
import type { EligibilityThresholds } from "../../src/utils/eligibility/eligibilityThresholds";
import { batApiResponse } from "../fixtures/batApiResponse";

type RuleMatchState = boolean | null;

interface BoundaryTestCase {
  id: string;
  name: string;
  overrides: Partial<EligibilityFacts>;
  thresholds?: EligibilityThresholds;
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
    state: null,
    maritalStatus: null,

    // Financial information
    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: 2000,
    householdSize: 2,
    perCapitaHouseholdIncome: 700,

    // Household information
    numberOfDependents: null,
    numberOfEligibleChildren: null,
    hasChildren: null,
    hasEligibleChildren: null,
    isFullTimeStudent: null,
    isFullTimeIptaIptsStudent: null,

    // Welfare assistance information
    receivesJkmMonthlyAssistance: null,
    isJkmTargetGroup: true,

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
    hasMedicalOrJkmRecommendation: true,
    requestedAssistiveEquipment: null,
    estimatedEquipmentCost: 5000,
    hasHospitalReferral: null,

    // External verification information
    socioeconomicAssessmentRequired: null,
    medicalAssessmentRequired: null,

    // JKM-specific assessment information
    baAdditionalCircumstancesRequireReview: null,
    batRecommendationOrEquipmentRequiresReview: false,
    batSpecialConsiderationRequested: false,
    bptMedicalOrCaregiverReviewRequired: null,

    ...overrides,
  };
}

// Synthetic PGK thresholds for testing only.
const testThresholds: EligibilityThresholds = {
  BAT_POOR_HOUSEHOLD_PGK: 2500,
  BAT_POOR_PER_CAPITA_PGK: 600,
};

const batRules = adaptJkmEligibilityResponse(
    batApiResponse,
    "BAT"
);

const boundaryTestCases: BoundaryTestCase[] = [
  // Household income boundary
  // Per-capita income exceeds RM600 to isolate household income.
  {
    id: "BAT-BT-001",
    name: "Household Income RM2,499",

    overrides: {
      monthlyHouseholdIncome: 2499,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-002",
    name: "Household Income RM2,500 - Exact Limit",

    overrides: {
      monthlyHouseholdIncome: 2500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-003",
    name: "Household Income RM2,501 - Above Limit",

    overrides: {
      monthlyHouseholdIncome: 2501,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": true,
    },
  },

  // Per-capita income boundary
  // Household income exceeds RM2,500 to isolate per-capita income.
  {
    id: "BAT-BT-004",
    name: "Per-Capita Income RM599",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 599,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-005",
    name: "Per-Capita Income RM600 - Exact Limit",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 600,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-006",
    name: "Per-Capita Income RM601 - Above Limit",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 601,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": true,
    },
  },

  // Income OR logic
  {
    id: "BAT-BT-007",
    name: "Low Household Income, High Per-Capita Income",

    overrides: {
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 700,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-008",
    name: "High Household Income, Low Per-Capita Income",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-009",
    name: "Both Income Conditions Fail",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 700,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": true,
    },
  },

  // Equipment cost boundary
  {
    id: "BAT-BT-010",
    name: "Equipment Cost RM10,000",

    overrides: {
      estimatedEquipmentCost: 10000,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-011",
    name: "Equipment Cost RM10,001 - Further Approval",

    overrides: {
      estimatedEquipmentCost: 10001,
    },

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": true,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-012",
    name: "Equipment Cost RM20,000 - Exact Upper Limit",

    overrides: {
      estimatedEquipmentCost: 20000,
    },

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": true,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-013",
    name: "Equipment Cost RM20,001 - Outside Further Approval Range",

    overrides: {
      estimatedEquipmentCost: 20001,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  // Citizenship
  {
    id: "BAT-BT-014",
    name: "Malaysian Applicant",

    overrides: {
      citizenship: "Malaysian",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-015",
    name: "Non-Malaysian Applicant",

    overrides: {
      citizenship: "Non-Malaysian",
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": true,
    },
  },

  {
    id: "BAT-BT-016",
    name: "Unknown Citizenship",

    overrides: {
      citizenship: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },

  // Residence
  {
    id: "BAT-BT-017",
    name: "Applicant Resides in Malaysia",

    overrides: {
      residenceCountry: "Malaysia",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-018",
    name: "Applicant Resides Outside Malaysia",

    overrides: {
      residenceCountry: "Singapore",
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": true,
    },
  },

  {
    id: "BAT-BT-019",
    name: "Unknown Residence Country",

    overrides: {
      residenceCountry: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },

  // JKM target group
  {
    id: "BAT-BT-020",
    name: "Applicant Belongs to JKM Target Group",

    overrides: {
      isJkmTargetGroup: true,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-021",
    name: "Applicant Does Not Belong to JKM Target Group",

    overrides: {
      isJkmTargetGroup: false,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": true,
    },
  },

  {
    id: "BAT-BT-022",
    name: "Unknown JKM Target Group Status",

    overrides: {
      isJkmTargetGroup: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },

  // Medical or JKM recommendation
  {
    id: "BAT-BT-023",
    name: "Applicant Has Medical or JKM Recommendation",

    overrides: {
      hasMedicalOrJkmRecommendation: true,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-024",
    name: "Applicant Does Not Have Recommendation",

    overrides: {
      hasMedicalOrJkmRecommendation: false,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": true,
    },
  },

  {
    id: "BAT-BT-025",
    name: "Unknown Recommendation Status",

    overrides: {
      hasMedicalOrJkmRecommendation: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },

  // Missing income information
  {
    id: "BAT-BT-026",
    name: "Household Income Missing, Per-Capita Qualifies",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: 500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-027",
    name: "Household Income Missing, Per-Capita Fails",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: 700,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },

  {
    id: "BAT-BT-028",
    name: "Both Income Values Missing",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },

  // Missing PGK thresholds
  {
    id: "BAT-BT-029",
    name: "Both PGK Thresholds Missing",

    overrides: {},

    thresholds: {},

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },

  {
    id: "BAT-BT-030",
    name: "Household PGK Missing, Per-Capita Qualifies",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 500,
    },

    thresholds: {
      BAT_POOR_PER_CAPITA_PGK: 600,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-031",
    name: "Household PGK Missing, Per-Capita Fails",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 700,
    },

    thresholds: {
      BAT_POOR_PER_CAPITA_PGK: 600,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },

  // Manual verification
  {
    id: "BAT-BT-032",
    name: "Recommendation or Equipment Review Required",

    overrides: {
      batRecommendationOrEquipmentRequiresReview: true,
    },

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": true,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-033",
    name: "Recommendation Review Status Unknown",

    overrides: {
      batRecommendationOrEquipmentRequiresReview: null,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": null,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  // Special consideration
  {
    id: "BAT-BT-034",
    name: "Applicant Requires Special Consideration",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 700,
      batSpecialConsiderationRequested: true,
    },

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": true,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-035",
    name: "Special Consideration Status Unknown",

    overrides: {
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 700,
      batSpecialConsiderationRequested: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": false,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": null,
      "BAT-005": null,
    },
  },

  // Rule dependencies
  {
    id: "BAT-BT-036",
    name: "BAT-005 Must Be False When BAT-001 Matches",

    overrides: {},

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BAT-001": true,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": false,
    },
  },

  {
    id: "BAT-BT-037",
    name: "BAT-005 Must Remain Unknown When BAT-001 Is Unknown",

    overrides: {
      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BAT-001": null,
      "BAT-002": false,
      "BAT-003": false,
      "BAT-004": false,
      "BAT-005": null,
    },
  },
];

// Automated boundary tests
describe("BantuanKu - BAT Boundary Testing", () => {
  test.each(boundaryTestCases)(
      "$id - $name",
      ({
         overrides,
         thresholds,
         expectedStatus,
         expectedRuleStates,
       }) => {
        const facts = createEligibleFacts(overrides);

        const result = evaluateProgramEligibility(
            "BAT",
            batRules,
            facts,
            thresholds ?? testThresholds
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

        expect(result.ruleResults).toHaveLength(5);
      }
  );
});
