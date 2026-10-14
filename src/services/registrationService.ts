import { RegisterFormData } from "../schemas/auth";
import {
  RegisterHouseholdIncomeFormData,
  RegisterPersonalFormData,
  RegisterResidenceFormData
} from "../schemas/registration";
import { supabase } from "../lib/supabase";
import { STATE_TERRITORY_MAP, StateTerritoryValue } from "../constants/registration";
import { SupportedLanguage } from "../i18n/types";
import { getGenderFromMyKad } from "../utils/myKad";

type CompleteRegistrationData = {
  account: RegisterFormData;
  personal: RegisterPersonalFormData;
  residence: RegisterResidenceFormData;
  householdIncome: RegisterHouseholdIncomeFormData;
  preferredLanguage: SupportedLanguage;
};

export type RegistrationErrorCode = "identificationNumberExists";

export class RegistrationError extends Error {
  code: RegistrationErrorCode;
  step: number;

  constructor(
      code: RegistrationErrorCode,
      step: number,
      message: string
  ) {
    super(message);

    this.name = "RegistrationError";
    this.code = code;
    this.step = step;
  }
}

const normalizeIdentificationNumber = (
    value: string
) => {
  return value.replace(/\D/g, "");
};

const normalizeMobileNumber = (
    value: string
) => {
  return value.replace(/\D/g, "");
};

const normalizeIncome = (
    value: string
) => {
  return Number(value);
};

const formatDateForDatabase = (
    date: Date
) => {
  const year = date.getFullYear();

  const month = String(
      date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
      date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const completeRegistration = async ({
  account,
  personal,
  residence,
  householdIncome,
  preferredLanguage
}: CompleteRegistrationData) => {
  if (!personal.dateOfBirth) {
    throw new Error("Date of Birth is required.");
  }

  if (!residence.stateTerritory) {
    throw new Error("State or territory is required.");
  }

  if (!householdIncome.employmentStatus) {
    throw new Error("Employment status is required.");
  }

  if (!householdIncome.incomeSource) {
    throw new Error("Income source is required.");
  }

  for (const member of householdIncome.householdMembers) {
    if (!member.relationship) {
      throw new Error("Household member relationship is required.");
    }

    if (!member.dateOfBirth) {
      throw new Error("Household member date of birth is required.");
    }
  }

  const email = account.email.trim().toLowerCase();

  const gender =
      personal.citizenship === "malaysian"
          ? getGenderFromMyKad(personal.myKadNumber)
          : null;

  // Check whether an authenticated session already exists
  // Allows registration to be retried if the Auth account was created successfully but profile creation
  // previously failed
  const {
    data: { session: existingSession },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    if (__DEV__) {
      console.error(
          "[REGISTRATION] Failed to check existing session:", sessionError
      );
    }

    throw sessionError;
  }

  let user;

  if (existingSession) {
    const existingEmail =
        existingSession.user.email
            ?.trim()
            .toLowerCase();

    if (existingEmail !== email) {
      throw new Error(
          "An authenticated session already exists for another account."
      );
    }

    user = existingSession.user;

  } else {
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.signUp({
      email,
      password: account.password,
    });

    if (authError) {
      if (__DEV__) {
        console.error(
            "[REGISTRATION] Auth account creation failed:", authError
        );
      }

      throw authError;
    }

    if (!authData.user) {
      throw new Error("Unable to create user account.");
    }

    if (!authData.session) {
      throw new Error("Registration requires an authenticated session.");
    }

    user = authData.user;
  }

  const householdMembers =
      householdIncome.householdMembers.map((member) => {
        if (!member.relationship) {
          throw new Error("Household member relationship is required.");
        }

        if (!member.dateOfBirth) {
          throw new Error("Household member date of birth is required.");
        }

        return {
          full_name: member.fullName.trim(),
          relationship: member.relationship,
          date_of_birth: formatDateForDatabase(member.dateOfBirth),
        }
      });

  const { data: profileId, error: registrationError } =
    await supabase.rpc(
        "complete_registration",
        {
          p_full_name: personal.fullName.trim(),
          p_identification_no: normalizeIdentificationNumber(personal.myKadNumber),
          p_date_of_birth: formatDateForDatabase(personal.dateOfBirth),
          p_gender: gender,
          p_citizenship: personal.citizenship,
          p_mobile_phone: normalizeMobileNumber(personal.mobileNumber),
          p_email: email,
          p_preferred_language: preferredLanguage,
          p_employment_status: householdIncome.employmentStatus,
          p_address_line_1: residence.addressLine1.trim(),
          p_address_line_2: residence.addressLine2?.trim() ?? "",
          p_postcode: residence.postcode.trim(),
          p_city: residence.city.trim(),
          p_state_territory: STATE_TERRITORY_MAP[residence.stateTerritory as StateTerritoryValue],
          p_monthly_personal_income: normalizeIncome(householdIncome.personalMonthlyIncome),
          p_monthly_household_income: normalizeIncome(householdIncome.householdMonthlyIncome),
          p_income_source: householdIncome.incomeSource,
          p_household_members: householdMembers,
        }
    );

  if (registrationError) {
    const isDuplicateIdentificationNumber =
        registrationError.code === "23505" &&
        (
            registrationError.message.includes(
                "profiles_identification_no_key"
            ) ||
            registrationError.details?.includes(
                "identification_no"
            )
        );

    if (isDuplicateIdentificationNumber) {
      throw new RegistrationError(
          "identificationNumberExists",
          2,
          "Identification number already exists."
      );
    }

    if (__DEV__) {
      console.error(
          "[REGISTRATION] Profile creation failed:", registrationError
      );
    }

    throw registrationError;
  }

  if (!profileId) {
    throw new Error("Registration completed without a profile ID");
  }

  return {
    user,
    profileId,
  };
};
