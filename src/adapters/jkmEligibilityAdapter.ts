import {
  AidProgramCode,
  EligibilityFacts,
  EligibilityOperator,
  EligibilityRule,
  EligibilityStatus,
  EligibilityValue,
} from "../types/eligibility";
import {
  JKM_MANUAL_VERIFICATION_OUTCOMES,
  JKM_OUTCOMES
} from "../constants/eligibility";
import {
  adaptEligibilityExpression,
  normalizeEligibilityRuleGroup,
  validateEligibilityRuleDependencies
} from "./eligibilityExpressionAdapter";

// JKM eligibility outcomes
type JkmEligibilityOutcome =
    | "preliminary_match"
    | "no_preliminary_match"
    | "further_assessment_required"
    | "further_approval_required";

// Raw condition formats returned by the JKM API
interface JkmFieldCondition {
  field: string;
  operator: EligibilityOperator;
  value:
      | EligibilityValue
      | EligibilityValue[]
      | {
    thresholdRef: string;
  };
}

interface JkmAllExpression {
  all: JkmExpression[];
}

interface JkmAnyExpression {
  any: JkmExpression[];
}

interface JkmNotExpression {
  not: JkmExpression;
}

interface JkmRuleReference {
  ruleMatched: string;
}

type JkmExpression =
    | JkmFieldCondition
    | JkmAllExpression
    | JkmAnyExpression
    | JkmNotExpression
    | JkmRuleReference;

// Individual JKM eligibility rule
export interface JkmEligibilityRule {
  ruleCode: string;
  name: string;
  conditions: JkmExpression;
  result: JkmEligibilityOutcome;
  assessmentNotes?: string;
}

// JKM eligibility criteria
export interface JkmEligibilityCriteria {
  schemaVersion: number;
  programCode: string;
  source?: string;
  scope?: string;
  thresholdNotes?: string;
  rules: JkmEligibilityRule[];
}

// Public JKM API response
export interface JkmEligibilityApiResponse {
  success: boolean;
  data: {
    programCode: string;
    programName: string;
    version: number;
    updatedAt?: string;
    criteria: JkmEligibilityCriteria;
  };
}

// Explicit mapping from JKM fields to BantuanKu facts
const JKM_FIELD_MAP = {
  // Applicant
  "applicant.citizenship": "citizenship",
  "applicant.residenceCountry": "residenceCountry",
  "applicant.residenceState": "state",
  "applicant.ageByBirthYear": "ageByBirthYear",
  "applicant.hasChildren": "hasChildren",
  "applicant.dependsOnFamilyOrCaregiver": "dependsOnFamilyOrCaregiver",
  "applicant.familyOrCaregiverIncomeExceedsApplicablePGK": "familyOrCaregiverIncomeExceedsPgk",
  "applicant.residesInExcludedInstitution": "residesInExcludedInstitution",
  "applicant.receivesOtherJKMMonthlyAssistance": "receivesJkmMonthlyAssistance",
  "applicant.isJKMTargetGroup": "isJkmTargetGroup",
  "applicant.isCaregiverOfPatient": "applicantIsCaregiver",
  "applicant.isPatient": "applicantIsPatient",

  // Household
  "household.monthlyIncome": "monthlyHouseholdIncome",
  "household.monthlyPerCapitaIncome": "perCapitaHouseholdIncome",

  // Patient
  "patient.citizenship": "patientCitizenship",
  "patient.residenceCountry": "patientResidenceCountry",
  "patient.isBedridden": "patientIsBedridden",
  "patient.isOKU": "patientIsOku",

  "patient.hasChronicIllness": "patientHasChronicIllness",
  "patient.requiresContinuousTreatment": "patientRequiresContinuousTreatment",

  "patient.continuousTreatmentMonths": "patientContinuousTreatmentMonths",
  "patient.hasCaregiver": "hasCaregiver",

  // Caregiver
  "caregiver.citizenship": "caregiverCitizenship",
  "caregiver.providesIntensiveCare": "caregiverProvidesIntensiveCare",

  // Application
  "application.hasApplicableMedicalOrJKMRecommendation": "hasMedicalOrJkmRecommendation",
  "application.equipmentCost": "estimatedEquipmentCost",

  // JKM assessment
  "assessment.baAdditionalCircumstancesRequireReview": "baAdditionalCircumstancesRequireReview",
  "assessment.batRecommendationOrEquipmentRequiresReview": "batRecommendationOrEquipmentRequiresReview",
  "assessment.batSpecialConsiderationRequested": "batSpecialConsiderationRequested",
  "assessment.bptMedicalOrCaregiverReviewRequired": "bptMedicalOrCaregiverReviewRequired",
} as const satisfies Record<string, keyof EligibilityFacts>;

