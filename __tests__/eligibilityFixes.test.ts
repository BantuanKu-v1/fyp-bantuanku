import { describe, expect, test } from "@jest/globals";

import { adaptJkmEligibilityCriteria } from "../src/adapters/jkmEligibilityAdapter";
import { adaptStrEligibilityResponse } from "../src/adapters/strEligibilityAdapter";
import { evaluateProgramEligibility } from "../src/utils/eligibility/eligibilityEngine";
import { buildEligibilityFacts } from "../src/utils/eligibility/eligibilityFacts";
import type { EligibilityFacts, EligibilityRule } from "../src/types/eligibility";

function createFacts(overrides: Partial<EligibilityFacts> = {}): EligibilityFacts {
  const base: EligibilityFacts = {
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
  };

  return { ...base, ...overrides };
}

describe("Eligibility engine", () => {
  test("BWE standard preliminary match", () => {
    const rules: EligibilityRule[] = [
      {
        id: "BWE-001",
        programCode: "BWE",
        name: "Standard preliminary match",
        description: "Standard preliminary match",
        outcome: "potentially_eligible",
        conditions: {
          operator: "AND",
          conditions: [
            { id: "c1", field: "citizenship", operator: "eq", value: "Malaysian", description: "citizenship" },
            { id: "c2", field: "residenceCountry", operator: "eq", value: "Malaysia", description: "residence" },
            { id: "c3", field: "ageByBirthYear", operator: "gte", value: 60, description: "age" },
          ],
        },
      },
      {
        id: "BWE-002",
        programCode: "BWE",
        name: "Manual review pathway",
        description: "Manual review pathway",
        outcome: "manual_verification",
        requiresManualVerification: true,
        conditions: {
          operator: "AND",
          conditions: [
            { id: "c4", field: "hasChildren", operator: "eq", value: false, description: "no children" },
            { id: "c5", field: "dependsOnFamilyOrCaregiver", operator: "eq", value: true, description: "depends" },
          ],
        },
      },
      {
        id: "BWE-003",
        programCode: "BWE",
        name: "No match",
        description: "No match",
        outcome: "potentially_ineligible",
        conditions: {
          operator: "AND",
          conditions: [{ not: { operator: "OR", conditions: [{ ruleMatched: "BWE-001" }, { ruleMatched: "BWE-002" }] } }],
        },
      },
    ];

    const result = evaluateProgramEligibility("BWE", rules, createFacts({
      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
      ageByBirthYear: 65,
    }));

    expect(result.status).toBe("potentially_eligible");
    expect(result.matchedRuleIds).toContain("BWE-001");
    expect(result.missingInformation).toEqual([]);
  });

  test("BWE age below threshold remains ineligible", () => {
    const rules: EligibilityRule[] = [
      {
        id: "BWE-001",
        programCode: "BWE",
        name: "Age threshold",
        description: "Age threshold",
        outcome: "potentially_eligible",
        conditions: { operator: "AND", conditions: [{ id: "age", field: "ageByBirthYear", operator: "gte", value: 60, description: "age" }] },
      },
      {
        id: "BWE-002",
        programCode: "BWE",
        name: "Fallback ineligible rule",
        description: "Fallback ineligible rule",
        outcome: "potentially_ineligible",
        conditions: { operator: "AND", conditions: [{ not: { ruleMatched: "BWE-001" } }] },
      },
    ];

    const result = evaluateProgramEligibility("BWE", rules, createFacts({ ageByBirthYear: 59 }));

    expect(result.status).toBe("potentially_ineligible");
    expect(result.matchedRuleIds).toEqual(["BWE-002"]);
  });

  test("BWE special consideration remains manual verification", () => {
    const rules: EligibilityRule[] = [
      {
        id: "BWE-001",
        programCode: "BWE",
        name: "Standard route",
        description: "Standard route",
        outcome: "potentially_eligible",
        conditions: { operator: "AND", conditions: [{ id: "sf", field: "citizenship", operator: "eq", value: "Malaysian", description: "citizenship" }] },
      },
      {
        id: "BWE-002",
        programCode: "BWE",
        name: "Special consideration",
        description: "Special consideration",
        outcome: "manual_verification",
        requiresManualVerification: true,
        conditions: { operator: "AND", conditions: [{ id: "special", field: "hasChildren", operator: "eq", value: false, description: "no children" }] },
      },
    ];

    const result = evaluateProgramEligibility("BWE", rules, createFacts({ citizenship: "Malaysian", hasChildren: false }));

    expect(result.status).toBe("manual_verification");
    expect(result.matchedRuleIds).toContain("BWE-002");
  });

  test("BWE unresolved alternate pathway is excluded from overall missing info after a match", () => {
    const rules: EligibilityRule[] = [
      {
        id: "BWE-001",
        programCode: "BWE",
        name: "Standard route",
        description: "Standard route",
        outcome: "potentially_eligible",
        conditions: { operator: "AND", conditions: [{ id: "c1", field: "citizenship", operator: "eq", value: "Malaysian", description: "citizenship" }] },
      },
      {
        id: "BWE-002",
        programCode: "BWE",
        name: "Manual route",
        description: "Manual route",
        outcome: "manual_verification",
        conditions: { operator: "AND", conditions: [{ id: "c2", field: "dependsOnFamilyOrCaregiver", operator: "eq", value: true, description: "depends" }] },
      },
    ];

    const result = evaluateProgramEligibility("BWE", rules, createFacts({ citizenship: "Malaysian", dependsOnFamilyOrCaregiver: null }));

    expect(result.status).toBe("potentially_eligible");
    expect(result.missingInformation).toEqual([]);
  });

  test("BA confirms a false JKM assistance status as explicit non-receipt", () => {
    const rules: EligibilityRule[] = [
      {
        id: "BA-001",
        programCode: "BA",
        name: "Basic assistance",
        description: "Basic assistance",
        outcome: "potentially_eligible",
        conditions: { operator: "AND", conditions: [{ id: "jk", field: "receivesJkmMonthlyAssistance", operator: "eq", value: false, description: "No JKM monthly assistance" }] },
      },
    ];

    const result = evaluateProgramEligibility("BA", rules, createFacts({ receivesJkmMonthlyAssistance: false }));

    expect(result.status).toBe("potentially_eligible");
    expect(result.matchedRuleIds).toContain("BA-001");
  });

  test("BA keeps unknown JKM assistance status unresolved", () => {
    const rules: EligibilityRule[] = [
      {
        id: "BA-001",
        programCode: "BA",
        name: "Basic assistance",
        description: "Basic assistance",
        outcome: "potentially_eligible",
        conditions: { operator: "AND", conditions: [{ id: "jk", field: "receivesJkmMonthlyAssistance", operator: "eq", value: false, description: "No JKM monthly assistance" }] },
      },
    ];

    const result = evaluateProgramEligibility("BA", rules, createFacts({ receivesJkmMonthlyAssistance: null }));

    expect(result.status).toBe("insufficient_information");
    expect(result.missingInformation.some((condition) => condition.field === "receivesJkmMonthlyAssistance")).toBe(true);
  });

  test("AND, OR, and NOT handle true, false, and null as expected", () => {
    const allTrue = evaluateProgramEligibility("BWE", [{
      id: "R1",
      programCode: "BWE",
      name: "R1",
      description: "R1",
      outcome: "potentially_eligible",
      conditions: { operator: "AND", conditions: [{ id: "a", field: "citizenship", operator: "eq", value: "Malaysian", description: "citizenship" }, { id: "b", field: "residenceCountry", operator: "eq", value: "Malaysia", description: "residence" }] },
    }], createFacts({ citizenship: "Malaysian", residenceCountry: "Malaysia" }));
    expect(allTrue.status).toBe("potentially_eligible");

    const withNull = evaluateProgramEligibility("BWE", [{
      id: "R2",
      programCode: "BWE",
      name: "R2",
      description: "R2",
      outcome: "potentially_ineligible",
      conditions: { operator: "AND", conditions: [{ id: "a", field: "citizenship", operator: "eq", value: "Malaysian", description: "citizenship" }, { id: "b", field: "residenceCountry", operator: "eq", value: "Malaysia", description: "residence" }, { id: "c", field: "hasChildren", operator: "eq", value: false, description: "has children" }] },
    }], createFacts({ citizenship: "Malaysian", residenceCountry: "Malaysia", hasChildren: null }));
    expect(withNull.status).toBe("insufficient_information");

    const notRule = evaluateProgramEligibility("BWE", [{
      id: "R3",
      programCode: "BWE",
      name: "R3",
      description: "R3",
      outcome: "potentially_eligible",
      conditions: { operator: "AND", conditions: [{ not: { operator: "OR", conditions: [{ id: "c3", field: "hasChildren", operator: "eq", value: true, description: "has children" }] } }] },
    }], createFacts({ hasChildren: false }));
    expect(notRule.status).toBe("potentially_eligible");
  });

  test("rule dependency order and validation errors are enforced", () => {
    const rules: EligibilityRule[] = [
      {
        id: "R1",
        programCode: "BWE",
        name: "R1",
        description: "R1",
        outcome: "potentially_eligible",
        conditions: { operator: "AND", conditions: [{ id: "r1", field: "citizenship", operator: "eq", value: "Malaysian", description: "citizenship" }] },
      },
      {
        id: "R2",
        programCode: "BWE",
        name: "R2",
        description: "R2",
        outcome: "potentially_eligible",
        conditions: { operator: "AND", conditions: [{ ruleMatched: "R1" }, { id: "r2", field: "residenceCountry", operator: "eq", value: "Malaysia", description: "residence" }] },
      },
    ];

    expect(() => evaluateProgramEligibility("BWE", rules, createFacts({ citizenship: "Malaysian", residenceCountry: "Malaysia" }))).not.toThrow();
    expect(() => evaluateProgramEligibility("BWE", [{
      id: "R3",
      programCode: "BWE",
      name: "R3",
      description: "R3",
      outcome: "potentially_eligible",
      conditions: { operator: "AND", conditions: [{ ruleMatched: "R4" }] },
    }], createFacts())).toThrow(/Unknown eligibility rule reference/);
    expect(() => evaluateProgramEligibility("BWE", [
      { ...rules[0], id: "DUP" },
      { ...rules[0], id: "DUP" },
    ], createFacts())).toThrow(/Duplicate eligibility rule IDs detected/);
  });

  test("missing dynamic thresholds and manual verification precedence are handled", () => {
    const rules: EligibilityRule[] = [
      {
        id: "BAT-001",
        programCode: "BAT",
        name: "Equipment cap",
        description: "Equipment cap",
        outcome: "potentially_eligible",
        conditions: { operator: "AND", conditions: [{ id: "eq", field: "estimatedEquipmentCost", operator: "lte", thresholdRef: "equipmentBudgetCap", description: "equipment cap" }] },
      },
      {
        id: "BAT-002",
        programCode: "BAT",
        name: "Manual review",
        description: "Manual review",
        outcome: "manual_verification",
        requiresManualVerification: true,
        conditions: { operator: "AND", conditions: [{ id: "manual", field: "baAdditionalCircumstancesRequireReview", operator: "eq", value: true, description: "review required" }] },
      },
    ];

    const missingThreshold = evaluateProgramEligibility("BAT", rules, createFacts({ estimatedEquipmentCost: 3000, baAdditionalCircumstancesRequireReview: false }));
    expect(missingThreshold.status).toBe("insufficient_information");

    const manualReview = evaluateProgramEligibility("BAT", rules, createFacts({ estimatedEquipmentCost: 3000, baAdditionalCircumstancesRequireReview: true }), { equipmentBudgetCap: 5000 });
    expect(manualReview.status).toBe("manual_verification");
  });
});

