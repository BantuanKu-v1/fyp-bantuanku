import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from "@jest/globals";
import {
  getPersonalInformation,
  updateMobileNumber,
  updateHomePhone,
  updatePersonalCircumstances,
  updateFinancialInformation,
  type PersonalCircumstancesInput,
  type FinancialInformationInput,
} from "../../../src/services/profile/personalInfoService";
import { supabase } from "../../../src/lib/supabase";

jest.mock("../../../src/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockGetUser = jest.mocked(supabase.auth.getUser);
const mockFrom = jest.mocked(supabase.from);

const USER_ID = "user-001";
const PROFILE_ID = "profile-001";

type MockQueryResult = {
  data?: unknown;
  error: Error | null;
};

const createMockQuery = () => {
  const query = {
    select: jest.fn<(...args: unknown[]) => unknown>(),
    eq: jest.fn<(...args: unknown[]) => unknown>(),
    update: jest.fn<(...args: unknown[]) => unknown>(),
    upsert: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
    single: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
    maybeSingle: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.update.mockReturnValue(query);

  return query;
};

const mockAuthenticatedUser = () => {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: USER_ID,
      },
    },
    error: null,
  } as never);
};

const mockUnauthenticatedUser = () => {
  mockGetUser.mockResolvedValue({
    data: {
      user: null,
    },
    error: null,
  } as never);
};

const mockAuthenticationError = (message: string) => {
  mockGetUser.mockResolvedValue({
    data: {
      user: null,
    },
    error: new Error(message),
  } as never);
};

const databaseProfile = () => ({
  id: PROFILE_ID,
  full_name: "Ahmad Bin Ali",
  identification_no: "990315-10-1235",
  date_of_birth: "1999-03-15",
  gender: "male",
  citizenship: "malaysian",
  marital_status: "married",
  mobile_phone: "0123456789",
  home_phone: "0312345678",
  employment_status: "employed",
  occupation: "Teacher",
  is_student: false,
  study_mode: null,
  institution_type: null,
});

const validCircumstances = (): PersonalCircumstancesInput => ({
  maritalStatus: "married",
  employmentStatus: "employed",
  occupation: "  Teacher  ",
  isStudent: false,
  studyMode: null,
  institutionType: null,
  isOku: false,
  okuRegistered: null,
});

const validFinancialInput = (): FinancialInformationInput => ({
  monthlyPersonalIncome: 3000,
  monthlyHouseholdIncome: 6000,
});

