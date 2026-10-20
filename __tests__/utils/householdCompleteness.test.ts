import { describe, it, expect } from "@jest/globals";
import {
  getMissingHouseholdFields,
  type HouseholdCompletenessData,
} from "../../src/utils/household/householdCompleteness";

// Test data
const validMember = (): HouseholdCompletenessData => ({
  fullName: "Ahmad Bin Ali",
  relationship: "spouse",
  identificationNumber: "990315-10-1235",
  dateOfBirth: "1999-03-15",
  gender: "male",
  citizenship: "malaysian",
  isStudent: false,
  studyMode: null,
  institutionType: null,
  isOku: false,
  okuRegistered: null,
});

describe("Household Completeness Utilities", () => {
  describe("getMissingHouseholdFields", () => {
    // Complete household information
    it("should return an empty array when all required fields are complete", () => {
      const result = getMissingHouseholdFields(validMember());

      expect(result).toEqual([]);
    });

    it("should return an empty array when optional fields are null", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isStudent: null,
        studyMode: null,
        institutionType: null,
        okuRegistered: null,
      });

      expect(result).toEqual([]);
    });

    // Basic information
    it("should detect an empty full name", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        fullName: "",
      });

      expect(result).toEqual(["fullName"]);
    });

    it("should detect a whitespace-only full name", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        fullName: "   ",
      });

      expect(result).toEqual(["fullName"]);
    });

    it("should detect an empty relationship", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        relationship: "",
      });

      expect(result).toEqual(["relationship"]);
    });

    it("should detect a whitespace-only relationship", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        relationship: "   ",
      });

      expect(result).toEqual(["relationship"]);
    });

    it("should detect a null identification number", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        identificationNumber: null,
      });

      expect(result).toEqual(["identificationNumber"]);
    });

    it("should detect an empty identification number", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        identificationNumber: "",
      });

      expect(result).toEqual(["identificationNumber"]);
    });

    it("should detect a whitespace-only identification number", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        identificationNumber: "   ",
      });

      expect(result).toEqual(["identificationNumber"]);
    });

    it("should detect a null date of birth", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        dateOfBirth: null,
      });

      expect(result).toEqual(["dateOfBirth"]);
    });

    it("should detect an empty date of birth", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        dateOfBirth: "",
      });

      expect(result).toEqual(["dateOfBirth"]);
    });

    it("should detect a null gender", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        gender: null,
      });

      expect(result).toEqual(["gender"]);
    });

    it("should detect an empty gender", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        gender: "",
      });

      expect(result).toEqual(["gender"]);
    });

    it("should detect a whitespace-only gender", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        gender: "   ",
      });

      expect(result).toEqual(["gender"]);
    });

    it("should detect a null citizenship", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        citizenship: null,
      });

      expect(result).toEqual(["citizenship"]);
    });

    it("should detect an empty citizenship", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        citizenship: "",
      });

      expect(result).toEqual(["citizenship"]);
    });

    it("should detect a whitespace-only citizenship", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        citizenship: "   ",
      });

      expect(result).toEqual(["citizenship"]);
    });

    // Student information
    it("should require study mode when member is a student", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isStudent: true,
        studyMode: null,
        institutionType: "university",
      });

      expect(result).toEqual(["studyMode"]);
    });

    it("should require institution type when member is a student", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isStudent: true,
        studyMode: "full_time",
        institutionType: null,
      });

      expect(result).toEqual(["institutionType"]);
    });

    it("should require both study fields when student information is missing", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isStudent: true,
        studyMode: "",
        institutionType: "",
      });

      expect(result).toEqual([
        "studyMode",
        "institutionType",
      ]);
    });

    it("should detect whitespace-only study information", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isStudent: true,
        studyMode: "   ",
        institutionType: "   ",
      });

      expect(result).toEqual([
        "studyMode",
        "institutionType",
      ]);
    });

    it("should accept complete student information", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isStudent: true,
        studyMode: "full_time",
        institutionType: "university",
      });

      expect(result).toEqual([]);
    });

    it("should not require study information when member is not a student", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isStudent: false,
        studyMode: null,
        institutionType: null,
      });

      expect(result).toEqual([]);
    });

    it("should not require study information when student status is null", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isStudent: null,
        studyMode: null,
        institutionType: null,
      });

      expect(result).toEqual([]);
    });

    // OKU information
    it("should require OKU status when it is null", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isOku: null,
      });

      expect(result).toEqual(["isOku"]);
    });

    it("should require OKU registration status when member is OKU", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isOku: true,
        okuRegistered: null,
      });

      expect(result).toEqual(["okuRegistered"]);
    });

    it("should accept an OKU member who is registered", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isOku: true,
        okuRegistered: true,
      });

      expect(result).toEqual([]);
    });

    it("should accept an OKU member who is not registered", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isOku: true,
        okuRegistered: false,
      });

      expect(result).toEqual([]);
    });

    it("should not require OKU registration status when member is not OKU", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        isOku: false,
        okuRegistered: null,
      });

      expect(result).toEqual([]);
    });

    // Multiple missing fields
    it("should return multiple missing basic fields", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        fullName: "",
        relationship: "",
        identificationNumber: null,
        dateOfBirth: null,
      });

      expect(result).toEqual([
        "fullName",
        "relationship",
        "identificationNumber",
        "dateOfBirth",
      ]);
    });

    it("should return missing basic, student, and OKU fields together", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        fullName: "",
        gender: null,
        isStudent: true,
        studyMode: "",
        institutionType: "",
        isOku: true,
        okuRegistered: null,
      });

      expect(result).toEqual([
        "fullName",
        "gender",
        "studyMode",
        "institutionType",
        "okuRegistered",
      ]);
    });

    it("should return all missing fields in the correct order", () => {
      const result = getMissingHouseholdFields({
        fullName: "",
        relationship: "",
        identificationNumber: null,
        dateOfBirth: null,
        gender: null,
        citizenship: null,
        isStudent: true,
        studyMode: null,
        institutionType: null,
        isOku: null,
        okuRegistered: null,
      });

      expect(result).toEqual([
        "fullName",
        "relationship",
        "identificationNumber",
        "dateOfBirth",
        "gender",
        "citizenship",
        "studyMode",
        "institutionType",
        "isOku",
      ]);
    });

    it("should not return duplicate missing field names", () => {
      const result = getMissingHouseholdFields({
        ...validMember(),
        fullName: "",
        isStudent: true,
        studyMode: "",
        institutionType: "",
        isOku: null,
      });

      expect(new Set(result).size).toBe(result.length);
    });
  });
});
