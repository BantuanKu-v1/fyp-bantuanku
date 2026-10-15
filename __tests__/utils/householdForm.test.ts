import { describe, it, expect } from "@jest/globals";
import {
  parseHouseholdDate,
  HOUSEHOLD_FORM_DEFAULT_VALUES,
  mapHouseholdMemberToForm,
} from "../../src/utils/householdForm";
import type { HouseholdMember } from "../../src/services/profile/householdService";
import {
  HOUSEHOLD_RELATIONSHIP_KEYS,
  HOUSEHOLD_GENDER_KEYS,
  HOUSEHOLD_CITIZENSHIP_KEYS,
  HOUSEHOLD_EMPLOYMENT_KEYS,
  HOUSEHOLD_STUDY_MODE_KEYS,
  HOUSEHOLD_INSTITUTION_TYPE_KEYS,
} from "../../src/constants/household";

// Test data
const firstKey = <T extends string>(
    keys: Record<T, string>
): T => {
  const key = Object.keys(keys)[0] as T | undefined;

  if (key === undefined) {
    throw new Error("Expected household options to contain at least one key");
  }

  return key;
};

const validMember = (): HouseholdMember => ({
  id: "member-001",
  fullName: "Ahmad Bin Ali",
  relationship: firstKey(HOUSEHOLD_RELATIONSHIP_KEYS),
  identificationNumber: "990315-10-1235",
  dateOfBirth: "1999-03-15",
  gender: firstKey(HOUSEHOLD_GENDER_KEYS),
  citizenship: firstKey(HOUSEHOLD_CITIZENSHIP_KEYS),
  isDependent: false,
  employmentStatus: firstKey(HOUSEHOLD_EMPLOYMENT_KEYS),
  occupation: "Teacher",
  monthlyIncome: 3000,
  isStudent: true,
  studyMode: firstKey(HOUSEHOLD_STUDY_MODE_KEYS),
  institutionType: firstKey(HOUSEHOLD_INSTITUTION_TYPE_KEYS),
  isOku: false,
  okuRegistered: null,
});

