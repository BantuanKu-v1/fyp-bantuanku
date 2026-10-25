import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { lookupPostcode } from "../../src/services/postcodeService";
import { DATA_GOV_MY_API_URL } from "../../src/constants/api";

type PostcodeApiResult = {
  postcode: string;
  city: string;
  state: string;
};

const createApiResult = (
    overrides: Partial<PostcodeApiResult> = {}
): PostcodeApiResult => ({
  postcode: "57000",
  city: "Kuala Lumpur",
  state: "W.P. Kuala Lumpur",
  ...overrides,
});

const STATE_CASES: [string, string][] = [
  ["Johor", "johor"],
  ["Kedah", "kedah"],
  ["Kelantan", "kelantan"],
  ["Melaka", "melaka"],
  ["Negeri Sembilan", "negeri_sembilan"],
  ["Pahang", "pahang"],
  ["Pulau Pinang", "penang"],
  ["Perak", "perak"],
  ["Perlis", "perlis"],
  ["Sabah", "sabah"],
  ["Sarawak", "sarawak"],
  ["Selangor", "selangor"],
  ["Terengganu", "terengganu"],
  ["W.P. Kuala Lumpur", "kuala_lumpur"],
  ["W.P. Labuan", "labuan"],
  ["W.P. Putrajaya", "putrajaya"],
];

