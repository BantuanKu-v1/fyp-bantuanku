import type { ApplicationStatus } from "../../types/applications.ts";
import type { AidProgramCode, EligibilityStatus } from "../../types/eligibility.ts";
import { JKM_PROGRAM_CODES } from "../eligibility/eligibility.ts";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "applications.statuses.draft",
  in_progress: "applications.statuses.inProgress",
  ready_for_review: "applications.statuses.readyForReview",
  simulated_submitted: "applications.statuses.submitted",
};

export const EDITABLE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
    "draft",
    "in_progress",
    "ready_for_review",
] as const;

export const SUPPORTED_APPLICATION_PROGRAM_CODES: readonly AidProgramCode[] = [
    ...JKM_PROGRAM_CODES,
    "STR",
] as const;

export const APPLICATION_ELIGIBILITY_STATUSES: readonly EligibilityStatus[] = [
    "potentially_eligible",
    "potentially_ineligible",
    "insufficient_information",
    "manual_verification",
] as const;
