import { describe, expect, test } from "@jest/globals";
import { adaptJkmEligibilityResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type {
  EligibilityFacts,
  EligibilityRule,
  EligibilityStatus,
} from "../../src/types/eligibility";

import type { EligibilityThresholds } from "../../src/utils/eligibility/eligibilityConditions";
import { bweApiResponse } from "../fixtures/bweApiResponse";

function createEligibleBweFacts(
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

function getBweRules(): EligibilityRule[] {
  return adaptJkmEligibilityResponse(
      structuredClone(bweApiResponse),
      "BWE"
  );
}

function evaluate(
    facts: EligibilityFacts,
    thresholds: EligibilityThresholds = {}
) {
  return evaluateProgramEligibility(
      "BWE",
      getBweRules(),
      facts,
      thresholds
  );
}

type BweEvaluationResult = ReturnType<typeof evaluate>;

function expectRule(
    result: BweEvaluationResult,
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
    result: BweEvaluationResult,
    status: EligibilityStatus,
    matchedRuleIds: string[]
): void {
  expect(result.status).toBe(status);
  expect(result.matchedRuleIds).toEqual(matchedRuleIds);
}

function expectCondition(
    result: BweEvaluationResult,
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

describe("BWE Eligibility Accuracy Validation", () => {
  test("ACC-001 - All standard requirements satisfied", () => {
    const result = evaluate(createEligibleBweFacts());

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BWE-001"]
    );

    expectRule(result, "BWE-001", true);
    expectRule(result, "BWE-002", false);
    expectRule(result, "BWE-003", false);

    expectCondition(
        result,
        "BWE-001",
        "citizenship",
        true
    );

    expectCondition(
        result,
        "BWE-001",
        "residenceCountry",
        true
    );

    expectCondition(
        result,
        "BWE-001",
        "ageByBirthYear",
        true
    );

    expectCondition(
        result,
        "BWE-001",
        "residesInExcludedInstitution",
        true
    );
  });

  test("ACC-002 - Applicant age 59", () => {
    const result = evaluate(
        createEligibleBweFacts({
          age: 59,
          ageByBirthYear: 59,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BWE-003"]
    );

    expectRule(result, "BWE-001", false);
    expectRule(result, "BWE-002", false);
    expectRule(result, "BWE-003", true);

    expectCondition(
        result,
        "BWE-001",
        "ageByBirthYear",
        false
    );
  });

  test("ACC-003 - Applicant age exactly 60", () => {
    const result = evaluate(
        createEligibleBweFacts({
          age: 60,
          ageByBirthYear: 60,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BWE-001"]
    );

    expectRule(result, "BWE-001", true);

    expectCondition(
        result,
        "BWE-001",
        "ageByBirthYear",
        true
    );
  });

  test("ACC-004 - Applicant is not Malaysian", () => {
    const result = evaluate(
        createEligibleBweFacts({
          citizenship: "Non-Malaysian",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BWE-003"]
    );

    expectRule(result, "BWE-001", false);

    expectCondition(
        result,
        "BWE-001",
        "citizenship",
        false
    );
  });

  test("ACC-005 - Applicant resides outside Malaysia", () => {
    const result = evaluate(
        createEligibleBweFacts({
          residenceCountry: "Singapore",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BWE-003"]
    );

    expectRule(result, "BWE-001", false);

    expectCondition(
        result,
        "BWE-001",
        "residenceCountry",
        false
    );
  });

  test("ACC-006 - Household income exactly RM1,236", () => {
    const result = evaluate(
        createEligibleBweFacts({
          monthlyHouseholdIncome: 1236,
          perCapitaHouseholdIncome: 500,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BWE-001"]
    );

    expectRule(result, "BWE-001", true);

    expectCondition(
        result,
        "BWE-001",
        "monthlyHouseholdIncome",
        true
    );
  });

  test("ACC-007 - Per-capita household income exactly RM348", () => {
    const result = evaluate(
        createEligibleBweFacts({
          monthlyHouseholdIncome: 1500,
          perCapitaHouseholdIncome: 348,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BWE-001"]
    );

    expectRule(result, "BWE-001", true);

    expectCondition(
        result,
        "BWE-001",
        "perCapitaHouseholdIncome",
        true
    );
  });

  test("ACC-008 - Both income values exceed thresholds", () => {
    const result = evaluate(
        createEligibleBweFacts({
          monthlyHouseholdIncome: 1500,
          perCapitaHouseholdIncome: 500,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BWE-003"]
    );

    expectRule(result, "BWE-001", false);
    expectRule(result, "BWE-003", true);

    expectCondition(
        result,
        "BWE-001",
        "monthlyHouseholdIncome",
        false
    );

    expectCondition(
        result,
        "BWE-001",
        "perCapitaHouseholdIncome",
        false
    );
  });

  test("ACC-009 - Applicant resides in an excluded institution", () => {
    const result = evaluate(
        createEligibleBweFacts({
          residesInExcludedInstitution: true,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BWE-003"]
    );

    expectRule(result, "BWE-001", false);

    expectCondition(
        result,
        "BWE-001",
        "residesInExcludedInstitution",
        false
    );
  });

  test("ACC-010 - Missing required information", () => {
    const result = evaluate(
        createEligibleBweFacts({
          monthlyHouseholdIncome: null,
          perCapitaHouseholdIncome: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BWE-001", null);
    expectRule(result, "BWE-003", null);

    expectCondition(
        result,
        "BWE-001",
        "monthlyHouseholdIncome",
        null
    );

    expectCondition(
        result,
        "BWE-001",
        "perCapitaHouseholdIncome",
        null
    );

    expect(
        result.missingInformation.length
    ).toBeGreaterThan(0);
  });

  test("ACC-011 - Alternative pathway satisfied", () => {
    const result = evaluate(
        createEligibleBweFacts({
          monthlyHouseholdIncome: 2000,
          perCapitaHouseholdIncome: 1000,
          hasChildren: false,
          dependsOnFamilyOrCaregiver: true,
          familyOrCaregiverIncomeExceedsPgk: true,
        })
    );

    expectStatusAndRules(
        result,
        "manual_verification",
        ["BWE-002"]
    );

    expectRule(result, "BWE-001", false);
    expectRule(result, "BWE-002", true);
    expectRule(result, "BWE-003", false);

    expectCondition(
        result,
        "BWE-002",
        "hasChildren",
        true
    );

    expectCondition(
        result,
        "BWE-002",
        "dependsOnFamilyOrCaregiver",
        true
    );

    expectCondition(
        result,
        "BWE-002",
        "familyOrCaregiverIncomeExceedsPgk",
        true
    );

    expect(
        result.manualVerification.length
    ).toBeGreaterThan(0);
  });

  test("ACC-012 - Alternative pathway incomplete information", () => {
    const result = evaluate(
        createEligibleBweFacts({
          monthlyHouseholdIncome: 2000,
          perCapitaHouseholdIncome: 1000,
          hasChildren: false,
          dependsOnFamilyOrCaregiver: true,
          familyOrCaregiverIncomeExceedsPgk: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BWE-001", false);
    expectRule(result, "BWE-002", null);
    expectRule(result, "BWE-003", null);

    expectCondition(
        result,
        "BWE-002",
        "familyOrCaregiverIncomeExceedsPgk",
        null
    );
  });

  test("ACC-013 - Dynamic threshold boundaries and missing threshold", () => {
    const thresholdRule: EligibilityRule = {
      id: "BWE-THRESHOLD-TEST",
      programCode: "BWE",
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
            description: "Household income must not exceed threshold",
          },
        ],
      },
    };

    const facts = createEligibleBweFacts({
      monthlyHouseholdIncome: 1236,
    });

    const boundaryResult = evaluateProgramEligibility(
        "BWE",
        [thresholdRule],
        facts,
        {
          householdIncomeLimit: 1236,
        }
    );

    expectStatusAndRules(
        boundaryResult,
        "potentially_eligible",
        ["BWE-THRESHOLD-TEST"]
    );

    expectCondition(
        boundaryResult,
        "BWE-THRESHOLD-TEST",
        "monthlyHouseholdIncome",
        true
    );

    const aboveThresholdResult = evaluateProgramEligibility(
        "BWE",
        [thresholdRule],
        facts,
        {
          householdIncomeLimit: 1235,
        }
    );

    expectRule(
        aboveThresholdResult,
        "BWE-THRESHOLD-TEST",
        false
    );

    expectCondition(
        aboveThresholdResult,
        "BWE-THRESHOLD-TEST",
        "monthlyHouseholdIncome",
        false
    );

    const missingThresholdResult = evaluateProgramEligibility(
        "BWE",
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
        "BWE-THRESHOLD-TEST",
        null
    );

    expectCondition(
        missingThresholdResult,
        "BWE-THRESHOLD-TEST",
        "monthlyHouseholdIncome",
        null
    );

    const invalidThresholdResult = evaluateProgramEligibility(
        "BWE",
        [thresholdRule],
        facts,
        {
          householdIncomeLimit: Number.NaN,
        }
    );

    expectRule(
        invalidThresholdResult,
        "BWE-THRESHOLD-TEST",
        null
    );

    expectCondition(
        invalidThresholdResult,
        "BWE-THRESHOLD-TEST",
        "monthlyHouseholdIncome",
        null
    );
  });

  test("ACC-014 - Contradictory outcomes require manual verification", () => {
    const conflictingRules: EligibilityRule[] = [
      {
        id: "BWE-CONFLICT-ELIGIBLE",
        programCode: "BWE",
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
        id: "BWE-CONFLICT-INELIGIBLE",
        programCode: "BWE",
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
        "BWE",
        conflictingRules,
        createEligibleBweFacts()
    );

    expectStatusAndRules(
        result,
        "manual_verification",
        [
          "BWE-CONFLICT-ELIGIBLE",
          "BWE-CONFLICT-INELIGIBLE",
        ]
    );

    expectRule(
        result,
        "BWE-CONFLICT-ELIGIBLE",
        true
    );

    expectRule(
        result,
        "BWE-CONFLICT-INELIGIBLE",
        true
    );
  });
});
