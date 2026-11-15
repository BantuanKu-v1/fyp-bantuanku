import { describe, expect, test } from "@jest/globals";
import { adaptJkmEligibilityResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type {
  EligibilityFacts,
  EligibilityStatus,
} from "../../src/types/eligibility";
import { bptApiResponse } from "../fixtures/bptApiResponse";

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
    state: null,
    maritalStatus: null,

    // Financial information
    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: 3000,
    householdSize: null,
    perCapitaHouseholdIncome: null,

    // Household information
    numberOfDependents: null,
    numberOfEligibleChildren: null,
    hasChildren: null,
    hasEligibleChildren: null,
    isFullTimeStudent: null,
    isFullTimeIptaIptsStudent: null,

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
    residesInExcludedInstitution: null,
    livesWithFamilyOrCaregiver: null,
    dependsOnFamilyOrCaregiver: null,
    familyOrCaregiverIncomeExceedsPgk: null,

    // Caregiver and patient information
    applicantIsPatient: false,
    applicantIsCaregiver: true,
    patientCitizenship: "Malaysian",
    patientResidenceCountry: "Malaysia",
    patientIsOku: true,
    patientHasChronicIllness: false,
    patientIsBedridden: true,
    patientRequiresContinuousTreatment: false,
    patientContinuousTreatmentMonths: 0,
    hasCaregiver: true,
    caregiverCitizenship: "Malaysian",
    caregiverProvidesIntensiveCare: true,

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
    bptMedicalOrCaregiverReviewRequired: false,

    ...overrides,
  };
}

