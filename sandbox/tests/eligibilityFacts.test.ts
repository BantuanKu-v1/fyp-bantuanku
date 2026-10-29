import { buildEligibilityFacts, type EligibilityFactsInput } from "../../src/utils/eligibility/eligibilityFacts";

const REFERENCE_DATE = new Date(2026, 9, 28);

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

// Age tests
describe("Eligibility Facts - Age", () => {
  test("calculates completed age correctly", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.age).toBe(65);
    expect(facts.ageByBirthYear).toBe(65);
  });

  test("distinguishes completed age from birth-year age", () => {
    const applicant = createApplicant({
      profile: {
        date_of_birth: "1966-12-15",
        citizenship: "Malaysian",
        marital_status: "single",
        is_student: false,
        study_mode: null,
      },
    });

    const facts = buildEligibilityFacts(
        applicant,
        REFERENCE_DATE
    );

    expect(facts.age).toBe(59);
    expect(facts.ageByBirthYear).toBe(60);
  });

  test("returns null for invalid date of birth", () => {
    const applicant = createApplicant({
      profile: {
        date_of_birth: "1961-02-30",
        citizenship: "Malaysian",
        marital_status: "single",
        is_student: false,
        study_mode: null,
      },
    });

    const facts = buildEligibilityFacts(
        applicant,
        REFERENCE_DATE
    );

    expect(facts.age).toBeNull();
    expect(facts.ageByBirthYear).toBeNull();
  });

  test("returns null for future date of birth", () => {
    const applicant = createApplicant({
      profile: {
        date_of_birth: "2030-01-01",
        citizenship: "Malaysian",
        marital_status: "single",
        is_student: false,
        study_mode: null,
      },
    });

    const facts = buildEligibilityFacts(
        applicant,
        REFERENCE_DATE
    );

    expect(facts.age).toBeNull();
    expect(facts.ageByBirthYear).toBeNull();
  });
});

// Personal information
describe("Eligibility Facts - Personal Information", () => {
  test("maps citizenship correctly", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.citizenship).toBe("Malaysian");
  });

  test("maps residence information correctly", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.residenceCountry).toBe("Malaysia");
    expect(facts.state).toBe("Selangor");
  });

  test("preserves unknown residence information", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          address: null,
        }),
        REFERENCE_DATE
    );

    expect(facts.residenceCountry).toBeNull();
    expect(facts.state).toBeNull();
  });
});

// Household tests
describe("Eligibility Facts - Household", () => {
  test("calculates household size", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.householdSize).toBe(2);
  });

  test("counts dependent household members", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          householdMembers: [
            {
              relationship: "child",
              date_of_birth: "2010-01-01",
              is_dependent: true,
            },
            {
              relationship: "parent",
              date_of_birth: "1940-01-01",
              is_dependent: false,
            },
          ],
        }),
        REFERENCE_DATE
    );

    expect(facts.householdSize).toBe(3);
    expect(facts.numberOfDependents).toBe(1);
  });

  test("returns null when dependent status is unknown", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          householdMembers: [
            {
              relationship: "child",
              date_of_birth: "2010-01-01",
              is_dependent: null,
            },
          ],
        }),
        REFERENCE_DATE
    );

    expect(facts.numberOfDependents).toBeNull();
  });

  test("recognizes recorded children", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.hasChildren).toBe(true);
  });

  test("does not assume absence of children", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          householdMembers: [],
        }),
        REFERENCE_DATE
    );

    expect(facts.hasChildren).toBeNull();
  });
});

// Financial tests
describe("Eligibility Facts - Financial Information", () => {
  test("calculates per-capita household income", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.monthlyHouseholdIncome).toBe(1000);
    expect(facts.householdSize).toBe(2);
    expect(facts.perCapitaHouseholdIncome).toBe(500);
  });

  test("calculates per-capita income for larger households", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          householdMembers: [
            {
              relationship: "child",
              date_of_birth: "2010-01-01",
              is_dependent: true,
            },
            {
              relationship: "child",
              date_of_birth: "2012-01-01",
              is_dependent: true,
            },
            {
              relationship: "parent",
              date_of_birth: "1940-01-01",
              is_dependent: false,
            },
          ],
        }),
        REFERENCE_DATE
    );

    expect(facts.householdSize).toBe(4);
    expect(facts.perCapitaHouseholdIncome).toBe(250);
  });

  test("preserves missing income as null", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          financialProfile: null,
        }),
        REFERENCE_DATE
    );

    expect(facts.monthlyPersonalIncome).toBeNull();
    expect(facts.monthlyHouseholdIncome).toBeNull();
    expect(facts.perCapitaHouseholdIncome).toBeNull();
  });
});

