import { describe, it, expect } from "@jest/globals";
import { homePhoneSchema } from "../../src/schemas/profile";

// Profile Schema Tests
describe("Profile Schemas", () => {
  // homePhoneSchema
  describe("homePhoneSchema", () => {
    it("should accept a valid Kuala Lumpur home phone number", () => {
      const result = homePhoneSchema.safeParse("0312345678");

      expect(result.success).toBe(true);
    });

    it("should accept a valid formatted home phone number", () => {
      const result = homePhoneSchema.safeParse("03-12345678");

      expect(result.success).toBe(true);
    });

    it("should accept a valid home phone number with spaces", () => {
      const result = homePhoneSchema.safeParse("03 1234 5678");

      expect(result.success).toBe(true);
    });

    it("should accept a valid 9-digit home phone number", () => {
      const result = homePhoneSchema.safeParse("041234567");

      expect(result.success).toBe(true);
    });

    it("should accept an empty home phone number", () => {
      const result = homePhoneSchema.safeParse("");

      expect(result.success).toBe(true);
    });

    it("should accept whitespace-only input as optional", () => {
      const result = homePhoneSchema.safeParse("   ");

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBe("");
      }
    });

    it("should trim surrounding whitespace", () => {
      const result = homePhoneSchema.safeParse("  03-12345678  ");

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBe("03-12345678");
      }
    });

    it("should reject a home phone number starting with 01", () => {
      const result = homePhoneSchema.safeParse("0123456789");

      expect(result.success).toBe(false);
    });

    it("should reject a home phone number not starting with 0", () => {
      const result = homePhoneSchema.safeParse("312345678");

      expect(result.success).toBe(false);
    });

    it("should reject a home phone number shorter than 9 digits", () => {
      const result = homePhoneSchema.safeParse("03123456");

      expect(result.success).toBe(false);
    });

    it("should reject a home phone number longer than 10 digits", () => {
      const result = homePhoneSchema.safeParse("03123456789");

      expect(result.success).toBe(false);
    });

    it("should reject a home phone number containing only letters", () => {
      const result = homePhoneSchema.safeParse("abcdefghij");

      expect(result.success).toBe(false);
    });

    it("should return the correct validation message for invalid input", () => {
      const result = homePhoneSchema.safeParse("12345");

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.homePhoneInvalid"
        );
      }
    });

    it("should reject undefined because the schema expects a string", () => {
      const result = homePhoneSchema.safeParse(undefined);

      expect(result.success).toBe(false);
    });

    it("should reject null because the schema expects a string", () => {
      const result = homePhoneSchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it("should reject numeric input because the schema expects a string", () => {
      const result = homePhoneSchema.safeParse(312345678);

      expect(result.success).toBe(false);
    });
  });
});
