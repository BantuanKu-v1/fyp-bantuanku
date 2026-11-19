export type ApplicationStatus = "draft" | "in_progress" | "ready_for_review" | "simulated_submitted";

export type ApplicationSummary = {
  id: string;
  profileId: string;
  programId: string;
  programCode: string;
  programName: string;
  agency: string;
  status: ApplicationStatus;
  currentStep: string | null;
  simulatedSubmittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
