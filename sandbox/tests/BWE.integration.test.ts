import { assessApplicantEligibility } from "../../src/services/eligibility/eligibility";
import { getApplicantEligibilityData } from "../../src/services/eligibility/eligibilityDataService";
import { getJkmEligibilityCriteria } from "../../src/services/api";
import type { EligibilityFactsInput } from "../../src/utils/eligibility/eligibilityFacts";
import { bweApiResponse } from "../fixtures/bweApiResponse";

jest.mock(
    "../../src/services/eligibility/eligibilityDataService",
    () => ({
      getApplicantEligibilityData: jest.fn(),
    })
);

jest.mock("../../src/services/api", () => ({
  getJkmEligibilityCriteria: jest.fn(),
}));

const mockGetApplicantEligibilityData =
    jest.mocked(getApplicantEligibilityData);

const mockGetJkmEligibilityCriteria =
    jest.mocked(getJkmEligibilityCriteria);

function createApplicant(
    overrides: Partial<EligibilityFactsInput> = {}
): EligibilityFactsInput {
  return {
    profile: {
      date_of_birth: "1961-05-15",
      citizenship: "Malaysian",
      marital_status: "single",
      is_student: false,
      study_mode: null,
    },

    address: {
      state_territory: "Selangor",
      country_code: "Malaysia",
    },

    financialProfile: {
      monthly_personal_income: 500,
      monthly_household_income: 1000,
    },

    householdMembers: [
      {
        relationship: "child",
        date_of_birth: "1990-01-01",
        is_dependent: false,
      },
    ],

    healthProfile: {
      is_oku: false,
      oku_registered: false,
      has_chronic_illness: false,
      is_bedridden: false,
      requires_continuous_treatment: false,
      treatment_start_date: null,
    },

    livingArrangement: {
      lives_with_family: true,
      depends_on_family: false,
      depends_on_caregiver: false,
      is_in_institution: false,
      institution_type: null,
    },

    caregivers: [],
    welfareAssistance: [],

    ...overrides,
  };
}

beforeEach(() => {
  jest.resetAllMocks();

  mockGetApplicantEligibilityData.mockResolvedValue(
      createApplicant()
  );

  mockGetJkmEligibilityCriteria.mockResolvedValue(
      structuredClone(bweApiResponse)
  );
});

describe("BantuanKu - BWE Assessment Integration", () => {
  test("BWE-INT-001 - Eligible Applicant", async () => {
    const assessment = await assessApplicantEligibility("BWE");

    expect(assessment.result.status).toBe(
        "potentially_eligible"
    );

    expect(assessment.result.matchedRuleIds).toContain(
        "BWE-001"
    );

    expect(assessment.facts.ageByBirthYear).toBeGreaterThanOrEqual(
        60
    );

    expect(assessment.facts.monthlyHouseholdIncome).toBe(
        1000
    );

    expect(assessment.facts.perCapitaHouseholdIncome).toBe(
        500
    );
  });

  test("BWE-INT-002 - Applicant Below Minimum Age", async () => {
    mockGetApplicantEligibilityData.mockResolvedValue(
        createApplicant({
          profile: {
            date_of_birth: "1981-05-15",
            citizenship: "Malaysian",
            marital_status: "single",
            is_student: false,
            study_mode: null,
          },
        })
    );

    const assessment = await assessApplicantEligibility("BWE");

    expect(assessment.result.status).toBe(
        "potentially_ineligible"
    );

    expect(assessment.result.matchedRuleIds).toContain(
        "BWE-003"
    );
  });

  test("BWE-INT-003 - Missing Required Information", async () => {
    mockGetApplicantEligibilityData.mockResolvedValue(
        createApplicant({
          financialProfile: null,
          livingArrangement: null,
        })
    );

    const assessment = await assessApplicantEligibility("BWE");

    expect(assessment.result.status).toBe(
        "insufficient_information"
    );

    expect(
        assessment.result.ruleResults.find(
            (rule) => rule.ruleId === "BWE-001"
        )?.matched
    ).toBeNull();
  });

  test("BWE-INT-004 - No Eligibility Rules", async () => {
    const response = structuredClone(bweApiResponse);

    response.data.criteria.rules = [];

    mockGetJkmEligibilityCriteria.mockResolvedValue(response);

    await expect(
        assessApplicantEligibility("BWE")
    ).rejects.toThrow(
        "No eligibility rules are available for BWE"
    );
  });

  test("BWE-INT-005 - Applicant Retrieval Failure", async () => {
    mockGetApplicantEligibilityData.mockRejectedValue(
        new Error("Supabase retrieval failed")
    );

    await expect(
        assessApplicantEligibility("BWE")
    ).rejects.toThrow(
        "Supabase retrieval failed"
    );
  });

  test("BWE-INT-006 - JKM API Failure", async () => {
    mockGetJkmEligibilityCriteria.mockRejectedValue(
        new Error("JKM API unavailable")
    );

    await expect(
        assessApplicantEligibility("BWE")
    ).rejects.toThrow(
        "JKM API unavailable"
    );
  });

  test("BWE-INT-007 - Criteria Version", async () => {
    const assessment = await assessApplicantEligibility("BWE");

    expect(assessment.criteriaVersion).toBe(1);
    expect(assessment.programCode).toBe("BWE");
  });

  test("BWE-INT-008 - Complete Assessment Output", async () => {
    const assessment = await assessApplicantEligibility("BWE");

    expect(assessment.facts).toBeDefined();
    expect(assessment.rules).toHaveLength(3);
    expect(assessment.result.ruleResults).toHaveLength(3);

    expect(
        assessment.rules.map((rule) => rule.id)
    ).toEqual([
      "BWE-001",
      "BWE-002",
      "BWE-003",
    ]);

    expect(assessment.rules[0].governmentOutcome).toBe(
        "preliminary_match"
    );
  });

  test("BWE-INT-009 - Dynamic Thresholds", async () => {
    const assessment = await assessApplicantEligibility(
        "BWE",
        {
          thresholds: {
            householdIncomeLimit: 1236,
          },
        }
    );

    expect(assessment.result.status).toBe(
        "potentially_eligible"
    );
  });

  test("BWE-INT-010 - Assessment Timestamp", async () => {
    const assessment = await assessApplicantEligibility("BWE");

    expect(
        Number.isNaN(Date.parse(assessment.assessedAt))
    ).toBe(false);

    expect(
        new Date(assessment.assessedAt).toISOString()
    ).toBe(assessment.assessedAt);
  });
});
