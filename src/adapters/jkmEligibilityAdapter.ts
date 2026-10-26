import {
  AidProgramCode,
  EligibilityCondition,
  EligibilityExpression,
  EligibilityFacts,
  EligibilityOperator,
  EligibilityRule,
  EligibilityRuleGroup,
  EligibilityStatus,
  EligibilityValue,
} from "../types/eligibility";

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
  value: EligibilityValue | EligibilityValue[] | {
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
  "applicant.dependsOnFamilyOrCaregiver":
      "dependsOnFamilyOrCaregiver",
  "applicant.familyOrCaregiverIncomeExceedsApplicablePGK":
      "familyOrCaregiverIncomeExceedsPgk",
  "applicant.residesInExcludedInstitution":
      "residesInExcludedInstitution",
  "applicant.receivesOtherJKMMonthlyAssistance":
      "receivesJkmMonthlyAssistance",
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
  "patient.requiresContinuousTreatment":
      "patientRequiresContinuousTreatment",
  "patient.continuousTreatmentMonths":
      "patientContinuousTreatmentMonths",
  "patient.hasCaregiver": "hasCaregiver",

  // Caregiver
  "caregiver.citizenship": "caregiverCitizenship",
  "caregiver.providesIntensiveCare":
      "caregiverProvidesIntensiveCare",

  // Application
  "application.hasApplicableMedicalOrJKMRecommendation":
      "hasMedicalOrJkmRecommendation",
  "application.equipmentCost": "estimatedEquipmentCost",

  // JKM assessment
  "assessment.baAdditionalCircumstancesRequireReview":
      "baAdditionalCircumstancesRequireReview",
  "assessment.batRecommendationOrEquipmentRequiresReview":
      "batRecommendationOrEquipmentRequiresReview",
  "assessment.batSpecialConsiderationRequested":
      "batSpecialConsiderationRequested",
  "assessment.bptMedicalOrCaregiverReviewRequired":
      "bptMedicalOrCaregiverReviewRequired",
} as const satisfies Record<string, keyof EligibilityFacts>;

// Supported operators
const SUPPORTED_OPERATORS: readonly EligibilityOperator[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "not_in",
];

// Supported government outcomes
const SUPPORTED_OUTCOMES: readonly JkmEligibilityOutcome[] = [
  "preliminary_match",
  "no_preliminary_match",
  "further_assessment_required",
  "further_approval_required",
];

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