describe("Postcode Service", () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let originalFetch: typeof globalThis.fetch;

  const mockApiResponse = (
      data: PostcodeApiResult[],
      status = 200
  ) => {
    mockFetch.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest
          .fn<() => Promise<PostcodeApiResult[]>>()
          .mockResolvedValue(data),
    } as unknown as Response);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    originalFetch = globalThis.fetch;

    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

    globalThis.fetch = mockFetch;

    mockApiResponse([createApiResult()]);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("Successful postcode lookup", () => {
    it("should return the correct postcode information", async () => {
      const result = await lookupPostcode("57000");

      expect(result).toEqual({
        postcode: "57000",
        city: "Kuala Lumpur",
        stateTerritory: "kuala_lumpur",
      });
    });

    it("should call the correct API endpoint", async () => {
      await lookupPostcode("57000");

      expect(mockFetch).toHaveBeenCalledWith(
          `${DATA_GOV_MY_API_URL}?id=poskod&filter=${encodeURIComponent(
              "57000@postcode"
          )}&limit=10`
      );
    });

    it("should make exactly one API request", async () => {
      await lookupPostcode("57000");

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should include the poskod dataset ID", async () => {
      await lookupPostcode("57000");

      const requestedUrl = mockFetch.mock.calls[0][0];

      expect(requestedUrl).toContain("id=poskod");
    });

    it("should encode the postcode filter correctly", async () => {
      await lookupPostcode("57000");

      const requestedUrl = mockFetch.mock.calls[0][0];

      expect(requestedUrl).toContain(
          `filter=${encodeURIComponent("57000@postcode")}`
      );
    });

    it("should request a maximum of ten results", async () => {
      await lookupPostcode("57000");

      const requestedUrl = mockFetch.mock.calls[0][0];

      expect(requestedUrl).toContain("limit=10");
    });

    it("should preserve leading zeros in postcodes", async () => {
      mockApiResponse([
        createApiResult({
          postcode: "01000",
          city: "Kangar",
          state: "Perlis",
        }),
      ]);

      const result = await lookupPostcode("01000");

      expect(result).toEqual({
        postcode: "01000",
        city: "Kangar",
        stateTerritory: "perlis",
      });
    });

    it("should preserve the city name returned by the API", async () => {
      mockApiResponse([
        createApiResult({
          city: "Petaling Jaya",
          state: "Selangor",
        }),
      ]);

      const result = await lookupPostcode("46000");

      expect(result?.city).toBe("Petaling Jaya");
    });

    it("should preserve the postcode returned by the API", async () => {
      mockApiResponse([
        createApiResult({
          postcode: "43000",
          city: "Kajang",
          state: "Selangor",
        }),
      ]);

      const result = await lookupPostcode("43000");

      expect(result?.postcode).toBe("43000");
    });

    it("should use the first result when the API returns multiple records", async () => {
      mockApiResponse([
        createApiResult({
          postcode: "57000",
          city: "Kuala Lumpur",
          state: "W.P. Kuala Lumpur",
        }),
        createApiResult({
          postcode: "57000",
          city: "Another City",
          state: "Selangor",
        }),
      ]);

      const result = await lookupPostcode("57000");

      expect(result).toEqual({
        postcode: "57000",
        city: "Kuala Lumpur",
        stateTerritory: "kuala_lumpur",
      });
    });

    it("should ignore additional results after the first", async () => {
      mockApiResponse([
        createApiResult({
          state: "Selangor",
        }),
        createApiResult({
          state: "Unsupported State",
        }),
      ]);

      const result = await lookupPostcode("57000");

      expect(result?.stateTerritory).toBe("selangor");
    });

    it("should use the API response rather than assuming the requested postcode", async () => {
      mockApiResponse([
        createApiResult({
          postcode: "50000",
        }),
      ]);

      const result = await lookupPostcode("57000");

      expect(result?.postcode).toBe("50000");
    });
  });

  describe("State and territory mapping", () => {
    it.each(STATE_CASES)(
        "should map %s to %s",
        async (apiState, expectedStateTerritory) => {
          mockApiResponse([
            createApiResult({
              state: apiState,
            }),
          ]);

          const result = await lookupPostcode("57000");

          expect(result?.stateTerritory).toBe(
              expectedStateTerritory
          );
        }
    );
  });

  describe("Empty and unsupported results", () => {
    it("should return null when the API returns an empty array", async () => {
      mockApiResponse([]);

      await expect(
          lookupPostcode("99999")
      ).resolves.toBeNull();
    });

    it("should throw when the state is unsupported", async () => {
      mockApiResponse([
        createApiResult({
          state: "Unknown State",
        }),
      ]);

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Unsupported postcode state: Unknown State"
      );
    });

    it("should throw when the state name is empty", async () => {
      mockApiResponse([
        createApiResult({
          state: "",
        }),
      ]);

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Unsupported postcode state: "
      );
    });

    it("should reject state names with different capitalization", async () => {
      mockApiResponse([
        createApiResult({
          state: "selangor",
        }),
      ]);

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Unsupported postcode state: selangor"
      );
    });

    it("should reject state names with extra whitespace", async () => {
      mockApiResponse([
        createApiResult({
          state: " Selangor ",
        }),
      ]);

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Unsupported postcode state:  Selangor "
      );
    });

    it("should not search later records when the first state is unsupported", async () => {
      mockApiResponse([
        createApiResult({
          state: "Unknown State",
        }),
        createApiResult({
          state: "Selangor",
        }),
      ]);

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Unsupported postcode state: Unknown State"
      );
    });
  });

  describe("HTTP errors", () => {
    it.each([
      [400, "Bad Request"],
      [401, "Unauthorized"],
      [403, "Forbidden"],
      [404, "Not Found"],
      [429, "Too Many Requests"],
      [500, "Internal Server Error"],
      [502, "Bad Gateway"],
      [503, "Service Unavailable"],
    ])(
        "should throw for HTTP %i (%s)",
        async (status) => {
          mockApiResponse([], status);

          await expect(
              lookupPostcode("57000")
          ).rejects.toThrow(
              `Postcode lookup failed with status ${status}`
          );
        }
    );

    it("should not parse JSON when the HTTP response is unsuccessful", async () => {
      const mockJson =
          jest.fn<() => Promise<PostcodeApiResult[]>>();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: mockJson,
      } as unknown as Response);

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Postcode lookup failed with status 500"
      );

      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe("Network and response errors", () => {
    it("should propagate network failures", async () => {
      mockFetch.mockRejectedValue(
          new Error("Network request failed")
      );

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Network request failed"
      );
    });

    it("should propagate request timeout errors", async () => {
      mockFetch.mockRejectedValue(
          new Error("Request timed out")
      );

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Request timed out"
      );
    });

    it("should propagate JSON parsing errors", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest
            .fn<() => Promise<PostcodeApiResult[]>>()
            .mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as Response);

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Invalid JSON"
      );
    });

    it("should not return postcode information when JSON parsing fails", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest
            .fn<() => Promise<PostcodeApiResult[]>>()
            .mockRejectedValue(
                new Error("Response parsing failed")
            ),
      } as unknown as Response);

      await expect(
          lookupPostcode("57000")
      ).rejects.toThrow(
          "Response parsing failed"
      );
    });
  });
});