// Student tests
describe("Eligibility Facts - Student Information", () => {
  test("identifies a full-time student", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          profile: {
            date_of_birth: "1961-05-15",
            citizenship: "Malaysian",
            marital_status: "single",
            is_student: true,
            study_mode: "full_time",
          },
        }),
        REFERENCE_DATE
    );

    expect(facts.isFullTimeStudent).toBe(true);
  });

  test("identifies a non-student", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.isFullTimeStudent).toBe(false);
  });

  test("preserves unknown student status", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          profile: {
            date_of_birth: "1961-05-15",
            citizenship: "Malaysian",
            marital_status: "single",
            is_student: null,
            study_mode: null,
          },
        }),
        REFERENCE_DATE
    );

    expect(facts.isFullTimeStudent).toBeNull();
  });
});

// Living arrangement tests
describe("Eligibility Facts - Living Arrangements", () => {
  test("identifies family dependency", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          livingArrangement: {
            lives_with_family: true,
            depends_on_family: true,
            depends_on_caregiver: false,
            is_in_institution: false,
            institution_type: null,
          },
        }),
        REFERENCE_DATE
    );

    expect(facts.dependsOnFamilyOrCaregiver).toBe(true);
  });

  test("identifies no family or caregiver dependency", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.dependsOnFamilyOrCaregiver).toBe(false);
  });

  test("preserves unknown institution status", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          livingArrangement: null,
        }),
        REFERENCE_DATE
    );

    expect(facts.residesInExcludedInstitution).toBeNull();
  });

  test("identifies applicant outside an institution", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.residesInExcludedInstitution).toBe(false);
  });
});

// Health tests
describe("Eligibility Facts - Health Information", () => {
  test("maps OKU information correctly", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          healthProfile: {
            is_oku: true,
            oku_registered: true,
            has_chronic_illness: false,
            is_bedridden: false,
            requires_continuous_treatment: false,
            treatment_start_date: null,
          },
        }),
        REFERENCE_DATE
    );

    expect(facts.isOku).toBe(true);
    expect(facts.okuRegistered).toBe(true);
  });

  test("calculates completed treatment months", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          healthProfile: {
            is_oku: false,
            oku_registered: false,
            has_chronic_illness: true,
            is_bedridden: false,
            requires_continuous_treatment: true,
            treatment_start_date: "2026-04-28",
          },
        }),
        REFERENCE_DATE
    );

    expect(facts.continuousTreatmentMonths).toBe(6);
  });
});

// Caregiver tests
describe("Eligibility Facts - Caregivers", () => {
  test("identifies a recorded caregiver", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          caregivers: [
            {
              citizenship: "Malaysian",
              provides_intensive_care: true,
            },
          ],
        }),
        REFERENCE_DATE
    );

    expect(facts.hasCaregiver).toBe(true);
    expect(facts.caregiverCitizenship).toBe("Malaysian");
    expect(facts.caregiverProvidesIntensiveCare).toBe(true);
  });

  test("does not assume absence of caregiver", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          caregivers: [],
        }),
        REFERENCE_DATE
    );

    expect(facts.hasCaregiver).toBeNull();
  });
});

// Welfare assistance tests
describe("Eligibility Facts - Welfare Assistance", () => {
  test("identifies active JKM monthly assistance", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          welfareAssistance: [
            {
              program_name: "Test Assistance",
              agency: "JKM",
              assistance_type: "monthly",
              is_active: true,
              start_date: "2026-01-01",
              end_date: null,
            },
          ],
        }),
        REFERENCE_DATE
    );

    expect(facts.receivesJkmMonthlyAssistance).toBe(true);
  });

  test("does not count inactive JKM assistance", () => {
    const facts = buildEligibilityFacts(
        createApplicant({
          welfareAssistance: [
            {
              program_name: "Test Assistance",
              agency: "JKM",
              assistance_type: "monthly",
              is_active: false,
              start_date: "2026-01-01",
              end_date: null,
            },
          ],
        }),
        REFERENCE_DATE
    );

    expect(facts.receivesJkmMonthlyAssistance).toBe(false);
  });

  test("preserves unknown assistance status", () => {
    const facts = buildEligibilityFacts(
        createApplicant(),
        REFERENCE_DATE
    );

    expect(facts.receivesJkmMonthlyAssistance).toBeNull();
  });
});
