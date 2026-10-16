import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from "@jest/globals";
import {
  getCurrentProfileId,
  getProfileOverview,
  updatePreferredLanguage,
  getPreferredLanguage,
} from "../../../src/services/profile/profileService";
import { supabase } from "../../../src/lib/supabase";
import type { SupportedLanguage } from "../../../src/i18n/types";

// Mock Supabase
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

// Test constants
const USER_ID = "user-001";
const PROFILE_ID = "profile-001";

// Mock Supabase query result
type MockQueryResult = {
  data?: unknown;
  error: Error | null;
  count?: number | null;
};

// Mock Supabase query builder
const createMockQuery = () => {
  const query = {
    select: jest.fn<(...args: unknown[]) => unknown>(),
    eq: jest.fn<(...args: unknown[]) => unknown>(),
    update: jest.fn<(...args: unknown[]) => unknown>(),
    single: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
    maybeSingle: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.update.mockReturnValue(query);

  return query;
};

// Mock authenticated user
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

// Mock unauthenticated user
const mockUnauthenticatedUser = () => {
  mockGetUser.mockResolvedValue({
    data: {
      user: null,
    },
    error: null,
  } as never);
};

// Mock authentication error
const mockAuthenticationError = (message: string) => {
  mockGetUser.mockResolvedValue({
    data: {
      user: null,
    },
    error: new Error(message),
  } as never);
};

// Test profile data
const databaseProfile = () => ({
  id: PROFILE_ID,
  full_name: "Ahmad Bin Ali",
  identification_no: "990315-10-1235",
  preferred_language: "en",
  employment_status: "employed",
});

describe("Profile Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser();
  });

  describe("getCurrentProfileId", () => {
    it("should retrieve the current profile ID", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: PROFILE_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getCurrentProfileId();

      expect(result).toBe(PROFILE_ID);
      expect(mockGetUser).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(query.select).toHaveBeenCalledWith("id");
      expect(query.eq).toHaveBeenCalledWith("user_id", USER_ID);
      expect(query.single).toHaveBeenCalledTimes(1);
    });

    it("should return the profile ID exactly as stored", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: "custom-profile-id" },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await expect(getCurrentProfileId()).resolves.toBe(
          "custom-profile-id"
      );
    });

    it("should throw when authentication returns an error", async () => {
      mockAuthenticationError("Authentication failed");

      await expect(getCurrentProfileId()).rejects.toThrow(
          "Authentication failed"
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      await expect(getCurrentProfileId()).rejects.toThrow(
          "No authenticated user."
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when the profile query fails", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: null,
        error: new Error("Profile query failed"),
      });

      mockFrom.mockReturnValue(query as never);

      await expect(getCurrentProfileId()).rejects.toThrow(
          "Profile query failed"
      );
    });

    it("should throw when the profile does not exist", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: null,
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await expect(getCurrentProfileId()).rejects.toThrow(
          "Profile not found."
      );
    });

    it("should query the profile belonging to the authenticated user", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: PROFILE_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await getCurrentProfileId();

      expect(query.eq).toHaveBeenCalledWith("user_id", USER_ID);
    });
  });

  describe("getProfileOverview", () => {
    const setupOverviewQueries = (
        options: {
          profile?: unknown;
          profileError?: Error | null;
          address?: unknown;
          addressError?: Error | null;
          householdCount?: number | null;
          householdError?: Error | null;
        } = {}
    ) => {
      const profileQuery = createMockQuery();
      const addressQuery = createMockQuery();
      const householdQuery = createMockQuery();

      profileQuery.single.mockResolvedValue({
        data: options.profile === undefined
            ? databaseProfile()
            : options.profile,
        error: options.profileError ?? null,
      });

      addressQuery.maybeSingle.mockResolvedValue({
        data: options.address === undefined
            ? {
              city: "Kuala Lumpur",
              state_territory: "Kuala Lumpur",
            }
            : options.address,
        error: options.addressError ?? null,
      });

      householdQuery.eq.mockReturnValue(
          Promise.resolve({
            data: null,
            count: options.householdCount === undefined
                ? 3
                : options.householdCount,
            error: options.householdError ?? null,
          })
      );

      mockFrom.mockImplementation((table) => {
        if (table === "profiles") {
          return profileQuery as never;
        }

        if (table === "addresses") {
          return addressQuery as never;
        }

        if (table === "household_members") {
          return householdQuery as never;
        }

        throw new Error(`Unexpected table: ${table}`);
      });

      return {
        profileQuery,
        addressQuery,
        householdQuery,
      };
    };

    it("should retrieve the complete profile overview", async () => {
      const {
        profileQuery,
        addressQuery,
        householdQuery,
      } = setupOverviewQueries();

      const result = await getProfileOverview();

      expect(result).toEqual({
        id: PROFILE_ID,
        fullName: "Ahmad Bin Ali",
        identificationNumber: "990315-10-1235",
        preferredLanguage: "en",
        employmentStatus: "employed",
        householdMemberCount: 3,
        address: {
          city: "Kuala Lumpur",
          stateTerritory: "Kuala Lumpur",
        },
      });

      expect(mockGetUser).toHaveBeenCalledTimes(1);

      expect(profileQuery.eq).toHaveBeenCalledWith(
          "user_id",
          USER_ID
      );

      expect(addressQuery.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );

      expect(addressQuery.eq).toHaveBeenCalledWith(
          "is_primary",
          true
      );

      expect(householdQuery.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );
    });

    it("should query the correct Supabase tables", async () => {
      setupOverviewQueries();

      await getProfileOverview();

      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockFrom).toHaveBeenCalledWith("addresses");
      expect(mockFrom).toHaveBeenCalledWith("household_members");
    });

    it("should request the exact household member count", async () => {
      const { householdQuery } = setupOverviewQueries();

      await getProfileOverview();

      expect(householdQuery.select).toHaveBeenCalledWith("*", {
        count: "exact",
        head: true,
      });
    });

    it("should return null when no primary address exists", async () => {
      setupOverviewQueries({
        address: null,
      });

      const result = await getProfileOverview();

      expect(result.address).toBeNull();
    });

    it("should return zero when the household count is null", async () => {
      setupOverviewQueries({
        householdCount: null,
      });

      const result = await getProfileOverview();

      expect(result.householdMemberCount).toBe(0);
    });

    it("should return zero when no household members exist", async () => {
      setupOverviewQueries({
        householdCount: 0,
      });

      const result = await getProfileOverview();

      expect(result.householdMemberCount).toBe(0);
    });

    it("should preserve the household member count", async () => {
      setupOverviewQueries({
        householdCount: 10,
      });

      const result = await getProfileOverview();

      expect(result.householdMemberCount).toBe(10);
    });

    it("should preserve null employment status", async () => {
      setupOverviewQueries({
        profile: {
          ...databaseProfile(),
          employment_status: null,
        },
      });

      const result = await getProfileOverview();

      expect(result.employmentStatus).toBeNull();
    });

    it("should return Malay as the preferred language", async () => {
      setupOverviewQueries({
        profile: {
          ...databaseProfile(),
          preferred_language: "ms",
        },
      });

      const result = await getProfileOverview();

      expect(result.preferredLanguage).toBe("ms");
    });

    it("should return Chinese as the preferred language", async () => {
      setupOverviewQueries({
        profile: {
          ...databaseProfile(),
          preferred_language: "zh",
        },
      });

      const result = await getProfileOverview();

      expect(result.preferredLanguage).toBe("zh");
    });

    it("should throw when authentication fails", async () => {
      mockAuthenticationError("Authentication failed");

      await expect(getProfileOverview()).rejects.toThrow(
          "Authentication failed"
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when no user is authenticated", async () => {
      mockUnauthenticatedUser();

      await expect(getProfileOverview()).rejects.toThrow(
          "No authenticated user."
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should throw when the profile query fails", async () => {
      setupOverviewQueries({
        profileError: new Error("Profile query failed"),
      });

      await expect(getProfileOverview()).rejects.toThrow(
          "Profile query failed"
      );

      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockFrom).not.toHaveBeenCalledWith("addresses");
      expect(mockFrom).not.toHaveBeenCalledWith("household_members");
    });

    it("should throw when the address query fails", async () => {
      setupOverviewQueries({
        addressError: new Error("Address query failed"),
      });

      await expect(getProfileOverview()).rejects.toThrow(
          "Address query failed"
      );
    });

    it("should throw when the household count query fails", async () => {
      setupOverviewQueries({
        householdError: new Error("Household query failed"),
      });

      await expect(getProfileOverview()).rejects.toThrow(
          "Household query failed"
      );
    });

    it("should prioritize the address error when both related queries fail", async () => {
      setupOverviewQueries({
        addressError: new Error("Address query failed"),
        householdError: new Error("Household query failed"),
      });

      await expect(getProfileOverview()).rejects.toThrow(
          "Address query failed"
      );
    });

    it("should retrieve only the primary address", async () => {
      const { addressQuery } = setupOverviewQueries();

      await getProfileOverview();

      expect(addressQuery.eq).toHaveBeenCalledWith(
          "is_primary",
          true
      );

      expect(addressQuery.maybeSingle).toHaveBeenCalledTimes(1);
    });
  });

  describe("updatePreferredLanguage", () => {
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

    it("should update the preferred language to English", async () => {
      const query = setupUpdateQuery();

      await expect(
          updatePreferredLanguage(PROFILE_ID, "en")
      ).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith("profiles");

      expect(query.update).toHaveBeenCalledWith({
        preferred_language: "en",
      });

      expect(query.eq).toHaveBeenCalledWith("id", PROFILE_ID);
    });

    it("should update the preferred language to Malay", async () => {
      const query = setupUpdateQuery();

      await updatePreferredLanguage(PROFILE_ID, "ms");

      expect(query.update).toHaveBeenCalledWith({
        preferred_language: "ms",
      });
    });

    it("should update the preferred language to Chinese", async () => {
      const query = setupUpdateQuery();

      await updatePreferredLanguage(PROFILE_ID, "zh");

      expect(query.update).toHaveBeenCalledWith({
        preferred_language: "zh",
      });
    });

    it("should use the provided profile ID", async () => {
      const query = setupUpdateQuery();

      await updatePreferredLanguage("another-profile", "en");

      expect(query.eq).toHaveBeenCalledWith(
          "id",
          "another-profile"
      );
    });

    it("should throw when the update fails", async () => {
      setupUpdateQuery(new Error("Language update failed"));

      await expect(
          updatePreferredLanguage(PROFILE_ID, "ms")
      ).rejects.toThrow("Language update failed");
    });

    it("should accept every supported language", async () => {
      const languages: SupportedLanguage[] = [
        "en",
        "ms",
        "zh",
      ];

      for (const language of languages) {
        const query = setupUpdateQuery();

        await updatePreferredLanguage(PROFILE_ID, language);

        expect(query.update).toHaveBeenCalledWith({
          preferred_language: language,
        });
      }
    });
  });

  describe("getPreferredLanguage", () => {
    const setupLanguageQuery = (
        data: unknown,
        error: Error | null = null
    ) => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data,
        error,
      });

      mockFrom.mockReturnValue(query as never);

      return query;
    };

    it("should retrieve English as the preferred language", async () => {
      const query = setupLanguageQuery({
        preferred_language: "en",
      });

      const result = await getPreferredLanguage(USER_ID);

      expect(result).toBe("en");
      expect(mockFrom).toHaveBeenCalledWith("profiles");

      expect(query.select).toHaveBeenCalledWith(
          "preferred_language"
      );

      expect(query.eq).toHaveBeenCalledWith(
          "user_id",
          USER_ID
      );

      expect(query.maybeSingle).toHaveBeenCalledTimes(1);
    });

    it("should retrieve Malay as the preferred language", async () => {
      setupLanguageQuery({
        preferred_language: "ms",
      });

      await expect(getPreferredLanguage(USER_ID)).resolves.toBe(
          "ms"
      );
    });

    it("should retrieve Chinese as the preferred language", async () => {
      setupLanguageQuery({
        preferred_language: "zh",
      });

      await expect(getPreferredLanguage(USER_ID)).resolves.toBe(
          "zh"
      );
    });

    it("should return null when no profile exists", async () => {
      setupLanguageQuery(null);

      await expect(getPreferredLanguage(USER_ID)).resolves.toBeNull();
    });

    it("should return null when the preferred language is null", async () => {
      setupLanguageQuery({
        preferred_language: null,
      });

      await expect(getPreferredLanguage(USER_ID)).resolves.toBeNull();
    });

    it("should return null for an unsupported language", async () => {
      setupLanguageQuery({
        preferred_language: "fr",
      });

      await expect(getPreferredLanguage(USER_ID)).resolves.toBeNull();
    });

    it("should return null for an empty preferred language", async () => {
      setupLanguageQuery({
        preferred_language: "",
      });

      await expect(getPreferredLanguage(USER_ID)).resolves.toBeNull();
    });

    it("should reject uppercase language codes", async () => {
      setupLanguageQuery({
        preferred_language: "EN",
      });

      await expect(getPreferredLanguage(USER_ID)).resolves.toBeNull();
    });

    it("should reject language codes with whitespace", async () => {
      setupLanguageQuery({
        preferred_language: " en ",
      });

      await expect(getPreferredLanguage(USER_ID)).resolves.toBeNull();
    });

    it("should throw when Supabase returns an error", async () => {
      setupLanguageQuery(
          null,
          new Error("Language query failed")
      );

      await expect(getPreferredLanguage(USER_ID)).rejects.toThrow(
          "Language query failed"
      );
    });

    it("should query the specified user ID", async () => {
      const query = setupLanguageQuery({
        preferred_language: "en",
      });

      await getPreferredLanguage("another-user");

      expect(query.eq).toHaveBeenCalledWith(
          "user_id",
          "another-user"
      );
    });

    it("should validate all supported languages", async () => {
      const languages: SupportedLanguage[] = [
        "en",
        "ms",
        "zh",
      ];

      for (const language of languages) {
        setupLanguageQuery({
          preferred_language: language,
        });

        const result = await getPreferredLanguage(USER_ID);

        expect(result).toBe(language);
      }
    });
  });
});
