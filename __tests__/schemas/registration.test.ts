import { describe, it, expect } from "@jest/globals";
import type { TFunction } from "i18next";
import {
  mobileNumberSchema,
  registerPersonalSchema,
  registerResidenceSchema,
  registerHouseholdIncomeSchema,
} from "../../src/schemas/registration";
import {
  CITIZENSHIP_VALUES,
  EMPLOYMENT_STATUS_VALUES,
  INCOME_SOURCE_VALUES,
  MYKAD_BIRTHPLACE_CODES,
  STATE_TERRITORY_VALUES,
} from "../../src/constants/registration";

// Mock translation function
const t = ((key: string) => key) as TFunction;

// Test Data
const validPersonalData = () => ({
  fullName: "Ahmad Bin Ali",
  myKadNumber: `990315-${MYKAD_BIRTHPLACE_CODES[0]}-1235`,
  dateOfBirth: new Date(1999, 2, 15),
  citizenship: CITIZENSHIP_VALUES[0],
  mobileNumber: "0123456789",
});

const validResidenceData = () => ({
  addressLine1: "No. 10, Jalan Example",
  addressLine2: "",
  postcode: "57000",
  city: "Kuala Lumpur",
  stateTerritory: STATE_TERRITORY_VALUES[0],
});

const validHouseholdIncomeData = () => ({
  employmentStatus: EMPLOYMENT_STATUS_VALUES[0],
  incomeSource: INCOME_SOURCE_VALUES[0],
  personalMonthlyIncome: "3000",
  householdMonthlyIncome: "5000",
  householdMembers: [],
});

