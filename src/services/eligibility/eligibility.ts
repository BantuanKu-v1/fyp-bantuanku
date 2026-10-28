import { getJkmEligibilityCriteria, JkmProgramCode } from "../api";
import { EligibilityFacts, EligibilityResult, EligibilityRule } from "../../types/eligibility";
import { EligibilityThresholds } from "../../utils/eligibility/eligibilityConditions";
import { getApplicantEligibilityData } from "./eligibilityDataService";
import { buildEligibilityFacts } from "../../utils/eligibility/eligibilityFacts";
import { adaptJkmEligibilityResponse } from "../../adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../utils/eligibility/eligibilityEngine";

// Complete eligibility assessment output
export interface ApplicantEligibilityAssessment {
  programCode: JkmProgramCode;

  // Government eligibility criteria version
  criteriaVersion: number;

  // Applicant facts used during evaluation
  facts: EligibilityFacts;

  // Government rules converted into BantuanKu's format
  rules: EligibilityRule[];

  // Final preliminary eligibility assessment
  result: EligibilityResult;

  // Timestamp indicating when the assessment was performed
  assessedAt: string;
}

// Options for evaluating dynamic eligibility thresholds
export interface EligibilityAssessmentOptions {
  thresholds?: EligibilityThresholds;
}

// Assess an authenticated applicant's preliminary eligibility
export async function assessApplicantEligibility(
    programCode: JkmProgramCode,
    options: EligibilityAssessmentOptions = {}
): Promise<ApplicantEligibilityAssessment> {
  // 1 - retrieve applicant data and government criteria
  const [applicantData, response] = await Promise.all([
      getApplicantEligibilityData(),
      getJkmEligibilityCriteria(programCode),
  ]);

  // 2 - build eligibility facts from applicant information
  const facts = buildEligibilityFacts(applicantData);

  // 3 - convert JKM eligibility rules into BantuanKu's format
  const rules = adaptJkmEligibilityResponse(response, programCode);

  // 4 - ensure eligibility rules are available
  if (rules.length === 0) {
    throw new Error(
        `No eligibility rules are available for ${programCode}`
    );
  }

  // 5 - evaluate the applicant against the eligibility rules
  const result = evaluateProgramEligibility(
      programCode,
      rules,
      facts,
      options.thresholds ?? {}
  );

  // 6 - return the complete assessment
  return {
    programCode,
    criteriaVersion: response.data.version,
    facts,
    rules,
    result,
    assessedAt: new Date().toISOString(),
  };
}
