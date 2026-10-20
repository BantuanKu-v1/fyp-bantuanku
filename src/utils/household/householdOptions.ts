import { TFunction } from "i18next";

export type YesNoValue = "" | "yes" | "no";

export type HouseholdOption<T extends string = string> = {
  label: string;
  value: T;
};

// Convert translation keys into dropdown options using the current language
export const getHouseholdOptions = <T extends string>(
    keys: Record<T, string>,
    t: TFunction
): HouseholdOption<T>[] => {
  return (Object.entries(keys) as [T, string][]).map(
      ([value, translationKey]) => ({
        label: t(translationKey),
        value
      })
  );
};

// Convert a nullable boolean into a Yes/No dropdown value
export const toYesNoValue = (
    value: boolean | null
): YesNoValue => {
  if (value === true) {
    return "yes";
  }

  if (value === false) {
    return "no";
  }

  return "";
};

// Convert a Yes/No dropdown value back into a nullable boolean
export const fromYesNoValue = (
    value: string
): boolean | null => {
  if (value === "yes") {
    return true;
  }

  if (value === "no") {
    return false;
  }

  return null;
};
