import { describe, expect, test } from "@jest/globals";
import { adaptJkmEligibilityResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type { EligibilityFacts, EligibilityStatus } from "../../src/types/eligibility";
import { bptApiResponse } from "../fixtures/bptApiResponse";

type RuleMatchState = boolean | null;

interface BptTestCase {
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

const testCases: BptTestCase[] = [
  {
    id: "BPT-TC-001",
    name: "Caregiver Preliminary Match",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      applicantIsCaregiver: true,
      applicantIsPatient: false,

      patientIsBedridden: true,
      patientIsOku: true,
      patientHasChronicIllness: false,

      caregiverProvidesIntensiveCare: true,
      monthlyHouseholdIncome: 3000,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": null,
      "BPT-004": null,
      "BPT-005": false,
    },
  },
  {
    id: "BPT-TC-002",
    name: "Non-Bedridden Chronic Patient Preliminary Match",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      applicantIsPatient: true,
      applicantIsCaregiver: false,

      patientIsBedridden: false,
      patientHasChronicIllness: true,
      patientRequiresContinuousTreatment: true,
      patientContinuousTreatmentMonths: 4,

      monthlyHouseholdIncome: 4000,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": true,
      "BPT-003": false,
      "BPT-004": null,
      "BPT-005": false,
    },
  },
  {
    id: "BPT-TC-003",
    name: "Bedridden Patient Without Caregiver",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      applicantIsPatient: true,
      applicantIsCaregiver: false,

      patientCitizenship: "Malaysian",
      patientResidenceCountry: "Malaysia",
      patientIsBedridden: true,
      patientIsOku: true,
      patientHasChronicIllness: false,

      hasCaregiver: false,
      monthlyHouseholdIncome: 2500,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": false,
      "BPT-003": true,
      "BPT-004": null,
      "BPT-005": false,
    },
  },
  {
    id: "BPT-TC-004",
    name: "Further Assessment Required",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      applicantIsCaregiver: true,
      applicantIsPatient: false,

      patientIsBedridden: true,
      patientIsOku: true,
      patientHasChronicIllness: false,

      caregiverProvidesIntensiveCare: true,
      monthlyHouseholdIncome: 3000,

      bptMedicalOrCaregiverReviewRequired: true,
    },

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": null,
      "BPT-004": true,
      "BPT-005": false,
    },
  },
  {
    id: "BPT-TC-005",
    name: "No Preliminary Match",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      applicantIsCaregiver: false,
      applicantIsPatient: false,

      patientCitizenship: "Malaysian",
      patientResidenceCountry: "Malaysia",
      patientIsBedridden: false,
      patientIsOku: false,
      patientHasChronicIllness: false,

      caregiverProvidesIntensiveCare: false,
      hasCaregiver: true,
      caregiverCitizenship: "Malaysian",

      monthlyHouseholdIncome: 6000,
    },

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": true,
    },
  },
  {
    id: "BPT-TC-006",
    name: "Insufficient Patient Information",

    facts: {
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      applicantIsPatient: true,
      applicantIsCaregiver: false,

      patientIsBedridden: null,
      patientHasChronicIllness: null,
      patientRequiresContinuousTreatment: null,
      patientContinuousTreatmentMonths: null,

      monthlyHouseholdIncome: 3000,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": null,
      "BPT-003": null,
      "BPT-004": null,
      "BPT-005": null,
    },
  },
];

const bptRules = adaptJkmEligibilityResponse(
    bptApiResponse,
    "BPT"
);

describe("BantuanKu - BPT Eligibility Engine", () => {
  test.each(testCases)(
      "$id - $name",
      ({
         facts,
         expectedStatus,
         expectedRuleStates,
       }) => {
        const result = evaluateProgramEligibility(
            "BPT",
            bptRules,
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

        expect(result.ruleResults).toHaveLength(5);
      }
  );
});
