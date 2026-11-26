export type JkmProgramCode =
    | "BA"
    | "BAT"
    | "BPT"
    | "BWE";

export type JkmApplicationStatus =
    | "submitted"
    | "under_review"
    | "additional_information_required"
    | "approved"
    | "rejected"
    | "cancelled";

// Common application data
export interface JkmApplicantData {
  fullName: string;
  identificationNo: string;
  dateOfBirth: string;
  gender: string | null;
  citizenship: string;
  maritalStatus: string | null;
}

export interface JkmContactData {
  mobilePhone: string | null;
  homePhone: string | null;
  email: string | null;
}

export interface JkmAddressData {
  addressLine1: string;
  addressLine2: string | null;
  postcode: string;
  city: string;
  stateTerritory: string;
  countryCode: string;
}

export interface JkmEmploymentData {
  occupation: string | null;
  employmentStatus: string | null;
  isStudent: boolean | null;
  studyMode: string | null;
  institutionType: string | null;
}

export interface JkmFinancialData {
  monthlyPersonalIncome: number | null;
  monthlyHouseholdIncome: number | null;
  incomeSource: string | null;
}

export interface JkmHouseholdMemberData {
  fullName: string;
  identificationNo: string | null;
  relationship: string;
  dateOfBirth: string | null;
  gender: string | null;
  citizenship: string | null;
  isDependent: boolean | null;
  employmentStatus: string | null;
  occupation: string | null;
  monthlyIncome: number | null;
  isStudent: boolean | null;
  studyMode: string | null;
  institutionType: string | null;
  isOku: boolean | null;
  okuRegistered: boolean | null;
}

export interface JkmHouseholdData {
  members: JkmHouseholdMemberData[];
}

export interface JkmHealthData {
  isOku: boolean | null;
  okuRegistered: boolean | null;
  disabilityDescription: string | null;
  hasChronicIllness: boolean | null;
  chronicIllnessDetails: string | null;
  isBedridden: boolean | null;
  requiresContinuousTreatment: boolean | null;
  treatmentStartDate: string | null;
}

export interface JkmLivingArrangementData {
  arrangementType: string | null;
  livesWithFamily: boolean | null;
  dependsOnFamily: boolean | null;
  dependsOnCaregiver: boolean | null;
  isInInstitution: boolean | null;
  institutionName: string | null;
  institutionType: string | null;
  receivesFreeServices: boolean | null;
  receivesRationGrant: boolean | null;
}

export interface JkmCaregiverData {
  fullName: string;
  identificationNo: string | null;
  citizenship: string | null;
  relationship: string | null;
  providesIntensiveCare: boolean | null;
  eligiblePersonsCaredFor: number | null;
}

export interface JkmWelfareAssistanceData {
  programName: string;
  agency: string | null;
  assistanceType: string | null;
  monthlyAmount: number | null;
  isActive: boolean | null;
  startDate: string | null;
  endDate: string | null;
}

// Supporting docs
export interface JkmSupportingDocument {
  documentId: string;
  requirementType: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number | null;
  issuedAt: string | null;
  expiresAt: string | null;
}

// Preliminary eligibility
export type JkmPreliminaryEligibilityStatus =
    | "potentially_eligible"
    | "potentially_ineligible"
    | "insufficient_information"
    | "manual_verification";

export interface JkmPreliminaryEligibility {
  status: JkmPreliminaryEligibilityStatus;
  criteriaVersion: number;
  assessedAt: string;
}

// Common application dats structure
export interface JkmCommonApplicationData {
  schemaVersion: 1;

  applicant: JkmApplicantData;
  contact: JkmContactData;
  address: JkmAddressData;
  financial: JkmFinancialData;

  household?: JkmHouseholdData;
  employment?: JkmEmploymentData;
  health?: JkmHealthData;
  livingArrangement?: JkmLivingArrangementData;
  caregivers?: JkmCaregiverData[];
  welfareAssistance?: JkmWelfareAssistanceData[];
  supportingDocuments?: JkmSupportingDocument[];
  preliminaryEligibility?: JkmPreliminaryEligibility;
}

// BA
export interface BaAdditionalCircumstances {
  economicHardship: boolean | null;
  healthRelatedNeeds: boolean | null;
  dependentRelatedNeeds: boolean | null;
  otherCircumstances: boolean | null;
  description: string | null;
}

export interface BaProgramSpecificData {
  receivesOtherJkmMonthlyAssistance: boolean | null;
  currentJkmAssistanceProgram: string | null;
  additionalCircumstances: BaAdditionalCircumstances;
}

export interface BaApplicationData
    extends JkmCommonApplicationData {
  household: JkmHouseholdData;
  welfareAssistance: JkmWelfareAssistanceData[];
  programSpecificData: BaProgramSpecificData;
}

