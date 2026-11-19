import type { ApplicationStatus } from "../types/applications";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  simulated_submitted: "Submitted",
};
