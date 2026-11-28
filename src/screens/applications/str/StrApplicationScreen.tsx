import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import {
  getStrApplicantReview,
  getStrExternalSubmissionState,
  submitStrApplication
} from "../../../services/applications/str/strApplicationService.ts";

import {
  getApplicationPreliminaryEligibility,
  persistApplicationEligibilityAssessment
} from "../../../services/applications/applicationEligibilityService";

import {
  getOrCreateStrApplication
} from "../../../services/applications/applicationServices";

import {
  assessApplicantEligibility
} from "../../../services/eligibility/eligibility";

import type {
  StrApplicantReview,
  StrSubmissionResult
} from "../../../types/applications";

import useApplicationSections from "../../../hooks/applications/useApplicationSections";
import useApplicationSubmission from "../../../hooks/applications/useApplicationSubmission";

import ApplicationScreenLayout from "../../../components/applications/shared/ApplicationScreenLayout";
import ApplicationSummaryCard from "../../../components/applications/shared/ApplicationSummaryCard";
import ApplicantInformationSection from "../../../components/applications/shared/ApplicantInformationSection";
import ApplicationReadinessSection from "../../../components/applications/shared/ApplicationReadinessSection";
import PreliminaryEligibilitySection from "../../../components/applications/shared/PreliminaryEligibilitySection";
import ApplicationDetailsSection from "../../../components/applications/shared/ApplicationDetailsSection";
import SubmissionConfirmationSection from "../../../components/applications/shared/SubmissionConfirmationSection";
import ApplicationSubmissionActions from "../../../components/applications/shared/ApplicationSubmissionActions";

import { isExistingSubmission, isStrApplicantProfileComplete } from "../../../utils/applicationUtils";

