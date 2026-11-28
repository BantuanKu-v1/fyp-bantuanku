import { useCallback, useRef, useState } from "react";

import type {
  ApplicationSummary,
  ExternalSubmissionState,
  JkmSubmissionResult,
  StrSubmissionResult,
} from "../../types/applications.ts";

import type {
  PreliminaryEligibilitySnapshot,
} from "../../types/eligibility.ts";

import {
  isApplicationSubmitted,
  isExistingSubmission,
  getApplicationSubmissionActionMode,
  canSubmitApplication,
} from "../../utils/applicationUtils.ts";

type ApplicationSubmissionResult =
    | JkmSubmissionResult
    | StrSubmissionResult;

export default function useApplicationSubmission<
    TConfirmation extends ApplicationSubmissionResult
>() {
  const [application, setApplication] = useState<ApplicationSummary | null>(null);

  const [confirmation, setConfirmation] = useState<TConfirmation | null>(null);

  const [externalSubmissionState, setExternalSubmissionState] = useState<ExternalSubmissionState | null>(null);
  const [preliminaryEligibility, setPreliminaryEligibility] = useState<PreliminaryEligibilitySnapshot | null>(null);

  const [submissionStateVerified, setSubmissionStateVerified] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const operationRef = useRef(false);
  const applicationRef = useRef<ApplicationSummary | null>(null);

  const busy = loading || submitting || saving;

  const alreadySubmitted = isApplicationSubmitted(
      application?.status,
      externalSubmissionState
  );

  const requiresRecovery = isExistingSubmission(
      externalSubmissionState
  );

  const applicationLocked =
      !submissionStateVerified ||
      requiresRecovery ||
      alreadySubmitted;

  const canEdit =
      !!application &&
      !applicationLocked &&
      !busy;

  const mode = getApplicationSubmissionActionMode(
      alreadySubmitted,
      requiresRecovery,
      !!confirmation
  );

  const getCanSubmit = (
      applicationReady: boolean,
      declarationAccepted = true
  ): boolean => {
    return canSubmitApplication({
      hasApplication: !!application,
      submissionStateVerified,
      busy,
      requiresRecovery,
      alreadySubmitted,
      hasConfirmation: !!confirmation,
      applicationReady,
      declarationAccepted,
    });
  };

  const applyConfirmation = useCallback((
      result: TConfirmation,
      currentApplication: ApplicationSummary
  ) => {
    setConfirmation(result);
    setExternalSubmissionState("submitted");

    const updatedApplication: ApplicationSummary = {
      ...currentApplication,
      status: "simulated_submitted",
      simulatedSubmittedAt: result.submittedAt,
    };

    applicationRef.current = updatedApplication;
    setApplication(updatedApplication);
  }, []);

  return {
    application,
    setApplication,

    confirmation,
    setConfirmation,

    externalSubmissionState,
    setExternalSubmissionState,

    preliminaryEligibility,
    setPreliminaryEligibility,

    submissionStateVerified,
    setSubmissionStateVerified,

    loading,
    setLoading,

    submitting,
    setSubmitting,

    saving,
    setSaving,

    error,
    setError,

    operationRef,
    applicationRef,

    busy,
    alreadySubmitted,
    requiresRecovery,
    applicationLocked,
    canEdit,
    mode,

    getCanSubmit,
    applyConfirmation,
  };
}
