import { z } from "zod";
import { TFunction } from "i18next";
import {
  CITIZENSHIP_VALUES,
  EMPLOYMENT_STATUS_VALUES,
  INCOME_SOURCE_VALUES,
  MYKAD_BIRTHPLACE_CODES,
  STATE_TERRITORY_VALUES
} from "../constants/registration";
import { householdMemberSchema } from "./household";

export const mobileNumberSchema = (t: TFunction) => z
    .string()
    .trim()
    .min(1, t("validation.mobileNumberRequired"))
    .refine(
        (value) => {
          const digits = value.replace(/\D/g, "");

          return /^01\d{8,9}$/.test(digits);
        },
        {
          message: t("validation.mobileNumberInvalid"),
        }
    );

export const registerPersonalSchema = (t: TFunction) => z.object({
  fullName: z
      .string()
      .trim()
      .min(1, t("validation.fullNameRequired")),

  myKadNumber: z
      .string()
      .trim()
      .min(1, t("validation.myKadNumberRequired"))
      .regex(
          /^\d{6}-\d{2}-\d{4}$/,
          t("validation.myKadNumberInvalid")
      )
      .refine(
          (value) => {
            if (!/^\d{6}-\d{2}-\d{4}$/.test(value)) {
              return true;
            }

            const birthplaceCode = value.slice(7, 9);

            return MYKAD_BIRTHPLACE_CODES.some(
                (code) => code === birthplaceCode
            );
          },
          {
            message: t("validation.myKadNumberInvalid")
          }
      )
      .refine(
          (value) => {
            if (!/^\d{6}-\d{2}-\d{4}$/.test(value)) {
              return true;
            }

            const month = Number(value.slice(2, 4));
            const day = Number(value.slice(4, 6));

            if (
                month < 1 ||
                month > 12 ||
                day < 1
            ) {
              return false;
            }

            const daysInMonth = new Date(
                2000,
                month,
                0
            ).getDate();

            return day <= daysInMonth;
          },
          {
            message: t("validation.myKadNumberInvalid")
          }
      ),

  dateOfBirth: z
      .date()
      .optional()
      .refine(
          (value) => value !== undefined,
          {
            message: t("validation.dateOfBirthRequired"),
          }
      ),

  citizenship: z.enum(CITIZENSHIP_VALUES, {
    error: t("validation.citizenshipRequired")
  }),

  mobileNumber: z
      .string()
      .trim()
      .min(1, t("validation.mobileNumberRequired"))
      .refine(
          (value) => {
            const digits = value.replace(/\D/g, "");

            return /^01\d{8,9}$/.test(digits);
          },
          {
            message: t("validation.mobileNumberInvalid"),
          }
      ),
});

export type RegisterPersonalFormData = z.input<ReturnType<typeof registerPersonalSchema>>;

export const registerResidenceSchema = (t: TFunction) => z.object({
  addressLine1: z
      .string()
      .trim()
      .min(1, t("validation.addressLine1Required")),

  addressLine2: z
      .string()
      .trim()
      .optional(),

  postcode: z
      .string()
      .trim()
      .min(1, t("validation.postcodeRequired"))
      .regex(
          /^\d{5}$/,
          t("validation.postcodeInvalid")
      ),

  city: z
      .string()
      .trim()
      .min(1, t("validation.cityRequired")),

  stateTerritory: z
      .union([
        z.literal(""),
        z.enum(STATE_TERRITORY_VALUES),
      ])
      .refine(
          (value) => value !== "",
          {
            message: t("validation.stateTerritoryRequired"),
          }
      ),
});

export type RegisterResidenceFormData = z.input<ReturnType<typeof registerResidenceSchema>>;

export const registerHouseholdIncomeSchema = (t: TFunction) => {
  return z.object({
    employmentStatus: z
        .union([
          z.literal(""),
          z.enum(EMPLOYMENT_STATUS_VALUES),
        ])
        .refine(
            (value) => value !== "",
            {
              message: t("validation.employmentStatusRequired"),
            }
        ),

    incomeSource: z
        .union([
          z.literal(""),
          z.enum(INCOME_SOURCE_VALUES),
        ])
        .refine(
            (value) => value !== "",
            {
              message: t("validation.incomeSourceRequired"),
            }
        ),

    personalMonthlyIncome: z
        .string()
        .trim()
        .min(
            1,
            t("validation.personalMonthlyIncomeRequired")
        )
        .refine(
            (value) => {
              const amount = Number(value);

              return (
                  Number.isFinite(amount) &&
                  amount >= 0 &&
                  amount <= 9999999
              );
            },
            {
              message: t("validation.monthlyIncomeInvalid")
            },
        ),

    householdMonthlyIncome: z
        .string()
        .trim()
        .min(
            1,
            t("validation.householdMonthlyIncomeRequired")
        )
        .refine(
            (value) => {
              const amount = Number(value);

              return (
                  Number.isFinite(amount) &&
                  amount >= 0 &&
                  amount <= 9999999
              );
            },
            {
              message: t("validation.monthlyIncomeInvalid")
            },
        ),

    householdMembers: z.array(
        householdMemberSchema(t)
    ),
  });
};

export type RegisterHouseholdIncomeFormData = z.input<ReturnType<typeof registerHouseholdIncomeSchema>>;
