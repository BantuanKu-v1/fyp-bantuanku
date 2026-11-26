export type ApplicationStatus =
    | "draft"
    | "in_progress"
    | "ready_for_review"
    | "simulated_submitted";

export type ExternalApplicationProvider = "str" | "jkm";

export type ExternalSubmissionState =
    | "pending"
    | "submitted"
    | "failed"
    | "unknown";

export type StrProviderStatus =
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected";

export type JkmProviderStatus =
    | "submitted"
    | "under_review"
    | "additional_information_required"
    | "approved"
    | "rejected"
    | "cancelled";

export type ExternalProviderStatus =
    | StrProviderStatus
    | JkmProviderStatus;

export interface ExternalApplicationSubmission {
  provider: ExternalApplicationProvider;
  submissionState: ExternalSubmissionState;
  providerApplicationId: string | null;
  referenceNo: string | null;
  providerStatus: ExternalProviderStatus | null;
  submittedAt: string | null;
  providerUpdatedAt: string | null;
  lastSyncedAt: string | null;
}

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
  externalSubmission?: ExternalApplicationSubmission | null;
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

// Supported JKM application programmes
export type JkmProgramCode =
    | "BA"
    | "BAT"
    | "BPT"
    | "BWE";

// JKM submission result
export interface JkmSubmissionResult {
  applicationId: string;
  provider: "jkm";
  submissionState: "submitted";
  providerApplicationId: string;
  referenceNo: string;
  providerStatus: JkmProviderStatus;
  submittedAt: string;
  alreadySubmitted: boolean;
}

// BA application declarations
export interface BaAdditionalCircumstances {
  economicHardship?: boolean | null;
  healthRelatedNeeds?: boolean | null;
  dependentRelatedNeeds?: boolean | null;
  otherCircumstances?: boolean | null;
  description?: string | null;
}

export interface BaApplicationSpecificData {
  receivesOtherJkmMonthlyAssistance?: boolean | null;
  currentJkmAssistanceProgram?: string | null;
  additionalCircumstances?: BaAdditionalCircumstances | null;
}

// BAT application declarations
export type BatBeneficiaryType =
    | "applicant"
    | "dependent";

export type BatRecommendingAuthority =
    | "medical_officer"
    | "jkm_officer"
    | "other";

export interface JkmHealthDeclaration {
  isOku?: boolean | null;
  okuRegistered?: boolean | null;
  disabilityDescription?: string | null;
  hasChronicIllness?: boolean | null;
  chronicIllnessDetails?: string | null;
  isBedridden?: boolean | null;
  requiresContinuousTreatment?: boolean | null;
  treatmentStartDate?: string | null;
}

export interface BatBeneficiaryDeclaration {
  type: BatBeneficiaryType | null;
  fullName?: string | null;
  identificationNo?: string | null;
  relationshipToApplicant?: string | null;
  health?: JkmHealthDeclaration | null;
}

export interface BatEquipmentDeclaration {
  equipmentType?: string | null;
  equipmentDescription?: string | null;
  purpose?: string | null;
  estimatedCost?: number | null;
  supplierName?: string | null;
  quotationAvailable?: boolean | null;
}

export interface BatRecommendationDeclaration {
  recommendationAvailable?: boolean | null;
  recommendingAuthority?: BatRecommendingAuthority | null;
  recommendationOfficerName?: string | null;
  recommendationInstitution?: string | null;
  recommendationDetails?: string | null;
}

export interface BatApplicationSpecificData {
  beneficiary: BatBeneficiaryDeclaration;
  functionalLimitationDescription?: string | null;
  equipment: BatEquipmentDeclaration;
  recommendation: BatRecommendationDeclaration;
  additionalJustification?: string | null;
}

// BPT application declarations
export type BptApplicationPathway =
    | "caregiver"
    | "non_bedridden_patient"
    | "bedridden_patient_without_eligible_caregiver";

export type BptSelfApplicationReason =
    | "no_caregiver"
    | "non_malaysian_caregiver";

export interface BptPatientDeclaration {
  fullName?: string | null;
  identificationNo?: string | null;
  citizenship?: string | null;
  relationshipToApplicant?: string | null;

  isOku?: boolean | null;
  okuRegistered?: boolean | null;
  hasChronicIllness?: boolean | null;
  chronicIllnessDetails?: string | null;
  isBedridden?: boolean | null;
  requiresContinuousTreatment?: boolean | null;
  treatmentStartDate?: string | null;
}

export interface BptCaregiverDeclaration {
  fullName?: string | null;
  identificationNo?: string | null;
  citizenship?: string | null;
  relationship?: string | null;
  providesIntensiveCare?: boolean | null;
  eligiblePersonsCaredFor?: number | null;
}

export interface BptMedicalConfirmationDeclaration {
  medicalConfirmationAvailable?: boolean | null;
  medicalInstitution?: string | null;
  medicalOfficerName?: string | null;
  diagnosisDetails?: string | null;
  treatmentDetails?: string | null;
  specialistDetails?: string | null;
}

export interface BptApplicationSpecificData {
  applicationPathway: BptApplicationPathway | null;
  patient: BptPatientDeclaration;
  caregiver?: BptCaregiverDeclaration | null;
  medicalConfirmation: BptMedicalConfirmationDeclaration;
  reasonForSelfApplication?: BptSelfApplicationReason | null;
  additionalRemarks?: string | null;
}

// BWE application declarations
export interface BweApplicationSpecificData {
  hasChildren?: boolean | null;
  dependsOnFamilyOrCaregiver?: boolean | null;
  familyOrCaregiverMonthlyIncome?: number | null;
  incomeDeclarationDetails?: string | null;
  specialConsiderationRequested: boolean | null;
  specialConsiderationReason?: string | null;
}

// Programme-specific application data
export interface BaApplicationDraftData {
  schemaVersion: 1;
  programCode: "BA";
  programSpecificData: BaApplicationSpecificData;
}

export interface BatApplicationDraftData {
  schemaVersion: 1;
  programCode: "BAT";
  programSpecificData: BatApplicationSpecificData;
}

export interface BptApplicationDraftData {
  schemaVersion: 1;
  programCode: "BPT";
  programSpecificData: BptApplicationSpecificData;
}

export interface BweApplicationDraftData {
  schemaVersion: 1;
  programCode: "BWE";
  programSpecificData: BweApplicationSpecificData;
}

// Discriminated union for JKM application drafts
export type JkmApplicationDraftData =
    | BaApplicationDraftData
    | BatApplicationDraftData
    | BptApplicationDraftData
    | BweApplicationDraftData;

export interface JkmApplicantReview {
  programCode: JkmProgramCode;

  fullName: string | null;
  identificationNo: string | null;
  dateOfBirth: string | null;
  citizenship: string | null;

  profileComplete: boolean;
  addressComplete: boolean;

  householdRequired: boolean;
  householdComplete: boolean;
  householdMembersComplete: boolean;

  profileReady: boolean;
}
