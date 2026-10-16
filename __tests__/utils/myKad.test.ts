import { getDobFromMyKad, getGenderFromMyKad, formatMyKad } from "../../src/utils/myKad";

describe("MyKad Utilities", () => {
  // getDobFromMyKad
  describe("getDobFromMyKad", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 9, 15));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should extract a valid date of birth from MyKad", () => {
      const result = getDobFromMyKad("990315-10-1234");

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(1999);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });

    it("should support MyKad numbers without hyphens", () => {
      const result = getDobFromMyKad("990315101234");

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(1999);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });

    it("should interpret recent birth years correctly", () => {
      const result = getDobFromMyKad("050620-10-1234");

      expect(result?.getFullYear()).toBe(2005);
      expect(result?.getMonth()).toBe(5);
      expect(result?.getDate()).toBe(20);
    });

    it("should interpret future two-digit years as the previous century", () => {
      const result = getDobFromMyKad("301201-10-1234");

      expect(result?.getFullYear()).toBe(1930);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(1);
    });

    it("should accept a valid leap year date", () => {
      const result = getDobFromMyKad("000229-10-1234");

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2000);
      expect(result?.getMonth()).toBe(1);
      expect(result?.getDate()).toBe(29);
    });

    it("should reject an invalid leap year date", () => {
      const result = getDobFromMyKad("010229-10-1234");

      expect(result).toBeNull();
    });

    it("should reject an invalid month", () => {
      expect(getDobFromMyKad("991315-10-1234")).toBeNull();
    });

    it("should reject an invalid day", () => {
      expect(getDobFromMyKad("990332-10-1234")).toBeNull();
    });

    it("should reject February 30", () => {
      expect(getDobFromMyKad("000230-10-1234")).toBeNull();
    });

    it("should reject MyKad numbers shorter than 12 digits", () => {
      expect(getDobFromMyKad("99031510123")).toBeNull();
    });

    it("should reject MyKad numbers longer than 12 digits", () => {
      expect(getDobFromMyKad("9903151012345")).toBeNull();
    });

    it("should reject an empty MyKad number", () => {
      expect(getDobFromMyKad("")).toBeNull();
    });
  });

  // getGenderFromMyKad
  describe("getGenderFromMyKad", () => {
    it("should return male when the last digit is odd", () => {
      expect(getGenderFromMyKad("990315-10-1235")).toBe("male");
    });

    it("should return female when the last digit is even", () => {
      expect(getGenderFromMyKad("990315-10-1234")).toBe("female");
    });

    it("should support MyKad numbers without hyphens", () => {
      expect(getGenderFromMyKad("990315101235")).toBe("male");
    });

    it("should return male when the last digit is 1", () => {
      expect(getGenderFromMyKad("990315101231")).toBe("male");
    });

    it("should return female when the last digit is 0", () => {
      expect(getGenderFromMyKad("990315101230")).toBe("female");
    });

    it("should reject MyKad numbers shorter than 12 digits", () => {
      expect(getGenderFromMyKad("99031510123")).toBeNull();
    });

    it("should reject MyKad numbers longer than 12 digits", () => {
      expect(getGenderFromMyKad("9903151012345")).toBeNull();
    });

    it("should reject an empty MyKad number", () => {
      expect(getGenderFromMyKad("")).toBeNull();
    });
  });

  // formatMyKad
  describe("formatMyKad", () => {
    it("should format a complete 12-digit MyKad number", () => {
      expect(formatMyKad("990315101234")).toBe("990315-10-1234");
    });

    it("should preserve the correct format when already formatted", () => {
      expect(formatMyKad("990315-10-1234")).toBe("990315-10-1234");
    });

    it("should return digits unchanged when length is 6 or fewer", () => {
      expect(formatMyKad("990315")).toBe("990315");
    });

    it("should insert the first hyphen after 6 digits", () => {
      expect(formatMyKad("9903151")).toBe("990315-1");
    });

    it("should format an 8-digit partial MyKad number", () => {
      expect(formatMyKad("99031510")).toBe("990315-10");
    });

    it("should insert the second hyphen after 8 digits", () => {
      expect(formatMyKad("990315101")).toBe("990315-10-1");
    });

    it("should remove non-numeric characters", () => {
      expect(formatMyKad("990315abc101234")).toBe("990315-10-1234");
    });

    it("should truncate MyKad numbers exceeding 12 digits", () => {
      expect(formatMyKad("9903151012345678")).toBe("990315-10-1234");
    });

    it("should return an empty string for empty input", () => {
      expect(formatMyKad("")).toBe("");
    });

    it("should return an empty string when input contains no digits", () => {
      expect(formatMyKad("abcdef")).toBe("");
    });
  });
});
