import { describe, expect, test } from "@jest/globals";
import { adaptJkmEligibilityResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type { EligibilityFacts, EligibilityRule, EligibilityStatus } from "../../src/types/eligibility";
import type { EligibilityThresholds } from "../../src/utils/eligibility/eligibilityThresholds";
import { bptApiResponse } from "../fixtures/bptApiResponse";

function createEligibleBptFacts(
    overrides: Partial<EligibilityFacts> = {}
): EligibilityFacts {
  return {
    age: null,
    ageByBirthYear: null,
    citizenship: "Malaysian",
    residenceCountry: "Malaysia",
    state: null,
    maritalStatus: null,

    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: 3000,
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

    hasMedicalOrJkmRecommendation: null,
    requestedAssistiveEquipment: null,
    estimatedEquipmentCost: null,
    hasHospitalReferral: null,

    socioeconomicAssessmentRequired: null,
    medicalAssessmentRequired: null,

    baAdditionalCircumstancesRequireReview: null,
    batRecommendationOrEquipmentRequiresReview: null,
    batSpecialConsiderationRequested: null,
    bptMedicalOrCaregiverReviewRequired: false,

    ...overrides,
  };
}

function getBptRules(): EligibilityRule[] {
  return adaptJkmEligibilityResponse(
      structuredClone(bptApiResponse),
      "BPT"
  );
}

function evaluate(
    facts: EligibilityFacts,
    thresholds: EligibilityThresholds = {}
) {
  return evaluateProgramEligibility(
      "BPT",
      getBptRules(),
      facts,
      thresholds
  );
}

type BptEvaluationResult = ReturnType<typeof evaluate>;

function expectRule(
    result: BptEvaluationResult,
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
    result: BptEvaluationResult,
    status: EligibilityStatus,
    matchedRuleIds: string[]
): void {
  expect(result.status).toBe(status);
  expect(result.matchedRuleIds).toEqual(matchedRuleIds);
}

function expectCondition(
    result: BptEvaluationResult,
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

describe("BPT Eligibility Accuracy Validation", () => {
  test("ACC-001 - Caregiver pathway requirements satisfied", () => {
    const result = evaluate(createEligibleBptFacts());

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BPT-001"]
    );

    expectRule(result, "BPT-001", true);
    expectRule(result, "BPT-002", false);
    expectRule(result, "BPT-003", false);
    expectRule(result, "BPT-004", false);
    expectRule(result, "BPT-005", false);

    expectCondition(result, "BPT-001", "citizenship", true);
    expectCondition(result, "BPT-001", "residenceCountry", true);
    expectCondition(result, "BPT-001", "applicantIsCaregiver", true);
    expectCondition(result, "BPT-001", "patientIsBedridden", true);
    expectCondition(result, "BPT-001", "patientIsOku", true);
    expectCondition(
        result,
        "BPT-001",
        "caregiverProvidesIntensiveCare",
        true
    );
    expectCondition(
        result,
        "BPT-001",
        "monthlyHouseholdIncome",
        true
    );
  });

  test("ACC-002 - Non-Malaysian caregiver applicant", () => {
    const result = evaluate(
        createEligibleBptFacts({
          citizenship: "Non-Malaysian",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BPT-005"]
    );

    expectRule(result, "BPT-001", false);
    expectRule(result, "BPT-005", true);
    expectCondition(result, "BPT-001", "citizenship", false);
  });

  test("ACC-003 - Caregiver applicant resides outside Malaysia", () => {
    const result = evaluate(
        createEligibleBptFacts({
          residenceCountry: "Singapore",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BPT-005"]
    );

    expectRule(result, "BPT-001", false);
    expectRule(result, "BPT-005", true);
    expectCondition(result, "BPT-001", "residenceCountry", false);
  });

  test("ACC-004 - Household income exactly RM5,000", () => {
    const result = evaluate(
        createEligibleBptFacts({
          monthlyHouseholdIncome: 5000,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BPT-001"]
    );

    expectRule(result, "BPT-001", true);
    expectCondition(
        result,
        "BPT-001",
        "monthlyHouseholdIncome",
        true
    );
  });

  test("ACC-005 - Household income exceeds RM5,000", () => {
    const result = evaluate(
        createEligibleBptFacts({
          monthlyHouseholdIncome: 5001,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BPT-005"]
    );

    expectRule(result, "BPT-001", false);
    expectRule(result, "BPT-005", true);
    expectCondition(
        result,
        "BPT-001",
        "monthlyHouseholdIncome",
        false
    );
  });

  test("ACC-006 - Patient has chronic illness instead of OKU status", () => {
    const result = evaluate(
        createEligibleBptFacts({
          patientIsOku: false,
          patientHasChronicIllness: true,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BPT-001"]
    );

    expectRule(result, "BPT-001", true);
    expectCondition(result, "BPT-001", "patientIsOku", false);
    expectCondition(result, "BPT-001", "patientHasChronicIllness", true);
  });

  test("ACC-007 - Patient has neither OKU nor chronic illness", () => {
    const result = evaluate(
        createEligibleBptFacts({
          patientIsOku: false,
          patientHasChronicIllness: false,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BPT-005"]
    );

    expectRule(result, "BPT-001", false);
    expectRule(result, "BPT-005", true);
  });

  test("ACC-008 - Intensive caregiving is not provided", () => {
    const result = evaluate(
        createEligibleBptFacts({
          caregiverProvidesIntensiveCare: false,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BPT-005"]
    );

    expectRule(result, "BPT-001", false);
    expectCondition(
        result,
        "BPT-001",
        "caregiverProvidesIntensiveCare",
        false
    );
  });

  test("ACC-009 - Non-bedridden chronic patient qualifies", () => {
    const result = evaluate(
        createEligibleBptFacts({
          applicantIsPatient: true,
          applicantIsCaregiver: false,
          patientIsBedridden: false,
          patientHasChronicIllness: true,
          patientRequiresContinuousTreatment: true,
          patientContinuousTreatmentMonths: 3,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BPT-002"]
    );

    expectRule(result, "BPT-001", false);
    expectRule(result, "BPT-002", true);
    expectRule(result, "BPT-003", false);

    expectCondition(result, "BPT-002", "applicantIsPatient", true);
    expectCondition(result, "BPT-002", "patientIsBedridden", true);
    expectCondition(
        result,
        "BPT-002",
        "patientContinuousTreatmentMonths",
        true
    );
  });

  test("ACC-010 - Continuous treatment below three months", () => {
    const result = evaluate(
        createEligibleBptFacts({
          applicantIsPatient: true,
          applicantIsCaregiver: false,
          patientIsBedridden: false,
          patientHasChronicIllness: true,
          patientRequiresContinuousTreatment: true,
          patientContinuousTreatmentMonths: 2,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BPT-005"]
    );

    expectRule(result, "BPT-002", false);
    expectCondition(
        result,
        "BPT-002",
        "patientContinuousTreatmentMonths",
        false
    );
  });

  test("ACC-011 - Continuous treatment duration is unknown", () => {
    const result = evaluate(
        createEligibleBptFacts({
          applicantIsPatient: true,
          applicantIsCaregiver: false,
          patientIsBedridden: false,
          patientHasChronicIllness: true,
          patientRequiresContinuousTreatment: true,
          patientContinuousTreatmentMonths: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BPT-002", null);
    expectRule(result, "BPT-005", null);

    expectCondition(
        result,
        "BPT-002",
        "patientContinuousTreatmentMonths",
        null
    );

    expect(result.missingInformation.length).toBeGreaterThan(0);
  });

  test("ACC-012 - Bedridden patient without caregiver qualifies", () => {
    const result = evaluate(
        createEligibleBptFacts({
          applicantIsCaregiver: false,
          hasCaregiver: false,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BPT-003"]
    );

    expectRule(result, "BPT-001", false);
    expectRule(result, "BPT-003", true);
    expectRule(result, "BPT-005", false);

    expectCondition(result, "BPT-003", "hasCaregiver", true);
  });

  test("ACC-013 - Bedridden patient has non-Malaysian caregiver", () => {
    const result = evaluate(
        createEligibleBptFacts({
          applicantIsCaregiver: false,
          hasCaregiver: true,
          caregiverCitizenship: "Non-Malaysian",
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BPT-003"]
    );

    expectRule(result, "BPT-003", true);
    expectCondition(
        result,
        "BPT-003",
        "caregiverCitizenship",
        true
    );
  });

  test("ACC-014 - Patient citizenship is unknown", () => {
    const result = evaluate(
        createEligibleBptFacts({
          applicantIsCaregiver: false,
          hasCaregiver: false,
          patientCitizenship: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BPT-003", null);
    expectRule(result, "BPT-005", null);

    expectCondition(result, "BPT-003", "patientCitizenship", null);
  });

  test("ACC-015 - Household income is missing", () => {
    const result = evaluate(
        createEligibleBptFacts({
          monthlyHouseholdIncome: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BPT-001", null);
    expectRule(result, "BPT-005", null);

    expectCondition(
        result,
        "BPT-001",
        "monthlyHouseholdIncome",
        null
    );

    expect(result.missingInformation.length).toBeGreaterThan(0);
  });

  test("ACC-016 - JKM medical or caregiver review required", () => {
    const result = evaluate(
        createEligibleBptFacts({
          bptMedicalOrCaregiverReviewRequired: true,
        })
    );

    expectStatusAndRules(
        result,
        "manual_verification",
        ["BPT-001", "BPT-004"]
    );

    expectRule(result, "BPT-001", true);
    expectRule(result, "BPT-004", true);
    expectRule(result, "BPT-005", false);

    expectCondition(
        result,
        "BPT-004",
        "bptMedicalOrCaregiverReviewRequired",
        true
    );

    expect(result.manualVerification.length).toBeGreaterThan(0);
  });

  test("ACC-017 - JKM assessment status unknown does not block preliminary match", () => {
    const result = evaluate(
        createEligibleBptFacts({
          bptMedicalOrCaregiverReviewRequired: null,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_eligible",
        ["BPT-001"]
    );

    expectRule(result, "BPT-001", true);
    expectRule(result, "BPT-004", null);
    expectRule(result, "BPT-005", false);

    expect(
        result.missingInformation.some(
            (condition) =>
                condition.field === "bptMedicalOrCaregiverReviewRequired"
        )
    ).toBe(false);
  });

  test("ACC-018 - No preliminary pathway matches", () => {
    const result = evaluate(
        createEligibleBptFacts({
          applicantIsPatient: false,
          applicantIsCaregiver: false,
          patientIsBedridden: false,
          patientIsOku: false,
          patientHasChronicIllness: false,
          monthlyHouseholdIncome: 6000,
        })
    );

    expectStatusAndRules(
        result,
        "potentially_ineligible",
        ["BPT-005"]
    );

    expectRule(result, "BPT-001", false);
    expectRule(result, "BPT-002", false);
    expectRule(result, "BPT-003", false);
    expectRule(result, "BPT-004", false);
    expectRule(result, "BPT-005", true);
  });

  test("ACC-019 - Missing bedridden status preserves unknown rule dependency", () => {
    const result = evaluate(
        createEligibleBptFacts({
          patientIsBedridden: null,
        })
    );

    expectStatusAndRules(
        result,
        "insufficient_information",
        []
    );

    expectRule(result, "BPT-001", null);
    expectRule(result, "BPT-002", false);
    expectRule(result, "BPT-003", false);
    expectRule(result, "BPT-004", false);
    expectRule(result, "BPT-005", null);
  });

  test("ACC-020 - Contradictory outcomes require manual verification", () => {
    const conflictingRules: EligibilityRule[] = [
      {
        id: "BPT-CONFLICT-ELIGIBLE",
        programCode: "BPT",
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
        id: "BPT-CONFLICT-INELIGIBLE",
        programCode: "BPT",
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
        "BPT",
        conflictingRules,
        createEligibleBptFacts()
    );

    expectStatusAndRules(
        result,
        "manual_verification",
        [
          "BPT-CONFLICT-ELIGIBLE",
          "BPT-CONFLICT-INELIGIBLE",
        ]
    );

    expectRule(result, "BPT-CONFLICT-ELIGIBLE", true);
    expectRule(result, "BPT-CONFLICT-INELIGIBLE", true);
  });
});
