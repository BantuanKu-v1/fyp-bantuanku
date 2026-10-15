import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { completeRegistration, RegistrationError } from "../../src/services/registrationService";
import type { RegisterFormData } from "../../src/schemas/auth";
import type {
  RegisterPersonalFormData,
  RegisterResidenceFormData,
  RegisterHouseholdIncomeFormData,
} from "../../src/schemas/registration";
import type { SupportedLanguage } from "../../src/i18n/types";
import { STATE_TERRITORY_MAP } from "../../src/constants/registration";
import { getGenderFromMyKad } from "../../src/utils/myKad";
import { supabase } from "../../src/lib/supabase";

jest.mock("../../src/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

jest.mock("../../src/utils/myKad", () => ({
  getGenderFromMyKad: jest.fn(),
}));

const mockGetSession = jest.mocked(supabase.auth.getSession);
const mockSignUp = jest.mocked(supabase.auth.signUp);
const mockRpc = jest.mocked(supabase.rpc);
const mockGetGenderFromMyKad = jest.mocked(getGenderFromMyKad);

const USER_ID = "user-001";
const PROFILE_ID = "profile-001";

const mockUser = {
  id: USER_ID,
  email: "ahmad@example.com",
};

const mockSession = {
  user: mockUser,
};

type RegistrationInput = Parameters<typeof completeRegistration>[0];

const createValidInput = (): RegistrationInput => ({
  account: {
    email: "ahmad@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
  } as RegisterFormData,

  personal: {
    fullName: "  Ahmad Bin Ali  ",
    myKadNumber: "990315-10-1235",
    dateOfBirth: new Date(1999, 2, 15),
    citizenship: "malaysian",
    mobileNumber: "012-3456789",
  } as RegisterPersonalFormData,

  residence: {
    addressLine1: "  No. 10, Jalan Bukit  ",
    addressLine2: "  Taman Maju  ",
    postcode: "  57000  ",
    city: "  Kuala Lumpur  ",
    stateTerritory: "kuala_lumpur",
  } as RegisterResidenceFormData,

  householdIncome: {
    employmentStatus: "employed",
    personalMonthlyIncome: "3000",
    householdMonthlyIncome: "6000",
    incomeSource: "salary",
    householdMembers: [],
  } as RegisterHouseholdIncomeFormData,

  preferredLanguage: "en",
});

const createRegistrationError = (
    code: string,
    message: string,
    details: string | null = null
) => ({
  code,
  message,
  details,
  hint: null,
});

const mockNoExistingSession = () => {
  mockGetSession.mockResolvedValue({
    data: {
      session: null,
    },
    error: null,
  } as never);
};

const mockExistingSession = (
    email = "ahmad@example.com"
) => {
  mockGetSession.mockResolvedValue({
    data: {
      session: {
        user: {
          ...mockUser,
          email,
        },
      },
    },
    error: null,
  } as never);
};

const mockSuccessfulSignUp = () => {
  mockSignUp.mockResolvedValue({
    data: {
      user: mockUser,
      session: mockSession,
    },
    error: null,
  } as never);
};

const mockSuccessfulRpc = (
    profileId: string | null = PROFILE_ID
) => {
  mockRpc.mockResolvedValue({
    data: profileId,
    error: null,
  } as never);
};

describe("Registration Service", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockNoExistingSession();
    mockSuccessfulSignUp();
    mockSuccessfulRpc();

    mockGetGenderFromMyKad.mockReturnValue("male");

    consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("RegistrationError", () => {
    it("should create a RegistrationError with the correct properties", () => {
      const error = new RegistrationError(
          "identificationNumberExists",
          2,
          "Identification number already exists."
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RegistrationError);
      expect(error.name).toBe("RegistrationError");
      expect(error.code).toBe("identificationNumberExists");
      expect(error.step).toBe(2);
      expect(error.message).toBe(
          "Identification number already exists."
      );
    });

    it("should preserve the provided step number", () => {
      const error = new RegistrationError(
          "identificationNumberExists",
          3,
          "Duplicate identification number"
      );

      expect(error.step).toBe(3);
    });

    it("should preserve the provided error message", () => {
      const error = new RegistrationError(
          "identificationNumberExists",
          2,
          "Custom registration error"
      );

      expect(error.message).toBe("Custom registration error");
    });
  });

  describe("Input validation", () => {
    it("should reject a missing date of birth", async () => {
      const input = createValidInput();

      input.personal.dateOfBirth = undefined;

      await expect(
          completeRegistration(input)
      ).rejects.toThrow("Date of Birth is required.");

      expect(mockGetSession).not.toHaveBeenCalled();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should reject a missing state or territory", async () => {
      const input = createValidInput();

      input.residence.stateTerritory = "";

      await expect(
          completeRegistration(input)
      ).rejects.toThrow("State or territory is required.");

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should reject a missing employment status", async () => {
      const input = createValidInput();

      input.householdIncome.employmentStatus = "";

      await expect(
          completeRegistration(input)
      ).rejects.toThrow("Employment status is required.");

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should reject a missing income source", async () => {
      const input = createValidInput();

      input.householdIncome.incomeSource = "";

      await expect(
          completeRegistration(input)
      ).rejects.toThrow("Income source is required.");

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should reject a household member without a relationship", async () => {
      const input = createValidInput();

      input.householdIncome.householdMembers = [
        {
          fullName: "Ali",
          relationship: "",
          dateOfBirth: new Date(2010, 0, 1),
        },
      ];

      await expect(
          completeRegistration(input)
      ).rejects.toThrow(
          "Household member relationship is required."
      );

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should reject a household member without a date of birth", async () => {
      const input = createValidInput();

      input.householdIncome.householdMembers = [
        {
          fullName: "Ali",
          relationship: "child",
          dateOfBirth: null,
        },
      ];

      await expect(
          completeRegistration(input)
      ).rejects.toThrow(
          "Household member date of birth is required."
      );

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should validate input before checking authentication", async () => {
      const input = createValidInput();

      input.personal.dateOfBirth = undefined;
      input.residence.stateTerritory = "";

      await expect(
          completeRegistration(input)
      ).rejects.toThrow("Date of Birth is required.");

      expect(mockGetSession).not.toHaveBeenCalled();
      expect(mockSignUp).not.toHaveBeenCalled();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should accept an empty household members array", async () => {
      const input = createValidInput();

      input.householdIncome.householdMembers = [];

      await expect(
          completeRegistration(input)
      ).resolves.toEqual({
        user: mockUser,
        profileId: PROFILE_ID,
      });

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_household_members: [],
          })
      );
    });
  });

  describe("Authentication and session handling", () => {
    it("should create an auth account when no session exists", async () => {
      await completeRegistration(createValidInput());

      expect(mockGetSession).toHaveBeenCalledTimes(1);

      expect(mockSignUp).toHaveBeenCalledWith({
        email: "ahmad@example.com",
        password: "Password123!",
      });
    });

    it("should normalize email before signing up", async () => {
      const input = createValidInput();

      input.account.email = "  AHMAD@EXAMPLE.COM  ";

      await completeRegistration(input);

      expect(mockSignUp).toHaveBeenCalledWith({
        email: "ahmad@example.com",
        password: "Password123!",
      });
    });

    it("should use an existing authenticated session", async () => {
      mockExistingSession();

      const result = await completeRegistration(
          createValidInput()
      );

      expect(result.user).toEqual(mockUser);
      expect(result.profileId).toBe(PROFILE_ID);

      expect(mockSignUp).not.toHaveBeenCalled();
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });

    it("should accept an existing session with uppercase email", async () => {
      mockExistingSession("AHMAD@EXAMPLE.COM");

      await expect(
          completeRegistration(createValidInput())
      ).resolves.toEqual({
        user: {
          ...mockUser,
          email: "AHMAD@EXAMPLE.COM",
        },
        profileId: PROFILE_ID,
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should accept an existing session with surrounding email whitespace", async () => {
      mockExistingSession("  ahmad@example.com  ");

      await expect(
          completeRegistration(createValidInput())
      ).resolves.toEqual({
        user: {
          ...mockUser,
          email: "  ahmad@example.com  ",
        },
        profileId: PROFILE_ID,
      });
    });

    it("should reject an existing session belonging to another account", async () => {
      mockExistingSession("another@example.com");

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toThrow(
          "An authenticated session already exists for another account."
      );

      expect(mockSignUp).not.toHaveBeenCalled();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should reject an existing session without an email", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: USER_ID,
              email: null,
            },
          },
        },
        error: null,
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toThrow(
          "An authenticated session already exists for another account."
      );

      expect(mockSignUp).not.toHaveBeenCalled();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should propagate errors from getSession", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: null,
        },
        error: new Error("Session lookup failed"),
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toThrow("Session lookup failed");

      expect(mockSignUp).not.toHaveBeenCalled();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should propagate errors from signUp", async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: new Error("Sign up failed"),
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toThrow("Sign up failed");

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should reject signUp when no user is returned", async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: null,
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toThrow("Unable to create user account.");

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should reject signUp when no authenticated session is returned", async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null,
        },
        error: null,
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toThrow(
          "Registration requires an authenticated session."
      );

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should return the newly created authenticated user", async () => {
      const result = await completeRegistration(
          createValidInput()
      );

      expect(result.user).toEqual(mockUser);
    });

    it("should not create a second auth account when retrying registration", async () => {
      mockExistingSession();

      await completeRegistration(createValidInput());

      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  describe("Registration RPC payload", () => {
    it("should call the correct Supabase RPC", async () => {
      await completeRegistration(createValidInput());

      expect(mockRpc).toHaveBeenCalledTimes(1);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.any(Object)
      );
    });

    it("should send all required registration fields", async () => {
      await completeRegistration(createValidInput());

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          {
            p_full_name: "Ahmad Bin Ali",
            p_identification_no: "990315101235",
            p_date_of_birth: "1999-03-15",
            p_gender: "male",
            p_citizenship: "malaysian",
            p_mobile_phone: "0123456789",
            p_email: "ahmad@example.com",
            p_preferred_language: "en",
            p_employment_status: "employed",
            p_address_line_1: "No. 10, Jalan Bukit",
            p_address_line_2: "Taman Maju",
            p_postcode: "57000",
            p_city: "Kuala Lumpur",
            p_state_territory:
            STATE_TERRITORY_MAP.kuala_lumpur,
            p_monthly_personal_income: 3000,
            p_monthly_household_income: 6000,
            p_income_source: "salary",
            p_household_members: [],
          }
      );
    });

    it("should trim the full name", async () => {
      const input = createValidInput();

      input.personal.fullName = "   Siti Aminah   ";

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_full_name: "Siti Aminah",
          })
      );
    });

    it("should remove non-digit characters from MyKad", async () => {
      const input = createValidInput();

      input.personal.myKadNumber = "990315-10-1235";

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_identification_no: "990315101235",
          })
      );
    });

    it("should remove non-digit characters from mobile numbers", async () => {
      const input = createValidInput();

      input.personal.mobileNumber = "(012) 345-6789";

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_mobile_phone: "0123456789",
          })
      );
    });

    it("should format dates as YYYY-MM-DD", async () => {
      const input = createValidInput();

      input.personal.dateOfBirth = new Date(2000, 0, 9);

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_date_of_birth: "2000-01-09",
          })
      );
    });

    it("should preserve leap-day dates", async () => {
      const input = createValidInput();

      input.personal.dateOfBirth = new Date(2000, 1, 29);

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_date_of_birth: "2000-02-29",
          })
      );
    });

    it("should derive gender from MyKad for Malaysian citizens", async () => {
      await completeRegistration(createValidInput());

      expect(mockGetGenderFromMyKad).toHaveBeenCalledWith(
          "990315-10-1235"
      );

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_gender: "male",
          })
      );
    });

    it("should support female gender derived from MyKad", async () => {
      mockGetGenderFromMyKad.mockReturnValue("female");

      await completeRegistration(createValidInput());

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_gender: "female",
          })
      );
    });

    it("should use null gender for non-Malaysian citizens", async () => {
      const input = createValidInput();

      input.personal.citizenship = "non_malaysian";

      await completeRegistration(input);

      expect(mockGetGenderFromMyKad).not.toHaveBeenCalled();

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_gender: null,
            p_citizenship: "non_malaysian",
          })
      );
    });

    it("should trim address fields", async () => {
      await completeRegistration(createValidInput());

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_address_line_1: "No. 10, Jalan Bukit",
            p_address_line_2: "Taman Maju",
            p_postcode: "57000",
            p_city: "Kuala Lumpur",
          })
      );
    });

    it("should store an empty second address line when omitted", async () => {
      const input = createValidInput();

      input.residence.addressLine2 = undefined;

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_address_line_2: "",
          })
      );
    });

    it("should convert income strings into numbers", async () => {
      const input = createValidInput();

      input.householdIncome.personalMonthlyIncome = "2500.50";
      input.householdIncome.householdMonthlyIncome = "7500.75";

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_monthly_personal_income: 2500.5,
            p_monthly_household_income: 7500.75,
          })
      );
    });

    it("should preserve zero income", async () => {
      const input = createValidInput();

      input.householdIncome.personalMonthlyIncome = "0";
      input.householdIncome.householdMonthlyIncome = "0";

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_monthly_personal_income: 0,
            p_monthly_household_income: 0,
          })
      );
    });

    it("should use the selected preferred language", async () => {
      const languages: SupportedLanguage[] = [
        "en",
        "ms",
        "zh",
      ];

      for (const language of languages) {
        const input = createValidInput();

        input.preferredLanguage = language;

        await completeRegistration(input);

        expect(mockRpc).toHaveBeenLastCalledWith(
            "complete_registration",
            expect.objectContaining({
              p_preferred_language: language,
            })
        );
      }
    });

    it("should map the selected state or territory", async () => {
      const input = createValidInput();

      input.residence.stateTerritory = "selangor";

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_state_territory:
            STATE_TERRITORY_MAP.selangor,
          })
      );
    });

    it("should map all supported states and territories", async () => {
      for (const stateTerritory of Object.keys(
          STATE_TERRITORY_MAP
      ) as Array<keyof typeof STATE_TERRITORY_MAP>) {
        const input = createValidInput();

        input.residence.stateTerritory = stateTerritory;

        await completeRegistration(input);

        expect(mockRpc).toHaveBeenLastCalledWith(
            "complete_registration",
            expect.objectContaining({
              p_state_territory:
                  STATE_TERRITORY_MAP[stateTerritory],
            })
        );
      }
    });

    it("should send an empty household member array when none are provided", async () => {
      await completeRegistration(createValidInput());

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_household_members: [],
          })
      );
    });

    it("should map a household member correctly", async () => {
      const input = createValidInput();

      input.householdIncome.householdMembers = [
        {
          fullName: "  Ali Bin Ahmad  ",
          relationship: "child",
          dateOfBirth: new Date(2010, 4, 9),
        },
      ];

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_household_members: [
              {
                full_name: "Ali Bin Ahmad",
                relationship: "child",
                date_of_birth: "2010-05-09",
              },
            ],
          })
      );
    });

    it("should map multiple household members correctly", async () => {
      const input = createValidInput();

      input.householdIncome.householdMembers = [
        {
          fullName: "  Siti Aminah  ",
          relationship: "spouse",
          dateOfBirth: new Date(2000, 0, 2),
        },
        {
          fullName: "  Ali Bin Ahmad  ",
          relationship: "child",
          dateOfBirth: new Date(2010, 4, 9),
        },
      ];

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_household_members: [
              {
                full_name: "Siti Aminah",
                relationship: "spouse",
                date_of_birth: "2000-01-02",
              },
              {
                full_name: "Ali Bin Ahmad",
                relationship: "child",
                date_of_birth: "2010-05-09",
              },
            ],
          })
      );
    });

    it("should preserve household member order", async () => {
      const input = createValidInput();

      input.householdIncome.householdMembers = [
        {
          fullName: "First Member",
          relationship: "spouse",
          dateOfBirth: new Date(1998, 0, 1),
        },
        {
          fullName: "Second Member",
          relationship: "child",
          dateOfBirth: new Date(2015, 0, 1),
        },
      ];

      await completeRegistration(input);

      expect(mockRpc).toHaveBeenCalledWith(
          "complete_registration",
          expect.objectContaining({
            p_household_members: [
              expect.objectContaining({
                full_name: "First Member",
              }),
              expect.objectContaining({
                full_name: "Second Member",
              }),
            ],
          })
      );
    });
  });

  describe("Registration RPC errors", () => {
    it("should throw a RegistrationError for duplicate identification number constraints", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: createRegistrationError(
            "23505",
            'duplicate key value violates unique constraint "profiles_identification_no_key"'
        ),
      } as never);

      const registrationPromise = completeRegistration(
          createValidInput()
      );

      await expect(registrationPromise).rejects.toMatchObject({
        name: "RegistrationError",
        code: "identificationNumberExists",
        step: 2,
        message: "Identification number already exists.",
      });

      expect(mockRpc).toHaveBeenCalledTimes(1);
    });

    it("should detect duplicate identification numbers from error details", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: createRegistrationError(
            "23505",
            "Duplicate key",
            "Key (identification_no) already exists."
        ),
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toMatchObject({
        name: "RegistrationError",
        code: "identificationNumberExists",
        step: 2,
      });
    });

    it("should not classify other unique constraint errors as identification number duplicates", async () => {
      const databaseError = createRegistrationError(
          "23505",
          'duplicate key value violates unique constraint "profiles_email_key"'
      );

      mockRpc.mockResolvedValue({
        data: null,
        error: databaseError,
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toMatchObject(databaseError);
    });

    it("should not classify identification number errors without code 23505 as duplicates", async () => {
      const databaseError = createRegistrationError(
          "23503",
          "profiles_identification_no_key"
      );

      mockRpc.mockResolvedValue({
        data: null,
        error: databaseError,
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toMatchObject(databaseError);
    });

    it("should propagate general database errors", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: createRegistrationError(
            "P0001",
            "Database operation failed"
        ),
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toMatchObject({
        message: "Database operation failed",
      });
    });

    it("should reject a successful RPC response without a profile ID", async () => {
      mockSuccessfulRpc(null);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toThrow(
          "Registration completed without a profile ID"
      );
    });

    it("should return the profile ID created by the RPC", async () => {
      mockSuccessfulRpc("custom-profile-id");

      const result = await completeRegistration(
          createValidInput()
      );

      expect(result.profileId).toBe("custom-profile-id");
    });

    it("should return both the authenticated user and profile ID", async () => {
      const result = await completeRegistration(
          createValidInput()
      );

      expect(result).toEqual({
        user: mockUser,
        profileId: PROFILE_ID,
      });
    });

    it("should not call RPC when authentication fails", async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: new Error("Authentication failed"),
      } as never);

      await expect(
          completeRegistration(createValidInput())
      ).rejects.toThrow("Authentication failed");

      expect(mockRpc).not.toHaveBeenCalled();
    });
  });
});
