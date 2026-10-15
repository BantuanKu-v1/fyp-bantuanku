import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from "@jest/globals";
import {
  getHouseholdMembers,
  getHouseholdMember,
  createHouseholdMember,
  updateHouseholdMember,
  type CreateHouseholdMemberInput,
} from "../../../src/services/profile/householdService";
import { supabase } from "../../../src/lib/supabase";
import { getCurrentProfileId } from "../../../src/services/profile/profileService";

// Mock Supabase and profile dependencies
jest.mock("../../../src/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../../src/services/profile/profileService", () => ({
  getCurrentProfileId: jest.fn(),
}));

const mockFrom = jest.mocked(supabase.from);
const mockGetCurrentProfileId = jest.mocked(getCurrentProfileId);

// Test constants
const PROFILE_ID = "profile-001";
const MEMBER_ID = "member-001";

// Test data
const validInput = (): CreateHouseholdMemberInput => ({
  fullName: "  Ahmad Bin Ali  ",
  relationship: "spouse",
  dateOfBirth: new Date(1999, 2, 15),
  identificationNumber: "  990315-10-1235  ",
  gender: "male",
  citizenship: "malaysian",
  isDependent: false,
  employmentStatus: "employed",
  occupation: "  Teacher  ",
  monthlyIncome: "3000",
  isStudent: false,
  studyMode: "",
  institutionType: "",
  isOku: false,
  okuRegistered: null,
});

const databaseMember = () => ({
  id: MEMBER_ID,
  full_name: "Ahmad Bin Ali",
  identification_no: "990315-10-1235",
  relationship: "spouse",
  date_of_birth: "1999-03-15",
  gender: "male",
  citizenship: "malaysian",
  is_dependent: false,
  employment_status: "employed",
  occupation: "Teacher",
  monthly_income: 3000,
  is_student: false,
  study_mode: null,
  institution_type: null,
  is_oku: false,
  oku_registered: null,
});

// Mock Supabase query result
type MockQueryResult = {
  data: unknown;
  error: Error | null;
};

// Mock Supabase query builder
const createMockQuery = () => {
  const query = {
    select: jest.fn<(...args: unknown[]) => unknown>(),
    eq: jest.fn<(...args: unknown[]) => unknown>(),
    order: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
    insert: jest.fn<(...args: unknown[]) => unknown>(),
    update: jest.fn<(...args: unknown[]) => unknown>(),
    single: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
    maybeSingle: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);

  return query;
};

