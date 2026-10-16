import { describe, it, expect } from "@jest/globals";
import { TFunction } from "i18next";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  registerSchema,
} from "../../src/schemas/auth";

// Mock translation function
const t = ((key: string) => key) as TFunction;

// Authentication Schema Tests
describe("Authentication Schemas", () => {
  // loginSchema
  describe("loginSchema", () => {
    const schema = loginSchema(t);

    it("should accept valid login credentials", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("should accept passwords shorter than 8 characters for login", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "123",
      });

      expect(result.success).toBe(true);
    });

    it("should trim whitespace from email addresses", () => {
      const result = schema.safeParse({
        email: "  user@example.com  ",
        password: "password123",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should reject an empty email", () => {
      const result = schema.safeParse({
        email: "",
        password: "password123",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.emailRequired"
        );
      }
    });

    it("should reject an invalid email format", () => {
      const result = schema.safeParse({
        email: "invalid-email",
        password: "password123",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.emailInvalid"
        );
      }
    });

    it("should reject an empty password", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.passwordRequired"
        );
      }
    });

    it("should reject missing email", () => {
      const result = schema.safeParse({
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing password", () => {
      const result = schema.safeParse({
        email: "user@example.com",
      });

      expect(result.success).toBe(false);
    });
  });

  // forgotPasswordSchema
  describe("forgotPasswordSchema", () => {
    const schema = forgotPasswordSchema(t);

    it("should accept a valid email", () => {
      const result = schema.safeParse({
        email: "user@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("should trim whitespace from email", () => {
      const result = schema.safeParse({
        email: "  user@example.com  ",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should reject an empty email", () => {
      const result = schema.safeParse({
        email: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.emailRequired"
        );
      }
    });

    it("should reject an invalid email", () => {
      const result = schema.safeParse({
        email: "invalid-email",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.emailInvalid"
        );
      }
    });

    it("should reject missing email", () => {
      const result = schema.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  // resetPasswordSchema
  describe("resetPasswordSchema", () => {
    const schema = resetPasswordSchema(t);

    it("should accept matching passwords with at least 8 characters", () => {
      const result = schema.safeParse({
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("should accept passwords with exactly 8 characters", () => {
      const result = schema.safeParse({
        password: "12345678",
        confirmPassword: "12345678",
      });

      expect(result.success).toBe(true);
    });

    it("should reject passwords shorter than 8 characters", () => {
      const result = schema.safeParse({
        password: "1234567",
        confirmPassword: "1234567",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.passwordTooShort"
        );
      }
    });

    it("should reject an empty password", () => {
      const result = schema.safeParse({
        password: "",
        confirmPassword: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.passwordRequired"
        );
      }
    });

    it("should reject an empty confirmation password", () => {
      const result = schema.safeParse({
        password: "password123",
        confirmPassword: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.confirmPasswordRequired"
        );
      }
    });

    it("should reject mismatched passwords", () => {
      const result = schema.safeParse({
        password: "password123",
        confirmPassword: "different123",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["confirmPassword"],
              message: "validation.passwordMismatch",
            })
        );
      }
    });

    it("should reject missing password", () => {
      const result = schema.safeParse({
        confirmPassword: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing confirmation password", () => {
      const result = schema.safeParse({
        password: "password123",
      });

      expect(result.success).toBe(false);
    });
  });

  // registerSchema
  describe("registerSchema", () => {
    const schema = registerSchema(t);

    it("should accept valid registration data", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("should accept passwords with exactly 8 characters", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "12345678",
        confirmPassword: "12345678",
      });

      expect(result.success).toBe(true);
    });

    it("should trim email whitespace", () => {
      const result = schema.safeParse({
        email: "  user@example.com  ",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should reject an empty email", () => {
      const result = schema.safeParse({
        email: "",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.emailRequired"
        );
      }
    });

    it("should reject an invalid email", () => {
      const result = schema.safeParse({
        email: "invalid-email",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.emailInvalid"
        );
      }
    });

    it("should reject an empty password", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "",
        confirmPassword: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.passwordRequired"
        );
      }
    });

    it("should reject passwords shorter than 8 characters", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "1234567",
        confirmPassword: "1234567",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.passwordTooShort"
        );
      }
    });

    it("should reject an empty confirmation password", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
            "validation.confirmPasswordRequired"
        );
      }
    });

    it("should reject mismatched passwords", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "different123",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["confirmPassword"],
              message: "validation.passwordMismatch",
            })
        );
      }
    });

    it("should reject missing email", () => {
      const result = schema.safeParse({
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing password", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing confirmation password", () => {
      const result = schema.safeParse({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });
  });
});
