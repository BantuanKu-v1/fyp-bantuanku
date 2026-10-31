import { describe, expect, test } from "@jest/globals";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type {
  EligibilityFacts,
  EligibilityStatus,
} from "../../src/types/eligibility";

import { baRules } from "../fixtures/baRules";

type RuleMatchState = boolean | null;

interface BaTestCase {
  id: string;
  name: string;
  facts: Partial<EligibilityFacts>;
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

const testCases: BaTestCase[] = [
  {
    id: "BA-TC-001",
    name: "Preliminary Match",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      state: "Kuala Lumpur",

      monthlyHouseholdIncome: 1000,
      perCapitaHouseholdIncome: 500,

      receivesJkmMonthlyAssistance: false,
      baAdditionalCircumstancesRequireReview: false,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },
  {
    id: "BA-TC-002",
    name: "No Preliminary Match",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      state: "Selangor",

      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 1000,

      receivesJkmMonthlyAssistance: false,
      baAdditionalCircumstancesRequireReview: false,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": false,
      "BA-003": true,
    },
  },
  {
    id: "BA-TC-003",
    name: "Insufficient Information",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      state: "Kuala Lumpur",

      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,

      receivesJkmMonthlyAssistance: null,
      baAdditionalCircumstancesRequireReview: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": null,
      "BA-003": null,
    },
  },
  {
    id: "BA-TC-004",
    name: "Manual Verification",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      state: "Kuala Lumpur",

      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 1000,

      receivesJkmMonthlyAssistance: false,
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
    id: "BA-TC-005",
    name: "Unknown Rule Dependencies",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      state: "Kuala Lumpur",

      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,

      receivesJkmMonthlyAssistance: null,
      baAdditionalCircumstancesRequireReview: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": null,
      "BA-003": null,
    },
  },
  {
    id: "BA-TC-006",
    name: "Per-Capita Income Qualification",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      state: "Putrajaya",

      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 300,

      receivesJkmMonthlyAssistance: false,
      baAdditionalCircumstancesRequireReview: false,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BA-001": true,
      "BA-002": false,
      "BA-003": false,
    },
  },
  {
    id: "BA-TC-007",
    name: "Existing JKM Monthly Assistance",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      state: "Labuan",

      monthlyHouseholdIncome: 900,
      perCapitaHouseholdIncome: 300,

      receivesJkmMonthlyAssistance: true,
      baAdditionalCircumstancesRequireReview: false,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BA-001": false,
      "BA-002": false,
      "BA-003": true,
    },
  },
  {
    id: "BA-TC-008",
    name: "Unknown Existing Assistance Status",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      state: "Kuala Lumpur",

      monthlyHouseholdIncome: 900,
      perCapitaHouseholdIncome: 300,

      receivesJkmMonthlyAssistance: null,
      baAdditionalCircumstancesRequireReview: false,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BA-001": null,
      "BA-002": false,
      "BA-003": null,
    },
  },
];

describe("BantuanKu - BA Eligibility Engine", () => {
  test.each(testCases)(
      "$id - $name",
      ({
         facts,
         expectedStatus,
         expectedRuleStates,
       }) => {
        const result = evaluateProgramEligibility(
            "BA",
            baRules,
            createTestFacts(facts)
        );

        expect(result.status).toBe(expectedStatus);

        for (const [ruleId, expected] of Object.entries(
            expectedRuleStates
        )) {
          const ruleResult = result.ruleResults.find(
              (rule) => rule.ruleId === ruleId
          );

          expect(ruleResult).toBeDefined();
          expect(ruleResult?.matched).toBe(expected);
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
