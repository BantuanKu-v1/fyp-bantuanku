import {
  ExternalApiError,
    externalApiRequest,
    getExternalApiConfig
} from "../_shared/external-api.ts";
import { HttpError } from "../_shared/response.ts";
import type {
  JkmApplicationPayload,
  JkmApplicationStatus,
  JkmProgramCode,
  JkmSubmissionConfirmation,
  JkmStatusResponse,
  JkmRecoveredApplication
} from "./jkm-types.ts";

const JKM_PROGRAM_CODE: readonly JkmProgramCode[] = ["BA", "BAT", "BPT", "BWE"];

const JKM_STATUSES: readonly JkmApplicationStatus[] = [
    "submitted",
    "under_review",
    "additional_information_required",
    "approved",
    "rejected",
    "cancelled",
];

// JKM rejects these requests before creating an application
const JKM_SUBMISSION_REJECTION_MESSAGES: readonly string[] = [
    "Invalid JSON request body",
    "Invalid application data",
];

const JKM_PROGRAM_NOT_FOUND_MESSAGE = "JKM program not found or inactive";

function getJkmApiConfig() {
  return getExternalApiConfig(
      "JKM_API_BASE_URL",
      "JKM_API_KEY",
  );
}

function isRecord(
    value: unknown
): value is Record<string, unknown> {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return (
      typeof value === "string" &&
      value.trim().length > 0
  );
}

function isJkmProgramCode(
    value: unknown
): value is JkmProgramCode {
  return (
      typeof value === "string" &&
      JKM_PROGRAM_CODE.some(
          (programCode) => programCode === value
      )
  );
}

function isJkmApplicationStatus(
    value: unknown
): value is JkmApplicationStatus {
  return (
      typeof value === "string" &&
      JKM_STATUSES.some((status) => status === value)
  );
}

// JKM returns normalized UTC timestamps
function isValidDateTime(value: unknown): value is string {
  if (
      !isNonEmptyString(value) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
          value,
      )
  ) {
    return false;
  }

  const date = new Date(value);

  return (
      Number.isFinite(date.getTime()) &&
      date.toISOString() === value
  );
}

// Validate the reference number against the JKM programme
function isValidJkmReferenceNo(
    value: unknown,
    programCode: JkmProgramCode,
): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const pattern = new RegExp(
      `^JKM-${programCode}-\\d{4}-[A-F0-9]{12}$`,
  );

  return pattern.test(value);
}

// Identify definitive submission rejections based on the JKM Mock API's known response contract
export function isDefinitiveJkmSubmissionRejection(
    error: unknown,
): boolean {
  if (
      !(error instanceof ExternalApiError) ||
      error.upstreamSuccess !== false ||
      error.redirected !== false ||
      error.upstreamMessage === null
  ) {
    return false;
  }

  if (error.upstreamStatus === 400) {
    return JKM_SUBMISSION_REJECTION_MESSAGES.includes(
        error.upstreamMessage,
    );
  }

  if (error.upstreamStatus === 404) {
    return (
        error.upstreamMessage ===
        JKM_PROGRAM_NOT_FOUND_MESSAGE
    );
  }

  return false;
}

// Only accept the expected JKM application-not-found response
function isJkmApplicationNotFoundResponse(
    value: unknown,
): boolean {
  return (
      isRecord(value) &&
      value.success === false &&
      value.message === "Application not found" &&
      (value.data === undefined || value.data === null)
  );
}

// Validate the application submission confirmation
function validateJkmSubmissionConfirmation(
    value: unknown,
    expectedProgramCode: JkmProgramCode,
): JkmSubmissionConfirmation {
  if (
      !isRecord(value) ||
      !isNonEmptyString(value.id) ||
      !isJkmProgramCode(value.programCode) ||
      value.programCode !== expectedProgramCode ||
      !isValidJkmReferenceNo(
          value.referenceNo,
          expectedProgramCode,
      ) ||
      !isJkmApplicationStatus(value.status) ||
      !isValidDateTime(value.submittedAt)
  ) {
    throw new HttpError(
        502,
        "The JKM service returned an invalid submission confirmation.",
    );
  }

  return {
    id: value.id,
    referenceNo: value.referenceNo,
    programCode: value.programCode,
    status: value.status,
    submittedAt: value.submittedAt,
  };
}

