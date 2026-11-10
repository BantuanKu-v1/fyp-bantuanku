import { useCallback, useRef, useState } from "react";
import { assessApplicantEligibility, assessAllApplicantEligibility } from "../services/eligibility/eligibility";
import type {
  ApplicantEligibilityAssessment,
  EligibilityAssessmentOptions,
  ProgramEligibilityCheck,
  SupportedProgramCode,
} from "../services/eligibility/eligibility";

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

export function useEligibility(): UseEligibilityReturn {
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

          console.log(
              "[useEligibility] All-program assessment completed:",
              JSON.stringify(
                  results.map((item) => ({
                    programCode: item.programCode,
                    status: item.assessment?.result.status ?? null,
                    error: item.error,
                  })),
                  null,
                  2
              )
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
      []
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
