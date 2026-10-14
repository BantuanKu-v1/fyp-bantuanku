import { z } from "zod";

export const homePhoneSchema = z
    .string()
    .trim()
    .refine(
        (value) => {
          if (!value) {
            return true;
          }

          const digits = value.replace(/\D/g, "");

          return /^0[3-9]\d{7,8}$/.test(digits);
        },
        {
          message: "validation.homePhoneInvalid"
        }
    );