describe("Household Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCurrentProfileId.mockResolvedValue(PROFILE_ID);
  });

  describe("getHouseholdMembers", () => {
    it("should retrieve household members for the current profile", async () => {
      const query = createMockQuery();

      query.order.mockResolvedValue({
        data: [databaseMember()],
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMembers();

      expect(mockGetCurrentProfileId).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith("household_members");

      expect(query.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );

      expect(query.order).toHaveBeenCalledWith("created_at", {
        ascending: true,
      });

      expect(result).toHaveLength(1);

      expect(result[0]).toEqual({
        id: MEMBER_ID,
        fullName: "Ahmad Bin Ali",
        identificationNumber: "990315-10-1235",
        relationship: "spouse",
        dateOfBirth: "1999-03-15",
        missingFields: [],
      });
    });

    it("should return an empty array when no household members exist", async () => {
      const query = createMockQuery();

      query.order.mockResolvedValue({
        data: [],
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMembers();

      expect(result).toEqual([]);
    });

    it("should detect missing household member information", async () => {
      const query = createMockQuery();

      query.order.mockResolvedValue({
        data: [
          {
            ...databaseMember(),
            full_name: "",
            identification_no: null,
            gender: null,
            citizenship: null,
            is_oku: null,
          },
        ],
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMembers();

      expect(result[0].missingFields).toEqual([
        "fullName",
        "identificationNumber",
        "gender",
        "citizenship",
        "isOku",
      ]);
    });

    it("should detect missing student information", async () => {
      const query = createMockQuery();

      query.order.mockResolvedValue({
        data: [
          {
            ...databaseMember(),
            is_student: true,
            study_mode: null,
            institution_type: null,
          },
        ],
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMembers();

      expect(result[0].missingFields).toEqual([
        "studyMode",
        "institutionType",
      ]);
    });

    it("should detect missing OKU registration status", async () => {
      const query = createMockQuery();

      query.order.mockResolvedValue({
        data: [
          {
            ...databaseMember(),
            is_oku: true,
            oku_registered: null,
          },
        ],
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMembers();

      expect(result[0].missingFields).toEqual([
        "okuRegistered",
      ]);
    });

    it("should preserve the database ordering of household members", async () => {
      const query = createMockQuery();

      query.order.mockResolvedValue({
        data: [
          {
            ...databaseMember(),
            id: "member-001",
            full_name: "Ahmad",
          },
          {
            ...databaseMember(),
            id: "member-002",
            full_name: "Siti",
          },
        ],
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMembers();

      expect(result.map((member) => member.id)).toEqual([
        "member-001",
        "member-002",
      ]);
    });

    it("should throw when Supabase returns an error", async () => {
      const query = createMockQuery();

      query.order.mockResolvedValue({
        data: null,
        error: new Error("Database error"),
      });

      mockFrom.mockReturnValue(query as never);

      await expect(getHouseholdMembers()).rejects.toThrow(
          "Database error"
      );
    });

    it("should throw when the current profile cannot be retrieved", async () => {
      mockGetCurrentProfileId.mockRejectedValue(
          new Error("Profile not found")
      );

      await expect(getHouseholdMembers()).rejects.toThrow(
          "Profile not found"
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe("getHouseholdMember", () => {
    it("should retrieve and map a household member correctly", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: databaseMember(),
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMember(MEMBER_ID);

      expect(mockFrom).toHaveBeenCalledWith("household_members");

      expect(query.eq).toHaveBeenCalledWith(
          "id",
          MEMBER_ID
      );

      expect(query.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );

      expect(result).toEqual({
        id: MEMBER_ID,
        fullName: "Ahmad Bin Ali",
        identificationNumber: "990315-10-1235",
        relationship: "spouse",
        dateOfBirth: "1999-03-15",
        gender: "male",
        citizenship: "malaysian",
        isDependent: false,
        employmentStatus: "employed",
        occupation: "Teacher",
        monthlyIncome: 3000,
        isStudent: false,
        studyMode: null,
        institutionType: null,
        isOku: false,
        okuRegistered: null,
      });
    });

    it("should convert database income strings into numbers", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: {
          ...databaseMember(),
          monthly_income: "2500.50",
        },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMember(MEMBER_ID);

      expect(result.monthlyIncome).toBe(2500.5);
    });

    it("should preserve null monthly income", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: {
          ...databaseMember(),
          monthly_income: null,
        },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMember(MEMBER_ID);

      expect(result.monthlyIncome).toBeNull();
    });

    it("should preserve nullable household member fields", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: {
          ...databaseMember(),
          identification_no: null,
          date_of_birth: null,
          gender: null,
          citizenship: null,
          is_dependent: null,
          employment_status: null,
          occupation: null,
          monthly_income: null,
          is_student: null,
          study_mode: null,
          institution_type: null,
          is_oku: null,
          oku_registered: null,
        },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await getHouseholdMember(MEMBER_ID);

      expect(result.identificationNumber).toBeNull();
      expect(result.dateOfBirth).toBeNull();
      expect(result.gender).toBeNull();
      expect(result.citizenship).toBeNull();
      expect(result.isDependent).toBeNull();
      expect(result.employmentStatus).toBeNull();
      expect(result.occupation).toBeNull();
      expect(result.monthlyIncome).toBeNull();
      expect(result.isStudent).toBeNull();
      expect(result.studyMode).toBeNull();
      expect(result.institutionType).toBeNull();
      expect(result.isOku).toBeNull();
      expect(result.okuRegistered).toBeNull();
    });

    it("should throw when Supabase returns an error", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: null,
        error: new Error("Member not found"),
      });

      mockFrom.mockReturnValue(query as never);

      await expect(getHouseholdMember(MEMBER_ID)).rejects.toThrow(
          "Member not found"
      );
    });

    it("should throw when the current profile cannot be retrieved", async () => {
      mockGetCurrentProfileId.mockRejectedValue(
          new Error("Profile not found")
      );

      await expect(getHouseholdMember(MEMBER_ID)).rejects.toThrow(
          "Profile not found"
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe("createHouseholdMember", () => {
    it("should create a household member and return its ID", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      const result = await createHouseholdMember(validInput());

      expect(result).toBe(MEMBER_ID);
      expect(mockFrom).toHaveBeenCalledWith("household_members");

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            profile_id: PROFILE_ID,
            full_name: "Ahmad Bin Ali",
            identification_no: "990315-10-1235",
            relationship: "spouse",
            date_of_birth: "1999-03-15",
            gender: "male",
            citizenship: "malaysian",
            is_dependent: false,
            employment_status: "employed",
            occupation: "Teacher",
            monthly_income: 3000,
            is_student: false,
            study_mode: null,
            institution_type: null,
            is_oku: false,
            oku_registered: null,
          })
      );
    });

    it("should format single-digit months and days correctly", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        dateOfBirth: new Date(2000, 0, 5),
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            date_of_birth: "2000-01-05",
          })
      );
    });

    it("should convert empty optional strings to null", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        identificationNumber: "   ",
        gender: "",
        citizenship: "",
        employmentStatus: "",
        occupation: "",
        monthlyIncome: "",
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            identification_no: null,
            gender: null,
            citizenship: null,
            employment_status: null,
            occupation: null,
            monthly_income: null,
          })
      );
    });

    it("should store occupation for self-employed members", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        employmentStatus: "self_employed",
        occupation: "  Freelancer  ",
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: "Freelancer",
          })
      );
    });

    it("should not store occupation for unemployed members", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        employmentStatus: "unemployed",
        occupation: "Previous Job",
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: null,
          })
      );
    });

    it("should convert whitespace-only occupation to null", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        occupation: "   ",
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: null,
          })
      );
    });

    it("should convert decimal income into a number", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        monthlyIncome: "2500.50",
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            monthly_income: 2500.5,
          })
      );
    });

    it("should preserve zero monthly income", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        monthlyIncome: "0",
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            monthly_income: 0,
          })
      );
    });

    it("should store student information when member is a student", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        isStudent: true,
        studyMode: "full_time",
        institutionType: "university",
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            is_student: true,
            study_mode: "full_time",
            institution_type: "university",
          })
      );
    });

    it("should not store student information when member is not a student", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        isStudent: false,
        studyMode: "full_time",
        institutionType: "university",
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            study_mode: null,
            institution_type: null,
          })
      );
    });

    it("should store OKU registration when member is OKU", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        isOku: true,
        okuRegistered: true,
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            is_oku: true,
            oku_registered: true,
          })
      );
    });

    it("should not store OKU registration when member is not OKU", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await createHouseholdMember({
        ...validInput(),
        isOku: false,
        okuRegistered: true,
      });

      expect(query.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            oku_registered: null,
          })
      );
    });

    it("should throw when Supabase returns an insert error", async () => {
      const query = createMockQuery();

      query.single.mockResolvedValue({
        data: null,
        error: new Error("Insert failed"),
      });

      mockFrom.mockReturnValue(query as never);

      await expect(
          createHouseholdMember(validInput())
      ).rejects.toThrow("Insert failed");
    });

    it("should throw when the current profile cannot be retrieved", async () => {
      mockGetCurrentProfileId.mockRejectedValue(
          new Error("Profile not found")
      );

      await expect(
          createHouseholdMember(validInput())
      ).rejects.toThrow("Profile not found");

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe("updateHouseholdMember", () => {
    it("should update a household member successfully", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await expect(
          updateHouseholdMember(MEMBER_ID, validInput())
      ).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith("household_members");

      expect(query.eq).toHaveBeenCalledWith(
          "id",
          MEMBER_ID
      );

      expect(query.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: "Ahmad Bin Ali",
            identification_no: "990315-10-1235",
            relationship: "spouse",
            date_of_birth: "1999-03-15",
            gender: "male",
            citizenship: "malaysian",
            is_dependent: false,
            employment_status: "employed",
            occupation: "Teacher",
            monthly_income: 3000,
            is_student: false,
            study_mode: null,
            institution_type: null,
            is_oku: false,
            oku_registered: null,
          })
      );
    });

    it("should format the date correctly when updating", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await updateHouseholdMember(MEMBER_ID, {
        ...validInput(),
        dateOfBirth: new Date(2005, 0, 9),
      });

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            date_of_birth: "2005-01-09",
          })
      );
    });

    it("should convert empty optional strings to null when updating", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await updateHouseholdMember(MEMBER_ID, {
        ...validInput(),
        identificationNumber: "   ",
        gender: "",
        citizenship: "",
        employmentStatus: "",
        occupation: "",
        monthlyIncome: "",
      });

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            identification_no: null,
            gender: null,
            citizenship: null,
            employment_status: null,
            occupation: null,
            monthly_income: null,
          })
      );
    });

    it("should store occupation for self-employed members when updating", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await updateHouseholdMember(MEMBER_ID, {
        ...validInput(),
        employmentStatus: "self_employed",
        occupation: "  Freelancer  ",
      });

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: "Freelancer",
          })
      );
    });

    it("should remove occupation for unemployed members when updating", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await updateHouseholdMember(MEMBER_ID, {
        ...validInput(),
        employmentStatus: "unemployed",
        occupation: "Previous Job",
      });

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            occupation: null,
          })
      );
    });

    it("should update student information correctly", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await updateHouseholdMember(MEMBER_ID, {
        ...validInput(),
        isStudent: true,
        studyMode: "full_time",
        institutionType: "university",
      });

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            is_student: true,
            study_mode: "full_time",
            institution_type: "university",
          })
      );
    });

    it("should clear student information when member is not a student", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await updateHouseholdMember(MEMBER_ID, {
        ...validInput(),
        isStudent: false,
        studyMode: "full_time",
        institutionType: "university",
      });

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            study_mode: null,
            institution_type: null,
          })
      );
    });

    it("should update OKU registration correctly", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await updateHouseholdMember(MEMBER_ID, {
        ...validInput(),
        isOku: true,
        okuRegistered: false,
      });

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            is_oku: true,
            oku_registered: false,
          })
      );
    });

    it("should clear OKU registration when member is not OKU", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: { id: MEMBER_ID },
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await updateHouseholdMember(MEMBER_ID, {
        ...validInput(),
        isOku: false,
        okuRegistered: true,
      });

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            oku_registered: null,
          })
      );
    });

    it("should throw when Supabase returns an update error", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: null,
        error: new Error("Update failed"),
      });

      mockFrom.mockReturnValue(query as never);

      await expect(
          updateHouseholdMember(MEMBER_ID, validInput())
      ).rejects.toThrow("Update failed");
    });

    it("should throw when the household member does not exist", async () => {
      const query = createMockQuery();

      query.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockFrom.mockReturnValue(query as never);

      await expect(
          updateHouseholdMember(MEMBER_ID, validInput())
      ).rejects.toThrow(
          "Household member not found or update not permitted."
      );
    });

    it("should throw when the current profile cannot be retrieved", async () => {
      mockGetCurrentProfileId.mockRejectedValue(
          new Error("Profile not found")
      );

      await expect(
          updateHouseholdMember(MEMBER_ID, validInput())
      ).rejects.toThrow("Profile not found");

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
