import { z } from "zod";
import { TFunction } from "i18next";
import {
  CITIZENSHIP_VALUES,
  EMPLOYMENT_STATUS_VALUES,
  HOUSEHOLD_RELATIONSHIP_VALUES,
  MYKAD_BIRTHPLACE_CODES
} from "../constants/registration";
import { getDobFromMyKad } from "../lib/myKad";

export const householdMemberSchema = (t: TFunction) => z.object({
  fullName: z
      .string()
      .trim()
      .min(1, t("validation.householdMemberNameRequired")),

  relationship: z
      .union([
        z.literal(""),
        z.enum(HOUSEHOLD_RELATIONSHIP_VALUES),
      ])
      .refine(
          (value) => value !== "",
          {
            message: t("validation.relationshipRequired"),
          }
      ),

  dateOfBirth: z
      .date()
      .nullable()
      .refine(
          (value) => value !== null,
          {
            message: t("validation.householdMemberDobRequired")
          },
      ),
});

export type HouseholdMemberFormData = z.input<ReturnType<typeof householdMemberSchema>>;

export const addHouseholdMemberSchema = (t: TFunction) => {
  return householdMemberSchema(t)
      .safeExtend({
        identificationNumber: z
            .string()
            .trim()
            .min(1, t("validation.required")),

        gender: z
            .union([
              z.literal(""),
              z.enum(["male", "female"]),
            ])
            .refine(
                (value) => value !== "",
                {
                  message: t("validation.required")
                }
            ),

        citizenship: z
            .union([
              z.literal(""),
              z.enum(CITIZENSHIP_VALUES),
            ])
            .refine(
                (value) => value !== "",
                {
                  message: t("validation.required")
                }
            ),

        isDependent: z
            .boolean()
            .nullable(),

        employmentStatus: z
            .union([
              z.literal(""),
              z.enum(EMPLOYMENT_STATUS_VALUES),
            ]),

        occupation: z
            .string()
            .trim(),

        monthlyIncome: z
            .string()
            .trim()
            .refine(
                (value) => {
                  if (value === "") {
                    return true;
                  }

                  const amount = Number(value);

                  return (
                      Number.isFinite(amount) &&
                      amount >= 0 &&
                      amount <= 9999999
                  );
                },
                {
                  message: t("validation.monthlyIncomeInvalid")
                }
            ),

        isStudent: z
            .boolean()
            .nullable(),

        studyMode: z
            .string()
            .trim(),

        institutionType: z
            .string()
            .trim(),

        isOku: z
            .boolean()
            .nullable()
            .refine(
                (value) => value !== null,
                {
                  message: t("validation.required")
                }
            ),

        okuRegistered: z
            .boolean()
            .nullable(),
      })
      .superRefine((data, ctx) => {
        if (data.dateOfBirth) {
          const selectedDate = new Date(
              data.dateOfBirth.getFullYear(),
              data.dateOfBirth.getMonth(),
              data.dateOfBirth.getDate()
          );

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const minimumDate = new Date(1900, 0, 1);

          if (selectedDate > today || selectedDate < minimumDate) {
            ctx.addIssue({
              code: "custom",
              path: ["dateOfBirth"],
              message: t("validation.dateOfBirthInvalid")
            });
          }
        }

        if (data.identificationNumber !== "") {
          if (data.citizenship === "malaysian") {
            const identificationNumber = data.identificationNumber;
            const formatValid = /^\d{6}-\d{2}-\d{4}$/.test(identificationNumber);
            const birthplaceCode = identificationNumber.slice(7, 9);
            const birthplaceValid = (MYKAD_BIRTHPLACE_CODES as readonly string[]).includes(birthplaceCode);
            const derivedDateOfBirth = getDobFromMyKad(identificationNumber);

            if (!formatValid || !birthplaceValid || !derivedDateOfBirth) {
              ctx.addIssue({
                code: "custom",
                path: ["identificationNumber"],
                message: t("validation.myKadNumberInvalid")
              });
            }

            // Check DOB consistency with MyKad
            // Compare YYMMDD to avoid incorrect century assumptions
            if (
                formatValid &&
                birthplaceValid &&
                derivedDateOfBirth &&
                data.dateOfBirth
            ) {
              const selectedDate = data.dateOfBirth;

              const selectedYear = String(
                  selectedDate.getFullYear() % 100
              ).padStart(2, "0");

              const selectedMonth = String(
                  selectedDate.getMonth() + 1
              ).padStart(2, "0");

              const selectedDay = String(
                  selectedDate.getDate()
              ).padStart(2, "0");

              const selectedDateDigits =
                  `${selectedYear}${selectedMonth}${selectedDay}`;

              const myKadDateDigits =
                  identificationNumber.slice(0, 6);

              if (selectedDateDigits !== myKadDateDigits) {
                ctx.addIssue({
                  code: "custom",
                  path: ["dateOfBirth"],
                  message: t("validation.dateOfBirthMismatch")
                });
              }
            }
          } else if (data.identificationNumber.length < 5) {
            ctx.addIssue({
              code: "custom",
              path: ["identificationNumber"],
              message: t("validation.identificationNumberInvalid")
            });
          }
        }

        // Student Information
        if (data.isStudent === true) {
          if (data.studyMode === "") {
            ctx.addIssue({
              code: "custom",
              path: ["studyMode"],
              message: t("validation.required")
            });
          }

          if (data.institutionType === "") {
            ctx.addIssue({
              code: "custom",
              path: ["institutionType"],
              message: t("validation.required")
            });
          }
        }

        // OKU Information
        if (data.isOku) {
          if (data.okuRegistered === null) {
            ctx.addIssue({
              code: "custom",
              path: ["okuRegistered"],
              message: t("validation.required")
            });
          }
        }
      });
};

export type AddHouseholdMemberFormData = z.input<ReturnType<typeof addHouseholdMemberSchema>>;
