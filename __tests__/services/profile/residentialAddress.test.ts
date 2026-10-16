import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from "@jest/globals";
import {
  getResidentialAddress,
  updateResidentialAddress,
} from "../../../src/services/profile/residentialAddressService";
import { supabase } from "../../../src/lib/supabase";
import { getCurrentProfileId } from "../../../src/services/profile/profileService";
import type { RegisterResidenceFormData } from "../../../src/schemas/registration";
import { STATE_TERRITORY_MAP } from "../../../src/constants/registration";

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

const PROFILE_ID = "profile-001";
const ADDRESS_ID = "address-001";

type MockQueryResult = {
  data: unknown;
  error: Error | null;
};

const createMockQuery = () => {
  const query = {
    select: jest.fn<(...args: unknown[]) => unknown>(),
    eq: jest.fn<(...args: unknown[]) => unknown>(),
    update: jest.fn<(...args: unknown[]) => unknown>(),
    single: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
    maybeSingle: jest.fn<(...args: unknown[]) => Promise<MockQueryResult>>(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.update.mockReturnValue(query);

  return query;
};

const databaseAddress = () => ({
  id: ADDRESS_ID,
  address_line_1: "No. 10, Jalan Bukit",
  address_line_2: "Taman Maju",
  postcode: "57000",
  city: "Kuala Lumpur",
  state_territory: "Kuala Lumpur",
  country_code: "MY",
});

const validAddressInput = (): RegisterResidenceFormData => ({
  addressLine1: "  No. 10, Jalan Bukit  ",
  addressLine2: "  Taman Maju  ",
  postcode: "57000",
  city: "  Kuala Lumpur  ",
  stateTerritory: Object.keys(
      STATE_TERRITORY_MAP
  )[0] as RegisterResidenceFormData["stateTerritory"],
});

const setupQuery = (
    data: unknown,
    error: Error | null = null
) => {
  const query = createMockQuery();

  query.single.mockResolvedValue({
    data,
    error,
  });

  query.maybeSingle.mockResolvedValue({
    data,
    error,
  });

  mockFrom.mockReturnValue(query as never);

  return query;
};

describe("Residential Address Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentProfileId.mockResolvedValue(PROFILE_ID);
  });

  describe("getResidentialAddress", () => {
    it("should retrieve and map the residential address correctly", async () => {
      const query = setupQuery(databaseAddress());

      const result = await getResidentialAddress();

      expect(result).toEqual({
        id: ADDRESS_ID,
        addressLine1: "No. 10, Jalan Bukit",
        addressLine2: "Taman Maju",
        postcode: "57000",
        city: "Kuala Lumpur",
        stateTerritory: "Kuala Lumpur",
        countryCode: "MY",
      });

      expect(mockGetCurrentProfileId).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith("addresses");

      expect(query.select).toHaveBeenCalledWith(
          "id, address_line_1, address_line_2, postcode, city, state_territory, country_code"
      );

      expect(query.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );

      expect(query.eq).toHaveBeenCalledWith(
          "address_type",
          "residential"
      );

      expect(query.eq).toHaveBeenCalledWith(
          "is_primary",
          true
      );

      expect(query.maybeSingle).toHaveBeenCalledTimes(1);
    });

    it("should return null when no residential address exists", async () => {
      setupQuery(null);

      await expect(getResidentialAddress()).resolves.toBeNull();
    });

    it("should preserve a null second address line", async () => {
      setupQuery({
        ...databaseAddress(),
        address_line_2: null,
      });

      const result = await getResidentialAddress();

      expect(result?.addressLine2).toBeNull();
    });

    it("should preserve an empty second address line", async () => {
      setupQuery({
        ...databaseAddress(),
        address_line_2: "",
      });

      const result = await getResidentialAddress();

      expect(result?.addressLine2).toBe("");
    });

    it("should preserve the postcode as a string", async () => {
      setupQuery({
        ...databaseAddress(),
        postcode: "01000",
      });

      const result = await getResidentialAddress();

      expect(result?.postcode).toBe("01000");
    });

    it("should preserve the country code", async () => {
      setupQuery({
        ...databaseAddress(),
        country_code: "MY",
      });

      const result = await getResidentialAddress();

      expect(result?.countryCode).toBe("MY");
    });

    it("should preserve the state or territory returned by the database", async () => {
      setupQuery({
        ...databaseAddress(),
        state_territory: "Selangor",
      });

      const result = await getResidentialAddress();

      expect(result?.stateTerritory).toBe("Selangor");
    });

    it("should throw when Supabase returns an error", async () => {
      setupQuery(
          null,
          new Error("Address query failed")
      );

      await expect(getResidentialAddress()).rejects.toThrow(
          "Address query failed"
      );
    });

    it("should prioritize the database error over a null result", async () => {
      setupQuery(
          null,
          new Error("Permission denied")
      );

      await expect(getResidentialAddress()).rejects.toThrow(
          "Permission denied"
      );
    });

    it("should throw when the current profile cannot be retrieved", async () => {
      mockGetCurrentProfileId.mockRejectedValue(
          new Error("Profile not found")
      );

      await expect(getResidentialAddress()).rejects.toThrow(
          "Profile not found"
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should query only the primary residential address", async () => {
      const query = setupQuery(databaseAddress());

      await getResidentialAddress();

      expect(query.eq).toHaveBeenNthCalledWith(
          1,
          "profile_id",
          PROFILE_ID
      );

      expect(query.eq).toHaveBeenNthCalledWith(
          2,
          "address_type",
          "residential"
      );

      expect(query.eq).toHaveBeenNthCalledWith(
          3,
          "is_primary",
          true
      );
    });

    it("should not perform any update operations", async () => {
      const query = setupQuery(databaseAddress());

      await getResidentialAddress();

      expect(query.update).not.toHaveBeenCalled();
    });
  });

  describe("updateResidentialAddress", () => {
    it("should update the residential address successfully", async () => {
      const query = setupQuery({
        id: ADDRESS_ID,
      });

      const input = validAddressInput();

      await expect(
          updateResidentialAddress(ADDRESS_ID, input)
      ).resolves.toBeUndefined();

      expect(mockGetCurrentProfileId).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith("addresses");

      expect(query.update).toHaveBeenCalledWith({
        address_line_1: "No. 10, Jalan Bukit",
        address_line_2: "Taman Maju",
        postcode: "57000",
        city: "Kuala Lumpur",
        state_territory:
            STATE_TERRITORY_MAP[
                input.stateTerritory as keyof typeof STATE_TERRITORY_MAP
                ],
      });

      expect(query.eq).toHaveBeenCalledWith(
          "id",
          ADDRESS_ID
      );

      expect(query.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );

      expect(query.eq).toHaveBeenCalledWith(
          "address_type",
          "residential"
      );

      expect(query.eq).toHaveBeenCalledWith(
          "is_primary",
          true
      );

      expect(query.select).toHaveBeenCalledWith("id");
      expect(query.single).toHaveBeenCalledTimes(1);
    });

    it("should trim the first address line", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          {
            ...validAddressInput(),
            addressLine1: "   No. 25, Jalan Mawar   ",
          }
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            address_line_1: "No. 25, Jalan Mawar",
          })
      );
    });

    it("should trim the second address line", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          {
            ...validAddressInput(),
            addressLine2: "   Apartment A-12   ",
          }
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            address_line_2: "Apartment A-12",
          })
      );
    });

    it("should trim the city name", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          {
            ...validAddressInput(),
            city: "   Shah Alam   ",
          }
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            city: "Shah Alam",
          })
      );
    });

    it("should convert an empty second address line to null", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          {
            ...validAddressInput(),
            addressLine2: "",
          }
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            address_line_2: null,
          })
      );
    });

    it("should convert a whitespace-only second address line to null", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          {
            ...validAddressInput(),
            addressLine2: "   ",
          }
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            address_line_2: null,
          })
      );
    });

    it("should convert a null second address line to null", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          {
            ...validAddressInput(),
            addressLine2: undefined,
          }
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            address_line_2: null,
          })
      );
    });

    it("should preserve the postcode without modifying it", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          {
            ...validAddressInput(),
            postcode: "01000",
          }
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            postcode: "01000",
          })
      );
    });

    it("should map the selected state or territory to its database value", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      const input = validAddressInput();

      await updateResidentialAddress(
          ADDRESS_ID,
          input
      );

      expect(query.update).toHaveBeenCalledWith(
          expect.objectContaining({
            state_territory:
                STATE_TERRITORY_MAP[
                    input.stateTerritory as keyof typeof STATE_TERRITORY_MAP
                    ],
          })
      );
    });

    it("should correctly map every supported state or territory", async () => {
      for (const stateTerritory of Object.keys(
          STATE_TERRITORY_MAP
      ) as Array<keyof typeof STATE_TERRITORY_MAP>) {
        const query = setupQuery({ id: ADDRESS_ID });

        await updateResidentialAddress(
            ADDRESS_ID,
            {
              ...validAddressInput(),
              stateTerritory:
                  stateTerritory as RegisterResidenceFormData["stateTerritory"],
            }
        );

        expect(query.update).toHaveBeenCalledWith(
            expect.objectContaining({
              state_territory: STATE_TERRITORY_MAP[stateTerritory],
            })
        );
      }
    });

    it("should update only the specified address ID", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          "another-address",
          validAddressInput()
      );

      expect(query.eq).toHaveBeenCalledWith(
          "id",
          "another-address"
      );
    });

    it("should filter the update by the current profile ID", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          validAddressInput()
      );

      expect(query.eq).toHaveBeenCalledWith(
          "profile_id",
          PROFILE_ID
      );
    });

    it("should update only residential addresses", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          validAddressInput()
      );

      expect(query.eq).toHaveBeenCalledWith(
          "address_type",
          "residential"
      );
    });

    it("should update only the primary address", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          validAddressInput()
      );

      expect(query.eq).toHaveBeenCalledWith(
          "is_primary",
          true
      );
    });

    it("should apply all update filters in the correct order", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          validAddressInput()
      );

      expect(query.eq).toHaveBeenNthCalledWith(
          1,
          "id",
          ADDRESS_ID
      );

      expect(query.eq).toHaveBeenNthCalledWith(
          2,
          "profile_id",
          PROFILE_ID
      );

      expect(query.eq).toHaveBeenNthCalledWith(
          3,
          "address_type",
          "residential"
      );

      expect(query.eq).toHaveBeenNthCalledWith(
          4,
          "is_primary",
          true
      );
    });

    it("should throw when Supabase returns an update error", async () => {
      setupQuery(
          null,
          new Error("Address update failed")
      );

      await expect(
          updateResidentialAddress(
              ADDRESS_ID,
              validAddressInput()
          )
      ).rejects.toThrow("Address update failed");
    });

    it("should throw when the address does not exist", async () => {
      setupQuery(null);

      await expect(
          updateResidentialAddress(
              ADDRESS_ID,
              validAddressInput()
          )
      ).rejects.toThrow(
          "Residential address not found."
      );
    });

    it("should throw when the update is not permitted", async () => {
      setupQuery(null);

      await expect(
          updateResidentialAddress(
              "unauthorized-address",
              validAddressInput()
          )
      ).rejects.toThrow(
          "Residential address not found."
      );
    });

    it("should throw when the current profile cannot be retrieved", async () => {
      mockGetCurrentProfileId.mockRejectedValue(
          new Error("Profile not found")
      );

      await expect(
          updateResidentialAddress(
              ADDRESS_ID,
              validAddressInput()
          )
      ).rejects.toThrow("Profile not found");

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should not perform an insert operation", async () => {
      const query = setupQuery({ id: ADDRESS_ID });

      await updateResidentialAddress(
          ADDRESS_ID,
          validAddressInput()
      );

      expect(query.update).toHaveBeenCalledTimes(1);
    });
  });
});
