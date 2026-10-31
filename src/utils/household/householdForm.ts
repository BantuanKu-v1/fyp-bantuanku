import { AddHouseholdMemberFormData } from "../../schemas/household";
import { HouseholdMember } from "../../services/profile/householdService";
import {
  HOUSEHOLD_RELATIONSHIP_KEYS,
  HOUSEHOLD_GENDER_KEYS,
  HOUSEHOLD_CITIZENSHIP_KEYS,
  HOUSEHOLD_EMPLOYMENT_KEYS,
  HOUSEHOLD_STUDY_MODE_KEYS,
  HOUSEHOLD_INSTITUTION_TYPE_KEYS
} from "../../constants/household";

// Check whether a value exists in a dropdown's supported values
const isHouseholdOption = <T extends string>(
    value: string | null,
    keys: Record<T, string>
): value is T => {
  return value !== null && Object.prototype.hasOwnProperty.call(keys, value);
};

// Convert database DATE values into local dates
export const parseHouseholdDate = (
    value: string | null
): Date | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

// Shared default values for Add and Edit forms
export const HOUSEHOLD_FORM_DEFAULT_VALUES: AddHouseholdMemberFormData = {
  fullName: "",
  relationship: "",
  dateOfBirth: null,
  identificationNumber: "",
  gender: "",
  citizenship: "",
  isDependent: null,
  employmentStatus: "",
  occupation: "",
  monthlyIncome: "",
  isStudent: null,
  studyMode: "",
  institutionType: "",
  isOku: null,
  okuRegistered: null
};

// Convert a database household member into form-compatible values
export const mapHouseholdMemberToForm = (
    member: HouseholdMember
): AddHouseholdMemberFormData => {
  return {
    fullName: member.fullName,

    relationship: isHouseholdOption(
        member.relationship,
        HOUSEHOLD_RELATIONSHIP_KEYS
    ) ? member.relationship : "",

    dateOfBirth: parseHouseholdDate(member.dateOfBirth),

    identificationNumber: member.identificationNumber ?? "",

    gender: isHouseholdOption(
        member.gender,
        HOUSEHOLD_GENDER_KEYS
    ) ? member.gender : "",

    citizenship: isHouseholdOption(
        member.citizenship,
        HOUSEHOLD_CITIZENSHIP_KEYS
    ) ? member.citizenship : "",

    isDependent: member.isDependent,

    employmentStatus: isHouseholdOption(
        member.employmentStatus,
        HOUSEHOLD_EMPLOYMENT_KEYS
    ) ? member.employmentStatus : "",

    occupation: member.occupation ?? "",

    monthlyIncome:
        member.monthlyIncome === null
            ? ""
            : String(member.monthlyIncome),

    isStudent: member.isStudent,

    studyMode: isHouseholdOption(
        member.studyMode,
        HOUSEHOLD_STUDY_MODE_KEYS
    ) ? member.studyMode : "",

    institutionType: isHouseholdOption(
        member.institutionType,
        HOUSEHOLD_INSTITUTION_TYPE_KEYS
    ) ? member.institutionType : "",

    isOku: member.isOku,
    okuRegistered: member.okuRegistered
  };
};
