import { z } from "zod";
import { TFunction } from "i18next";

export const loginSchema = (t: TFunction) => z.object({
  email: z
      .string()
      .trim()
      .min(1, t("validation.emailRequired"))
      .pipe(
          z.email(t("validation.emailInvalid"))
      ),

  password: z
      .string()
      .min(1, t("validation.passwordRequired")),
});

export type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;

export const forgotPasswordSchema = (t: TFunction) => z.object({
  email: z
      .string()
      .trim()
      .min(1, t("validation.emailRequired"))
      .pipe(
          z.email(t("validation.emailInvalid"))
      ),
});

export type ForgotPasswordFormData = z.infer<ReturnType<typeof forgotPasswordSchema>>;

export const resetPasswordSchema = (t: TFunction) => z.object({
  password: z
      .string()
      .min(1, t("validation.passwordRequired"))
      .min(8, t("validation.passwordTooShort")),

  confirmPassword: z
      .string()
      .min(1, t("validation.confirmPasswordRequired"))
})
    .refine(
        (data) => data.password === data.confirmPassword,
        {
          message: t("validation.passwordMismatch"),
          path: ["confirmPassword"]
        }
    );

export type ResetPasswordFormData = z.infer<ReturnType<typeof resetPasswordSchema>>;

export const registerSchema = (t: TFunction) => z.object({
  email: z
      .string()
      .trim()
      .min(1, t("validation.emailRequired"))
      .pipe(
          z.email(t("validation.emailInvalid"))
      ),

  password: z
      .string()
      .min(1, t("validation.passwordRequired"))
      .min(8, t("validation.passwordTooShort")),

  confirmPassword: z
      .string()
      .min(1, t("validation.confirmPasswordRequired")),
})
    .refine(
        (data) => data.password === data.confirmPassword,
        {
          message: t("validation.passwordMismatch"),
          path: ["confirmPassword"],
        }
    );

export type RegisterFormData = z.infer<ReturnType<typeof registerSchema>>;