// Validate the application status response
function validateJkmStatusResponse(
    value: unknown,
    expectedProviderApplicationId: string,
    expectedProgramCode: JkmProgramCode,
): JkmStatusResponse {
  if (
      !isRecord(value) ||
      !isNonEmptyString(value.id) ||
      value.id !== expectedProviderApplicationId ||
      !isJkmProgramCode(value.programCode) ||
      value.programCode !== expectedProgramCode ||
      !isValidJkmReferenceNo(
          value.referenceNo,
          expectedProgramCode,
      ) ||
      !isJkmApplicationStatus(value.status) ||
      !isValidDateTime(value.updatedAt)
  ) {
    throw new HttpError(
        502,
        "The JKM service returned an invalid application status.",
    );
  }

  return {
    id: value.id,
    referenceNo: value.referenceNo,
    programCode: value.programCode,
    status: value.status,
    updatedAt: value.updatedAt,
  };
}

// Validate the recovered application and its external identity
function validateJkmRecoveredApplication(
    value: unknown,
    expectedExternalId: string,
    expectedProgramCode: JkmProgramCode,
): JkmRecoveredApplication {
  const confirmation =
      validateJkmSubmissionConfirmation(
          value,
          expectedProgramCode,
      );

  if (
      !isRecord(value) ||
      !isNonEmptyString(value.externalApplicationId) ||
      value.externalApplicationId !== expectedExternalId ||
      !isValidDateTime(value.updatedAt) ||
      Date.parse(value.updatedAt) <
      Date.parse(confirmation.submittedAt)
  ) {
    throw new HttpError(
        502,
        "The JKM service returned an invalid recovery response.",
    );
  }

  return {
    ...confirmation,
    externalApplicationId: value.externalApplicationId,
    updatedAt: value.updatedAt,
  };
}

// Submit an application to the JKM Mock API
export async function submitToJkmApi(
    payload: JkmApplicationPayload,
): Promise<JkmSubmissionConfirmation> {
  const data = await externalApiRequest<unknown>(
      getJkmApiConfig(),
      "/api/v1/applications",
      {
        method: "POST",
        body: payload,
        rejectRedirects: true,
      },
  );

  return validateJkmSubmissionConfirmation(
      data,
      payload.programCode,
  );
}

// Retrieve the latest application status from JKM
export async function getJkmApplicationStatus(
    providerApplicationId: string,
    expectedProgramCode: JkmProgramCode,
): Promise<JkmStatusResponse> {
  if (!isNonEmptyString(providerApplicationId)) {
    throw new HttpError(
        400,
        "Provider application ID is required.",
    );
  }

  if (!isJkmProgramCode(expectedProgramCode)) {
    throw new HttpError(
        400,
        "Invalid JKM programme code.",
    );
  }

  const data = await externalApiRequest<unknown>(
      getJkmApiConfig(),
      `/api/v1/applications/${encodeURIComponent(providerApplicationId)}/status`,
      {
        method: "GET",
        rejectRedirects: true,
      },
  );

  return validateJkmStatusResponse(
      data,
      providerApplicationId,
      expectedProgramCode,
  );
}

// Recover an application using its BantuanKu application ID
export async function findJkmApplicationByExternalId(
    externalApplicationId: string,
    expectedProgramCode: JkmProgramCode,
): Promise<JkmRecoveredApplication | null> {
  if (
      !isNonEmptyString(externalApplicationId) ||
      externalApplicationId.length > 100 ||
      externalApplicationId !== externalApplicationId.trim()
  ) {
    throw new HttpError(
        400,
        "Invalid external application ID.",
    );
  }

  if (!isJkmProgramCode(expectedProgramCode)) {
    throw new HttpError(
        400,
        "Invalid JKM programme code.",
    );
  }

  const data = await externalApiRequest<unknown>(
      getJkmApiConfig(),
      `/api/v1/applications/external/${encodeURIComponent(externalApplicationId)}`,
      {
        method: "GET",
        notFoundReturnsNull: true,
        validateNotFoundResponse:
        isJkmApplicationNotFoundResponse,
        rejectRedirects: true,
      },
  );

  if (data === null) {
    return null;
  }

  return validateJkmRecoveredApplication(
      data,
      externalApplicationId,
      expectedProgramCode,
  );
}
