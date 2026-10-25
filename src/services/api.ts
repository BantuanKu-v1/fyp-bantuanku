const JKM_API_BASE_URL = process.env.EXPO_PUBLIC_JKM_API_BASE_URL
    ?.trim()
    .replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 10000;

export type JkmProgramCode = "BA" | "BAT" | "BPT" | "BWE";

export interface JkmEligibilityRule {
  ruleCode: string;
  name: string;
  result: string;
  assessmentNotes?: string;
}

export interface JkmEligibilityResponse {
  success: boolean;
  data: {
    programCode: string;
    programName: string;
    version: number;
    criteria: {
      rules: JkmEligibilityRule[];
    };
  };
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

// Validate the basic structure of a JKM eligibility API response
// Note: Full eligibility condition validation will be implemented alongside the JKM eligibility adapter
function isJkmEligibilityResponse(
    value: unknown
): value is JkmEligibilityResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  if (response.success !== true) {
    return false;
  }

  const data = response.data;

  if (typeof data !== "object" || data === null) {
    return false;
  }

  const eligibility = data as Record<string, unknown>;

  if (
      typeof eligibility.programCode !== "string" ||
      typeof eligibility.programName !== "string" ||
      typeof eligibility.version !== "number"
  ) {
    return false;
  }

  const criteria = eligibility.criteria;

  if (typeof criteria !== "object" || criteria === null) {
    return false;
  }

  const rules = (criteria as Record<string, unknown>).rules;

  return (
      Array.isArray(rules) &&
      rules.every(
          (rule) =>
              typeof rule === "object" &&
              rule !== null &&
              typeof rule.ruleCode === "string" &&
              typeof rule.name === "string" &&
              typeof rule.result === "string" &&
              (rule.assessmentNotes === undefined ||
                  typeof rule.assessmentNotes === "string")
      )
  );
}

// Fetch public eligibility criteria from the JKM Mock APi
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
      throw new Error("JKM API request timed out. Please try again.");
    }

    if (error instanceof Error && error.name === "AbortError") {
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
    throw new Error("JKM API returned an invalid JSON response");
  }

  if (!isJkmEligibilityResponse(data)) {
    throw new Error("JKM API returned an invalid eligibility response");
  }

  if (data.data.programCode !== programCode) {
    throw new Error(
        "JKM API returned criteria for an unexpected program"
    );
  }

  return data;
}
