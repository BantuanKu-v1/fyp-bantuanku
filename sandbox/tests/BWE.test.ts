import { describe, expect, test } from "@jest/globals";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type { EligibilityFacts, EligibilityStatus } from "../../src/types/eligibility";
import { bweRules } from "../fixtures/bweRules";

type RuleMatchState = boolean | null;

interface BweTestCase {
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

const testCases: BweTestCase[] = [
  {
    id: "BWE-TC-001",
    name: "Preliminary Match",

    facts: {
      age: 65,
      ageByBirthYear: 65,
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      monthlyHouseholdIncome: 1000,
      perCapitaHouseholdIncome: 500,
      residesInExcludedInstitution: false,
      hasChildren: true,
      dependsOnFamilyOrCaregiver: false,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-TC-002",
    name: "No Preliminary Match",

    facts: {
      age: 45,
      ageByBirthYear: 45,
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },
  },

  {
    id: "BWE-TC-003",
    name: "Insufficient Information",

    facts: {
      age: 65,
      ageByBirthYear: 65,
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": null,
      "BWE-003": null,
    },
  },

  {
    id: "BWE-TC-004",
    name: "Manual Verification",

    facts: {
      age: 65,
      ageByBirthYear: 65,
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",

      hasChildren: false,
      dependsOnFamilyOrCaregiver: true,
      familyOrCaregiverIncomeExceedsPgk: true,
      residesInExcludedInstitution: false,

      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 1000,
    },

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": true,
      "BWE-003": false,
    },
  },

  {
    id: "BWE-TC-005",
    name: "Unknown Rule Dependencies",

    facts: {
      age: 65,
      ageByBirthYear: 65,
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",

      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,
      hasChildren: null,
      dependsOnFamilyOrCaregiver: null,
      familyOrCaregiverIncomeExceedsPgk: null,
      residesInExcludedInstitution: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": null,
      "BWE-003": null,
    },
  },
];

describe("BantuanKu - BWE Eligibility Engine", () => {
  test.each(testCases)(
      "$id - $name",
      ({
         facts,
         expectedStatus,
         expectedRuleStates,
       }) => {
        const result = evaluateProgramEligibility(
            "BWE",
            bweRules,
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