describe("Household Form Utilities", () => {
  describe("parseHouseholdDate", () => {
    it("should parse a valid database date", () => {
      const result = parseHouseholdDate("1999-03-15");

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(1999);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });

    it("should parse January 1 correctly", () => {
      const result = parseHouseholdDate("2000-01-01");

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2000);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
    });

    it("should parse December 31 correctly", () => {
      const result = parseHouseholdDate("2020-12-31");

      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(31);
    });

    it("should accept February 29 in a leap year", () => {
      const result = parseHouseholdDate("2000-02-29");

      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(29);
    });

    it("should reject February 29 in a non-leap year", () => {
      expect(parseHouseholdDate("1999-02-29")).toBeNull();
    });

    it("should reject February 30", () => {
      expect(parseHouseholdDate("2000-02-30")).toBeNull();
    });

    it("should reject an invalid month", () => {
      expect(parseHouseholdDate("1999-13-15")).toBeNull();
    });

    it("should reject month zero", () => {
      expect(parseHouseholdDate("1999-00-15")).toBeNull();
    });

    it("should reject an invalid day", () => {
      expect(parseHouseholdDate("1999-03-32")).toBeNull();
    });

    it("should reject day zero", () => {
      expect(parseHouseholdDate("1999-03-00")).toBeNull();
    });

    it("should return null for an empty string", () => {
      expect(parseHouseholdDate("")).toBeNull();
    });

    it("should return null for null input", () => {
      expect(parseHouseholdDate(null)).toBeNull();
    });

    it("should reject an invalid date string", () => {
      expect(parseHouseholdDate("invalid-date")).toBeNull();
    });

    it("should reject an incomplete date string", () => {
      expect(parseHouseholdDate("1999-03")).toBeNull();
    });

    it("should reject a date with non-numeric values", () => {
      expect(parseHouseholdDate("1999-AA-15")).toBeNull();
    });
  });

  describe("HOUSEHOLD_FORM_DEFAULT_VALUES", () => {
    it("should have an empty full name", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.fullName).toBe("");
    });

    it("should have an empty relationship", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.relationship).toBe("");
    });

    it("should have a null date of birth", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.dateOfBirth).toBeNull();
    });

    it("should have an empty identification number", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.identificationNumber).toBe("");
    });

    it("should have an empty gender", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.gender).toBe("");
    });

    it("should have an empty citizenship", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.citizenship).toBe("");
    });

    it("should have a null dependent status", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.isDependent).toBeNull();
    });

    it("should have an empty employment status", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.employmentStatus).toBe("");
    });

    it("should have an empty occupation", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.occupation).toBe("");
    });

    it("should have an empty monthly income", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.monthlyIncome).toBe("");
    });

    it("should have a null student status", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.isStudent).toBeNull();
    });

    it("should have an empty study mode", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.studyMode).toBe("");
    });

    it("should have an empty institution type", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.institutionType).toBe("");
    });

    it("should have a null OKU status", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.isOku).toBeNull();
    });

    it("should have a null OKU registration status", () => {
      expect(HOUSEHOLD_FORM_DEFAULT_VALUES.okuRegistered).toBeNull();
    });

    it("should contain all expected form fields", () => {
      expect(Object.keys(HOUSEHOLD_FORM_DEFAULT_VALUES)).toHaveLength(15);
    });
  });

  describe("mapHouseholdMemberToForm", () => {
    it("should map a complete household member correctly", () => {
      const member = validMember();

      const result = mapHouseholdMemberToForm(member);

      expect(result).toEqual({
        fullName: member.fullName,
        relationship: member.relationship,
        dateOfBirth: new Date(1999, 2, 15),
        identificationNumber: member.identificationNumber,
        gender: member.gender,
        citizenship: member.citizenship,
        isDependent: member.isDependent,
        employmentStatus: member.employmentStatus,
        occupation: member.occupation,
        monthlyIncome: "3000",
        isStudent: member.isStudent,
        studyMode: member.studyMode,
        institutionType: member.institutionType,
        isOku: member.isOku,
        okuRegistered: member.okuRegistered,
      });
    });

    it("should convert monthly income from number to string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        monthlyIncome: 2500.5,
      });

      expect(result.monthlyIncome).toBe("2500.5");
    });

    it("should convert zero monthly income to string zero", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        monthlyIncome: 0,
      });

      expect(result.monthlyIncome).toBe("0");
    });

    it("should convert null monthly income to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        monthlyIncome: null,
      });

      expect(result.monthlyIncome).toBe("");
    });

    it("should convert null identification number to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        identificationNumber: null,
      });

      expect(result.identificationNumber).toBe("");
    });

    it("should convert null occupation to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        occupation: null,
      });

      expect(result.occupation).toBe("");
    });

    it("should convert null date of birth to null", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        dateOfBirth: null,
      });

      expect(result.dateOfBirth).toBeNull();
    });

    it("should convert invalid database dates to null", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        dateOfBirth: "1999-02-30",
      });

      expect(result.dateOfBirth).toBeNull();
    });

    it("should preserve valid relationship values", () => {
      const member = validMember();

      const result = mapHouseholdMemberToForm(member);

      expect(result.relationship).toBe(member.relationship);
    });

    it("should convert invalid relationship values to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        relationship: "invalid",
      });

      expect(result.relationship).toBe("");
    });

    // it("should convert null relationship to an empty string", () => {
    //   const result = mapHouseholdMemberToForm({
    //     ...validMember(),
    //     relationship: null,
    //   });
    //
    //   expect(result.relationship).toBe("");
    // });

    it("should convert an empty relationship to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        relationship: "",
      });

      expect(result.relationship).toBe("");
    });

    it("should preserve valid gender values", () => {
      const member = validMember();

      const result = mapHouseholdMemberToForm(member);

      expect(result.gender).toBe(member.gender);
    });

    it("should convert invalid gender values to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        gender: "invalid",
      });

      expect(result.gender).toBe("");
    });

    it("should convert null gender to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        gender: null,
      });

      expect(result.gender).toBe("");
    });

    it("should preserve valid citizenship values", () => {
      const member = validMember();

      const result = mapHouseholdMemberToForm(member);

      expect(result.citizenship).toBe(member.citizenship);
    });

    it("should convert invalid citizenship values to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        citizenship: "invalid",
      });

      expect(result.citizenship).toBe("");
    });

    it("should convert null citizenship to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        citizenship: null,
      });

      expect(result.citizenship).toBe("");
    });

    it("should preserve valid employment status values", () => {
      const member = validMember();

      const result = mapHouseholdMemberToForm(member);

      expect(result.employmentStatus).toBe(member.employmentStatus);
    });

    it("should convert invalid employment status to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        employmentStatus: "invalid",
      });

      expect(result.employmentStatus).toBe("");
    });

    it("should convert null employment status to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        employmentStatus: null,
      });

      expect(result.employmentStatus).toBe("");
    });

    it("should preserve valid study mode values", () => {
      const member = validMember();

      const result = mapHouseholdMemberToForm(member);

      expect(result.studyMode).toBe(member.studyMode);
    });

    it("should convert invalid study mode to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        studyMode: "invalid",
      });

      expect(result.studyMode).toBe("");
    });

    it("should convert null study mode to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        studyMode: null,
      });

      expect(result.studyMode).toBe("");
    });

    it("should preserve valid institution type values", () => {
      const member = validMember();

      const result = mapHouseholdMemberToForm(member);

      expect(result.institutionType).toBe(member.institutionType);
    });

    it("should convert invalid institution type to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        institutionType: "invalid",
      });

      expect(result.institutionType).toBe("");
    });

    it("should convert null institution type to an empty string", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        institutionType: null,
      });

      expect(result.institutionType).toBe("");
    });

    it("should preserve dependent status", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        isDependent: true,
      });

      expect(result.isDependent).toBe(true);
    });

    it("should preserve student status", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        isStudent: true,
      });

      expect(result.isStudent).toBe(true);
    });

    it("should preserve OKU status", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        isOku: true,
      });

      expect(result.isOku).toBe(true);
    });

    it("should preserve OKU registration status", () => {
      const result = mapHouseholdMemberToForm({
        ...validMember(),
        okuRegistered: false,
      });

      expect(result.okuRegistered).toBe(false);
    });
  });
});
