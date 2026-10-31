import { supabaseTestClient } from "../helpers/supabaseTestClient";
import { buildEligibilityFacts } from "../../src/utils/eligibility/eligibilityFacts";
import { getApplicantEligibilityData } from "../../src/services/eligibility/eligibilityDataService";

jest.mock("../../src/lib/supabase", () => {
  const { supabaseTestClient } = jest.requireActual(
      "../helpers/supabaseTestClient"
  );

  return {
    supabase: supabaseTestClient,
  };
});
const TEST_EMAIL = process.env.TEST_APPLICANT_EMAIL;
const TEST_PASSWORD = process.env.TEST_APPLICANT_PASSWORD;

function expectedCitizenship(
    value: string | null
): string | null {
  if (!value) {
    return null;
  }

  switch (value.trim().toLowerCase()) {
    case "malaysian":
      return "Malaysian";

    case "non_malaysian":
      return "Non-Malaysian";

    default:
      return null;
  }
}

function expectedCountry(
    value: string | null
): string | null {
  if (!value) {
    return null;
  }

  switch (value.trim().toUpperCase()) {
    case "MY":
    case "MALAYSIA":
      return "Malaysia";

    default:
      return null;
  }
}

function expectedNumber(
    value: string | number | null | undefined
): number | null {
  if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
      ? number
      : null;
}

async function getTestUser() {
  const {
    data: { user },
    error,
  } = await supabaseTestClient.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("No authenticated test user.");
  }

  return user;
}

async function getTestProfileId(): Promise<string> {
  const user = await getTestUser();

  const { data: profile, error } =
      await supabaseTestClient
          .from("profiles")
          .select("id, user_id")
          .eq("user_id", user.id)
          .single();

  if (error) {
    throw error;
  }

  if (!profile) {
    throw new Error("Test applicant profile not found.");
  }

  if (profile.user_id !== user.id) {
    throw new Error(
        "Profile does not belong to authenticated test user."
    );
  }

  return profile.id;
}

