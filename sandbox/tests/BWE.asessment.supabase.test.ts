import { supabaseTestClient } from "../helpers/supabaseTestClient";
import { assessApplicantEligibility, ApplicantEligibilityAssessment } from "../../src/services/eligibility/eligibility";
import { getApplicantEligibilityData } from "../../src/services/eligibility/eligibilityDataService";
import { buildEligibilityFacts } from "../../src/utils/eligibility/eligibilityFacts";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";

describe("BantuanKu - Real BWE Eligibility Assessment", () => {
  let assessment: ApplicantEligibilityAssessment;

  beforeAll(async () => {
    const email = process.env.TEST_APPLICANT_EMAIL;
    const password = process.env.TEST_APPLICANT_PASSWORD;

    if (!email || !password) {
      throw new Error(
          "Missing test applicant credentials."
      );
    }

    const { error } =
        await supabaseTestClient.auth.signInWithPassword({
          email,
          password,
        });

    if (error) {
      throw error;
    }

    assessment = await assessApplicantEligibility("BWE");
  });

  afterAll(async () => {
    await supabaseTestClient.auth.signOut();
  });

  test("BWE-REAL-001 - Complete eligibility assessment executes successfully", () => {
    expect(assessment).toBeDefined();

    expect(assessment).toHaveProperty("programCode");
    expect(assessment).toHaveProperty("criteriaVersion");
    expect(assessment).toHaveProperty("facts");
    expect(assessment).toHaveProperty("rules");
    expect(assessment).toHaveProperty("result");
    expect(assessment).toHaveProperty("assessedAt");
  });

  test("BWE-REAL-002 - Assessment uses the correct BWE program", () => {
    expect(assessment.programCode).toBe("BWE");

    expect(assessment.result.programCode).toBe("BWE");

    expect(
        assessment.rules.every(
            (rule) => rule.programCode === "BWE"
        )
    ).toBe(true);
  });

  test("BWE-REAL-003 - Assessment contains valid JKM eligibility criteria", () => {
    expect(
        Number.isInteger(assessment.criteriaVersion)
    ).toBe(true);

    expect(assessment.criteriaVersion).toBeGreaterThan(0);

    expect(assessment.rules.length).toBeGreaterThan(0);

    const ruleIds = assessment.rules.map(
        (rule) => rule.id
    );

    expect(new Set(ruleIds).size).toBe(ruleIds.length);
  });

  test("BWE-REAL-004 - Assessment facts match real applicant data", async () => {
    const applicantData =
        await getApplicantEligibilityData();

    const expectedFacts =
        buildEligibilityFacts(applicantData);

    expect(assessment.facts).toEqual(expectedFacts);
  });

  test("BWE-REAL-005 - Forward-chaining engine evaluates every BWE rule", () => {
    const ruleResults = assessment.result.ruleResults;

    expect(ruleResults).toHaveLength(
        assessment.rules.length
    );

    const expectedRuleIds = assessment.rules.map(
        (rule) => rule.id
    );

    const evaluatedRuleIds = ruleResults.map(
        (result) => result.ruleId
    );

    expect(evaluatedRuleIds).toEqual(expectedRuleIds);

    for (const result of ruleResults) {
      expect(
          [true, false, null]
      ).toContain(result.matched);

      expect(
          [
            "potentially_eligible",
            "potentially_ineligible",
            "manual_verification",
          ]
      ).toContain(result.outcome);
    }
  });

  test("BWE-REAL-006 - Final eligibility status is consistent with rule evaluation", () => {
    const independentlyEvaluated =
        evaluateProgramEligibility(
            "BWE",
            assessment.rules,
            assessment.facts
        );

    expect(assessment.result).toEqual(
        independentlyEvaluated
    );

    expect(
        [
          "potentially_eligible",
          "potentially_ineligible",
          "manual_verification",
          "insufficient_information",
        ]
    ).toContain(assessment.result.status);
  });

  test("BWE-REAL-007 - Assessment explanations are internally consistent", () => {
    const result = assessment.result;

    const expectedMatchedRuleIds =
        result.ruleResults
            .filter((rule) => rule.matched === true)
            .map((rule) => rule.ruleId);

    expect(result.matchedRuleIds).toEqual(
        expectedMatchedRuleIds
    );

    for (const condition of result.matchedConditions) {
      expect(condition.passed).toBe(true);
    }

    for (const condition of result.unmetConditions) {
      expect(condition.passed).toBe(false);
    }

    for (const condition of result.missingInformation) {
      expect(condition.passed).toBeNull();
    }

    expect(
        Array.isArray(result.manualVerification)
    ).toBe(true);
  });

  test("BWE-REAL-008 - Assessment timestamp is valid", () => {
    const timestamp = new Date(
        assessment.assessedAt
    );

    expect(
        Number.isNaN(timestamp.getTime())
    ).toBe(false);

    expect(timestamp.toISOString()).toBe(
        assessment.assessedAt
    );

    expect(timestamp.getTime()).toBeLessThanOrEqual(
        Date.now()
    );
  });
});