// Registration Schema Tests
describe("Registration Schemas", () => {
  // mobileNumberSchema
  describe("mobileNumberSchema", () => {
    const schema = mobileNumberSchema(t);

    it("should accept a valid 10-digit Malaysian mobile number", () => {
      expect(schema.safeParse("0123456789").success).toBe(true);
    });

    it("should accept a valid 11-digit Malaysian mobile number", () => {
      expect(schema.safeParse("01123456789").success).toBe(true);
    });

    it("should accept a formatted mobile number", () => {
      expect(schema.safeParse("012-3456789").success).toBe(true);
    });

    it("should trim surrounding whitespace", () => {
      const result = schema.safeParse("  0123456789  ");

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBe("0123456789");
      }
    });

    it("should reject an empty mobile number", () => {
      const result = schema.safeParse("");

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.mobileNumberRequired"
        );
      }
    });

    it("should reject a mobile number shorter than 10 digits", () => {
      expect(schema.safeParse("012345678").success).toBe(false);
    });

    it("should reject a mobile number longer than 11 digits", () => {
      expect(schema.safeParse("012345678901").success).toBe(false);
    });

    it("should reject a number that does not start with 01", () => {
      expect(schema.safeParse("0323456789").success).toBe(false);
    });

    it("should reject missing mobile number", () => {
      expect(schema.safeParse(undefined).success).toBe(false);
    });
  });

  // registerPersonalSchema
  describe("registerPersonalSchema", () => {
    const schema = registerPersonalSchema(t);

    it("should accept valid personal information", () => {
      expect(schema.safeParse(validPersonalData()).success).toBe(true);
    });

    it("should trim whitespace from full name", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        fullName: "  Ahmad Bin Ali  ",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.fullName).toBe("Ahmad Bin Ali");
      }
    });

    it("should reject an empty full name", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        fullName: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["fullName"],
              message: "validation.fullNameRequired",
            })
        );
      }
    });

    it("should reject a missing full name", () => {
      const { fullName, ...data } = validPersonalData();

      expect(schema.safeParse(data).success).toBe(false);
    });

    it("should reject an empty MyKad number", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["myKadNumber"],
              message: "validation.myKadNumberRequired",
            })
        );
      }
    });

    it("should reject a MyKad number without hyphens", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: "990315101235",
      });

      expect(result.success).toBe(false);
    });

    it("should reject a MyKad number with incorrect length", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: "990315-10-123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject a MyKad number containing letters", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: "990315-10-12AB",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an invalid MyKad birthplace code", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: "990315-00-1235",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an invalid MyKad month", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: `991315-${MYKAD_BIRTHPLACE_CODES[0]}-1235`,
      });

      expect(result.success).toBe(false);
    });

    it("should reject an invalid MyKad day", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: `990332-${MYKAD_BIRTHPLACE_CODES[0]}-1235`,
      });

      expect(result.success).toBe(false);
    });

    it("should reject February 30 in MyKad", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: `990230-${MYKAD_BIRTHPLACE_CODES[0]}-1235`,
      });

      expect(result.success).toBe(false);
    });

    it("should accept February 29 in MyKad", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        myKadNumber: `000229-${MYKAD_BIRTHPLACE_CODES[0]}-1235`,
      });

      expect(result.success).toBe(true);
    });

    it("should reject a missing date of birth", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        dateOfBirth: undefined,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["dateOfBirth"],
              message: "validation.dateOfBirthRequired",
            })
        );
      }
    });

    it("should reject an invalid date of birth", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        dateOfBirth: "1999-03-15",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an invalid citizenship value", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        citizenship: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing citizenship", () => {
      const { citizenship, ...data } = validPersonalData();

      expect(schema.safeParse(data).success).toBe(false);
    });

    it("should accept a valid formatted mobile number", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        mobileNumber: "012-3456789",
      });

      expect(result.success).toBe(true);
    });

    it("should reject an invalid mobile number", () => {
      const result = schema.safeParse({
        ...validPersonalData(),
        mobileNumber: "12345",
      });

      expect(result.success).toBe(false);
    });

    it("should reject a missing mobile number", () => {
      const { mobileNumber, ...data } = validPersonalData();

      expect(schema.safeParse(data).success).toBe(false);
    });
  });

  // registerResidenceSchema
  describe("registerResidenceSchema", () => {
    const schema = registerResidenceSchema(t);

    it("should accept valid residential information", () => {
      expect(schema.safeParse(validResidenceData()).success).toBe(true);
    });

    it("should accept an empty optional address line 2", () => {
      expect(
          schema.safeParse({
            ...validResidenceData(),
            addressLine2: "",
          }).success
      ).toBe(true);
    });

    it("should accept missing optional address line 2", () => {
      const { addressLine2, ...data } = validResidenceData();

      expect(schema.safeParse(data).success).toBe(true);
    });

    it("should trim whitespace from address line 1", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        addressLine1: "  No. 10, Jalan Example  ",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.addressLine1).toBe("No. 10, Jalan Example");
      }
    });

    it("should reject an empty address line 1", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        addressLine1: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an empty postcode", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        postcode: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject a postcode shorter than 5 digits", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        postcode: "5700",
      });

      expect(result.success).toBe(false);
    });

    it("should reject a postcode longer than 5 digits", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        postcode: "570000",
      });

      expect(result.success).toBe(false);
    });

    it("should reject a postcode containing letters", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        postcode: "57ABC",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an empty city", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        city: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an empty state or territory", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        stateTerritory: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["stateTerritory"],
              message: "validation.stateTerritoryRequired",
            })
        );
      }
    });

    it("should reject an invalid state or territory", () => {
      const result = schema.safeParse({
        ...validResidenceData(),
        stateTerritory: "invalid",
      });

      expect(result.success).toBe(false);
    });
  });

  // registerHouseholdIncomeSchema
  describe("registerHouseholdIncomeSchema", () => {
    const schema = registerHouseholdIncomeSchema(t);

    it("should accept valid household income information", () => {
      expect(schema.safeParse(validHouseholdIncomeData()).success).toBe(true);
    });

    it("should accept zero personal monthly income", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        personalMonthlyIncome: "0",
      });

      expect(result.success).toBe(true);
    });

    it("should accept zero household monthly income", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        householdMonthlyIncome: "0",
      });

      expect(result.success).toBe(true);
    });

    it("should accept the maximum allowed income", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        personalMonthlyIncome: "9999999",
        householdMonthlyIncome: "9999999",
      });

      expect(result.success).toBe(true);
    });

    it("should reject income exceeding the maximum", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        personalMonthlyIncome: "10000000",
      });

      expect(result.success).toBe(false);
    });

    it("should reject negative income", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        personalMonthlyIncome: "-100",
      });

      expect(result.success).toBe(false);
    });

    it("should reject non-numeric income", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        personalMonthlyIncome: "abc",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an empty personal monthly income", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        personalMonthlyIncome: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["personalMonthlyIncome"],
              message: "validation.personalMonthlyIncomeRequired",
            })
        );
      }
    });

    it("should reject an empty household monthly income", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        householdMonthlyIncome: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an empty employment status", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        employmentStatus: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an invalid employment status", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        employmentStatus: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an empty income source", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        incomeSource: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject an invalid income source", () => {
      const result = schema.safeParse({
        ...validHouseholdIncomeData(),
        incomeSource: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing household members", () => {
      const { householdMembers, ...data } = validHouseholdIncomeData();

      expect(schema.safeParse(data).success).toBe(false);
    });

    it("should accept an empty household members array", () => {
      expect(
          schema.safeParse({
            ...validHouseholdIncomeData(),
            householdMembers: [],
          }).success
      ).toBe(true);
    });
  });
});
