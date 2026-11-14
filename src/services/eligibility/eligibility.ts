import { getJkmEligibilityCriteria, getStrEligibilityCriteria } from "../api";
import type { JkmProgramCode } from "../api";
import type { EligibilityFacts, EligibilityResult, EligibilityRule } from "../../types/eligibility";
import type { EligibilityThresholds } from "../../utils/eligibility/eligibilityThresholds";
import { getApplicantEligibilityData, ProgramEligibilityAnswers } from "./eligibilityDataService";
import { buildEligibilityFacts } from "../../utils/eligibility/eligibilityFacts";
import { adaptJkmEligibilityResponse } from "../../adapters/jkmEligibilityAdapter";
import { adaptStrEligibilityResponse } from "../../adapters/strEligibilityAdapter";
import { evaluateProgramEligibility } from "../../utils/eligibility/eligibilityEngine";
import { DEFAULT_ELIGIBILITY_THRESHOLDS } from "../../constants/eligibilityPgk";

export type SupportedProgramCode = JkmProgramCode | "STR";

export const ELIGIBILITY_PROGRAM_CODES: readonly SupportedProgramCode[] = [
  "BWE",
  "BA",
  "BAT",
  "BPT",
  "STR",
];

const STR_SCHEME_YEAR = 2026;

// Complete eligibility assessment output
export interface ApplicantEligibilityAssessment {
  programCode: SupportedProgramCode;
  criteriaVersion: number;
  facts: EligibilityFacts;
  rules: EligibilityRule[];
  result: EligibilityResult;
  assessedAt: string;
}

// Options for evaluating dynamic eligibility thresholds
export interface EligibilityAssessmentOptions {
  thresholds?: EligibilityThresholds;
  answers?: ProgramEligibilityAnswers;
}

// Result for each program, including individual failures
export interface ProgramEligibilityCheck {
  programCode: SupportedProgramCode;
  assessment: ApplicantEligibilityAssessment | null;
  error: string | null;
}

// Evaluate a program using already prepared applicant facts
async function evaluateApplicantProgram(
    programCode: SupportedProgramCode,
    facts: EligibilityFacts,
    options: EligibilityAssessmentOptions = {}
): Promise<ApplicantEligibilityAssessment> {
  let rules: EligibilityRule[];
  let criteriaVersion: number;

  if (programCode === "STR") {
    const response = await getStrEligibilityCriteria(
        STR_SCHEME_YEAR
    );

    rules = adaptStrEligibilityResponse(response);
    criteriaVersion = response.data.version;
  } else {
    const response = await getJkmEligibilityCriteria(
        programCode
    );

    rules = adaptJkmEligibilityResponse(
        response,
        programCode
    );

    criteriaVersion = response.data.version;
  }

  if (!Array.isArray(rules) || rules.length === 0) {
    throw new Error(
        `No eligibility rules are available for ${programCode}`
    );
  }

  const result = evaluateProgramEligibility(
      programCode,
      rules,
      facts,
      {
        ...DEFAULT_ELIGIBILITY_THRESHOLDS,
        ...options.thresholds,
      }
  );

  if (programCode === "BAT" || programCode === "BPT") {
    console.log(`[Eligibility] ${programCode} facts:`, facts);
    console.log(`[Eligibility] ${programCode} rules:`, rules);
    console.log(`[Eligibility] ${programCode} result:`, result);
  }

  return {
    programCode,
    criteriaVersion,
    facts,
    rules,
    result,
    assessedAt: new Date().toISOString(),
  };
}

// Assess one program
export async function assessApplicantEligibility(
    programCode: SupportedProgramCode,
    options: EligibilityAssessmentOptions = {}
): Promise<ApplicantEligibilityAssessment> {
  const applicantData = await getApplicantEligibilityData(
      options.answers ?? {}
  );

  const facts = buildEligibilityFacts(applicantData);

  return evaluateApplicantProgram(
      programCode,
      facts,
      options
  );
}

// Assess all five programs using one applicant data snapshot
export async function assessAllApplicantEligibility(
    options: EligibilityAssessmentOptions = {}
): Promise<ProgramEligibilityCheck[]> {
  const applicantData = await getApplicantEligibilityData(
      options.answers ?? {}
  );

  const facts = buildEligibilityFacts(applicantData);

  const settledResults = await Promise.allSettled(
      ELIGIBILITY_PROGRAM_CODES.map((programCode) =>
          evaluateApplicantProgram(
              programCode,
              facts,
              options
          )
      )
  );

  return settledResults.map((settled, index) => {
    const programCode = ELIGIBILITY_PROGRAM_CODES[index];

    if (settled.status === "fulfilled") {
      return {
        programCode,
        assessment: settled.value,
        error: null,
      };
    }

    console.error(
        `[Eligibility] ${programCode} assessment failed:`,
        settled.reason
    );

    return {
      programCode,
      assessment: null,
      error:
          settled.reason instanceof Error
              ? settled.reason.message
              : "Unable to assess this program.",
    };
  });
}
