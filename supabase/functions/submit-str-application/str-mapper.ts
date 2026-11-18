import {
  nullableBoolean,
  nullableNumber,
  nullableText,
  requiredText
} from "../_shared/validators.ts";

type DatabaseRow = Record<string, unknown>;

export interface StrApplicationPayload {
  externalApplicationId: string;
  applicantName: string;
  applicationYear: number;
  applicationData: {
    schemaVersion: 1;
    applicant: {
      fullName: string;
      identificationNo: string;
      dateOfBirth: string;
      gender: string | null;
      citizenship: string;
      maritalStatus: string | null;
    };
    contact: {
      mobilePhone: string | null;
      homePhone: string | null;
      email: string | null;
    };
    address: {
      addressLine1: string;
      addressLine2: string | null;
      postcode: string;
      city: string;
      stateTerritory: string;
      countryCode: string;
    };
    financial: {
      monthlyPersonalIncome: number | null;
      monthlyHouseholdIncome: number | null;
      incomeSource: string | null;
    };
    employment: {
      occupation: string | null;
      employmentStatus: string | null;
      isStudent: boolean | null;
      studyMode: string | null;
      institutionType: string | null;
    };
    household: {
      members: Array<{
        fullName: string;
        identificationNo: string | null;
        relationship: string;
        dateOfBirth: string | null;
        gender: string | null;
        citizenship: string | null;
        isDependent: boolean | null;
        employmentStatus: string | null;
        occupation: string | null;
        monthlyIncome: number | null;
        isStudent: boolean | null;
        studyMode: string | null;
        institutionType: string | null;
        isOku: boolean | null;
        okuRegistered: boolean | null;
      }>;
      informationComplete: true;
    };
    preliminaryEligibility?: {
      status: string;
      criteriaVersion: string;
      assessedAt: string;
    };
  };
}

export interface StrMapperInput {
  applicationId: string;
  applicationYear: number;
  profile: DatabaseRow;
  address: DatabaseRow;
  financialProfile: DatabaseRow | null;
  householdMembers: DatabaseRow[];
  preliminaryEligibility?: {
    status: string;
    criteriaVersion: string;
    assessedAt: string;
  };
}

export function mapToStrApplication(
    input: StrMapperInput
): StrApplicationPayload {
  const {
    applicationId,
      applicationYear,
      profile,
      address,
      financialProfile,
      householdMembers,
      preliminaryEligibility
  } = input;

  const applicantName = requiredText(profile.full_name);

  return {
    externalApplicationId: applicationId,
    applicantName,
    applicationYear,
    applicationData: {
      schemaVersion: 1,

      applicant: {
        fullName: applicantName,
        identificationNo: requiredText(profile.identification_no),
        dateOfBirth: requiredText(profile.date_of_birth),
        gender: nullableText(profile.gender),
        citizenship: requiredText(profile.citizenship),
        maritalStatus: nullableText(profile.marital_status),
      },

      contact: {
        mobilePhone: nullableText(profile.mobile_phone),
        homePhone: nullableText(profile.home_phone),
        email: nullableText(profile.email),
      },

      address: {
        addressLine1: requiredText(address.address_line_1),
        addressLine2: nullableText(address.address_line_2),
        postcode: requiredText(address.postcode),
        city: requiredText(address.city),
        stateTerritory: requiredText(address.state_territory),
        countryCode: requiredText(address.country_code),
      },

      financial: {
        monthlyPersonalIncome: nullableNumber(
            financialProfile?.monthly_personal_income,
        ),
        monthlyHouseholdIncome: nullableNumber(
            financialProfile?.monthly_household_income,
        ),
        incomeSource: nullableText(financialProfile?.income_source),
      },

      employment: {
        occupation: nullableText(profile.occupation),
        employmentStatus: nullableText(profile.employment_status),
        isStudent: nullableBoolean(profile.is_student),
        studyMode: nullableText(profile.study_mode),
        institutionType: nullableText(profile.institution_type),
      },

      household: {
        members: householdMembers.map((member) => ({
          fullName: requiredText(member.full_name),
          identificationNo: nullableText(member.identification_no),
          relationship: requiredText(member.relationship),
          dateOfBirth: nullableText(member.date_of_birth),
          gender: nullableText(member.gender),
          citizenship: nullableText(member.citizenship),
          isDependent: nullableBoolean(member.is_dependent),
          employmentStatus: nullableText(member.employment_status),
          occupation: nullableText(member.occupation),
          monthlyIncome: nullableNumber(member.monthly_income),
          isStudent: nullableBoolean(member.is_student),
          studyMode: nullableText(member.study_mode),
          institutionType: nullableText(member.institution_type),
          isOku: nullableBoolean(member.is_oku),
          okuRegistered: nullableBoolean(member.oku_registered),
        })),
        informationComplete: true,
      },

      ...(preliminaryEligibility
          ? {preliminaryEligibility}
          : {}),
    },
  };
}