describe("STR eligibility facts", () => {
  test("age 18 qualifies and age 19 requires full-time IPTA/IPTS student status", () => {
    const age18 = buildEligibilityFacts({
      profile: { date_of_birth: "2008-01-01", citizenship: "Malaysian", marital_status: "single", is_student: false, study_mode: null, institution_type: null },
      address: { state_territory: "Selangor", country_code: "Malaysia" },
      financialProfile: { monthly_personal_income: 0, monthly_household_income: 1000 },
      householdMembers: [{ relationship: "child", date_of_birth: "2008-01-01", is_dependent: true, identification_no: "100101100001", citizenship: "Malaysian", employment_status: "unemployed", monthly_income: 0, is_student: false, study_mode: null, institution_type: null }],
      householdMembersComplete: true,
      healthProfile: null,
      livingArrangement: { lives_with_family: true, depends_on_family: false, depends_on_caregiver: false, is_in_institution: false, institution_type: null },
      caregivers: [],
      welfareAssistance: [],
    }, new Date(2026, 0, 1));

    expect(age18.numberOfEligibleChildren).toBe(1);

    const age19Student = buildEligibilityFacts({
      profile: { date_of_birth: "2007-01-01", citizenship: "Malaysian", marital_status: "single", is_student: false, study_mode: null, institution_type: null },
      address: { state_territory: "Selangor", country_code: "Malaysia" },
      financialProfile: { monthly_personal_income: 0, monthly_household_income: 1000 },
      householdMembers: [{ relationship: "child", date_of_birth: "2007-01-01", is_dependent: true, identification_no: "100101100001", citizenship: "Malaysian", employment_status: "unemployed", monthly_income: 0, is_student: true, study_mode: "full_time", institution_type: "ipta" }],
      householdMembersComplete: true,
      healthProfile: null,
      livingArrangement: { lives_with_family: true, depends_on_family: false, depends_on_caregiver: false, is_in_institution: false, institution_type: null },
      caregivers: [],
      welfareAssistance: [],
    }, new Date(2026, 0, 1));

    expect(age19Student.numberOfEligibleChildren).toBe(1);
  });

  test("incomplete household information keeps child eligibility unknown", () => {
    const facts = buildEligibilityFacts({
      profile: { date_of_birth: "1960-01-01", citizenship: "Malaysian", marital_status: "single", is_student: false, study_mode: null, institution_type: null },
      address: { state_territory: "Selangor", country_code: "Malaysia" },
      financialProfile: { monthly_personal_income: 0, monthly_household_income: 1000 },
      householdMembers: [{ relationship: "child", date_of_birth: "2010-01-01", is_dependent: true, identification_no: null, citizenship: "Malaysian", employment_status: "unemployed", monthly_income: 0, is_student: false, study_mode: null, institution_type: null }],
      householdMembersComplete: false,
      healthProfile: null,
      livingArrangement: { lives_with_family: true, depends_on_family: false, depends_on_caregiver: false, is_in_institution: false, institution_type: null },
      caregivers: [],
      welfareAssistance: [],
    }, new Date(2026, 0, 1));

    expect(facts.numberOfEligibleChildren).toBeNull();
    expect(facts.hasEligibleChildren).toBeNull();
  });
});

describe("Eligibility adapters", () => {
  test("reject invalid STR API responses and unsupported years", () => {
    expect(() => adaptStrEligibilityResponse({ success: true, data: {} as never })).toThrow(/Invalid STR eligibility API response/);
    expect(() => adaptStrEligibilityResponse({
      success: true,
      data: {
        programCode: "STR",
        programName: "Sumbangan Tunai Rahmah",
        schemeYear: 2025,
        version: 1,
        criteria: {
          schemaVersion: 1,
          programCode: "STR",
          schemeYear: 2025,
          rules: [],
        },
      },
    } as never)).toThrow(/Unsupported STR scheme year/);
  });

  test("reject empty or invalid JKM rules arrays", () => {
    expect(() => adaptJkmEligibilityCriteria({
      schemaVersion: 1,
      programCode: "BA",
      rules: [],
    }, "BA")).toThrow(/must contain rules/i);
    expect(() => adaptJkmEligibilityCriteria({
      schemaVersion: 1,
      programCode: "BA",
      rules: [{ ruleCode: "A", name: "Rule A", conditions: { any: [] }, result: "preliminary_match" }],
    }, "BA")).toThrow(/Invalid ANY expression|Invalid.*expression/i);
  });
});