const boundaryTestCases: BoundaryTestCase[] = [
  // Household income boundary
  {
    id: "BPT-BT-001",
    name: "Household Income RM4,999",

    overrides: {
      monthlyHouseholdIncome: 4999,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-002",
    name: "Household Income RM5,000 - Exact Limit",

    overrides: {
      monthlyHouseholdIncome: 5000,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-003",
    name: "Household Income RM5,001 - Above Limit",

    overrides: {
      monthlyHouseholdIncome: 5001,
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

  // Applicant citizenship
  {
    id: "BPT-BT-004",
    name: "Malaysian Caregiver Applicant",

    overrides: {
      citizenship: "Malaysian",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-005",
    name: "Non-Malaysian Caregiver Applicant",

    overrides: {
      citizenship: "Non-Malaysian",
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
    id: "BPT-BT-006",
    name: "Unknown Applicant Citizenship",

    overrides: {
      citizenship: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": null,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  // Applicant residence
  {
    id: "BPT-BT-007",
    name: "Applicant Resides in Malaysia",

    overrides: {
      residenceCountry: "Malaysia",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-008",
    name: "Applicant Resides Outside Malaysia",

    overrides: {
      residenceCountry: "Singapore",
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
    id: "BPT-BT-009",
    name: "Unknown Applicant Residence",

    overrides: {
      residenceCountry: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": null,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  // Caregiver pathway
  {
    id: "BPT-BT-010",
    name: "Applicant Is a Caregiver",

    overrides: {
      applicantIsCaregiver: true,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-011",
    name: "Applicant Is Not a Caregiver",

    overrides: {
      applicantIsCaregiver: false,
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
    id: "BPT-BT-012",
    name: "Unknown Caregiver Role",

    overrides: {
      applicantIsCaregiver: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": null,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  // Bedridden patient condition
  {
    id: "BPT-BT-013",
    name: "Patient Is Bedridden",

    overrides: {
      patientIsBedridden: true,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-014",
    name: "Patient Is Not Bedridden",

    overrides: {
      patientIsBedridden: false,
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
    id: "BPT-BT-015",
    name: "Unknown Bedridden Status",

    overrides: {
      patientIsBedridden: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": null,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  // Patient condition OR logic
  {
    id: "BPT-BT-016",
    name: "Patient Has OKU Status Only",

    overrides: {
      patientIsOku: true,
      patientHasChronicIllness: false,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-017",
    name: "Patient Has Chronic Illness Only",

    overrides: {
      patientIsOku: false,
      patientHasChronicIllness: true,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-018",
    name: "Patient Has Neither OKU Nor Chronic Illness",

    overrides: {
      patientIsOku: false,
      patientHasChronicIllness: false,
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
    id: "BPT-BT-019",
    name: "Unknown Patient Medical Condition",

    overrides: {
      patientIsOku: null,
      patientHasChronicIllness: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": null,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  // Intensive caregiving
  {
    id: "BPT-BT-020",
    name: "Caregiver Provides Intensive Care",

    overrides: {
      caregiverProvidesIntensiveCare: true,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-021",
    name: "Caregiver Does Not Provide Intensive Care",

    overrides: {
      caregiverProvidesIntensiveCare: false,
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
    id: "BPT-BT-022",
    name: "Unknown Intensive Care Status",

    overrides: {
      caregiverProvidesIntensiveCare: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": null,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  // Non-bedridden chronic patient pathway
  {
    id: "BPT-BT-023",
    name: "Continuous Treatment for 2 Months",

    overrides: {
      applicantIsPatient: true,
      applicantIsCaregiver: false,
      patientIsBedridden: false,
      patientHasChronicIllness: true,
      patientRequiresContinuousTreatment: true,
      patientContinuousTreatmentMonths: 2,
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
    id: "BPT-BT-024",
    name: "Continuous Treatment for 3 Months - Exact Minimum",

    overrides: {
      applicantIsPatient: true,
      applicantIsCaregiver: false,
      patientIsBedridden: false,
      patientHasChronicIllness: true,
      patientRequiresContinuousTreatment: true,
      patientContinuousTreatmentMonths: 3,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": true,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-025",
    name: "Continuous Treatment for 4 Months",

    overrides: {
      applicantIsPatient: true,
      applicantIsCaregiver: false,
      patientIsBedridden: false,
      patientHasChronicIllness: true,
      patientRequiresContinuousTreatment: true,
      patientContinuousTreatmentMonths: 4,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": true,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-026",
    name: "Unknown Continuous Treatment Duration",

    overrides: {
      applicantIsPatient: true,
      applicantIsCaregiver: false,
      patientIsBedridden: false,
      patientHasChronicIllness: true,
      patientRequiresContinuousTreatment: true,
      patientContinuousTreatmentMonths: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": null,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  {
    id: "BPT-BT-027",
    name: "Patient Does Not Require Continuous Treatment",

    overrides: {
      applicantIsPatient: true,
      applicantIsCaregiver: false,
      patientIsBedridden: false,
      patientHasChronicIllness: true,
      patientRequiresContinuousTreatment: false,
      patientContinuousTreatmentMonths: 3,
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

  // Patient without an eligible Malaysian caregiver
  {
    id: "BPT-BT-028",
    name: "Bedridden Patient Has No Caregiver",

    overrides: {
      applicantIsCaregiver: false,
      patientIsBedridden: true,
      hasCaregiver: false,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": false,
      "BPT-003": true,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-029",
    name: "Bedridden Patient Has Non-Malaysian Caregiver",

    overrides: {
      applicantIsCaregiver: false,
      patientIsBedridden: true,
      hasCaregiver: true,
      caregiverCitizenship: "Non-Malaysian",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": false,
      "BPT-003": true,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-030",
    name: "Bedridden Patient Has Malaysian Caregiver",

    overrides: {
      applicantIsCaregiver: false,
      patientIsBedridden: true,
      hasCaregiver: true,
      caregiverCitizenship: "Malaysian",
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
    id: "BPT-BT-031",
    name: "Unknown Caregiver Citizenship",

    overrides: {
      applicantIsCaregiver: false,
      patientIsBedridden: true,
      hasCaregiver: true,
      caregiverCitizenship: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": false,
      "BPT-003": null,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  // Patient citizenship and residence
  {
    id: "BPT-BT-032",
    name: "Patient Is Malaysian Without Caregiver",

    overrides: {
      applicantIsCaregiver: false,
      hasCaregiver: false,
      patientCitizenship: "Malaysian",
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": false,
      "BPT-002": false,
      "BPT-003": true,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-033",
    name: "Patient Is Non-Malaysian Without Caregiver",

    overrides: {
      applicantIsCaregiver: false,
      hasCaregiver: false,
      patientCitizenship: "Non-Malaysian",
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
    id: "BPT-BT-034",
    name: "Patient Resides Outside Malaysia",

    overrides: {
      applicantIsCaregiver: false,
      hasCaregiver: false,
      patientResidenceCountry: "Singapore",
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

  // Missing information
  {
    id: "BPT-BT-035",
    name: "Household Income Missing",

    overrides: {
      monthlyHouseholdIncome: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": null,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },

  // Manual verification
  {
    id: "BPT-BT-036",
    name: "Medical or Caregiver Review Required",

    overrides: {
      bptMedicalOrCaregiverReviewRequired: true,
    },

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": true,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-037",
    name: "Medical or Caregiver Review Status Unknown",

    overrides: {
      bptMedicalOrCaregiverReviewRequired: null,
    },

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": null,
      "BPT-005": false,
    },
  },

  // Rule dependencies
  {
    id: "BPT-BT-038",
    name: "BPT-005 Must Be False When BPT-001 Matches",

    overrides: {},

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BPT-001": true,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": false,
    },
  },

  {
    id: "BPT-BT-039",
    name: "BPT-005 Must Remain Unknown When BPT-001 Is Unknown",

    overrides: {
      applicantIsCaregiver: null,
    },

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BPT-001": null,
      "BPT-002": false,
      "BPT-003": false,
      "BPT-004": false,
      "BPT-005": null,
    },
  },
];

const bptRules = adaptJkmEligibilityResponse(
    bptApiResponse,
    "BPT"
);

// Automated boundary tests
describe("BantuanKu - BPT Boundary Testing", () => {
  test.each(boundaryTestCases)(
      "$id - $name",
      ({
         overrides,
         expectedStatus,
         expectedRuleStates,
       }) => {
        const facts = createEligibleFacts(overrides);

        const result = evaluateProgramEligibility(
            "BPT",
            bptRules,
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

        expect(result.ruleResults).toHaveLength(5);
      }
  );
});
