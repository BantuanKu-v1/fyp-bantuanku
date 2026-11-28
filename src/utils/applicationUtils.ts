import {
  EDITABLE_APPLICATION_STATUSES,
} from "../constants/applications/applications";

import type {
  ApplicationStatus,
  ExternalSubmissionState,
} from "../types/applications";

import type { StrApplicantReview } from "../types/applications";
import { hasValue } from "./stringUtils.ts";

export type ApplicationSubmissionActionMode =
    | "submit"
    | "recover"
    | "submitted";

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
    status: ApplicationStatus | null | undefined,
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

export function getApplicationSubmissionActionMode(
    alreadySubmitted: boolean,
    requiresRecovery: boolean,
    hasConfirmation: boolean
): ApplicationSubmissionActionMode {
  if (requiresRecovery && !hasConfirmation) {
    return "recover";
  }

  if (alreadySubmitted) {
    return "submitted";
  }

  return "submit";
}

export type ApplicationSubmissionAvailability = {
  hasApplication: boolean;
  submissionStateVerified: boolean;
  busy: boolean;
  requiresRecovery: boolean;
  alreadySubmitted: boolean;
  hasConfirmation: boolean;
  applicationReady: boolean;
  declarationAccepted?: boolean;
};

export function canSubmitApplication({
    hasApplication,
    submissionStateVerified,
    busy,
    requiresRecovery,
    alreadySubmitted,
    hasConfirmation,
    applicationReady,
    declarationAccepted = true
}: ApplicationSubmissionAvailability): boolean {
  if (
      !hasApplication ||
      !submissionStateVerified ||
      busy
  ) {
    return false;
  }

  if (requiresRecovery) {
    return !hasConfirmation;
  }

  return (
      !alreadySubmitted &&
      applicationReady &&
      declarationAccepted
  );
}

export function isStrApplicantProfileComplete(
    applicant: StrApplicantReview | null
): boolean {
  return (
      !!applicant &&
      hasValue(applicant.fullName) &&
      hasValue(applicant.identificationNo) &&
      hasValue(applicant.dateOfBirth) &&
      hasValue(applicant.citizenship)
  );
}