const JKM_EXPRESSION_OPTIONS = {
  fieldMap: JKM_FIELD_MAP,
  source: "JKM",
  allowThresholdRef: true,
} as const;

// Convert a government outcome to BantuanKu's internal status
function normalizeOutcome(
    outcome: JkmEligibilityOutcome
): EligibilityStatus {
  switch (outcome) {
    case "preliminary_match":
      return "potentially_eligible";

    case "no_preliminary_match":
      return "potentially_ineligible";

    case "further_assessment_required":
    case "further_approval_required":
      return "manual_verification";
  }
}

// Validate government outcomes
function isJkmOutcome(
    value: unknown
): value is JkmEligibilityOutcome {
  return JKM_OUTCOMES.includes(
      value as JkmEligibilityOutcome
  );
}

// Convert one JKM rule into an internal eligibility rule
function adaptRule(
    raw: JkmEligibilityRule,
    programCode: AidProgramCode
): EligibilityRule {
  if (
      typeof raw.ruleCode !== "string" ||
      raw.ruleCode.trim() === ""
  ) {
    throw new Error("JKM rule is missing ruleCode");
  }

  if (
      typeof raw.name !== "string" ||
      raw.name.trim() === ""
  ) {
    throw new Error(
        `JKM rule ${raw.ruleCode} is missing a name`
    );
  }

  if (!isJkmOutcome(raw.result)) {
    throw new Error(
        `Unsupported JKM outcome in rule ${raw.ruleCode}`
    );
  }

  const expression = adaptEligibilityExpression(
      raw.conditions,
      raw.ruleCode,
      JKM_EXPRESSION_OPTIONS
  );

  return {
    id: raw.ruleCode,
    programCode,
    name: raw.name,
    conditions: normalizeEligibilityRuleGroup(expression),
    outcome: normalizeOutcome(raw.result),
    governmentOutcome: raw.result,
    description: raw.name,
    outcomeDescription: raw.assessmentNotes ?? raw.name,
    requiresManualVerification:
        (JKM_MANUAL_VERIFICATION_OUTCOMES as readonly string[]).includes(
            raw.result
        ),
  };
}

// Convert JKM eligibility criteria into BantuanKu rules
export function adaptJkmEligibilityCriteria(
    criteria: JkmEligibilityCriteria,
    programCode: AidProgramCode
): EligibilityRule[] {
  if (criteria.schemaVersion !== 1) {
    throw new Error(
        `Unsupported JKM eligibility schema version: ${criteria.schemaVersion}`
    );
  }

  if (criteria.programCode !== programCode) {
    throw new Error(
        `JKM program mismatch: expected ${programCode}, received ${criteria.programCode}`
    );
  }

  if (!Array.isArray(criteria.rules)) {
    throw new Error(
        "JKM eligibility criteria must contain a rules array"
    );
  }

  const rules = criteria.rules.map((rule) =>
      adaptRule(rule, programCode)
  );

  validateEligibilityRuleDependencies(rules, "JKM");

  return rules;
}

// Convert a complete JKM API response
export function adaptJkmEligibilityResponse(
    response: JkmEligibilityApiResponse,
    programCode: AidProgramCode
): EligibilityRule[] {
  if (
      !response.success ||
      !response.data ||
      !response.data.criteria
  ) {
    throw new Error(
        "Invalid JKM eligibility API response"
    );
  }

  if (response.data.programCode !== programCode) {
    throw new Error(
        "JKM API response program code mismatch"
    );
  }

  return adaptJkmEligibilityCriteria(
      response.data.criteria,
      programCode
  );
}