describe("BantuanKu - Real Supabase Eligibility Data", () => {
  beforeAll(async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      throw new Error(
          "Missing TEST_APPLICANT_EMAIL or TEST_APPLICANT_PASSWORD."
      );
    }

    const { data, error } =
        await supabaseTestClient.auth.signInWithPassword({
          email: TEST_EMAIL.trim(),
          password: TEST_PASSWORD,
        });

    if (error) {
      throw new Error(
          `Supabase test authentication failed: ${error.message}`
      );
    }

    if (!data.user || !data.session) {
      throw new Error(
          "Authentication returned no user or session."
      );
    }
  });

  afterAll(async () => {
    await supabaseTestClient.auth.signOut();
  });

  test("SUP-000 - Production Supabase module uses test client", () => {
    const { supabase } = require("../../src/lib/supabase");

    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();

    expect(supabase).toBe(supabaseTestClient);
  });

  test(
      "SUP-001 - Authenticated test applicant exists",
      async () => {
        const {
          data: { user },
          error,
        } = await supabaseTestClient.auth.getUser();

        expect(error).toBeNull();

        expect(user).not.toBeNull();

        expect(user?.email).toBe(TEST_EMAIL!.trim());
      }
  );

  test(
      "SUP-002 - Authenticated user has a linked profile",
      async () => {
        const user = await getTestUser();

        const { data: profile, error } =
            await supabaseTestClient
                .from("profiles")
                .select("id, user_id")
                .eq("user_id", user.id)
                .single();

        expect(error).toBeNull();

        expect(profile).not.toBeNull();

        expect(profile?.id).toBeTruthy();

        expect(profile?.user_id).toBe(user.id);
      }
  );

  test(
      "SUP-003 - Production service retrieves actual profile information",
      async () => {
        const profileId = await getTestProfileId();

        const { data: profile, error } =
            await supabaseTestClient
                .from("profiles")
                .select(`
            date_of_birth,
            citizenship,
            marital_status,
            is_student,
            study_mode
          `)
                .eq("id", profileId)
                .single();

        expect(error).toBeNull();

        expect(profile).not.toBeNull();

        const applicant =
            await getApplicantEligibilityData();

        expect(applicant.profile).toBeDefined();

        expect(
            applicant.profile.date_of_birth
        ).toBe(profile!.date_of_birth);

        expect(
            applicant.profile.citizenship
        ).toBe(
            expectedCitizenship(profile!.citizenship)
        );

        expect(
            applicant.profile.marital_status
        ).toBe(profile!.marital_status);

        expect(
            applicant.profile.is_student
        ).toBe(profile!.is_student);

        expect(
            applicant.profile.study_mode
        ).toBe(profile!.study_mode);
      }
  );

  test(
      "SUP-004 - Production service retrieves residential address",
      async () => {
        const profileId = await getTestProfileId();

        const { data: address, error } =
            await supabaseTestClient
                .from("addresses")
                .select(`
            state_territory,
            country_code
          `)
                .eq("profile_id", profileId)
                .eq("address_type", "residential")
                .eq("is_primary", true)
                .maybeSingle();

        expect(error).toBeNull();

        const applicant =
            await getApplicantEligibilityData();

        if (!address) {
          expect(applicant.address).toBeNull();

          return;
        }

        expect(applicant.address).not.toBeNull();

        expect(
            applicant.address?.state_territory
        ).toBe(address.state_territory);

        expect(
            applicant.address?.country_code
        ).toBe(
            expectedCountry(address.country_code)
        );
      }
  );

  test(
      "SUP-005 - Production service retrieves financial information",
      async () => {
        const profileId = await getTestProfileId();

        const { data: financial, error } =
            await supabaseTestClient
                .from("financial_profiles")
                .select(`
            monthly_personal_income,
            monthly_household_income
          `)
                .eq("profile_id", profileId)
                .maybeSingle();

        expect(error).toBeNull();

        const applicant =
            await getApplicantEligibilityData();

        if (!financial) {
          expect(
              applicant.financialProfile
          ).toBeNull();

          return;
        }

        expect(
            applicant.financialProfile
        ).not.toBeNull();

        expect(
            applicant.financialProfile
                ?.monthly_personal_income
        ).toBe(
            expectedNumber(
                financial.monthly_personal_income
            )
        );

        expect(
            applicant.financialProfile
                ?.monthly_household_income
        ).toBe(
            expectedNumber(
                financial.monthly_household_income
            )
        );
      }
  );

  test(
      "SUP-006 - Household records belong to authenticated applicant",
      async () => {
        const profileId = await getTestProfileId();

        const { data: household, error } =
            await supabaseTestClient
                .from("household_members")
                .select(`
            profile_id,
            relationship,
            date_of_birth,
            is_dependent
          `)
                .eq("profile_id", profileId);

        expect(error).toBeNull();

        expect(household).not.toBeNull();

        for (const member of household ?? []) {
          expect(
              member.profile_id
          ).toBe(profileId);
        }

        const applicant =
            await getApplicantEligibilityData();

        const expectedMembers =
            (household ?? []).map((member) => ({
              relationship: member.relationship,
              date_of_birth: member.date_of_birth,
              is_dependent: member.is_dependent,
            }));

        expect(
            applicant.householdMembers
        ).toEqual(
            expect.arrayContaining(expectedMembers)
        );

        expect(
            applicant.householdMembers
        ).toHaveLength(expectedMembers.length);
      }
  );

  test(
      "SUP-007 - Actual applicant data generates eligibility facts",
      async () => {
        const applicant =
            await getApplicantEligibilityData();

        const facts =
            buildEligibilityFacts(applicant);

        expect(facts).toBeDefined();

        expect(
            facts.citizenship
        ).toBe(
            applicant.profile.citizenship
        );

        expect(
            facts.residenceCountry
        ).toBe(
            applicant.address?.country_code ?? null
        );

        expect(
            facts.monthlyHouseholdIncome
        ).toBe(
            applicant.financialProfile
                ?.monthly_household_income ?? null
        );

        if (applicant.profile.date_of_birth) {
          const birthYear = Number(
              applicant.profile.date_of_birth.substring(0, 4)
          );

          const expectedAgeByBirthYear =
              new Date().getFullYear() - birthYear;

          expect(
              facts.ageByBirthYear
          ).toBe(expectedAgeByBirthYear);
        } else {
          expect(
              facts.ageByBirthYear
          ).toBeNull();
        }
      }
  );

  test(
      "SUP-008 - Production service retrieves complete applicant data",
      async () => {
        const applicant =
            await getApplicantEligibilityData();

        expect(applicant).toBeDefined();

        expect(applicant.profile).toBeDefined();

        expect(
            Array.isArray(applicant.householdMembers)
        ).toBe(true);

        expect(
            Array.isArray(applicant.caregivers)
        ).toBe(true);

        expect(
            Array.isArray(applicant.welfareAssistance)
        ).toBe(true);

        expect(
            applicant.address === null ||
            typeof applicant.address === "object"
        ).toBe(true);

        expect(
            applicant.financialProfile === null ||
            typeof applicant.financialProfile === "object"
        ).toBe(true);

        expect(
            applicant.healthProfile === null ||
            typeof applicant.healthProfile === "object"
        ).toBe(true);

        expect(
            applicant.livingArrangement === null ||
            typeof applicant.livingArrangement === "object"
        ).toBe(true);
      }
  );
});
