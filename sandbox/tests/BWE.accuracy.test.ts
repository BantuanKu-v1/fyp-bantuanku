import { describe, expect, test } from "@jest/globals";
import { adaptJkmEligibilityResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type { EligibilityFacts, EligibilityStatus } from "../../src/types/eligibility";
import type { EligibilityThresholds } from "../../src/utils/eligibility/eligibilityConditions";
import { bweApiResponse } from "../fixtures/bweApiResponse";

function createFacts(
    overrides: Partial<EligibilityFacts> = {}
): EligibilityFacts {
  return {
    age: 65,
    ageByBirthYear: 65,
    citizenship: "Malaysian",
    residenceCountry: "Malaysia",
    state: null,
    maritalStatus: null,
    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: 1000,
    householdSize: 2,
    perCapitaHouseholdIncome: 500,
    numberOfDependents: null,
    numberOfEligibleChildren: null,
    hasChildren: true,
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
    residesInExcludedInstitution: false,
    livesWithFamilyOrCaregiver: null,
    dependsOnFamilyOrCaregiver: false,
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

function evaluate(
    facts: EligibilityFacts,
    thresholds: EligibilityThresholds = {}
) {
  const rules = adaptJkmEligibilityResponse(
      structuredClone(bweApiResponse),
      "BWE"
  );

  return evaluateProgramEligibility(
      "BWE",
      rules,
      facts,
      thresholds
  );
}

function expectRule(
    result: ReturnType<typeof evaluate>,
    ruleId: string,
    matched: boolean | null
): void {
  const rule = result.ruleResults.find((item) => item.ruleId === ruleId);
  expect(rule).toBeDefined();
  expect(rule?.matched).toBe(matched);
}

function expectStatusAndRules(
    result: ReturnType<typeof evaluate>,
    status: EligibilityStatus,
    matchedRuleIds: string[]
) {
  expect(result.status).toBe(status);
  expect(result.matchedRuleIds).toEqual(matchedRuleIds);
}

describe("BWE Eligibility Accuracy Validation", () => {
  test("ACC-001 - All standard requirements satisfied", () => {
    const result = evaluate(createFacts());
    expectStatusAndRules(result, "potentially_eligible", ["BWE-001"]);
    expectRule(result, "BWE-001", true);
    expectRule(result, "BWE-002", false);
    expectRule(result, "BWE-003", false);
  });

  test("ACC-002 - Applicant age 59", () => {
    const result = evaluate(createFacts({ ageByBirthYear: 59, age: 59 }));
    expectStatusAndRules(result, "potentially_ineligible", ["BWE-003"]);
    expectRule(result, "BWE-001", false);
    expectRule(result, "BWE-002", false);
    expectRule(result, "BWE-003", true);
  });

  test("ACC-003 - Applicant age exactly 60", () => {
    const result = evaluate(createFacts({ ageByBirthYear: 60, age: 60 }));
    expectStatusAndRules(result, "potentially_eligible", ["BWE-001"]);
    expectRule(result, "BWE-001", true);
  });

  test("ACC-004 - Applicant is not Malaysian", () => {
    const result = evaluate(createFacts({ citizenship: "Non-Malaysian" }));
    expectStatusAndRules(result, "potentially_ineligible", ["BWE-003"]);
    expectRule(result, "BWE-001", false);
  });

  test("ACC-005 - Applicant resides outside Malaysia", () => {
    const result = evaluate(createFacts({ residenceCountry: "Singapore" }));
    expectStatusAndRules(result, "potentially_ineligible", ["BWE-003"]);
    expectRule(result, "BWE-001", false);
  });

  test("ACC-006 - Household income exactly RM1,236", () => {
    const result = evaluate(
        createFacts({
          monthlyHouseholdIncome: 1236,
          perCapitaHouseholdIncome: 500,
        })
    );
    expectStatusAndRules(result, "potentially_eligible", ["BWE-001"]);
    expectRule(result, "BWE-001", true);
  });

  test("ACC-007 - Per-capita household income exactly RM348", () => {
    const result = evaluate(
        createFacts({
          monthlyHouseholdIncome: 1500,
          perCapitaHouseholdIncome: 348,
        })
    );
    expectStatusAndRules(result, "potentially_eligible", ["BWE-001"]);
    expectRule(result, "BWE-001", true);
  });

  test("ACC-008 - Both income values exceed thresholds", () => {
    const result = evaluate(
        createFacts({
          monthlyHouseholdIncome: 1500,
          perCapitaHouseholdIncome: 500,
        })
    );
    expectStatusAndRules(result, "potentially_ineligible", ["BWE-003"]);
    expectRule(result, "BWE-001", false);
    expectRule(result, "BWE-003", true);
  });

  test("ACC-009 - Applicant resides in an excluded institution", () => {
    const result = evaluate(
        createFacts({
          residesInExcludedInstitution: true,
        })
    );
    expectStatusAndRules(result, "potentially_ineligible", ["BWE-003"]);
    expectRule(result, "BWE-001", false);
  });

  test("ACC-010 - Missing required information", () => {
    const result = evaluate(
        createFacts({
          monthlyHouseholdIncome: null,
          perCapitaHouseholdIncome: null,
        })
    );
    expectStatusAndRules(result, "insufficient_information", []);
    expectRule(result, "BWE-001", null);
    expectRule(result, "BWE-003", null);
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });

  test("ACC-011 - Alternative pathway satisfied", () => {
    const result = evaluate(
        createFacts({
          monthlyHouseholdIncome: 2000,
          perCapitaHouseholdIncome: 1000,
          hasChildren: false,
          dependsOnFamilyOrCaregiver: true,
          familyOrCaregiverIncomeExceedsPgk: true,
        })
    );
    expectStatusAndRules(result, "manual_verification", ["BWE-002"]);
    expectRule(result, "BWE-001", false);
    expectRule(result, "BWE-002", true);
    expectRule(result, "BWE-003", false);
    expect(result.manualVerification.length).toBeGreaterThan(0);
  });

  test("ACC-012 - Alternative pathway incomplete information", () => {
    const result = evaluate(
        createFacts({
          monthlyHouseholdIncome: 2000,
          perCapitaHouseholdIncome: 1000,
          hasChildren: false,
          dependsOnFamilyOrCaregiver: true,
          familyOrCaregiverIncomeExceedsPgk: null,
        })
    );
    expectStatusAndRules(result, "insufficient_information", []);
    expectRule(result, "BWE-001", false);
    expectRule(result, "BWE-002", null);
    expectRule(result, "BWE-003", null);
  });

  test("ACC-013 - Dynamic threshold boundaries and missing threshold", () => {
    const thresholdRulesResponse = structuredClone(bweApiResponse);

    thresholdRulesResponse.data.criteria.rules[0].conditions = {
      all: [
        {
          field: "applicant.citizenship",
          operator: "eq",
          value: "Malaysian",
        },
        {
          field: "household.monthlyIncome",
          operator: "lte",
          value: { thresholdRef: "householdIncomeLimit" },
        },
      ],
    };

    const rules = adaptJkmEligibilityResponse(thresholdRulesResponse, "BWE");
    const facts = createFacts({ monthlyHouseholdIncome: 1236 });

    const boundaryResult = evaluateProgramEligibility("BWE", rules, facts, {
      householdIncomeLimit: 1236,
    });
    expect(boundaryResult.status).toBe("potentially_eligible");

    const missingThresholdResult = evaluateProgramEligibility("BWE", rules, facts, {});
    expectRule(missingThresholdResult, "BWE-001", null);

    const invalidThresholdResult = evaluateProgramEligibility("BWE", rules, facts, {
      householdIncomeLimit: Number.NaN,
    });
    expectRule(invalidThresholdResult, "BWE-001", null);
  });
});