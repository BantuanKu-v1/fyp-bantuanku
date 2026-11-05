import { REQUEST_TIMEOUT_MS } from "../../constants/eligibility";

const STR_API_BASE_URL = process.env.EXPO_PUBLIC_STR_API_BASE_URL
    ?.trim()
    .replace(/\/+$/, "");

export interface StrEligibilityApiResponse {
  success: true,
  data: {
    programCode: 'STR',
    programName: string;
    schemeYear: number;
    version: number;
    updatedAt?: string;
    criteria: {
      schemaVersion: number;
      programCode: 'STR';
      scope?: string;
      rules: unknown[];
    };
  };
}

function getStrApiBaseUrl(): string {
  if (!STR_API_BASE_URL) {
    throw new Error("STR Mock API base URL is not configured");
  }

  if (!URL.canParse(STR_API_BASE_URL)) {
    throw new Error("STR Mock API base URL is invalid");
  }

  const url = new URL(STR_API_BASE_URL);

  if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
  ) {
    throw new Error("STR Mock API base URL is invalid");
  }

  return STR_API_BASE_URL;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" &&
      value !== null &&
      !Array.isArray(value);
}

function isStrEligibilityResponse(value: unknown): value is StrEligibilityApiResponse {
  if (!isRecord(value) || value.success !== true) {
    return false;
  }

  const data = value.data;

  if (!isRecord(data) || !isRecord(data.criteria)) {
    return false;
  }

  const criteria = data.criteria;

  return (
      data.programCode === "STR" &&
          typeof data.programName === "string" &&
          Number.isInteger(data.schemeYear) &&
          typeof data.version === "number" &&
          (data.updatedAt === undefined || typeof data.updatedAt === "string") &&
          criteria.programCode === "STR" &&
          criteria.schemaVersion === 1 &&
          Array.isArray(criteria.rules)
  );
}

export async function getStrEligibilityCriteria(year: number = 2026): Promise<StrEligibilityApiResponse> {
  if (!Number.isInteger(year) || year < 2020) {
    throw new Error("Invalid STR scheme year");
  }

  const baseUrl = getStrApiBaseUrl();
  const controller = new AbortController();

  let timedOut = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(
        `${baseUrl}/api/v1/programs/STR/eligibility?year=${year}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        }
    );
  } catch (error) {
    if (timedOut) {
      throw new Error("STR API request timed out. Please try again");
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("STR API request was cancelled");
    }

    throw new Error(
        "Unable to connect to STR API. Please check the internet connection"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve STR eligibility criteria (HTTP ${response.status})`);
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error("STR API retuned invalid JSON");
  }

  if (!isStrEligibilityResponse(data)) {
    throw new Error("STR API returned an invalid eligibility response");
  }

  if (data.data.schemeYear !== year) {
    throw new Error("STR API returned criteria for an unexpected year");
  }

  return data;
}
