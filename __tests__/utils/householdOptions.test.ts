import { describe, it, expect } from "@jest/globals";
import type { TFunction } from "i18next";
import {
  getHouseholdOptions,
  toYesNoValue,
  fromYesNoValue,
  type HouseholdOption,
  type YesNoValue,
} from "../../src/utils/household/householdOptions";

// Mock translation function
const t = ((key: string) => `translated:${key}`) as TFunction;

// Test data
const relationshipKeys = {
  spouse: "household.relationship.spouse",
  child: "household.relationship.child",
  parent: "household.relationship.parent",
};

const genderKeys = {
  male: "household.gender.male",
  female: "household.gender.female",
};

describe("Household Options Utilities", () => {
  describe("getHouseholdOptions", () => {
    it("should convert translation keys into dropdown options", () => {
      const result = getHouseholdOptions(relationshipKeys, t);

      expect(result).toEqual([
        {
          label: "translated:household.relationship.spouse",
          value: "spouse",
        },
        {
          label: "translated:household.relationship.child",
          value: "child",
        },
        {
          label: "translated:household.relationship.parent",
          value: "parent",
        },
      ]);
    });

    it("should preserve the original option values", () => {
      const result = getHouseholdOptions(relationshipKeys, t);

      expect(result.map((option) => option.value)).toEqual([
        "spouse",
        "child",
        "parent",
      ]);
    });

    it("should use translated labels", () => {
      const result = getHouseholdOptions(genderKeys, t);

      expect(result[0].label).toBe("translated:household.gender.male");
      expect(result[1].label).toBe("translated:household.gender.female");
    });

    it("should return an empty array when no keys are provided", () => {
      const result = getHouseholdOptions({}, t);

      expect(result).toEqual([]);
    });

    it("should return one option for one translation key", () => {
      const result = getHouseholdOptions(
          {
            spouse: "household.relationship.spouse",
          },
          t
      );

      expect(result).toEqual([
        {
          label: "translated:household.relationship.spouse",
          value: "spouse",
        },
      ]);
    });

    it("should preserve the insertion order of string keys", () => {
      const result = getHouseholdOptions(
          {
            parent: "household.relationship.parent",
            spouse: "household.relationship.spouse",
            child: "household.relationship.child",
          },
          t
      );

      expect(result.map((option) => option.value)).toEqual([
        "parent",
        "spouse",
        "child",
      ]);
    });

    it("should return the correct number of options", () => {
      const result = getHouseholdOptions(relationshipKeys, t);

      expect(result).toHaveLength(3);
    });

    it("should produce options with label and value properties", () => {
      const result = getHouseholdOptions(genderKeys, t);

      result.forEach((option) => {
        expect(option).toHaveProperty("label");
        expect(option).toHaveProperty("value");
        expect(Object.keys(option)).toEqual(["label", "value"]);
      });
    });

    it("should preserve values containing underscores", () => {
      const result = getHouseholdOptions(
          {
            self_employed: "household.employment.selfEmployed",
          },
          t
      );

      expect(result).toEqual([
        {
          label: "translated:household.employment.selfEmployed",
          value: "self_employed",
        },
      ]);
    });

    it("should preserve translation keys containing dots", () => {
      const result = getHouseholdOptions(
          {
            full_time: "household.studyMode.fullTime",
          },
          t
      );

      expect(result[0].label).toBe(
          "translated:household.studyMode.fullTime"
      );
    });

    it("should use the translation function provided at call time", () => {
      const englishT = ((key: string) => `EN:${key}`) as TFunction;
      const malayT = ((key: string) => `BM:${key}`) as TFunction;

      const englishOptions = getHouseholdOptions(genderKeys, englishT);
      const malayOptions = getHouseholdOptions(genderKeys, malayT);

      expect(englishOptions[0].label).toBe(
          "EN:household.gender.male"
      );

      expect(malayOptions[0].label).toBe(
          "BM:household.gender.male"
      );
    });

    it("should not modify the original translation keys", () => {
      const keys = {
        male: "household.gender.male",
        female: "household.gender.female",
      };

      const original = { ...keys };

      getHouseholdOptions(keys, t);

      expect(keys).toEqual(original);
    });

    it("should create a new array for each call", () => {
      const first = getHouseholdOptions(genderKeys, t);
      const second = getHouseholdOptions(genderKeys, t);

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
    });

    it("should support explicitly typed household options", () => {
      type Gender = "male" | "female";

      const result: HouseholdOption<Gender>[] = getHouseholdOptions(
          genderKeys,
          t
      );

      expect(result.map((option) => option.value)).toEqual([
        "male",
        "female",
      ]);
    });
  });

  describe("toYesNoValue", () => {
    it("should convert true to yes", () => {
      expect(toYesNoValue(true)).toBe("yes");
    });

    it("should convert false to no", () => {
      expect(toYesNoValue(false)).toBe("no");
    });

    it("should convert null to an empty string", () => {
      expect(toYesNoValue(null)).toBe("");
    });

    it("should return a valid YesNoValue for true", () => {
      const result: YesNoValue = toYesNoValue(true);

      expect(result).toBe("yes");
    });

    it("should return a valid YesNoValue for false", () => {
      const result: YesNoValue = toYesNoValue(false);

      expect(result).toBe("no");
    });

    it("should return a valid YesNoValue for null", () => {
      const result: YesNoValue = toYesNoValue(null);

      expect(result).toBe("");
    });
  });

  describe("fromYesNoValue", () => {
    it("should convert yes to true", () => {
      expect(fromYesNoValue("yes")).toBe(true);
    });

    it("should convert no to false", () => {
      expect(fromYesNoValue("no")).toBe(false);
    });

    it("should convert an empty string to null", () => {
      expect(fromYesNoValue("")).toBeNull();
    });

    it("should convert an invalid value to null", () => {
      expect(fromYesNoValue("invalid")).toBeNull();
    });

    it("should treat uppercase YES as an invalid value", () => {
      expect(fromYesNoValue("YES")).toBeNull();
    });

    it("should treat uppercase NO as an invalid value", () => {
      expect(fromYesNoValue("NO")).toBeNull();
    });

    it("should treat values with surrounding whitespace as invalid", () => {
      expect(fromYesNoValue(" yes ")).toBeNull();
      expect(fromYesNoValue(" no ")).toBeNull();
    });

    it("should treat numeric strings as invalid", () => {
      expect(fromYesNoValue("1")).toBeNull();
      expect(fromYesNoValue("0")).toBeNull();
    });

    it("should treat boolean strings as invalid", () => {
      expect(fromYesNoValue("true")).toBeNull();
      expect(fromYesNoValue("false")).toBeNull();
    });
  });

  describe("Yes/No Conversion Consistency", () => {
    it("should preserve true through both conversions", () => {
      const dropdownValue = toYesNoValue(true);
      const result = fromYesNoValue(dropdownValue);

      expect(result).toBe(true);
    });

    it("should preserve false through both conversions", () => {
      const dropdownValue = toYesNoValue(false);
      const result = fromYesNoValue(dropdownValue);

      expect(result).toBe(false);
    });

    it("should preserve null through both conversions", () => {
      const dropdownValue = toYesNoValue(null);
      const result = fromYesNoValue(dropdownValue);

      expect(result).toBeNull();
    });

    it("should preserve yes through reverse conversion", () => {
      const booleanValue = fromYesNoValue("yes");
      const result = toYesNoValue(booleanValue);

      expect(result).toBe("yes");
    });

    it("should preserve no through reverse conversion", () => {
      const booleanValue = fromYesNoValue("no");
      const result = toYesNoValue(booleanValue);

      expect(result).toBe("no");
    });

    it("should preserve an empty value through reverse conversion", () => {
      const booleanValue = fromYesNoValue("");
      const result = toYesNoValue(booleanValue);

      expect(result).toBe("");
    });
  });
});
