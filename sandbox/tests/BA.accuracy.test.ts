import { describe, expect, test } from "@jest/globals";
import { adaptJkmEligibilityResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type {
  EligibilityFacts,
  EligibilityRule,
  EligibilityStatus,
} from "../../src/types/eligibility";

import type { EligibilityThresholds } from "../../src/utils/eligibility/eligibilityConditions";

import { baApiResponse } from "../fixtures/baApiResponse";

function createEligibleBaFacts(
    overrides: Partial<EligibilityFacts> = {}
): EligibilityFacts {
  return {
    age: null,
    ageByBirthYear: null,
    citizenship: "Malaysian",
    residenceCountry: "Malaysia",
    state: "Kuala Lumpur",
    maritalStatus: null,

    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: 1000,
    householdSize: 2,
    perCapitaHouseholdIncome: 500,

    numberOfDependents: null,
    numberOfEligibleChildren: null,
    hasChildren: null,
    hasEligibleChildren: null,
    isFullTimeStudent: null,

    receivesJkmMonthlyAssistance: false,
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

    baAdditionalCircumstancesRequireReview: false,
    batRecommendationOrEquipmentRequiresReview: null,
    batSpecialConsiderationRequested: null,
    bptMedicalOrCaregiverReviewRequired: null,

    ...overrides,
  };
}

function getBaRules(): EligibilityRule[] {
  return adaptJkmEligibilityResponse(
      structuredClone(baApiResponse),
      "BA"
  );
}

function evaluate(
    facts: EligibilityFacts,
    thresholds: EligibilityThresholds = {}
) {
  return evaluateProgramEligibility(
      "BA",
      getBaRules(),
      facts,
      thresholds
  );
}

type BaEvaluationResult = ReturnType<typeof evaluate>;

function expectRule(
    result: BaEvaluationResult,
    ruleId: string,
    matched: boolean | null
): void {
  const rule = result.ruleResults.find(
      (item) => item.ruleId === ruleId
  );

  expect(rule).toBeDefined();
  expect(rule?.matched).toBe(matched);
}

function expectStatusAndRules(
    result: BaEvaluationResult,
    status: EligibilityStatus,
    matchedRuleIds: string[]
): void {
  expect(result.status).toBe(status);
  expect(result.matchedRuleIds).toEqual(matchedRuleIds);
}

function expectCondition(
    result: BaEvaluationResult,
    ruleId: string,
    field: keyof EligibilityFacts,
    passed: boolean | null
): void {
  const rule = result.ruleResults.find(
      (item) => item.ruleId === ruleId
  );

  expect(rule).toBeDefined();

  const conditions = [
    ...(rule?.matchedConditions ?? []),
    ...(rule?.unmetConditions ?? []),
    ...(rule?.missingInformation ?? []),
  ];

  const matchingConditions = conditions.filter(
      (condition) => condition.field === field
  );

  expect(matchingConditions.length).toBeGreaterThan(0);

  expect(
      matchingConditions.some(
          (condition) => condition.passed === passed
      )
  ).toBe(true);
}

describe("BA Eligibility Accuracy Validation", () => {
  test("ACC-001 - All standard requirements satisfied", () => {
    const result = evaluate(createEligibleBaFacts());

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BA-001"]
    );

    expectRule(result, "BA-001", true);
    expectRule(result, "BA-002", false);
    expectRule(result, "BA-003", false);

    expectCondition(result, "BA-001", "citizenship", true);
    expectCondition(result, "BA-001", "state", true);
    expectCondition(
        result,
        "BA-001",
        "monthlyHouseholdIncome",
        true
    );
    expectCondition(
        result,
        "BA-001",
        "receivesJkmMonthlyAssistance",
        true
    );
  });

  test("ACC-002 - Applicant is not Malaysian", () => {
    const result = evaluate(
        createEligibleBaFacts({
          citizenship: "Non-Malaysian",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BA-003"]
    );

    expectRule(result, "BA-001", false);
    expectRule(result, "BA-002", false);
    expectRule(result, "BA-003", true);

    expectCondition(
        result,
        "BA-001",
        "citizenship",
        false
    );
  });

  test("ACC-003 - Applicant resides outside eligible territories", () => {
    const result = evaluate(
        createEligibleBaFacts({
          state: "Selangor",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BA-003"]
    );

    expectRule(result, "BA-001", false);
    expectRule(result, "BA-003", true);

    expectCondition(
        result,
        "BA-001",
        "state",
        false
    );
  });

  test("ACC-004 - Household income exactly RM1,236", () => {
    const result = evaluate(
        createEligibleBaFacts({
          monthlyHouseholdIncome: 1236,
          perCapitaHouseholdIncome: 500,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BA-001"]
    );

    expectRule(result, "BA-001", true);

    expectCondition(
        result,
        "BA-001",
        "monthlyHouseholdIncome",
        true
    );
  });

  test("ACC-005 - Per-capita income exactly RM348", () => {
    const result = evaluate(
        createEligibleBaFacts({
          monthlyHouseholdIncome: 1500,
          perCapitaHouseholdIncome: 348,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BA-001"]
    );

    expectRule(result, "BA-001", true);

    expectCondition(
        result,
        "BA-001",
        "perCapitaHouseholdIncome",
        true
    );
  });

  test("ACC-006 - Both income values exceed thresholds", () => {
    const result = evaluate(
        createEligibleBaFacts({
          monthlyHouseholdIncome: 1500,
          perCapitaHouseholdIncome: 500,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BA-003"]
    );

    expectRule(result, "BA-001", false);
    expectRule(result, "BA-003", true);

    expectCondition(
        result,
        "BA-001",
        "monthlyHouseholdIncome",
        false
    );

    expectCondition(
        result,
        "BA-001",
        "perCapitaHouseholdIncome",
        false
    );
  });

  test("ACC-007 - Applicant receives other JKM monthly assistance", () => {
    const result = evaluate(
        createEligibleBaFacts({
          receivesJkmMonthlyAssistance: true,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BA-003"]
    );

    expectRule(result, "BA-001", false);
    expectRule(result, "BA-003", true);

    expectCondition(
        result,
        "BA-001",
        "receivesJkmMonthlyAssistance",
        false
    );
  });

  test("ACC-008 - Existing assistance status is unknown", () => {
    const result = evaluate(
        createEligibleBaFacts({
          receivesJkmMonthlyAssistance: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BA-001", null);
    expectRule(result, "BA-002", false);
    expectRule(result, "BA-003", null);

    expectCondition(
        result,
        "BA-001",
        "receivesJkmMonthlyAssistance",
        null
    );

    expect(
        result.missingInformation.length
    ).toBeGreaterThan(0);
  });

  test("ACC-009 - Missing both household income values", () => {
    const result = evaluate(
        createEligibleBaFacts({
          monthlyHouseholdIncome: null,
          perCapitaHouseholdIncome: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BA-001", null);
    expectRule(result, "BA-003", null);

    expectCondition(
        result,
        "BA-001",
        "monthlyHouseholdIncome",
        null
    );

    expectCondition(
        result,
        "BA-001",
        "perCapitaHouseholdIncome",
        null
    );

    expect(
        result.missingInformation.length
    ).toBeGreaterThan(0);
  });

  test("ACC-010 - Additional circumstances require manual verification", () => {
    const result = evaluate(
        createEligibleBaFacts({
          monthlyHouseholdIncome: 2000,
          perCapitaHouseholdIncome: 1000,
          baAdditionalCircumstancesRequireReview: true,
        })
    );

    expectStatusAndRules(
        result,
        "manual_verification",
        ["BA-002"]
    );

    expectRule(result, "BA-001", false);
    expectRule(result, "BA-002", true);
    expectRule(result, "BA-003", false);

    expectCondition(
        result,
        "BA-002",
        "baAdditionalCircumstancesRequireReview",
        true
    );

    expect(
        result.manualVerification.length
    ).toBeGreaterThan(0);
  });

  test("ACC-011 - Additional circumstances status unknown", () => {
    const result = evaluate(
        createEligibleBaFacts({
          monthlyHouseholdIncome: 2000,
          perCapitaHouseholdIncome: 1000,
          baAdditionalCircumstancesRequireReview: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BA-001", false);
    expectRule(result, "BA-002", null);
    expectRule(result, "BA-003", null);

    expectCondition(
        result,
        "BA-002",
        "baAdditionalCircumstancesRequireReview",
        null
    );
  });

  test("ACC-012 - Putrajaya residence qualifies", () => {
    const result = evaluate(
        createEligibleBaFacts({
          state: "Putrajaya",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BA-001"]
    );

    expectCondition(result, "BA-001", "state", true);
  });

  test("ACC-013 - Labuan residence qualifies", () => {
    const result = evaluate(
        createEligibleBaFacts({
          state: "Labuan",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BA-001"]
    );

    expectCondition(result, "BA-001", "state", true);
  });

  test("ACC-014 - Dynamic threshold boundaries and missing threshold", () => {
    const thresholdRule: EligibilityRule = {
      id: "BA-THRESHOLD-TEST",
      programCode: "BA",
      name: "Dynamic household income threshold",
      description: "Test dynamic income threshold resolution",
      outcome: "potentially_eligible",
      conditions: {
        operator: "AND",
        conditions: [
          {
            id: "THRESHOLD-001",
            field: "monthlyHouseholdIncome",
            operator: "lte",
            thresholdRef: "householdIncomeLimit",
            description:
                "Household income must not exceed threshold",
          },
        ],
      },
    };

    const facts = createEligibleBaFacts({
      monthlyHouseholdIncome: 1236,
    });

    const boundaryResult = evaluateProgramEligibility(
        "BA",
        [thresholdRule],
        facts,
        { householdIncomeLimit: 1236 }
    );

    expectStatusAndRules(
        boundaryResult,
        "potentially_eligible",
        ["BA-THRESHOLD-TEST"]
    );

    expectCondition(
        boundaryResult,
        "BA-THRESHOLD-TEST",
        "monthlyHouseholdIncome",
        true
    );

    const aboveThresholdResult = evaluateProgramEligibility(
        "BA",
        [thresholdRule],
        facts,
        { householdIncomeLimit: 1235 }
    );

    expectRule(
        aboveThresholdResult,
        "BA-THRESHOLD-TEST",
        false
    );

    expectCondition(
        aboveThresholdResult,
        "BA-THRESHOLD-TEST",
        "monthlyHouseholdIncome",
        false
    );

    const missingThresholdResult = evaluateProgramEligibility(
        "BA",
        [thresholdRule],
        facts,
        {}
    );

    expectStatusAndRules(
        missingThresholdResult,
        "insufficient_information",
        []
    );

    expectRule(
        missingThresholdResult,
        "BA-THRESHOLD-TEST",
        null
    );

    expectCondition(
        missingThresholdResult,
        "BA-THRESHOLD-TEST",
        "monthlyHouseholdIncome",
        null
    );

    const invalidThresholdResult = evaluateProgramEligibility(
        "BA",
        [thresholdRule],
        facts,
        { householdIncomeLimit: Number.NaN }
    );

    expectRule(
        invalidThresholdResult,
        "BA-THRESHOLD-TEST",
        null
    );

    expectCondition(
        invalidThresholdResult,
        "BA-THRESHOLD-TEST",
        "monthlyHouseholdIncome",
        null
    );
  });

  test("ACC-015 - Contradictory outcomes require manual verification", () => {
    const conflictingRules: EligibilityRule[] = [
      {
        id: "BA-CONFLICT-ELIGIBLE",
        programCode: "BA",
        name: "Conflicting preliminary eligibility",
        description: "Controlled eligible outcome",
        outcome: "potentially_eligible",
        conditions: {
          operator: "AND",
          conditions: [
            {
              id: "CONFLICT-001",
              field: "citizenship",
              operator: "eq",
              value: "Malaysian",
              description: "Applicant is Malaysian",
            },
          ],
        },
      },
      {
        id: "BA-CONFLICT-INELIGIBLE",
        programCode: "BA",
        name: "Conflicting preliminary ineligibility",
        description: "Controlled ineligible outcome",
        outcome: "potentially_ineligible",
        conditions: {
          operator: "AND",
          conditions: [
            {
              id: "CONFLICT-002",
              field: "citizenship",
              operator: "eq",
              value: "Malaysian",
              description: "Applicant is Malaysian",
            },
          ],
        },
      },
    ];

    const result = evaluateProgramEligibility(
        "BA",
        conflictingRules,
        createEligibleBaFacts()
    );

    expectStatusAndRules(
        result,
        "manual_verification",
        [
          "BA-CONFLICT-ELIGIBLE",
          "BA-CONFLICT-INELIGIBLE",
        ]
    );

    expectRule(
        result,
        "BA-CONFLICT-ELIGIBLE",
        true
    );

    expectRule(
        result,
        "BA-CONFLICT-INELIGIBLE",
        true
    );
  });
});