export default function StrApplicationScreen() {
  const { t } = useTranslation();

  const submission = useApplicationSubmission<StrSubmissionResult>();

  const sections = useApplicationSections();

  const {
    application,
    setApplication,
    confirmation,
    setExternalSubmissionState,
    preliminaryEligibility,
    setPreliminaryEligibility,

    loading,
    setLoading,
    submitting,
    setSubmitting,

    setSubmissionStateVerified,
    error,
    setError,

    operationRef,
    applicationRef,

    alreadySubmitted,
    requiresRecovery,
    mode,
    getCanSubmit,
    applyConfirmation
  } = submission;

  const {
    showApplicationDetails,
    setShowApplicationDetails,
    showApplicantDetails,
    setShowApplicantDetails,
    showReadiness,
    setShowReadiness,
    showPreliminaryEligibility,
    setShowPreliminaryEligibility,
    showConfirmationDetails,
    setShowConfirmationDetails
  } = sections;

  const [applicant, setApplicant] =
      useState<StrApplicantReview | null>(null);

  const loadApplication = useCallback(async () => {
    if (operationRef.current) {
      return;
    }

    operationRef.current = true;

    try {
      setLoading(true);
      setError(null);
      setSubmissionStateVerified(false);

      const strApplication =
          applicationRef.current ??
          await getOrCreateStrApplication();

      const [
        applicantReview,
        submissionState,
        eligibilitySnapshot
      ] = await Promise.all([
        getStrApplicantReview(
            strApplication.profileId
        ),

        getStrExternalSubmissionState(
            strApplication.id
        ),

        getApplicationPreliminaryEligibility(
            strApplication.id
        )
      ]);

      applicationRef.current = strApplication;

      setApplication(strApplication);
      setApplicant(applicantReview);
      setExternalSubmissionState(submissionState);
      setPreliminaryEligibility(eligibilitySnapshot);
      setSubmissionStateVerified(true);
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : "applications.str.messages.loadError"
      );

      setSubmissionStateVerified(false);
    } finally {
      operationRef.current = false;
      setLoading(false);
    }
  }, [
    operationRef,
    applicationRef,
    setLoading,
    setError,
    setSubmissionStateVerified,
    setApplication,
    setExternalSubmissionState,
    setPreliminaryEligibility
  ]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const profileComplete = isStrApplicantProfileComplete(applicant);

  const applicationReady =
      profileComplete &&
      applicant?.addressComplete === true && applicant?.householdComplete && applicant?.householdMembersComplete;

  const canSubmit = getCanSubmit(applicationReady);

  const refreshSubmissionState = async (
      applicationId: string
  ) => {
    try {
      const submissionState = await getStrExternalSubmissionState(applicationId);

      setExternalSubmissionState(submissionState);
      setSubmissionStateVerified(true);
    } catch {
      setSubmissionStateVerified(false);
    }
  };

  const handleSubmit = async () => {
    if (
        !application ||
        !canSubmit ||
        operationRef.current
    ) {
      return;
    }

    operationRef.current = true;

    try {
      setSubmitting(true);
      setError(null);

      const submissionState =
          await getStrExternalSubmissionState(
              application.id
          );

      setExternalSubmissionState(submissionState);
      setSubmissionStateVerified(true);

      if (!isExistingSubmission(submissionState)) {
        if (
            !applicationReady ||
            alreadySubmitted ||
            requiresRecovery
        ) {
          throw new Error(
              "This application is not ready for submission."
          );
        }

        const assessment =
            await assessApplicantEligibility("STR");

        const snapshot =
            await persistApplicationEligibilityAssessment(
                application.id,
                assessment
            );

        setPreliminaryEligibility(snapshot);
        setShowPreliminaryEligibility(true);
      } else {
        const snapshot =
            await getApplicationPreliminaryEligibility(
                application.id
            );

        setPreliminaryEligibility(snapshot);
      }

      const result =
          await submitStrApplication(
              application.id
          );

      applyConfirmation(result, application);
      setShowConfirmationDetails(true);

      Alert.alert(
          t("applications.str.messages.successTitle"),
          t("applications.str.messages.successDescription", {
            referenceNo: result.referenceNo
          })
      );
    } catch (err) {
      const message =
          err instanceof Error
              ? err.message
              : "applications.str.messages.submissionError";

      const translatedMessage = t(message, {
        defaultValue: message
      });

      setError(translatedMessage);

      await refreshSubmissionState(application.id);

      Alert.alert(
          t("applications.str.messages.submissionError"),
          translatedMessage
      );
    } finally {
      operationRef.current = false;
      setSubmitting(false);
    }
  };

  return (
      <ApplicationScreenLayout
          provider="str"
          loading={loading}
          error={error}
          actions={
            <ApplicationSubmissionActions
                provider="str"
                mode={mode}
                canSubmit={canSubmit}
                submitting={submitting}
                refreshing={loading}
                onSubmit={handleSubmit}
                onRefresh={loadApplication}
            />
          }
      >
        <ApplicationSummaryCard
            provider="str"
            application={application}
        />

        <ApplicantInformationSection
            provider="str"
            applicant={applicant}
            expanded={showApplicantDetails}
            onExpandedChange={setShowApplicantDetails}
        />

        <ApplicationReadinessSection
            provider="str"
            applicant={applicant}
            expanded={showReadiness}
            onExpandedChange={setShowReadiness}
        />

        {application && (
            <PreliminaryEligibilitySection
                provider="str"
                assessment={preliminaryEligibility}
                alreadySubmitted={alreadySubmitted}
                requiresRecovery={requiresRecovery}
                expanded={showPreliminaryEligibility}
                onExpandedChange={setShowPreliminaryEligibility}
            />
        )}

        <ApplicationDetailsSection
            provider="str"
            application={application}
            expanded={showApplicationDetails}
            onExpandedChange={setShowApplicationDetails}
        />

        <SubmissionConfirmationSection
            provider="str"
            confirmation={confirmation}
            alreadySubmitted={alreadySubmitted}
            expanded={showConfirmationDetails}
            onExpandedChange={setShowConfirmationDetails}
        />
      </ApplicationScreenLayout>
  );
}
