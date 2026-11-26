import {
  EDITABLE_APPLICATION_STATUSES,
} from "../constants/applications/applications";

import type {
  ApplicationStatus,
  ExternalSubmissionState,
} from "../types/applications";

export function isExistingSubmission(
    state: ExternalSubmissionState | null | undefined
): boolean {
  return (
      state === "pending" ||
      state === "unknown" ||
      state === "submitted"
  );
}

export function isSubmissionRecoveryRequired(
    state: ExternalSubmissionState | null | undefined
): boolean {
  return (
      state === "pending" ||
      state === "unknown"
  );
}

export function isApplicationSubmitted(
    status: ApplicationStatus,
    submissionState?: ExternalSubmissionState | null
): boolean {
  return (
      status === "simulated_submitted" ||
      submissionState === "submitted"
  );
}

export function isApplicationEditable(
    status: ApplicationStatus,
    submissionState?: ExternalSubmissionState | null
): boolean {
  return (
      EDITABLE_APPLICATION_STATUSES.includes(status) &&
      !isExistingSubmission(submissionState)
  );
}
