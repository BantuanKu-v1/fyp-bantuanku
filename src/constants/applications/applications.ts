import type { ApplicationStatus } from "../../types/applications.ts";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "applications.statuses.draft",
  in_progress: "applications.statuses.inProgress",
  ready_for_review: "applications.statuses.readyForReview",
  simulated_submitted: "applications.statuses.submitted",
};