// BAT
export type BatBeneficiaryType =
    | "applicant"
    | "dependent";

export type BatRecommendingAuthority =
    | "medical_officer"
    | "jkm_officer"
    | "other";

export interface BatBeneficiaryData {
  type: BatBeneficiaryType;
  fullName: string;
  identificationNo: string | null;
  relationshipToApplicant: string | null;
  health: JkmHealthData;
}

export interface BatEquipmentData {
  equipmentType: string;
  equipmentDescription: string;
  purpose: string;
  estimatedCost: number | null;
  supplierName: string | null;
  quotationAvailable: boolean | null;
}

export interface BatRecommendationData {
  recommendationAvailable: boolean | null;
  recommendingAuthority: BatRecommendingAuthority | null;
  recommendationOfficerName: string | null;
  recommendationInstitution: string | null;
  recommendationDetails: string | null;
}

export interface BatProgramSpecificData {
  beneficiary: BatBeneficiaryData;
  functionalLimitationDescription: string | null;
  equipment: BatEquipmentData;
  recommendation: BatRecommendationData;
  additionalJustification: string | null;
}

export interface BatApplicationData
    extends JkmCommonApplicationData {
  household: JkmHouseholdData;
  health: JkmHealthData;
  programSpecificData: BatProgramSpecificData;
}

// BPT
export type BptApplicationPathway =
    | "caregiver"
    | "non_bedridden_patient"
    | "bedridden_patient_without_eligible_caregiver";

export type BptSelfApplicationReason =
    | "no_caregiver"
    | "non_malaysian_caregiver";

export interface BptPatientData {
  fullName: string;
  identificationNo: string | null;
  citizenship: string | null;
  relationshipToApplicant: string | null;
  isOku: boolean | null;
  okuRegistered: boolean | null;
  hasChronicIllness: boolean | null;
  chronicIllnessDetails: string | null;
  isBedridden: boolean | null;
  requiresContinuousTreatment: boolean | null;
  treatmentStartDate: string | null;
}

export interface BptMedicalConfirmationData {
  medicalConfirmationAvailable: boolean | null;
  medicalInstitution: string | null;
  medicalOfficerName: string | null;
  diagnosisDetails: string | null;
  treatmentDetails: string | null;
  specialistDetails: string | null;
}

export interface BptProgramSpecificData {
  applicationPathway: BptApplicationPathway;
  patient: BptPatientData;
  caregiver: JkmCaregiverData | null;
  medicalConfirmation: BptMedicalConfirmationData;
  reasonForSelfApplication: BptSelfApplicationReason | null;
  additionalRemarks: string | null;
}

export interface BptApplicationData
    extends JkmCommonApplicationData {
  health: JkmHealthData;
  programSpecificData: BptProgramSpecificData;
}

// BWE
export interface BweProgramSpecificData {
  hasChildren: boolean | null;
  dependsOnFamilyOrCaregiver: boolean | null;
  familyOrCaregiverMonthlyIncome: number | null;
  incomeDeclarationDetails: string | null;
  specialConsiderationRequested: boolean;
  specialConsiderationReason: string | null;
}

export interface BweApplicationData
    extends JkmCommonApplicationData {
  household: JkmHouseholdData;
  livingArrangement: JkmLivingArrangementData;
  programSpecificData: BweProgramSpecificData;
}

// Application submission payload
export interface JkmBaseApplicationPayload {
  externalApplicationId: string;
  applicantName: string;
  applicantIdentificationNo?: string;
}

export interface BaApplicationPayload
    extends JkmBaseApplicationPayload {
  programCode: "BA";
  applicationData: BaApplicationData;
}

export interface BatApplicationPayload
    extends JkmBaseApplicationPayload {
  programCode: "BAT";
  applicationData: BatApplicationData;
}

export interface BptApplicationPayload
    extends JkmBaseApplicationPayload {
  programCode: "BPT";
  applicationData: BptApplicationData;
}

export interface BweApplicationPayload
    extends JkmBaseApplicationPayload {
  programCode: "BWE";
  applicationData: BweApplicationData;
}

// Ensure each program uses its corresponding application data
export type JkmApplicationPayload =
    | BaApplicationPayload
    | BatApplicationPayload
    | BptApplicationPayload
    | BweApplicationPayload;

// External API response
export interface JkmSubmissionConfirmation {
  id: string;
  referenceNo: string;
  programCode: JkmProgramCode;
  status: JkmApplicationStatus;
  submittedAt: string;
}

export interface JkmStatusResponse {
  id: string;
  referenceNo: string;
  programCode: JkmProgramCode;
  status: JkmApplicationStatus;
  updatedAt: string;
}

export interface JkmRecoveredApplication
    extends JkmSubmissionConfirmation {
  externalApplicationId: string;
  updatedAt: string;
}
