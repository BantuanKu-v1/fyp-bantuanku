import { getJkmEligibilityCriteria, getStrEligibilityCriteria } from "../api";
import { EligibilityFacts, EligibilityResult, EligibilityRule } from "../../types/eligibility";
import { EligibilityThresholds } from "../../utils/eligibility/eligibilityConditions";
import { getApplicantEligibilityData } from "./eligibilityDataService";
import { buildEligibilityFacts } from "../../utils/eligibility/eligibilityFacts";
import { adaptJkmEligibilityResponse } from "../../adapters/jkmEligibilityAdapter";
import { evaluateProgramEligibility } from "../../utils/eligibility/eligibilityEngine";
import { adaptStrEligibilityResponse } from "../../adapters/strEligibilityAdapter";

import type { JkmProgramCode } from "../api";

// Complete eligibility assessment output
export interface ApplicantEligibilityAssessment {
  programCode: JkmProgramCode | "STR";

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
    programCode: JkmProgramCode | "STR",
    options: EligibilityAssessmentOptions = {}
): Promise<ApplicantEligibilityAssessment> {
  const applicantData = await getApplicantEligibilityData();
  const facts = buildEligibilityFacts(applicantData);

  let rules: EligibilityRule[];
  let criteriaVersion: number;

  if (programCode === "STR") {
    const response = await getStrEligibilityCriteria();

    rules = adaptStrEligibilityResponse(response);
    criteriaVersion = response.data.version;
  } else {
    const response = await getJkmEligibilityCriteria(programCode);

    rules = adaptJkmEligibilityResponse(response, programCode);
    criteriaVersion = response.data.version;
  }

  // Ensure eligibility rules are available
  if (rules.length === 0) {
    throw new Error(`No eligibility rules are available for ${programCode}`);
  }

  // Evaluate the applicant against the eligibility rules
  const result = evaluateProgramEligibility(
      programCode,
      rules,
      facts,
      options.thresholds ?? {}
  );

  return {
    programCode,
    criteriaVersion,
    facts,
    rules,
    result,
    assessedAt: new Date().toISOString(),
  };
}
