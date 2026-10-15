import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import type { TFunction } from "i18next";
import {
  householdMemberSchema,
  addHouseholdMemberSchema,
} from "../../src/schemas/household";
import {
  EMPLOYMENT_STATUS_VALUES,
  HOUSEHOLD_RELATIONSHIP_VALUES,
  MYKAD_BIRTHPLACE_CODES,
} from "../../src/constants/registration";

// Mock translation function
const t = ((key: string) => key) as TFunction;

// Test Data
const validBasicMemberData = () => ({
  fullName: "Ahmad Bin Ali",
  relationship: HOUSEHOLD_RELATIONSHIP_VALUES[0],
  dateOfBirth: new Date(1999, 2, 15),
});

const validAddMemberData = () => ({
  ...validBasicMemberData(),
  identificationNumber: `990315-${MYKAD_BIRTHPLACE_CODES[0]}-1235`,
  gender: "male",
  citizenship: "malaysian",
  isDependent: false,
  employmentStatus: EMPLOYMENT_STATUS_VALUES[0],
  occupation: "Teacher",
  monthlyIncome: "3000",
  isStudent: false,
  studyMode: "",
  institutionType: "",
  isOku: false,
  okuRegistered: null,
});

// Household Schema Tests
describe("Household Schemas", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 15));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // householdMemberSchema
  describe("householdMemberSchema", () => {
    const schema = householdMemberSchema(t);

    it("should accept valid basic household member information", () => {
      expect(schema.safeParse(validBasicMemberData()).success).toBe(true);
    });

    it("should trim whitespace from full name", () => {
      const result = schema.safeParse({
        ...validBasicMemberData(),
        fullName: "  Ahmad Bin Ali  ",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.fullName).toBe("Ahmad Bin Ali");
      }
    });

    it("should reject an empty full name", () => {
      const result = schema.safeParse({
        ...validBasicMemberData(),
        fullName: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["fullName"],
              message: "validation.householdMemberNameRequired",
            })
        );
      }
    });

    it("should reject a missing full name", () => {
      const { fullName, ...data } = validBasicMemberData();

      expect(schema.safeParse(data).success).toBe(false);
    });

    it("should reject an empty relationship", () => {
      const result = schema.safeParse({
        ...validBasicMemberData(),
        relationship: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["relationship"],
              message: "validation.relationshipRequired",
            })
        );
      }
    });

    it("should reject an invalid relationship", () => {
      const result = schema.safeParse({
        ...validBasicMemberData(),
        relationship: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("should reject a missing relationship", () => {
      const { relationship, ...data } = validBasicMemberData();

      expect(schema.safeParse(data).success).toBe(false);
    });

    it("should accept a valid date of birth", () => {
      expect(
          schema.safeParse({
            ...validBasicMemberData(),
            dateOfBirth: new Date(2005, 5, 20),
          }).success
      ).toBe(true);
    });

    it("should reject a null date of birth", () => {
      const result = schema.safeParse({
        ...validBasicMemberData(),
        dateOfBirth: null,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["dateOfBirth"],
              message: "validation.householdMemberDobRequired",
            })
        );
      }
    });

    it("should reject a missing date of birth", () => {
      const { dateOfBirth, ...data } = validBasicMemberData();

      expect(schema.safeParse(data).success).toBe(false);
    });

    it("should reject a string date of birth", () => {
      const result = schema.safeParse({
        ...validBasicMemberData(),
        dateOfBirth: "1999-03-15",
      });

      expect(result.success).toBe(false);
    });
  });

  // addHouseholdMemberSchema
  describe("addHouseholdMemberSchema", () => {
    const schema = addHouseholdMemberSchema(t);

    // General Validation
    describe("General Validation", () => {
      it("should accept valid household member information", () => {
        expect(schema.safeParse(validAddMemberData()).success).toBe(true);
      });

      it("should reject an empty identification number", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          identificationNumber: "",
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ["identificationNumber"],
                message: "validation.required",
              })
          );
        }
      });

      it("should reject a missing identification number", () => {
        const { identificationNumber, ...data } = validAddMemberData();

        expect(schema.safeParse(data).success).toBe(false);
      });

      it("should reject an empty gender", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          gender: "",
        });

        expect(result.success).toBe(false);
      });

      it("should reject an invalid gender", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          gender: "invalid",
        });

        expect(result.success).toBe(false);
      });

      it("should reject an empty citizenship", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          citizenship: "",
        });

        expect(result.success).toBe(false);
      });

      it("should reject an invalid citizenship", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          citizenship: "invalid",
        });

        expect(result.success).toBe(false);
      });

      it("should accept null dependent status", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isDependent: null,
        });

        expect(result.success).toBe(true);
      });

      it("should accept an empty employment status", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          employmentStatus: "",
        });

        expect(result.success).toBe(true);
      });

      it("should reject an invalid employment status", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          employmentStatus: "invalid",
        });

        expect(result.success).toBe(false);
      });

      it("should accept an empty occupation", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          occupation: "",
        });

        expect(result.success).toBe(true);
      });

      it("should accept an empty monthly income", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          monthlyIncome: "",
        });

        expect(result.success).toBe(true);
      });

      it("should accept null student status", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isStudent: null,
        });

        expect(result.success).toBe(true);
      });

      it("should reject null OKU status", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isOku: null,
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ["isOku"],
                message: "validation.required",
              })
          );
        }
      });
    });

    // MyKad Validation
    describe("MyKad Validation", () => {
      it("should accept a valid Malaysian MyKad", () => {
        expect(schema.safeParse(validAddMemberData()).success).toBe(true);
      });

      it("should reject a MyKad without hyphens", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          identificationNumber: "990315101235",
        });

        expect(result.success).toBe(false);
      });

      it("should reject an invalid birthplace code", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          identificationNumber: "990315-00-1235",
        });

        expect(result.success).toBe(false);
      });

      it("should reject an invalid MyKad date", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          identificationNumber: `990230-${MYKAD_BIRTHPLACE_CODES[0]}-1235`,
        });

        expect(result.success).toBe(false);
      });

      it("should reject MyKad date of birth mismatch", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          dateOfBirth: new Date(1998, 2, 15),
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ["dateOfBirth"],
                message: "validation.dateOfBirthMismatch",
              })
          );
        }
      });

      it("should accept matching MyKad date of birth", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          dateOfBirth: new Date(1999, 2, 15),
        });

        expect(result.success).toBe(true);
      });

      it("should accept non-Malaysian identification numbers with at least 5 characters", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          citizenship: "non_malaysian",
          identificationNumber: "A12345",
        });

        expect(result.success).toBe(true);
      });

      it("should reject non-Malaysian identification numbers shorter than 5 characters", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          citizenship: "non_malaysian",
          identificationNumber: "A123",
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ["identificationNumber"],
                message: "validation.identificationNumberInvalid",
              })
          );
        }
      });
    });

    // Date of Birth Validation
    describe("Date of Birth Validation", () => {
      it("should reject a future date of birth", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          citizenship: "non_malaysian",
          identificationNumber: "A12345",
          dateOfBirth: new Date(2027, 0, 1),
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ["dateOfBirth"],
                message: "validation.dateOfBirthInvalid",
              })
          );
        }
      });

      it("should reject dates before 1900", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          citizenship: "non_malaysian",
          identificationNumber: "A12345",
          dateOfBirth: new Date(1899, 11, 31),
        });

        expect(result.success).toBe(false);
      });

      it("should accept January 1, 1900", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          citizenship: "non_malaysian",
          identificationNumber: "A12345",
          dateOfBirth: new Date(1900, 0, 1),
        });

        expect(result.success).toBe(true);
      });

      it("should accept today's date", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          citizenship: "non_malaysian",
          identificationNumber: "A12345",
          dateOfBirth: new Date(2026, 9, 15),
        });

        expect(result.success).toBe(true);
      });

      it("should reject null date of birth", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          dateOfBirth: null,
        });

        expect(result.success).toBe(false);
      });
    });

    // Monthly Income Validation
    describe("Monthly Income Validation", () => {
      it("should accept zero monthly income", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          monthlyIncome: "0",
        });

        expect(result.success).toBe(true);
      });

      it("should accept the maximum allowed monthly income", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          monthlyIncome: "9999999",
        });

        expect(result.success).toBe(true);
      });

      it("should reject income exceeding the maximum", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          monthlyIncome: "10000000",
        });

        expect(result.success).toBe(false);
      });

      it("should reject negative monthly income", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          monthlyIncome: "-100",
        });

        expect(result.success).toBe(false);
      });

      it("should reject non-numeric monthly income", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          monthlyIncome: "abc",
        });

        expect(result.success).toBe(false);
      });

      it("should accept decimal monthly income", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          monthlyIncome: "2500.50",
        });

        expect(result.success).toBe(true);
      });
    });

    // Student Information Validation
    describe("Student Information Validation", () => {
      it("should require study mode when member is a student", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isStudent: true,
          studyMode: "",
          institutionType: "university",
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ["studyMode"],
                message: "validation.required",
              })
          );
        }
      });

      it("should require institution type when member is a student", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isStudent: true,
          studyMode: "full_time",
          institutionType: "",
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ["institutionType"],
                message: "validation.required",
              })
          );
        }
      });

      it("should accept complete student information", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isStudent: true,
          studyMode: "full_time",
          institutionType: "university",
        });

        expect(result.success).toBe(true);
      });

      it("should not require study information when member is not a student", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isStudent: false,
          studyMode: "",
          institutionType: "",
        });

        expect(result.success).toBe(true);
      });
    });

    // OKU Information Validation
    describe("OKU Information Validation", () => {
      it("should require OKU registration status when member is OKU", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isOku: true,
          okuRegistered: null,
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toContainEqual(
              expect.objectContaining({
                path: ["okuRegistered"],
                message: "validation.required",
              })
          );
        }
      });

      it("should accept registered OKU members", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isOku: true,
          okuRegistered: true,
        });

        expect(result.success).toBe(true);
      });

      it("should accept unregistered OKU members", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isOku: true,
          okuRegistered: false,
        });

        expect(result.success).toBe(true);
      });

      it("should not require OKU registration status when member is not OKU", () => {
        const result = schema.safeParse({
          ...validAddMemberData(),
          isOku: false,
          okuRegistered: null,
        });

        expect(result.success).toBe(true);
      });
    });
  });
});
