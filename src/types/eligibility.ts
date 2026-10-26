// Supported government assistance programs
// Refer to docs/aid-programs for more details
export type AidProgramCode = "BA" | "BAT" | "BPT" | "BWE" | "STR" | "TBP";

// Possible eligibility assessment outcomes
export type EligibilityStatus = "potentially_eligible" | "potentially_ineligible" | "insufficient_information" | "manual_verification";

// Supported comparison operators
export type EligibilityOperator =
  "eq" // Equal to (===)
  | "neq" // Not equal to (!==)
  | "gt" // Greater than (>)
  | "gte" // Greater than or equal to (>=)
  | "lt" // Less than (<)
  | "lte" // Less than or equal to (<=)
  | "in" // Value exists in a specified list
  | "not_in"; // Value does not exist in a specified list

// Supported values for eligibility comparisons
export type EligibilityValue = string | number | boolean;

// Information used by the eligibility engine
export interface EligibilityFacts {
  // Personal information
  age: number | null;
  ageByBirthYear: number | null;
  citizenship: string | null;
  residenceCountry: string | null;
  state: string | null;
  maritalStatus: string | null;

  // Financial information
  monthlyPersonalIncome: number | null;
  monthlyHouseholdIncome: number | null;
  householdSize: number | null;
  perCapitaHouseholdIncome: number | null;

  // Household information
  numberOfDependents: number | null;
  numberOfEligibleChildren: number | null;
  hasChildren: boolean | null;
  hasEligibleChildren: boolean | null;
  isFullTimeStudent: boolean | null;

  // Welfare assistance information
  receivesJkmMonthlyAssistance: boolean | null;
  isJkmTargetGroup: boolean | null;

  // Health and disability information
  isOku: boolean | null;
  okuRegistered: boolean | null;
  hasChronicIllness: boolean | null;
  isBedridden: boolean | null;
  requiresContinuousTreatment: boolean | null;
  continuousTreatmentMonths: number | null;

  // Living arrangement information
  residesInJkmInstitution: boolean | null;
  residesInExcludedCareCentre: boolean | null;
  residesInExcludedInstitution: boolean | null;
  livesWithFamilyOrCaregiver: boolean | null;
  dependsOnFamilyOrCaregiver: boolean | null;
  familyOrCaregiverIncomeExceedsPgk: boolean | null;

  // Caregiver and patient information
  applicantIsPatient: boolean | null;
  applicantIsCaregiver: boolean | null;
  patientCitizenship: string | null;
  patientResidenceCountry: string | null;
  patientIsOku: boolean | null;
  patientHasChronicIllness: boolean | null;
  patientIsBedridden: boolean | null;
  patientRequiresContinuousTreatment: boolean | null;
  patientContinuousTreatmentMonths: number | null;
  hasCaregiver: boolean | null;
  caregiverCitizenship: string | null;
  caregiverProvidesIntensiveCare: boolean | null;

  // Medical and assistive equipment information
  hasMedicalOrJkmRecommendation: boolean | null;
  requestedAssistiveEquipment: boolean | null;
  estimatedEquipmentCost: number | null;
  hasHospitalReferral: boolean | null;

  // External verification and assessment information
  socioeconomicAssessmentRequired: boolean | null;
  medicalAssessmentRequired: boolean | null;

  // JKM-specific assessment information
  baAdditionalCircumstancesRequireReview: boolean | null;
  batRecommendationOrEquipmentRequiresReview: boolean | null;
  batSpecialConsiderationRequested: boolean | null;
  bptMedicalOrCaregiverReviewRequired: boolean | null;
}

// Individual eligibility condition
export interface EligibilityCondition {
  id: string;
  field: keyof EligibilityFacts;
  operator: EligibilityOperator;

  // Static comparison value
  value?: EligibilityValue | readonly EligibilityValue[];

  // Reference to a dynamic threshold, such as PGK
  thresholdRef?: string;

  description: string;
}

// A condition that negates another eligibility expression
export interface EligibilityNotExpression {
  not: EligibilityExpression;
}

// A condition referencing another eligibility rule
export interface EligibilityRuleReference {
  ruleMatched: string;
}

// Supported eligibility expressions
export type EligibilityExpression =
    | EligibilityCondition
    | EligibilityRuleGroup
    | EligibilityNotExpression
    | EligibilityRuleReference;

// A group of eligibility conditions
export interface EligibilityRuleGroup {
  operator: "AND" | "OR";
  conditions: EligibilityExpression[];
}

// Individual rule for an assistance program
export interface EligibilityRule {
  id: string;
  programCode: AidProgramCode;
  name: string;
  conditions: EligibilityRuleGroup;

  // Normalized BantuanKu eligibility outcome
  outcome: EligibilityStatus;

  // Original government API outcome
  governmentOutcome?: string;

  description: string;
  outcomeDescription?: string;
  requiresManualVerification?: boolean;
}

// Result of evaluating an individual condition
export interface EligibilityConditionResult {
  conditionId: string;
  field: keyof EligibilityFacts;
  passed: boolean | null;
  description: string;
}

// Result of evaluating an individual rule
export interface EligibilityRuleResult {
  ruleId: string;
  programCode: AidProgramCode;
  matched: boolean | null;
  outcome: EligibilityStatus;
  matchedConditions: EligibilityConditionResult[];
  unmetConditions: EligibilityConditionResult[];
  missingInformation: EligibilityConditionResult[];
}

// Final assessment for an assistance program
export interface EligibilityResult {
  programCode: AidProgramCode;
  status: EligibilityStatus;
  matchedRuleIds: string[];
  ruleResults: EligibilityRuleResult[];
  matchedConditions: EligibilityConditionResult[];
  unmetConditions: EligibilityConditionResult[];
  missingInformation: EligibilityConditionResult[];
  manualVerification: string[];
}
