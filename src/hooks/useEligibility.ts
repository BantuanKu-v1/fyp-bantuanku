import { useCallback, useRef, useState } from "react";
import { assessApplicantEligibility, assessAllApplicantEligibility } from "../services/eligibility/eligibility";
import type {
  ApplicantEligibilityAssessment,
  EligibilityAssessmentOptions,
  ProgramEligibilityCheck,
  SupportedProgramCode,
} from "../services/eligibility/eligibility";
import { logEligibilityTestReport } from "../utils/eligibility/eligibilityTestLogger";

interface UseEligibilityReturn {
  assessment: ApplicantEligibilityAssessment | null;
  assessments: ProgramEligibilityCheck[];
  loading: boolean;
  error: string | null;

  assessEligibility: (
      programCode: SupportedProgramCode,
      options?: EligibilityAssessmentOptions
  ) => Promise<ApplicantEligibilityAssessment | null>;

  assessAllEligibility: (
      options?: EligibilityAssessmentOptions
  ) => Promise<ProgramEligibilityCheck[] | null>;

  resetEligibility: () => void;
}

export function useEligibility(
    testAccountId = "Unspecified"
): UseEligibilityReturn {
  const [assessment, setAssessment] =
      useState<ApplicantEligibilityAssessment | null>(null);

  const [assessments, setAssessments] =
      useState<ProgramEligibilityCheck[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent outdated requests from overwriting newer results
  const requestIdRef = useRef(0);

  const assessEligibility = useCallback(
      async (
          programCode: SupportedProgramCode,
          options: EligibilityAssessmentOptions = {}
      ): Promise<ApplicantEligibilityAssessment | null> => {
        const requestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);
        setAssessment(null);
        setAssessments([]);

        try {
          const result = await assessApplicantEligibility(
              programCode,
              options
          );

          // Ignore outdated requests
          if (requestId !== requestIdRef.current) {
            return null;
          }

          setAssessment(result);

          return result;
        } catch (err) {
          if (requestId !== requestIdRef.current) {
            return null;
          }

          const message =
              err instanceof Error
                  ? err.message
                  : "Unable to assess eligibility. Please try again.";

          console.error(
              "[useEligibility] Single-program assessment failed:",
              err
          );

          setError(message);

          return null;
        } finally {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      },
      []
  );

  const assessAllEligibility = useCallback(
      async (
          options: EligibilityAssessmentOptions = {}
      ): Promise<ProgramEligibilityCheck[] | null> => {
        const requestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);
        setAssessment(null);
        setAssessments([]);

        try {
          const results = await assessAllApplicantEligibility(
              options
          );

          // Ignore outdated requests
          if (requestId !== requestIdRef.current) {
            return null;
          }

          setAssessments(results);

          logEligibilityTestReport(
              testAccountId,
              results.map((item) => ({
                programCode: item.programCode,
                status: item.assessment?.result.status ?? null,
                error: item.error
                    ? String(item.error)
                    : null,
                matchedRuleIds:
                item.assessment?.result.matchedRuleIds,
                missingInformation:
                item.assessment?.result.missingInformation,
                unmetConditions:
                item.assessment?.result.unmetConditions,
              }))
          );

          return results;
        } catch (err) {
          if (requestId !== requestIdRef.current) {
            return null;
          }

          const message =
              err instanceof Error
                  ? err.message
                  : "Unable to check program eligibility. Please try again.";

          console.error(
              "[useEligibility] All-program assessment failed:",
              err
          );

          setError(message);

          return null;
        } finally {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      },
      [testAccountId]
  );

  const resetEligibility = useCallback(() => {
    // Invalidate any assessment currently in progress
    requestIdRef.current += 1;

    setAssessment(null);
    setAssessments([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    assessment,
    assessments,
    loading,
    error,
    assessEligibility,
    assessAllEligibility,
    resetEligibility,
  };
}
