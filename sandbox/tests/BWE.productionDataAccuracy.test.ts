import { getApplicantEligibilityData } from "../../src/services/eligibility/eligibilityDataService";
import { buildEligibilityFacts, type EligibilityFactsInput } from "../../src/utils/eligibility/eligibilityFacts";
import { adaptJkmEligibilityResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../src/utils/eligibility/eligibilityEngine";
import type { JkmEligibilityApiResponse } from "../../src/adapters/jkmEligibilityAdapter";
import { supabase } from "../../src/lib/supabase";
import { getCurrentProfileId } from "../../src/services/profile/profileService";
import { bweApiResponse } from "../fixtures/bweApiResponse";

jest.mock("../../src/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../src/services/profile/profileService", () => ({
  getCurrentProfileId: jest.fn(),
}));

const mockedFrom = supabase.from as jest.Mock;
const mockedGetCurrentProfileId = getCurrentProfileId as jest.Mock;

const PROFILE_ID = "bwe-production-accuracy-profile";
const REFERENCE_DATE = new Date(2026, 9, 30);

type MockTableName =
    | "profiles"
    | "addresses"
    | "financial_profiles"
    | "household_members"
    | "health_profiles"
    | "living_arrangements"
    | "caregivers"
    | "welfare_assistance";

type MockRow = Record<string, unknown>;

type MockTableValue =
    | MockRow
    | MockRow[]
    | null;

type MockDatabase = Record<MockTableName, MockTableValue>;
type MockErrorTable = MockTableName | null;

function createDefaultDatabase(): MockDatabase {
  return {
    profiles: {
      id: PROFILE_ID,
      date_of_birth: "1960-05-15",
      citizenship: "Malaysian",
      marital_status: "single",
      is_student: false,
      study_mode: null,
    },

    addresses: {
      profile_id: PROFILE_ID,
      address_type: "residential",
      is_primary: true,
      state_territory: "Selangor",
      country_code: "MY",
    },

    financial_profiles: {
      profile_id: PROFILE_ID,
      monthly_personal_income: 500,
      monthly_household_income: 1000,
    },

    household_members: [],

    health_profiles: {
      profile_id: PROFILE_ID,
      is_oku: false,
      oku_registered: false,
      has_chronic_illness: false,
      is_bedridden: false,
      requires_continuous_treatment: false,
      treatment_start_date: null,
    },

    living_arrangements: {
      profile_id: PROFILE_ID,
      lives_with_family: false,
      depends_on_family: false,
      depends_on_caregiver: false,
      is_in_institution: false,
      institution_type: null,
    },

    caregivers: [],

    welfare_assistance: [],
  };
}

let mockDatabase: MockDatabase;
let mockErrorTable: MockErrorTable = null;

function createQueryBuilder(tableName: MockTableName) {
  const filters: Array<{
    column: string;
    value: unknown;
  }> = [];

  function getRows(): MockRow[] {
    const tableData = mockDatabase[tableName];

    if (tableData === null) {
      return [];
    }

    const rows = Array.isArray(tableData)
        ? tableData
        : [tableData];

    return rows.filter((row) =>
        filters.every(({ column, value }) => {
          if (
              tableName === "profiles" &&
              column === "id"
          ) {
            return row.id === value;
          }

          return row[column] === value;
        })
    );
  }

  function getError() {
    if (mockErrorTable !== tableName) {
      return null;
    }

    return {
      message: `Mocked Supabase error: ${tableName}`,
      code: "MOCK_ERROR",
    };
  }

  const builder = {
    select: jest.fn(),

    eq: jest.fn(),

    single: jest.fn(async () => {
      const error = getError();

      if (error) {
        return {
          data: null,
          error,
        };
      }

      const rows = getRows();

      if (rows.length !== 1) {
        return {
          data: null,
          error: {
            message: `Expected one row, received ${rows.length}`,
            code: "PGRST116",
          },
        };
      }

      return {
        data: rows[0],
        error: null,
      };
    }),

    maybeSingle: jest.fn(async () => {
      const error = getError();

      if (error) {
        return {
          data: null,
          error,
        };
      }

      const rows = getRows();

      if (rows.length > 1) {
        return {
          data: null,
          error: {
            message: "Multiple rows returned",
            code: "PGRST116",
          },
        };
      }

      return {
        data: rows[0] ?? null,
        error: null,
      };
    }),

    then: (
        resolve: (
            value: {
              data: MockRow[] | null;
              error: ReturnType<typeof getError>;
            }
        ) => unknown,
        reject?: (reason: unknown) => unknown
    ) => {
      const error = getError();

      return Promise.resolve({
        data: error ? null : getRows(),
        error,
      }).then(resolve, reject);
    },
  };

  builder.select.mockImplementation(() => builder);

  builder.eq.mockImplementation(
      (column: string, value: unknown) => {
        filters.push({ column, value });
        return builder;
      }
  );

  return builder;
}

function updateTable(
    table: MockTableName,
    value: MockTableValue
): void {
  mockDatabase[table] = value;
}

function updateProfile(
    changes: Record<string, unknown>
): void {
  mockDatabase.profiles = {
    ...(mockDatabase.profiles as MockRow),
    ...changes,
  };
}

function updateAddress(
    changes: Record<string, unknown>
): void {
  mockDatabase.addresses = {
    ...(mockDatabase.addresses as MockRow),
    ...changes,
  };
}

function updateFinancialProfile(
    changes: Record<string, unknown>
): void {
  mockDatabase.financial_profiles = {
    ...(mockDatabase.financial_profiles as MockRow),
    ...changes,
  };
}

function updateLivingArrangement(
    changes: Record<string, unknown>
): void {
  mockDatabase.living_arrangements = {
    ...(mockDatabase.living_arrangements as MockRow),
    ...changes,
  };
}

function createHouseholdMember(
    changes: Record<string, unknown> = {}
): MockRow {
  return {
    profile_id: PROFILE_ID,
    relationship: "other",
    date_of_birth: "1990-01-01",
    is_dependent: false,
    ...changes,
  };
}

async function loadApplicantData(): Promise<EligibilityFactsInput> {
  return getApplicantEligibilityData();
}

async function loadFacts() {
  const applicantData = await loadApplicantData();

  return buildEligibilityFacts(
      applicantData,
      REFERENCE_DATE
  );
}

async function evaluateBwe() {
  const facts = await loadFacts();

  const rules = adaptJkmEligibilityResponse(
      bweApiResponse as JkmEligibilityApiResponse,
      "BWE"
  );

  const result = evaluateProgramEligibility(
      "BWE",
      rules,
      facts,
      {}
  );

  return {
    facts,
    rules,
    result,
  };
}

beforeEach(() => {
  jest.clearAllMocks();

  mockDatabase = createDefaultDatabase();
  mockErrorTable = null;

  mockedGetCurrentProfileId.mockResolvedValue(
      PROFILE_ID
  );

  mockedFrom.mockImplementation(
      (tableName: MockTableName) =>
          createQueryBuilder(tableName)
  );
});

describe("PDA-001 — Malaysian residence normalization", () => {
  it.each([
    "MY",
    "my",
    " MY ",
    "Malaysia",
    "MALAYSIA",
    " malaysia ",
  ])(
      "normalizes %p to Malaysia",
      async (countryCode) => {
        updateAddress({
          country_code: countryCode,
        });

        const facts = await loadFacts();

        expect(facts.residenceCountry).toBe(
            "Malaysia"
        );
      }
  );
});

describe("PDA-002 — Foreign residence", () => {
  it.each([
    ["SG", "SG"],
    ["sg", "SG"],
    [" SG ", "SG"],
    ["US", "US"],
    ["AU", "AU"],
  ])(
      "normalizes %p to %p",
      async (input, expected) => {
        updateAddress({
          country_code: input,
        });

        const facts = await loadFacts();

        expect(facts.residenceCountry).toBe(
            expected
        );
      }
  );
});

describe("PDA-003 — Invalid country codes", () => {
  it.each([
    "XX",
    "ZZ",
    "UNKNOWN",
    "N/A",
    "NA",
    "NOT A COUNTRY",
    "",
    "   ",
  ])(
      "normalizes invalid country %p to null",
      async (countryCode) => {
        updateAddress({
          country_code: countryCode,
        });

        const facts = await loadFacts();

        expect(facts.residenceCountry).toBeNull();
      }
  );
});

describe("PDA-004 — Missing residential address", () => {
  it("does not assume Malaysian residence", async () => {
    updateTable("addresses", null);

    const facts = await loadFacts();

    expect(facts.residenceCountry).toBeNull();
    expect(facts.state).toBeNull();
  });

  it("ignores non-primary addresses", async () => {
    updateAddress({
      is_primary: false,
    });

    const facts = await loadFacts();

    expect(facts.residenceCountry).toBeNull();
  });

  it("ignores non-residential addresses", async () => {
    updateAddress({
      address_type: "mailing",
    });

    const facts = await loadFacts();

    expect(facts.residenceCountry).toBeNull();
  });
});

describe("PDA-005 — Completed age before birthday", () => {
  it("distinguishes completed age from birth-year age", async () => {
    updateProfile({
      date_of_birth: "1966-12-15",
    });

    const facts = await loadFacts();

    expect(facts.age).toBe(59);
    expect(facts.ageByBirthYear).toBe(60);
  });
});

describe("PDA-006 — Exactly 60th birthday", () => {
  it("returns 60 for both age calculations", async () => {
    updateProfile({
      date_of_birth: "1966-10-30",
    });

    const facts = await loadFacts();

    expect(facts.age).toBe(60);
    expect(facts.ageByBirthYear).toBe(60);
  });
});

describe("PDA-007 — Invalid birth dates", () => {
  it.each([
    "2026-02-30",
    "2025-02-29",
    "INVALID",
    "1966-13-01",
    "1966-00-01",
    "1966-04-31",
  ])(
      "returns unknown ages for %p",
      async (dateOfBirth) => {
        updateProfile({
          date_of_birth: dateOfBirth,
        });

        const facts = await loadFacts();

        expect(facts.age).toBeNull();
        expect(facts.ageByBirthYear).toBeNull();
      }
  );
});

describe("PDA-008 — Future birth date", () => {
  it("does not calculate an age for a future DOB", async () => {
    updateProfile({
      date_of_birth: "2027-01-01",
    });

    const facts = await loadFacts();

    expect(facts.age).toBeNull();
    expect(facts.ageByBirthYear).toBeNull();
  });
});

describe("PDA-009 — Valid leap-year date", () => {
  it("accepts February 29, 2000", async () => {
    updateProfile({
      date_of_birth: "2000-02-29",
    });

    const facts = await loadFacts();

    expect(facts.age).toBe(26);
    expect(facts.ageByBirthYear).toBe(26);
  });
});

describe("PDA-010 — Whitespace around dates", () => {
  it("parses a valid trimmed DOB", async () => {
    updateProfile({
      date_of_birth: " 1966-10-30 ",
    });

    const facts = await loadFacts();

    expect(facts.age).toBe(60);
    expect(facts.ageByBirthYear).toBe(60);
  });
});

describe("PDA-011 — Household size", () => {
  it("includes the applicant in household size", async () => {
    updateTable("household_members", [
      createHouseholdMember({
        relationship: "spouse",
      }),
      createHouseholdMember({
        relationship: "child",
      }),
      createHouseholdMember({
        relationship: "parent",
      }),
    ]);

    const facts = await loadFacts();

    expect(facts.householdSize).toBe(4);
  });

  it("counts the applicant when no other members are recorded", async () => {
    updateTable("household_members", []);

    const facts = await loadFacts();

    expect(facts.householdSize).toBe(1);
  });
});

describe("PDA-012 — Per-capita income", () => {
  it("calculates RM1200 / 4 = RM300", async () => {
    updateFinancialProfile({
      monthly_household_income: 1200,
    });

    updateTable("household_members", [
      createHouseholdMember(),
      createHouseholdMember(),
      createHouseholdMember(),
    ]);

    const facts = await loadFacts();

    expect(facts.householdSize).toBe(4);

    expect(
        facts.monthlyHouseholdIncome
    ).toBe(1200);

    expect(
        facts.perCapitaHouseholdIncome
    ).toBe(300);
  });
});

describe("PDA-013 — Missing financial information", () => {
  it("preserves unknown income as null", async () => {
    updateTable("financial_profiles", null);

    const facts = await loadFacts();

    expect(
        facts.monthlyPersonalIncome
    ).toBeNull();

    expect(
        facts.monthlyHouseholdIncome
    ).toBeNull();

    expect(
        facts.perCapitaHouseholdIncome
    ).toBeNull();
  });

  it("does not convert invalid income to zero", async () => {
    updateFinancialProfile({
      monthly_personal_income: "INVALID",
      monthly_household_income: "",
    });

    const facts = await loadFacts();

    expect(
        facts.monthlyPersonalIncome
    ).toBeNull();

    expect(
        facts.monthlyHouseholdIncome
    ).toBeNull();

    expect(
        facts.perCapitaHouseholdIncome
    ).toBeNull();
  });
});

describe("PDA-014 — Zero household income", () => {
  it("preserves numeric zero", async () => {
    updateFinancialProfile({
      monthly_personal_income: 0,
      monthly_household_income: 0,
    });

    const facts = await loadFacts();

    expect(
        facts.monthlyPersonalIncome
    ).toBe(0);

    expect(
        facts.monthlyHouseholdIncome
    ).toBe(0);

    expect(
        facts.perCapitaHouseholdIncome
    ).toBe(0);
  });

  it("preserves numeric string zero", async () => {
    updateFinancialProfile({
      monthly_personal_income: "0",
      monthly_household_income: "0",
    });

    const facts = await loadFacts();

    expect(
        facts.monthlyPersonalIncome
    ).toBe(0);

    expect(
        facts.monthlyHouseholdIncome
    ).toBe(0);
  });
});

describe("PDA-015 — Dependent household members", () => {
  it("counts confirmed dependents", async () => {
    updateTable("household_members", [
      createHouseholdMember({
        is_dependent: true,
      }),
      createHouseholdMember({
        is_dependent: true,
      }),
      createHouseholdMember({
        is_dependent: false,
      }),
    ]);

    const facts = await loadFacts();

    expect(facts.numberOfDependents).toBe(2);
  });

  it("preserves uncertainty when dependency is unknown", async () => {
    updateTable("household_members", [
      createHouseholdMember({
        is_dependent: true,
      }),
      createHouseholdMember({
        is_dependent: null,
      }),
    ]);

    const facts = await loadFacts();

    expect(
        facts.numberOfDependents
    ).toBeNull();
  });
});

describe("PDA-016 — Children information", () => {
  it("confirms children when a child is recorded", async () => {
    updateTable("household_members", [
      createHouseholdMember({
        relationship: "child",
      }),
    ]);

    const facts = await loadFacts();

    expect(facts.hasChildren).toBe(true);
  });

  it("does not infer no children from missing records", async () => {
    updateTable("household_members", []);

    const facts = await loadFacts();

    expect(facts.hasChildren).toBeNull();
  });

  it.each(["son", "daughter", " CHILD "])(
      "recognizes relationship %p",
      async (relationship) => {
        updateTable("household_members", [
          createHouseholdMember({
            relationship,
          }),
        ]);

        const facts = await loadFacts();

        expect(facts.hasChildren).toBe(true);
      }
  );
});

describe("PDA-017 — Family/caregiver dependency", () => {
  it("returns true for family dependency", async () => {
    updateLivingArrangement({
      depends_on_family: true,
      depends_on_caregiver: false,
    });

    const facts = await loadFacts();

    expect(
        facts.dependsOnFamilyOrCaregiver
    ).toBe(true);
  });

  it("returns true for caregiver dependency", async () => {
    updateLivingArrangement({
      depends_on_family: false,
      depends_on_caregiver: true,
    });

    const facts = await loadFacts();

    expect(
        facts.dependsOnFamilyOrCaregiver
    ).toBe(true);
  });

  it("returns false when both dependencies are false", async () => {
    updateLivingArrangement({
      depends_on_family: false,
      depends_on_caregiver: false,
    });

    const facts = await loadFacts();

    expect(
        facts.dependsOnFamilyOrCaregiver
    ).toBe(false);
  });

  it("returns null when dependency cannot be established", async () => {
    updateLivingArrangement({
      depends_on_family: false,
      depends_on_caregiver: null,
    });

    const facts = await loadFacts();

    expect(
        facts.dependsOnFamilyOrCaregiver
    ).toBeNull();
  });
});

describe("PDA-018 — Institution exclusion", () => {
  it("confirms no exclusion for non-institutional residence", async () => {
    updateLivingArrangement({
      is_in_institution: false,
    });

    const facts = await loadFacts();

    expect(
        facts.residesInExcludedInstitution
    ).toBe(false);
  });

  it("does not automatically exclude all institutions", async () => {
    updateLivingArrangement({
      is_in_institution: true,
      institution_type: "other",
    });

    const facts = await loadFacts();

    expect(
        facts.residesInExcludedInstitution
    ).toBeNull();
  });

  it("preserves unknown institution information", async () => {
    updateTable("living_arrangements", null);

    const facts = await loadFacts();

    expect(
        facts.residesInExcludedInstitution
    ).toBeNull();
  });
});

describe("PDA-019 — Alternative BWE pathway limitations", () => {
  it("does not fabricate absence of children", async () => {
    updateTable("household_members", []);

    const facts = await loadFacts();

    expect(facts.hasChildren).toBeNull();
  });

  it("does not fabricate family income relative to PGK", async () => {
    const facts = await loadFacts();

    expect(
        facts.familyOrCaregiverIncomeExceedsPgk
    ).toBeNull();
  });

  it("does not infer PGK eligibility from household income", async () => {
    updateFinancialProfile({
      monthly_household_income: 0,
    });

    const facts = await loadFacts();

    expect(
        facts.familyOrCaregiverIncomeExceedsPgk
    ).toBeNull();
  });
});

describe("PDA-020 — End-to-end BWE assessment", () => {
  it("evaluates a qualifying Malaysian applicant", async () => {
    updateProfile({
      citizenship: "Malaysian",
      date_of_birth: "1960-05-15",
    });

    updateAddress({
      country_code: "MY",
    });

    updateFinancialProfile({
      monthly_household_income: 1000,
    });

    updateLivingArrangement({
      is_in_institution: false,
    });

    const { facts, rules, result } =
        await evaluateBwe();

    expect(facts.citizenship).toBe(
        "Malaysian"
    );

    expect(facts.residenceCountry).toBe(
        "Malaysia"
    );

    expect(facts.ageByBirthYear).toBeGreaterThanOrEqual(
        60
    );

    expect(
        facts.monthlyHouseholdIncome
    ).toBe(1000);

    expect(
        facts.residesInExcludedInstitution
    ).toBe(false);

    expect(rules.length).toBeGreaterThan(0);

    expect(result.status).toBe(
        "potentially_eligible"
    );
  });

  it("rejects a known foreign residence condition", async () => {
    updateAddress({
      country_code: "SG",
    });

    const { facts, result } =
        await evaluateBwe();

    expect(facts.residenceCountry).toBe("SG");

    expect(result.status).toBe(
        "potentially_ineligible"
    );
  });

  it("preserves uncertainty for unknown residence", async () => {
    updateTable("addresses", null);

    const { facts, result } =
        await evaluateBwe();

    expect(facts.residenceCountry).toBeNull();

    expect(result.status).not.toBe(
        "potentially_eligible"
    );

    expect(result.status).not.toBe(
        "potentially_ineligible"
    );

    expect([
      "manual_verification",
      "insufficient_information",
    ]).toContain(result.status);
  });
});

describe("Additional — Supabase error handling", () => {
  it("propagates profile query errors", async () => {
    mockErrorTable = "profiles";

    await expect(
        loadApplicantData()
    ).rejects.toBeTruthy();
  });

  it("propagates financial profile query errors", async () => {
    mockErrorTable = "financial_profiles";

    await expect(
        loadApplicantData()
    ).rejects.toBeTruthy();
  });

  it("propagates address query errors", async () => {
    mockErrorTable = "addresses";

    await expect(
        loadApplicantData()
    ).rejects.toBeTruthy();
  });
});
