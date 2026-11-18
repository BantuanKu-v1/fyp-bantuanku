import { externalApiRequest, getExternalApiConfig } from "../_shared/external-api.ts";
import { HttpError } from "../_shared/response.ts";
import type { StrApplicationPayload } from "./str-mapper.ts";

export type StrApplicationStatus = "submitted" | "under_review" | "approved" | "rejected";

export interface StrSubmissionConfirmation {
  id: string;
  referenceNo: string;
  status: StrApplicationStatus;
  submittedAt: string;
}

export interface StrStatusResponse {
  id: string;
  referenceNo: string;
  status: StrApplicationStatus;
  updatedAt: string;
}

export interface StrRecoveredApplication extends StrSubmissionConfirmation {
  externalApplicationId: string;
  updatedAt: string;
}

const STR_STATUSES: readonly StrApplicationStatus[] = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
];

function getStrApiConfig() {
  return getExternalApiConfig(
      "STR_API_BASE_URL",
      "STR_API_KEY",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
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

function isStrApplicationStatus(
    value: unknown,
): value is StrApplicationStatus {
  return (
      typeof value === "string" &&
      STR_STATUSES.some((status) => status === value)
  );
}

function isValidDateTime(value: unknown): value is string {
  return (
      isNonEmptyString(value) &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          value,
      ) &&
      Number.isFinite(Date.parse(value))
  );
}

function validateStrSubmissionConfirmation(
    value: unknown,
): StrSubmissionConfirmation {
  if (
      !isRecord(value) ||
      !isNonEmptyString(value.id) ||
      !isNonEmptyString(value.referenceNo) ||
      !isStrApplicationStatus(value.status) ||
      !isValidDateTime(value.submittedAt)
  ) {
    throw new HttpError(
        502,
        "The STR service returned an invalid submission confirmation.",
    );
  }

  return {
    id: value.id,
    referenceNo: value.referenceNo,
    status: value.status,
    submittedAt: value.submittedAt,
  };
}

function validateStrStatusResponse(
    value: unknown,
): StrStatusResponse {
  if (
      !isRecord(value) ||
      !isNonEmptyString(value.id) ||
      !isNonEmptyString(value.referenceNo) ||
      !isStrApplicationStatus(value.status) ||
      !isValidDateTime(value.updatedAt)
  ) {
    throw new HttpError(
        502,
        "The STR service returned an invalid application status.",
    );
  }

  return {
    id: value.id,
    referenceNo: value.referenceNo,
    status: value.status,
    updatedAt: value.updatedAt,
  };
}

function validateStrRecoveredApplication(
    value: unknown,
    expectedExternalId: string
): StrRecoveredApplication {
  const confirmation = validateStrSubmissionConfirmation(value);

  if (
      !isRecord(value) ||
      !isNonEmptyString(value.externalApplicationId) ||
      value.externalApplicationId !== expectedExternalId ||
      !isValidDateTime(value.updatedAt)
  ) {
    throw new HttpError(
        502,
        "The STR service returned an invalid recovery response.",
    );
  }

  return {
    ...confirmation,
    externalApplicationId: value.externalApplicationId,
    updatedAt: value.updatedAt,
  };
}

export async function submitToStrApi(
    payload: StrApplicationPayload,
): Promise<StrSubmissionConfirmation> {
  const data = await externalApiRequest<unknown>(
      getStrApiConfig(),
      "/api/v1/applications",
      {
        method: "POST",
        body: payload,
      },
  );

  return validateStrSubmissionConfirmation(data);
}

export async function getStrApplicationStatus(
    providerApplicationId: string,
): Promise<StrStatusResponse> {
  const data = await externalApiRequest<unknown>(
      getStrApiConfig(),
      `/api/v1/applications/${encodeURIComponent(providerApplicationId)}/status`,
      {
        method: "GET",
      },
  );

  return validateStrStatusResponse(data);
}

export async function findStrApplicationByExternalId(
    externalApplicationId: string
): Promise<StrRecoveredApplication | null> {
  if (!isNonEmptyString(externalApplicationId)) {
    throw new HttpError(
        400,
        "External application ID is required.",
    );
  }

  const data = await externalApiRequest<unknown>(
      getStrApiConfig(),
      `/api/v1/applications/external/${encodeURIComponent(externalApplicationId)}`,
      {
        method: "GET",
        notFoundReturnsNull: true,
      },
  );

  if (data === null) {
    return null;
  }

  return validateStrRecoveredApplication(
      data,
      externalApplicationId,
  );
}
