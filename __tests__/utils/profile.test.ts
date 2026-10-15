import { describe, it, expect } from "@jest/globals";
import {
  formatDateOfBirth,
  formatIdentificationNumber,
  formatMobileNumber,
  formatHomePhone,
  formatIncome,
  parseIncome,
} from "../../src/utils/profile";

describe("Profile Utilities", () => {
  describe("formatDateOfBirth", () => {
    it("should format a valid date into DD/MM/YYYY", () => {
      expect(formatDateOfBirth("1999-03-15")).toBe("15/03/1999");
    });

    it("should format January 1 correctly", () => {
      expect(formatDateOfBirth("2000-01-01")).toBe("01/01/2000");
    });

    it("should format December 31 correctly", () => {
      expect(formatDateOfBirth("2020-12-31")).toBe("31/12/2020");
    });

    it("should format a leap day correctly", () => {
      expect(formatDateOfBirth("2000-02-29")).toBe("29/02/2000");
    });

    it("should preserve an empty string", () => {
      expect(formatDateOfBirth("")).toBe("");
    });

    it("should preserve a date containing only a year", () => {
      expect(formatDateOfBirth("1999")).toBe("1999");
    });

    it("should preserve an incomplete date", () => {
      expect(formatDateOfBirth("1999-03")).toBe("1999-03");
    });

    it("should preserve a date with an empty month", () => {
      expect(formatDateOfBirth("1999--15")).toBe("1999--15");
    });

    it("should preserve a date with an empty day", () => {
      expect(formatDateOfBirth("1999-03-")).toBe("1999-03-");
    });

    it("should preserve a date without hyphens", () => {
      expect(formatDateOfBirth("19990315")).toBe("19990315");
    });

    it("should preserve invalid date components without validating them", () => {
      expect(formatDateOfBirth("1999-13-40")).toBe("40/13/1999");
    });

    it("should format date components without changing their values", () => {
      expect(formatDateOfBirth("2026-1-5")).toBe("5/1/2026");
    });
  });

  describe("formatIdentificationNumber", () => {
    it("should format a 12-digit MyKad number", () => {
      expect(formatIdentificationNumber("990315101235")).toBe(
          "990315-10-1235"
      );
    });

    it("should preserve an already formatted MyKad number", () => {
      expect(formatIdentificationNumber("990315-10-1235")).toBe(
          "990315-10-1235"
      );
    });

    it("should normalize a MyKad number containing spaces", () => {
      expect(formatIdentificationNumber("990315 10 1235")).toBe(
          "990315-10-1235"
      );
    });

    it("should normalize a MyKad number containing dots", () => {
      expect(formatIdentificationNumber("990315.10.1235")).toBe(
          "990315-10-1235"
      );
    });

    it("should normalize a MyKad number containing multiple separators", () => {
      expect(formatIdentificationNumber("990315--10--1235")).toBe(
          "990315-10-1235"
      );
    });

    it("should preserve a MyKad number shorter than 12 digits", () => {
      expect(formatIdentificationNumber("99031510123")).toBe(
          "99031510123"
      );
    });

    it("should preserve a MyKad number longer than 12 digits", () => {
      expect(formatIdentificationNumber("9903151012356")).toBe(
          "9903151012356"
      );
    });

    it("should preserve an empty string", () => {
      expect(formatIdentificationNumber("")).toBe("");
    });

    it("should preserve non-numeric input when it does not contain 12 digits", () => {
      expect(formatIdentificationNumber("ABC123")).toBe("ABC123");
    });

    it("should format a 12-digit number even when letters are present", () => {
      expect(formatIdentificationNumber("MY990315101235")).toBe(
          "990315-10-1235"
      );
    });

    it("should preserve leading zeros", () => {
      expect(formatIdentificationNumber("000101101234")).toBe(
          "000101-10-1234"
      );
    });
  });

  describe("formatMobileNumber", () => {
    it("should format a 10-digit mobile number", () => {
      expect(formatMobileNumber("0123456789")).toBe("012-3456789");
    });

    it("should format an 11-digit mobile number", () => {
      expect(formatMobileNumber("01112345678")).toBe("011-12345678");
    });

    it("should preserve a correctly formatted mobile number", () => {
      expect(formatMobileNumber("012-3456789")).toBe("012-3456789");
    });

    it("should normalize mobile numbers containing spaces", () => {
      expect(formatMobileNumber("012 345 6789")).toBe("012-3456789");
    });

    it("should normalize mobile numbers containing multiple hyphens", () => {
      expect(formatMobileNumber("012--345--6789")).toBe("012-3456789");
    });

    it("should return null for null input", () => {
      expect(formatMobileNumber(null)).toBeNull();
    });

    it("should return null for an empty string", () => {
      expect(formatMobileNumber("")).toBeNull();
    });

    it("should return an empty string for whitespace-only input", () => {
      expect(formatMobileNumber("   ")).toBe("");
    });

    it("should preserve a one-digit input", () => {
      expect(formatMobileNumber("0")).toBe("0");
    });

    it("should preserve a two-digit input", () => {
      expect(formatMobileNumber("01")).toBe("01");
    });

    it("should preserve a three-digit input", () => {
      expect(formatMobileNumber("012")).toBe("012");
    });

    it("should add a hyphen after the first three digits", () => {
      expect(formatMobileNumber("0123")).toBe("012-3");
    });

    it("should format numbers without validating their length", () => {
      expect(formatMobileNumber("012345678901")).toBe(
          "012-345678901"
      );
    });

    it("should remove non-numeric characters before formatting", () => {
      expect(formatMobileNumber("+60 (12) 345-6789")).toBe(
          "601-23456789"
      );
    });
  });

  describe("formatHomePhone", () => {
    it("should format a 10-digit Kuala Lumpur home phone number", () => {
      expect(formatHomePhone("0312345678")).toBe("03-12345678");
    });

    it("should preserve a correctly formatted Kuala Lumpur home phone number", () => {
      expect(formatHomePhone("03-12345678")).toBe("03-12345678");
    });

    it("should normalize a Kuala Lumpur home phone number containing spaces", () => {
      expect(formatHomePhone("03 1234 5678")).toBe("03-12345678");
    });

    it("should format a 9-digit home phone number", () => {
      expect(formatHomePhone("041234567")).toBe("041-234567");
    });

    it("should format a 10-digit non-Kuala Lumpur home phone number", () => {
      expect(formatHomePhone("0412345678")).toBe("041-2345678");
    });

    it("should return null for null input", () => {
      expect(formatHomePhone(null)).toBeNull();
    });

    it("should return null for an empty string", () => {
      expect(formatHomePhone("")).toBeNull();
    });

    it("should preserve whitespace-only input", () => {
      expect(formatHomePhone("   ")).toBe("   ");
    });

    it("should preserve home phone numbers shorter than 9 digits", () => {
      expect(formatHomePhone("03123456")).toBe("03123456");
    });

    it("should preserve home phone numbers longer than 10 digits", () => {
      expect(formatHomePhone("03123456789")).toBe("03123456789");
    });

    it("should preserve non-numeric input", () => {
      expect(formatHomePhone("invalid")).toBe("invalid");
    });

    it("should normalize home phone numbers containing multiple separators", () => {
      expect(formatHomePhone("03--1234--5678")).toBe("03-12345678");
    });

    it("should preserve an invalid short formatted number", () => {
      expect(formatHomePhone("03-1234")).toBe("03-1234");
    });

    it("should format numbers based on length without validating area codes", () => {
      expect(formatHomePhone("991234567")).toBe("991-234567");
    });
  });

  describe("formatIncome", () => {
    it("should format zero income", () => {
      expect(formatIncome(0)).toBe("RM 0.00");
    });

    it("should format a whole number with two decimal places", () => {
      expect(formatIncome(1000)).toBe("RM 1,000.00");
    });

    it("should format income containing cents", () => {
      expect(formatIncome(2500.5)).toBe("RM 2,500.50");
    });

    it("should format income with two decimal places", () => {
      expect(formatIncome(1234.56)).toBe("RM 1,234.56");
    });

    it("should format large income values with thousand separators", () => {
      expect(formatIncome(1000000)).toBe("RM 1,000,000.00");
    });

    it("should format income below RM 1", () => {
      expect(formatIncome(0.5)).toBe("RM 0.50");
    });

    it("should format negative income values", () => {
      expect(formatIncome(-1000)).toBe("RM -1,000.00");
    });

    it("should return null for null income", () => {
      expect(formatIncome(null)).toBeNull();
    });

    it("should return null for NaN", () => {
      expect(formatIncome(Number.NaN)).toBeNull();
    });

    it("should return null for positive infinity", () => {
      expect(formatIncome(Infinity)).toBeNull();
    });

    it("should return null for negative infinity", () => {
      expect(formatIncome(-Infinity)).toBeNull();
    });

    it("should round income to two decimal places", () => {
      expect(formatIncome(1234.567)).toBe("RM 1,234.57");
    });

    it("should preserve exactly two decimal places", () => {
      expect(formatIncome(1234.5)).toBe("RM 1,234.50");
    });
  });

  describe("parseIncome", () => {
    it("should convert an integer string into a number", () => {
      expect(parseIncome("3000")).toBe(3000);
    });

    it("should convert a decimal string into a number", () => {
      expect(parseIncome("2500.50")).toBe(2500.5);
    });

    it("should convert zero into a number", () => {
      expect(parseIncome("0")).toBe(0);
    });

    it("should convert a negative income string into a number", () => {
      expect(parseIncome("-100")).toBe(-100);
    });

    it("should trim surrounding whitespace", () => {
      expect(parseIncome("  3000  ")).toBe(3000);
    });

    it("should return null for an empty string", () => {
      expect(parseIncome("")).toBeNull();
    });

    it("should return null for whitespace-only input", () => {
      expect(parseIncome("   ")).toBeNull();
    });

    it("should return NaN for non-numeric input", () => {
      expect(parseIncome("abc")).toBeNaN();
    });

    it("should return NaN for a currency-formatted string", () => {
      expect(parseIncome("RM 3000")).toBeNaN();
    });

    it("should return NaN for a number containing commas", () => {
      expect(parseIncome("1,000")).toBeNaN();
    });

    it("should convert a leading-zero string into a number", () => {
      expect(parseIncome("003000")).toBe(3000);
    });

    it("should convert a positive decimal string into a number", () => {
      expect(parseIncome("+2500.50")).toBe(2500.5);
    });

    it("should convert scientific notation into a number", () => {
      expect(parseIncome("1e3")).toBe(1000);
    });

    it("should return positive infinity for the Infinity string", () => {
      expect(parseIncome("Infinity")).toBe(Infinity);
    });

    it("should return negative infinity for the -Infinity string", () => {
      expect(parseIncome("-Infinity")).toBe(-Infinity);
    });
  });

  describe("Profile Utility Integration", () => {
    it("should preserve income through parsing and formatting", () => {
      const parsed = parseIncome("2500.50");
      const formatted = formatIncome(parsed);

      expect(formatted).toBe("RM 2,500.50");
    });

    it("should preserve zero income through parsing and formatting", () => {
      const parsed = parseIncome("0");
      const formatted = formatIncome(parsed);

      expect(formatted).toBe("RM 0.00");
    });

    it("should return null when formatting an empty income input", () => {
      const parsed = parseIncome("");
      const formatted = formatIncome(parsed);

      expect(formatted).toBeNull();
    });

    it("should return null when formatting an invalid income input", () => {
      const parsed = parseIncome("invalid");
      const formatted = formatIncome(parsed);

      expect(formatted).toBeNull();
    });

    it("should format a MyKad number consistently", () => {
      const formatted = formatIdentificationNumber("990315101235");

      expect(formatted).toBe("990315-10-1235");
    });

    it("should format a date of birth consistently", () => {
      const formatted = formatDateOfBirth("1999-03-15");

      expect(formatted).toBe("15/03/1999");
    });
  });
});
