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

interface BatTestCase {
  id: string;
  name: string;
  facts: Partial<EligibilityFacts>;
  thresholds?: EligibilityThresholds;
  expectedStatus: EligibilityStatus;
  expectedRuleStates: Record<string, RuleMatchState>;
}

function createTestFacts(
    overrides: Partial<EligibilityFacts> = {}
): EligibilityFacts {
  return {
    age: null,
    ageByBirthYear: null,
    citizenship: null,
    residenceCountry: null,
    state: null,
    maritalStatus: null,

    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: null,
    householdSize: null,
    perCapitaHouseholdIncome: null,

    numberOfDependents: null,
    numberOfEligibleChildren: null,
    hasChildren: null,
    hasEligibleChildren: null,
    isFullTimeStudent: null,
    isFullTimeIptaIptsStudent: null,

    receivesJkmMonthlyAssistance: null,
    isJkmTargetGroup: null,

    isOku: null,
    okuRegistered: null,
    hasChronicIllness: null,
    isBedridden: null,
    requiresContinuousTreatment: null,
    continuousTreatmentMonths: null,

    residesInJkmInstitution: null,
    residesInExcludedCareCentre: null,
    residesInExcludedInstitution: null,
    livesWithFamilyOrCaregiver: null,
    dependsOnFamilyOrCaregiver: null,
    familyOrCaregiverIncomeExceedsPgk: null,

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

    hasMedicalOrJkmRecommendation: null,
    requestedAssistiveEquipment: null,
    estimatedEquipmentCost: null,
    hasHospitalReferral: null,

    socioeconomicAssessmentRequired: null,
    medicalAssessmentRequired: null,

    baAdditionalCircumstancesRequireReview: null,
    batRecommendationOrEquipmentRequiresReview: null,
    batSpecialConsiderationRequested: null,
    bptMedicalOrCaregiverReviewRequired: null,

    ...overrides,
  };
}

// Test-only PGK values, not official JKM thresholds.
const testThresholds: EligibilityThresholds = {
  BAT_POOR_HOUSEHOLD_PGK: 2500,
  BAT_POOR_PER_CAPITA_PGK: 600,
};

const batRules = adaptJkmEligibilityResponse(
    batApiResponse,
    "BAT"
);

const testCases: BatTestCase[] = [
  {
    id: "BAT-TC-001",
    name: "Applicant Meets Standard BAT Requirements",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: false,
      batSpecialConsiderationRequested: false,
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
    id: "BAT-TC-002",
    name: "Applicant Qualifies Through Per-Capita Income",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 500,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: false,
      batSpecialConsiderationRequested: false,
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
    id: "BAT-TC-003",
    name: "Applicant Exceeds Both PGK Thresholds",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: false,
      batSpecialConsiderationRequested: false,
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
    id: "BAT-TC-004",
    name: "Applicant Requires Recommendation or Equipment Review",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: true,
      batSpecialConsiderationRequested: false,
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
    id: "BAT-TC-005",
    name: "Equipment Cost Requires Further Approval",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 15000,
      batRecommendationOrEquipmentRequiresReview: false,
      batSpecialConsiderationRequested: false,
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
    id: "BAT-TC-006",
    name: "Applicant Requires Special Consideration",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 3000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: false,
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
    id: "BAT-TC-007",
    name: "PGK Thresholds Are Missing",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: false,
      batSpecialConsiderationRequested: false,
    },

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
    id: "BAT-TC-008",
    name: "Applicant Is Not Malaysian",

    facts: {
      citizenship: "Non-Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: false,
      batSpecialConsiderationRequested: false,
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
    id: "BAT-TC-009",
    name: "Medical or JKM Recommendation Is Missing",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: true,
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: null,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: false,
      batSpecialConsiderationRequested: false,
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
    id: "BAT-TC-010",
    name: "Applicant Is Not in JKM Target Group",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      isJkmTargetGroup: false,
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 700,
      hasMedicalOrJkmRecommendation: true,
      estimatedEquipmentCost: 5000,
      batRecommendationOrEquipmentRequiresReview: false,
      batSpecialConsiderationRequested: false,
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
];

// Automated eligibility tests
describe("BantuanKu - BAT Eligibility Testing", () => {
  test.each(testCases)(
      "$id - $name",
      ({
         facts,
         thresholds,
         expectedStatus,
         expectedRuleStates,
       }) => {
        const result = evaluateProgramEligibility(
            "BAT",
            batRules,
            createTestFacts(facts),
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