// Check whether a value is a plain object
function isRecord(
    value: unknown
): value is Record<string, unknown> {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

// Check whether a value is a supported scalar
function isEligibilityValue(
    value: unknown
): value is EligibilityValue {
  return (
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
  );
}

// Validate comparison operators
function isEligibilityOperator(
    value: unknown
): value is EligibilityOperator {
  return SUPPORTED_OPERATORS.includes(
      value as EligibilityOperator
  );
}

// Validate government outcomes
function isJkmOutcome(
    value: unknown
): value is JkmEligibilityOutcome {
  return SUPPORTED_OUTCOMES.includes(
      value as JkmEligibilityOutcome
  );
}

// Convert a JKM field name into an internal fact name
function mapJkmField(
    field: string
): keyof EligibilityFacts {
  const mappedField =
      JKM_FIELD_MAP[field as keyof typeof JKM_FIELD_MAP];

  if (!mappedField) {
    throw new Error(
        `Unsupported JKM eligibility field: ${field}`
    );
  }

  return mappedField;
}

// Convert an individual JKM field condition
function adaptFieldCondition(
    raw: Record<string, unknown>,
    conditionId: string
): EligibilityCondition {
  const { field, operator, value } = raw;

  if (typeof field !== "string") {
    throw new Error(
        `Invalid field in JKM condition: ${conditionId}`
    );
  }

  if (!isEligibilityOperator(operator)) {
    throw new Error(
        `Unsupported operator in JKM condition: ${conditionId}`
    );
  }

  const mappedField = mapJkmField(field);

  const description = `${field} ${operator}`;

  // Dynamic threshold reference
  if (isRecord(value)) {
    if (
        Object.keys(value).length !== 1 ||
        typeof value.thresholdRef !== "string" ||
        value.thresholdRef.trim() === ""
    ) {
      throw new Error(
          `Invalid threshold reference in condition: ${conditionId}`
      );
    }

    return {
      id: conditionId,
      field: mappedField,
      operator,
      thresholdRef: value.thresholdRef,
      description,
    };
  }

  // List comparison
  if (Array.isArray(value)) {
    if (
        !["in", "not_in"].includes(operator) ||
        value.length === 0 ||
        !value.every(isEligibilityValue)
    ) {
      throw new Error(
          `Invalid list comparison in condition: ${conditionId}`
      );
    }

    return {
      id: conditionId,
      field: mappedField,
      operator,
      value,
      description,
    };
  }

  // Static scalar comparison
  if (!isEligibilityValue(value)) {
    throw new Error(
        `Invalid comparison value in condition: ${conditionId}`
    );
  }

  if (operator === "in" || operator === "not_in") {
    throw new Error(
        `Operator ${operator} requires a list: ${conditionId}`
    );
  }

  return {
    id: conditionId,
    field: mappedField,
    operator,
    value,
    description,
  };
}

// Recursively convert JKM expressions
function adaptExpression(
    expression: unknown,
    path: string
): EligibilityExpression {
  if (!isRecord(expression)) {
    throw new Error(
        `Invalid JKM eligibility expression: ${path}`
    );
  }

  // AND expression
  if ("all" in expression) {
    if (
        !Array.isArray(expression.all) ||
        expression.all.length === 0
    ) {
      throw new Error(
          `Invalid ALL expression: ${path}`
      );
    }

    return {
      operator: "AND",
      conditions: expression.all.map((item, index) =>
          adaptExpression(item, `${path}.all.${index}`)
      ),
    };
  }

  // OR expression
  if ("any" in expression) {
    if (
        !Array.isArray(expression.any) ||
        expression.any.length === 0
    ) {
      throw new Error(
          `Invalid ANY expression: ${path}`
      );
    }

    return {
      operator: "OR",
      conditions: expression.any.map((item, index) =>
          adaptExpression(item, `${path}.any.${index}`)
      ),
    };
  }

  // NOT expression
  if ("not" in expression) {
    return {
      not: adaptExpression(
          expression.not,
          `${path}.not`
      ),
    };
  }

  // Reference to another rule
  if ("ruleMatched" in expression) {
    if (
        typeof expression.ruleMatched !== "string" ||
        expression.ruleMatched.trim() === ""
    ) {
      throw new Error(
          `Invalid rule reference: ${path}`
      );
    }

    return {
      ruleMatched: expression.ruleMatched,
    };
  }

  // Individual field condition
  if ("field" in expression) {
    return adaptFieldCondition(expression, path);
  }

  throw new Error(
      `Unsupported JKM eligibility expression: ${path}`
  );
}

// Ensure every rule has a group as its root expression
function normalizeRuleGroup(
    expression: EligibilityExpression
): EligibilityRuleGroup {
  if ("conditions" in expression) {
    return expression;
  }

  return {
    operator: "AND",
    conditions: [expression],
  };
}

// Collect referenced rule IDs from an expression
function collectRuleReferences(
    expression: EligibilityExpression,
    references: Set<string>
): void {
  if ("ruleMatched" in expression) {
    references.add(expression.ruleMatched);
    return;
  }

  if ("not" in expression) {
    collectRuleReferences(expression.not, references);
    return;
  }

  if ("conditions" in expression) {
    for (const condition of expression.conditions) {
      collectRuleReferences(condition, references);
    }
  }
}

// Validate rule references and reject circular dependencies
function validateRuleDependencies(
    rules: EligibilityRule[]
): void {
  const ruleMap = new Map(
      rules.map((rule) => [rule.id, rule])
  );

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(ruleId: string): void {
    if (visiting.has(ruleId)) {
      throw new Error(
          `Circular JKM rule dependency detected: ${ruleId}`
      );
    }

    if (visited.has(ruleId)) {
      return;
    }

    const rule = ruleMap.get(ruleId);

    if (!rule) {
      throw new Error(
          `Unknown JKM rule reference: ${ruleId}`
      );
    }

    visiting.add(ruleId);

    const references = new Set<string>();

    collectRuleReferences(
        rule.conditions,
        references
    );

    for (const reference of references) {
      visit(reference);
    }

    visiting.delete(ruleId);
    visited.add(ruleId);
  }

  for (const rule of rules) {
    visit(rule.id);
  }
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

  const expression = adaptExpression(
      raw.conditions,
      raw.ruleCode
  );

  return {
    id: raw.ruleCode,
    programCode,
    name: raw.name,
    conditions: normalizeRuleGroup(expression),

    outcome: normalizeOutcome(raw.result),
    governmentOutcome: raw.result,

    description: raw.name,
    outcomeDescription:
        raw.assessmentNotes ?? raw.name,

    requiresManualVerification:
        raw.result === "further_assessment_required" ||
        raw.result === "further_approval_required",
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

  const ruleIds = rules.map((rule) => rule.id);

  if (new Set(ruleIds).size !== ruleIds.length) {
    throw new Error(
        "Duplicate JKM eligibility rule codes detected"
    );
  }

  validateRuleDependencies(rules);

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
