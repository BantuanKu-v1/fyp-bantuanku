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

export interface StrSubmissionResult {
  applicationId: string;
  provider: "str";
  submissionState: "submitted";
  providerApplicationId: string;
  referenceNo: string;
  providerStatus: string | null;
  submittedAt: string;
  alreadySubmitted: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface StrApplicantReview {
  fullName: string | null;
  identificationNo: string | null;
  dateOfBirth: string | null;
  citizenship: string | null;
  householdComplete: boolean;
  addressComplete: boolean;
  householdMembersComplete: boolean;
}
