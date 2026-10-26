import { useCallback, useRef, useState } from "react";
import { assessApplicantEligibility, ApplicantEligibilityAssessment, EligibilityAssessmentOptions } from "../services/eligibility/eligibility";
import { JkmProgramCode } from "../services/api";

interface UseEligibilityReturn {
  assessment: ApplicantEligibilityAssessment | null;
  loading: boolean;
  error: string | null;

  assessEligibility: (
      programCode: JkmProgramCode,
      options?: EligibilityAssessmentOptions
  ) => Promise<ApplicantEligibilityAssessment | null>;

  resetEligibility: () => void;
}

export function useEligibility(): UseEligibilityReturn {
  const [assessment, setAssessment] = useState<ApplicantEligibilityAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent older requests from overwriting newer results
  const requestIdRef = useRef(0);

  const assessEligibility = useCallback(
      async (
          programCode: JkmProgramCode,
          options: EligibilityAssessmentOptions = {}
      ): Promise<ApplicantEligibilityAssessment | null> => {
        const requestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);
        setAssessment(null);

        try {
          const result = await assessApplicantEligibility(
              programCode,
              options
          );

          // Ignore results from outdated requests
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
              "[useEligibility] Assessment failed:",
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
    setError(null);
    setLoading(false);
  }, []);

  return {
    assessment,
    loading,
    error,
    assessEligibility,
    resetEligibility,
  };
}