describe("Personal Information Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser();
  });

  describe("getPersonalInformation", () => {
    const setupPersonalInformationQueries = (
        options: {
          profile?: unknown;
          profileError?: Error | null;
          financial?: unknown;
          financialError?: Error | null;
          health?: unknown;
          healthError?: Error | null;
        } = {}
    ) => {
      const profileQuery = createMockQuery();
      const financialQuery = createMockQuery();
      const healthQuery = createMockQuery();

      profileQuery.single.mockResolvedValue({
        data:
            options.profile === undefined
                ? databaseProfile()
                : options.profile,
        error: options.profileError ?? null,
      });

      financialQuery.maybeSingle.mockResolvedValue({
        data:
            options.financial === undefined
                ? {
                  monthly_personal_income: 3000,
                  monthly_household_income: 6000,
                }
                : options.financial,
        error: options.financialError ?? null,
      });

      healthQuery.maybeSingle.mockResolvedValue({
        data:
            options.health === undefined
                ? {
                  is_oku: false,
                  oku_registered: null,
                }
                : options.health,
        error: options.healthError ?? null,
      });

      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return profileQuery as never;
        }

        if (table === "financial_profiles") {
          return financialQuery as never;
        }

        if (table === "health_profiles") {
          return healthQuery as never;
        }

        throw new Error(`Unexpected table: ${table}`);
      });

      return {
        profileQuery,
        financialQuery,
        healthQuery,
      };
    };

    it("should retrieve complete personal information", async () => {
      const {
        profileQuery,
        financialQuery,
        healthQuery,
      } = setupPersonalInformationQueries();

      const result = await getPersonalInformation();

      expect(result).toEqual({
        fullName: "Ahmad Bin Ali",
        identificationNumber: "990315-10-1235",
        dateOfBirth: "1999-03-15",
        gender: "male",
        citizenship: "malaysian",
        maritalStatus: "married",
        mobilePhone: "0123456789",
        homePhone: "0312345678",
        employmentStatus: "employed",
        occupation: "Teacher",
        isStudent: false,
        studyMode: null,
        institutionType: null,
        isOku: false,
        okuRegistered: null,
        monthlyPersonalIncome: 3000,
        monthlyHouseholdIncome: 6000,
      });

      expect(mockGetUser).toHaveBeenCalledTimes(1);

      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockFrom).toHaveBeenCalledWith("financial_profiles");
      expect(mockFrom).toHaveBeenCalledWith("health_profiles");

      expect(profileQuery.eq).toHaveBeenCalledWith(
          "user_id",
          USER_ID
      );

      expect(financialQuery.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );

      expect(healthQuery.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );
    });

    it("should preserve nullable profile fields", async () => {
      setupPersonalInformationQueries({
        profile: {
          ...databaseProfile(),
          gender: null,
          marital_status: null,
          mobile_phone: null,
          home_phone: null,
          employment_status: null,
          occupation: null,
          is_student: null,
          study_mode: null,
          institution_type: null,
        },
      });

      const result = await getPersonalInformation();

      expect(result.gender).toBeNull();
      expect(result.maritalStatus).toBeNull();
      expect(result.mobilePhone).toBeNull();
      expect(result.homePhone).toBeNull();
      expect(result.employmentStatus).toBeNull();
      expect(result.occupation).toBeNull();
      expect(result.isStudent).toBeNull();
      expect(result.studyMode).toBeNull();
      expect(result.institutionType).toBeNull();
    });

    it("should convert financial income strings into numbers", async () => {
      setupPersonalInformationQueries({
        financial: {
          monthly_personal_income: "2500.50",
          monthly_household_income: "7000.75",
        },
      });

      const result = await getPersonalInformation();

      expect(result.monthlyPersonalIncome).toBe(2500.5);
      expect(result.monthlyHouseholdIncome).toBe(7000.75);
    });

    it("should preserve zero income", async () => {
      setupPersonalInformationQueries({
        financial: {
          monthly_personal_income: 0,
          monthly_household_income: 0,
        },
      });

      const result = await getPersonalInformation();

      expect(result.monthlyPersonalIncome).toBe(0);
      expect(result.monthlyHouseholdIncome).toBe(0);
    });

    it("should return null when financial information does not exist", async () => {
      setupPersonalInformationQueries({
        financial: null,
      });

      const result = await getPersonalInformation();

      expect(result.monthlyPersonalIncome).toBeNull();
      expect(result.monthlyHouseholdIncome).toBeNull();
    });

    it("should preserve null financial income values", async () => {
      setupPersonalInformationQueries({
        financial: {
          monthly_personal_income: null,
          monthly_household_income: null,
        },
      });

      const result = await getPersonalInformation();

      expect(result.monthlyPersonalIncome).toBeNull();
      expect(result.monthlyHouseholdIncome).toBeNull();
    });

    it("should return null when health information does not exist", async () => {
      setupPersonalInformationQueries({
        health: null,
      });

      const result = await getPersonalInformation();

      expect(result.isOku).toBeNull();
      expect(result.okuRegistered).toBeNull();
    });

    it("should retrieve OKU information correctly", async () => {
      setupPersonalInformationQueries({
        health: {
          is_oku: true,
          oku_registered: true,
        },
      });

      const result = await getPersonalInformation();

      expect(result.isOku).toBe(true);
      expect(result.okuRegistered).toBe(true);
    });

    it("should preserve false OKU registration status", async () => {
      setupPersonalInformationQueries({
        health: {
          is_oku: true,
          oku_registered: false,
        },
      });

      const result = await getPersonalInformation();

      expect(result.isOku).toBe(true);
      expect(result.okuRegistered).toBe(false);
    });

    it("should throw when authentication fails", async () => {
      mockAuthenticationError("Authentication failed");

      await expect(getPersonalInformation()).rejects.toThrow(
          "Authentication failed"
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      await expect(getPersonalInformation()).rejects.toThrow(
          "No authenticated user."
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when the profile query fails", async () => {
      setupPersonalInformationQueries({
        profileError: new Error("Profile query failed"),
      });

      await expect(getPersonalInformation()).rejects.toThrow(
          "Profile query failed"
      );

      expect(mockFrom).not.toHaveBeenCalledWith(
          "financial_profiles"
      );

      expect(mockFrom).not.toHaveBeenCalledWith(
          "health_profiles"
      );
    });

    it("should throw when the financial query fails", async () => {
      setupPersonalInformationQueries({
        financialError: new Error("Financial query failed"),
      });

      await expect(getPersonalInformation()).rejects.toThrow(
          "Financial query failed"
      );
    });

    it("should throw when the health query fails", async () => {
      setupPersonalInformationQueries({
        healthError: new Error("Health query failed"),
      });

      await expect(getPersonalInformation()).rejects.toThrow(
          "Health query failed"
      );
    });

    it("should prioritize the financial error when both related queries fail", async () => {
      setupPersonalInformationQueries({
        financialError: new Error("Financial query failed"),
        healthError: new Error("Health query failed"),
      });

      await expect(getPersonalInformation()).rejects.toThrow(
          "Financial query failed"
      );
    });
  });

  describe("updateMobileNumber", () => {
    const setupUpdateQuery = (
        error: Error | null = null
    ) => {
      const query = createMockQuery();

      query.eq.mockReturnValue(
          Promise.resolve({
            data: null,
            error,
          })
      );

      mockFrom.mockReturnValue(query as never);

      return query;
    };

    it("should update a mobile number", async () => {
      const query = setupUpdateQuery();

      await expect(
          updateMobileNumber("0123456789")
      ).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith("profiles");

      expect(query.update).toHaveBeenCalledWith({
        mobile_phone: "0123456789",
      });

      expect(query.eq).toHaveBeenCalledWith(
          "user_id",
          USER_ID
      );
    });

    it("should remove hyphens from mobile numbers", async () => {
      const query = setupUpdateQuery();

      await updateMobileNumber("012-3456789");

      expect(query.update).toHaveBeenCalledWith({
        mobile_phone: "0123456789",
      });
    });

    it("should remove spaces from mobile numbers", async () => {
      const query = setupUpdateQuery();

      await updateMobileNumber("012 345 6789");

      expect(query.update).toHaveBeenCalledWith({
        mobile_phone: "0123456789",
      });
    });

    it("should remove other non-numeric characters", async () => {
      const query = setupUpdateQuery();

      await updateMobileNumber("(012) 345-6789");

      expect(query.update).toHaveBeenCalledWith({
        mobile_phone: "0123456789",
      });
    });

    it("should preserve leading zeros", async () => {
      const query = setupUpdateQuery();

      await updateMobileNumber("01112345678");

      expect(query.update).toHaveBeenCalledWith({
        mobile_phone: "01112345678",
      });
    });

    it("should store an empty string when given an empty input", async () => {
      const query = setupUpdateQuery();

      await updateMobileNumber("");

      expect(query.update).toHaveBeenCalledWith({
        mobile_phone: "",
      });
    });

    it("should throw when authentication fails", async () => {
      mockAuthenticationError("Authentication failed");

      await expect(
          updateMobileNumber("0123456789")
      ).rejects.toThrow("Authentication failed");

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      await expect(
          updateMobileNumber("0123456789")
      ).rejects.toThrow("No authenticated user.");
    });

    it("should throw when the update fails", async () => {
      setupUpdateQuery(new Error("Mobile update failed"));

      await expect(
          updateMobileNumber("0123456789")
      ).rejects.toThrow("Mobile update failed");
    });
  });

  describe("updateHomePhone", () => {
    const setupUpdateQuery = (
        error: Error | null = null
    ) => {
      const query = createMockQuery();

      query.eq.mockReturnValue(
          Promise.resolve({
            data: null,
            error,
          })
      );

      mockFrom.mockReturnValue(query as never);

      return query;
    };

    it("should update a home phone number", async () => {
      const query = setupUpdateQuery();

      await updateHomePhone("0312345678");

      expect(query.update).toHaveBeenCalledWith({
        home_phone: "0312345678",
      });

      expect(query.eq).toHaveBeenCalledWith(
          "user_id",
          USER_ID
      );
    });

    it("should remove hyphens from home phone numbers", async () => {
      const query = setupUpdateQuery();

      await updateHomePhone("03-12345678");

      expect(query.update).toHaveBeenCalledWith({
        home_phone: "0312345678",
      });
    });

    it("should remove spaces from home phone numbers", async () => {
      const query = setupUpdateQuery();

      await updateHomePhone("03 1234 5678");

      expect(query.update).toHaveBeenCalledWith({
        home_phone: "0312345678",
      });
    });

    it("should store null when home phone is null", async () => {
      const query = setupUpdateQuery();

      await updateHomePhone(null);

      expect(query.update).toHaveBeenCalledWith({
        home_phone: null,
      });
    });

    it("should store null when home phone is empty", async () => {
      const query = setupUpdateQuery();

      await updateHomePhone("");

      expect(query.update).toHaveBeenCalledWith({
        home_phone: null,
      });
    });

    it("should store null when home phone contains only whitespace", async () => {
      const query = setupUpdateQuery();

      await updateHomePhone("   ");

      expect(query.update).toHaveBeenCalledWith({
        home_phone: null,
      });
    });

    it("should throw when authentication fails", async () => {
      mockAuthenticationError("Authentication failed");

      await expect(
          updateHomePhone("0312345678")
      ).rejects.toThrow("Authentication failed");

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      await expect(
          updateHomePhone("0312345678")
      ).rejects.toThrow("No authenticated user.");
    });

    it("should throw when the update fails", async () => {
      setupUpdateQuery(new Error("Home phone update failed"));

      await expect(
          updateHomePhone("0312345678")
      ).rejects.toThrow("Home phone update failed");
    });
  });

  describe("updatePersonalCircumstances", () => {
    const setupCircumstancesQueries = (
        options: {
          profileIdError?: Error | null;
          profileUpdateError?: Error | null;
          healthError?: Error | null;
        } = {}
    ) => {
      const profileLookupQuery = createMockQuery();
      const profileUpdateQuery = createMockQuery();
      const healthQuery = createMockQuery();

      profileLookupQuery.single.mockResolvedValue({
        data: { id: PROFILE_ID },
        error: options.profileIdError ?? null,
      });

      profileUpdateQuery.eq.mockReturnValue(
          Promise.resolve({
            data: null,
            error: options.profileUpdateError ?? null,
          })
      );

      healthQuery.upsert.mockResolvedValue({
        data: null,
        error: options.healthError ?? null,
      });

      let profileCallCount = 0;

      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          profileCallCount += 1;

          if (profileCallCount === 1) {
            return profileLookupQuery as never;
          }

          return profileUpdateQuery as never;
        }

        if (table === "health_profiles") {
          return healthQuery as never;
        }

        throw new Error(`Unexpected table: ${table}`);
      });

      return {
        profileLookupQuery,
        profileUpdateQuery,
        healthQuery,
      };
    };

    it("should update personal circumstances successfully", async () => {
      const {
        profileUpdateQuery,
        healthQuery,
      } = setupCircumstancesQueries();

      await expect(
          updatePersonalCircumstances(validCircumstances())
      ).resolves.toBeUndefined();

      expect(profileUpdateQuery.update).toHaveBeenCalledWith({
        marital_status: "married",
        employment_status: "employed",
        occupation: "Teacher",
        is_student: false,
        study_mode: null,
        institution_type: null,
      });

      expect(profileUpdateQuery.eq).toHaveBeenCalledWith(
          "user_id",
          USER_ID
      );

      expect(healthQuery.upsert).toHaveBeenCalledWith(
          {
            profile_id: PROFILE_ID,
            is_oku: false,
            oku_registered: null,
          },
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should retrieve the profile ID before updating", async () => {
      const {
        profileLookupQuery,
      } = setupCircumstancesQueries();

      await updatePersonalCircumstances(validCircumstances());

      expect(profileLookupQuery.select).toHaveBeenCalledWith("id");
      expect(profileLookupQuery.eq).toHaveBeenCalledWith(
          "user_id",
          USER_ID
      );
    });

    it("should store occupation for self-employed users", async () => {
      const {
        profileUpdateQuery,
      } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        employmentStatus: "self_employed",
        occupation: "  Freelancer  ",
      });

      expect(profileUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: "Freelancer",
          })
      );
    });

    it("should clear occupation for unemployed users", async () => {
      const {
        profileUpdateQuery,
      } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        employmentStatus: "unemployed",
        occupation: "Previous Job",
      });

      expect(profileUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: null,
          })
      );
    });

    it("should clear occupation when employment status is null", async () => {
      const {
        profileUpdateQuery,
      } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        employmentStatus: null,
        occupation: "Teacher",
      });

      expect(profileUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: null,
          })
      );
    });

    it("should convert whitespace-only occupation to null", async () => {
      const {
        profileUpdateQuery,
      } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        occupation: "   ",
      });

      expect(profileUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: null,
          })
      );
    });

    it("should store student information for students", async () => {
      const {
        profileUpdateQuery,
      } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        isStudent: true,
        studyMode: "full_time",
        institutionType: "university",
      });

      expect(profileUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            is_student: true,
            study_mode: "full_time",
            institution_type: "university",
          })
      );
    });

    it("should clear student information for non-students", async () => {
      const {
        profileUpdateQuery,
      } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        isStudent: false,
        studyMode: "full_time",
        institutionType: "university",
      });

      expect(profileUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            study_mode: null,
            institution_type: null,
          })
      );
    });

    it("should clear student information when student status is null", async () => {
      const {
        profileUpdateQuery,
      } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        isStudent: null,
        studyMode: "full_time",
        institutionType: "university",
      });

      expect(profileUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            study_mode: null,
            institution_type: null,
          })
      );
    });

    it("should store OKU registration for OKU users", async () => {
      const { healthQuery } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        isOku: true,
        okuRegistered: true,
      });

      expect(healthQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            is_oku: true,
            oku_registered: true,
          }),
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should preserve false OKU registration status", async () => {
      const { healthQuery } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        isOku: true,
        okuRegistered: false,
      });

      expect(healthQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            oku_registered: false,
          }),
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should clear OKU registration for non-OKU users", async () => {
      const { healthQuery } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        isOku: false,
        okuRegistered: true,
      });

      expect(healthQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            oku_registered: null,
          }),
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should clear OKU registration when OKU status is null", async () => {
      const { healthQuery } = setupCircumstancesQueries();

      await updatePersonalCircumstances({
        ...validCircumstances(),
        isOku: null,
        okuRegistered: true,
      });

      expect(healthQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            oku_registered: null,
          }),
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should throw when authentication fails", async () => {
      mockAuthenticationError("Authentication failed");

      await expect(
          updatePersonalCircumstances(validCircumstances())
      ).rejects.toThrow("Authentication failed");

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      await expect(
          updatePersonalCircumstances(validCircumstances())
      ).rejects.toThrow("No authenticated user.");
    });

    it("should throw when profile ID lookup fails", async () => {
      setupCircumstancesQueries({
        profileIdError: new Error("Profile lookup failed"),
      });

      await expect(
          updatePersonalCircumstances(validCircumstances())
      ).rejects.toThrow("Profile lookup failed");
    });

    it("should throw when the profile update fails", async () => {
      const { healthQuery } = setupCircumstancesQueries({
        profileUpdateError: new Error("Profile update failed"),
      });

      await expect(
          updatePersonalCircumstances(validCircumstances())
      ).rejects.toThrow("Profile update failed");

      expect(healthQuery.upsert).not.toHaveBeenCalled();
    });

    it("should throw when the health profile upsert fails", async () => {
      setupCircumstancesQueries({
        healthError: new Error("Health update failed"),
      });

      await expect(
          updatePersonalCircumstances(validCircumstances())
      ).rejects.toThrow("Health update failed");
    });

    it("should authenticate twice when updating circumstances", async () => {
      setupCircumstancesQueries();

      await updatePersonalCircumstances(validCircumstances());

      expect(mockGetUser).toHaveBeenCalledTimes(2);
    });
  });

  describe("updateFinancialInformation", () => {
    const setupFinancialQueries = (
        options: {
          profileIdError?: Error | null;
          financialError?: Error | null;
        } = {}
    ) => {
      const profileQuery = createMockQuery();
      const financialQuery = createMockQuery();

      profileQuery.single.mockResolvedValue({
        data: { id: PROFILE_ID },
        error: options.profileIdError ?? null,
      });

      financialQuery.upsert.mockResolvedValue({
        data: null,
        error: options.financialError ?? null,
      });

      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return profileQuery as never;
        }

        if (table === "financial_profiles") {
          return financialQuery as never;
        }

        throw new Error(`Unexpected table: ${table}`);
      });

      return {
        profileQuery,
        financialQuery,
      };
    };

    it("should update financial information successfully", async () => {
      const { financialQuery } = setupFinancialQueries();

      await expect(
          updateFinancialInformation(validFinancialInput())
      ).resolves.toBeUndefined();

      expect(financialQuery.upsert).toHaveBeenCalledWith(
          {
            profile_id: PROFILE_ID,
            monthly_personal_income: 3000,
            monthly_household_income: 6000,
          },
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should retrieve the current profile ID", async () => {
      const { profileQuery } = setupFinancialQueries();

      await updateFinancialInformation(validFinancialInput());

      expect(profileQuery.select).toHaveBeenCalledWith("id");
      expect(profileQuery.eq).toHaveBeenCalledWith(
          "user_id",
          USER_ID
      );
    });

    it("should preserve zero income values", async () => {
      const { financialQuery } = setupFinancialQueries();

      await updateFinancialInformation({
        monthlyPersonalIncome: 0,
        monthlyHouseholdIncome: 0,
      });

      expect(financialQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            monthly_personal_income: 0,
            monthly_household_income: 0,
          }),
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should preserve null income values", async () => {
      const { financialQuery } = setupFinancialQueries();

      await updateFinancialInformation({
        monthlyPersonalIncome: null,
        monthlyHouseholdIncome: null,
      });

      expect(financialQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            monthly_personal_income: null,
            monthly_household_income: null,
          }),
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should preserve decimal income values", async () => {
      const { financialQuery } = setupFinancialQueries();

      await updateFinancialInformation({
        monthlyPersonalIncome: 2500.5,
        monthlyHouseholdIncome: 7500.75,
      });

      expect(financialQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            monthly_personal_income: 2500.5,
            monthly_household_income: 7500.75,
          }),
          {
            onConflict: "profile_id",
          }
      );
    });

    it("should throw when authentication fails", async () => {
      mockAuthenticationError("Authentication failed");

      await expect(
          updateFinancialInformation(validFinancialInput())
      ).rejects.toThrow("Authentication failed");

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      await expect(
          updateFinancialInformation(validFinancialInput())
      ).rejects.toThrow("No authenticated user.");
    });

    it("should throw when profile ID lookup fails", async () => {
      setupFinancialQueries({
        profileIdError: new Error("Profile lookup failed"),
      });

      await expect(
          updateFinancialInformation(validFinancialInput())
      ).rejects.toThrow("Profile lookup failed");
    });

    it("should throw when the financial upsert fails", async () => {
      setupFinancialQueries({
        financialError: new Error("Financial update failed"),
      });

      await expect(
          updateFinancialInformation(validFinancialInput())
      ).rejects.toThrow("Financial update failed");
    });

    it("should authenticate once when updating financial information", async () => {
      setupFinancialQueries();

      await updateFinancialInformation(validFinancialInput());

      expect(mockGetUser).toHaveBeenCalledTimes(1);
    });
  });
});
