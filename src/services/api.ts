import type { JkmEligibilityApiResponse } from "../adapters/jkmEligibilityAdapter";
import { JKM_PROGRAM_CODES, REQUEST_TIMEOUT_MS } from "../constants/eligibility";

const JKM_API_BASE_URL = process.env.EXPO_PUBLIC_JKM_API_BASE_URL
    ?.trim()
    .replace(/\/+$/, "");

export type JkmProgramCode = (typeof JKM_PROGRAM_CODES)[number];

export type JkmEligibilityResponse = JkmEligibilityApiResponse;

// Response containing eligibility criteria for all supported programs
export interface JkmAllEligibilityResponse {
  success: true;
  data: JkmEligibilityApiResponse["data"][];
}

// Validate the configured JKM Mock API base URL
function getJkmApiBaseUrl(): string {
  if (!JKM_API_BASE_URL) {
    throw new Error("JKM Mock API base URL is not configured");
  }

  if (!URL.canParse(JKM_API_BASE_URL)) {
    throw new Error("JKM Mock API base URL is invalid");
  }

  const parsedUrl = new URL(JKM_API_BASE_URL);

  if (parsedUrl.protocol !== "https:") {
    throw new Error("JKM Mock API must use HTTPS");
  }

  if (
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.search ||
      parsedUrl.hash
  ) {
    throw new Error(
        "JKM Mock API base URL contains unsupported components"
    );
  }

  return JKM_API_BASE_URL;
}

// Check whether a value is a non-array object
function isRecord(
    value: unknown
): value is Record<string, unknown> {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

// Validate the basic structure of a JKM eligibility API response
// Detailed expression and dependency validation is handled by the adapter
function isJkmEligibilityResponse(
    value: unknown
): value is JkmEligibilityResponse {
  if (!isRecord(value) || value.success !== true) {
    return false;
  }

  const data = value.data;

  if (!isRecord(data)) {
    return false;
  }

  if (
      typeof data.programCode !== "string" ||
      typeof data.programName !== "string" ||
      typeof data.version !== "number"
  ) {
    return false;
  }

  // The mock API may omit updatedAt in some response versions
  if (
      data.updatedAt !== undefined &&
      typeof data.updatedAt !== "string"
  ) {
    return false;
  }

  const criteria = data.criteria;

  if (!isRecord(criteria)) {
    return false;
  }

  if (
      typeof criteria.schemaVersion !== "number" ||
      typeof criteria.programCode !== "string" ||
      !Array.isArray(criteria.rules)
  ) {
    return false;
  }

  return criteria.rules.every((rule) => {
    if (!isRecord(rule)) {
      return false;
    }

    return (
        typeof rule.ruleCode === "string" &&
        typeof rule.name === "string" &&
        typeof rule.result === "string" &&
        isRecord(rule.conditions) &&
        (
            rule.assessmentNotes === undefined ||
            typeof rule.assessmentNotes === "string"
        )
    );
  });
}

// Validate the response containing all JKM eligibility criteria
function isJkmAllEligibilityResponse(
    value: unknown
): value is JkmAllEligibilityResponse {
  if (!isRecord(value) || value.success !== true) {
    return false;
  }

  if (!Array.isArray(value.data)) {
    return false;
  }

  const seenCodes = new Set<string>();

  return value.data.every((program) => {
    // Reuse existing individual response validation
    if (
        !isJkmEligibilityResponse({
          success: true,
          data: program,
        })
    ) {
      return false;
    }

    const programCode = program.programCode;

    // Ensure program code matches its criteria
    if (programCode !== program.criteria.programCode) {
      return false;
    }

    // Ensure the program is supported by BantuanKu
    if (
        !JKM_PROGRAM_CODES.includes(
            programCode as JkmProgramCode
        )
    ) {
      return false;
    }

    // Prevent duplicate program codes
    if (seenCodes.has(programCode)) {
      return false;
    }

    seenCodes.add(programCode);

    return true;
  });
}

// Fetch eligibility criteria for a specific JKM program
export async function getJkmEligibilityCriteria(
    programCode: JkmProgramCode
): Promise<JkmEligibilityResponse> {
  const baseUrl = getJkmApiBaseUrl();

  const controller = new AbortController();

  let timedOut = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(
        `${baseUrl}/api/v1/programs/${programCode}/eligibility`,
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
      throw new Error(
          "JKM API request timed out. Please try again."
      );
    }

    if (
        error instanceof Error &&
        error.name === "AbortError"
    ) {
      throw new Error("JKM API request was cancelled.");
    }

    throw new Error(
        "Unable to connect to JKM API. Please check your internet connection."
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(
        `Failed to retrieve JKM eligibility criteria (HTTP ${response.status})`
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
        "JKM API returned an invalid JSON response"
    );
  }

  if (!isJkmEligibilityResponse(data)) {
    throw new Error(
        "JKM API returned an invalid eligibility response"
    );
  }

  if (
      data.data.programCode !== programCode ||
      data.data.criteria.programCode !== programCode
  ) {
    throw new Error(
        "JKM API returned criteria for an unexpected program"
    );
  }

  return data;
}

// Fetch eligibility criteria for all supported JKM programs
export async function getAllJkmEligibilityCriteria():
    Promise<JkmAllEligibilityResponse> {
  const baseUrl = getJkmApiBaseUrl();

  const controller = new AbortController();

  let timedOut = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;

  // Handle network errors and request timeout
  try {
    response = await fetch(
        `${baseUrl}/api/v1/programs/eligibility`,
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
      throw new Error(
          "JKM API request timed out. Please try again."
      );
    }

    if (
        error instanceof Error &&
        error.name === "AbortError"
    ) {
      throw new Error("JKM API request was cancelled.");
    }

    throw new Error(
        "Unable to connect to JKM API. Please check your internet connection."
    );
  } finally {
    clearTimeout(timeout);
  }

  // Validate HTTP response
  if (!response.ok) {
    throw new Error(
        `Failed to retrieve JKM eligibility criteria (HTTP ${response.status})`
    );
  }

  // Parse JSON response
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
        "JKM API returned an invalid JSON response"
    );
  }

  // Validate eligibility response structure
  if (!isJkmAllEligibilityResponse(data)) {
    throw new Error(
        "JKM API returned an invalid eligibility response"
    );
  }

  return data;
}
