import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";

import {
  getJkmApplicantReview,
  getJkmExternalSubmissionState,
  submitJkmApplication
} from "../../../services/applications/jkm/jkmApplicationService.ts";

import {
  buildInitialJkmApplicationData,
  getJkmApplicationData,
  saveJkmApplicationData
} from "../../../services/applications/jkm/jkmApplicationDataService";

import {
  getApplicationPreliminaryEligibility,
  persistApplicationEligibilityAssessment
} from "../../../services/applications/applicationEligibilityService";

import {
  getOrCreateJkmApplication
} from "../../../services/applications/applicationServices";

import {
  assessApplicantEligibility
} from "../../../services/eligibility/eligibility";

import type {
  JkmApplicantReview,
  JkmApplicationDraftData,
  JkmProgramCode,
  JkmSubmissionResult
} from "../../../types/applications";

import useApplicationSections from "../../../hooks/applications/useApplicationSections";
import useApplicationSubmission from "../../../hooks/applications/useApplicationSubmission";

import ApplicationScreenLayout from "../../../components/applications/shared/ApplicationScreenLayout.tsx";
import ApplicationSummaryCard from "../../../components/applications/shared/ApplicationSummaryCard.tsx";
import ApplicantInformationSection from "../../../components/applications/shared/ApplicantInformationSection.tsx";
import ApplicationReadinessSection from "../../../components/applications/shared/ApplicationReadinessSection.tsx";
import PreliminaryEligibilitySection from "../../../components/applications/shared/PreliminaryEligibilitySection.tsx";
import ApplicationDetailsSection from "../../../components/applications/shared/ApplicationDetailsSection.tsx";
import SubmissionConfirmationSection from "../../../components/applications/shared/SubmissionConfirmationSection.tsx";
import ApplicationSubmissionActions from "../../../components/applications/shared/ApplicationSubmissionActions.tsx";
import ApplicationDeclaration from "../../../components/applications/shared/ApplicationDeclaration.tsx";

import JkmProgramSpecificSection from "../../../components/applications/jkm/JkmProgramSpecificSection";

import ApplicationAlert from "../../../components/ui/Alert";

import { isExistingSubmission } from "../../../utils/applicationUtils";

interface JkmApplicationScreenProps {
  programCode?: JkmProgramCode;
}

export default function JkmApplicationScreen({
                                               programCode = "BA"
                                             }: JkmApplicationScreenProps) {
  return (
      <JkmApplicationContent
          key={programCode}
          programCode={programCode}
      />
  );
}

function JkmApplicationContent({
                                 programCode
                               }: {
  programCode: JkmProgramCode;
}) {
  const { t } = useTranslation();

  const submission = useApplicationSubmission<JkmSubmissionResult>();

  const sections = useApplicationSections({
    confirmationExpanded: true
  });

  const {
    application,
    setApplication,
    confirmation,
    externalSubmissionState,
    setExternalSubmissionState,
    preliminaryEligibility,
    setPreliminaryEligibility,

    loading,
    setLoading,
    saving,
    setSaving,
    submitting,
    setSubmitting,

    setSubmissionStateVerified,
    error,
    setError,

    operationRef,
    applicationRef,

    alreadySubmitted,
    requiresRecovery,
    applicationLocked,
    canEdit,
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
      useState<JkmApplicantReview | null>(null);

  const [applicationData, setApplicationData] =
      useState<JkmApplicationDraftData | null>(null);

  const [declarationAccepted, setDeclarationAccepted] =
      useState(false);

  const [showProgramSpecificData, setShowProgramSpecificData] =
      useState(true);

  const loadApplication = useCallback(async () => {
    if (operationRef.current) {
      return;
    }

    operationRef.current = true;

    try {
      setLoading(true);
      setError(null);
      setSubmissionStateVerified(false);

      const jkmApplication =
          applicationRef.current ??
          await getOrCreateJkmApplication(programCode);

      applicationRef.current = jkmApplication;

      const [
        applicantReview,
        submissionState,
        eligibilitySnapshot,
        savedApplicationData
      ] = await Promise.all([
        getJkmApplicantReview(
            jkmApplication.profileId,
            programCode
        ),

        getJkmExternalSubmissionState(
            jkmApplication.id
        ),

        getApplicationPreliminaryEligibility(
            jkmApplication.id
        ),

        getJkmApplicationData(
            jkmApplication.id
        )
      ]);

      setApplication(jkmApplication);
      setApplicant(applicantReview);
      setExternalSubmissionState(submissionState);
      setPreliminaryEligibility(eligibilitySnapshot);

      setApplicationData(
          savedApplicationData ??
          buildInitialJkmApplicationData(programCode)
      );

      setDeclarationAccepted(false);
      setSubmissionStateVerified(true);

      if (submissionState === "submitted") {
        const result = await submitJkmApplication(
            jkmApplication.id,
            programCode
        );

        applyConfirmation(result, jkmApplication);
        setShowConfirmationDetails(true);
      }
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : "applications.jkm.messages.loadError"
      );

      setSubmissionStateVerified(false);
    } finally {
      operationRef.current = false;
      setLoading(false);
    }
  }, [
    programCode,
    operationRef,
    applicationRef,
    setLoading,
    setError,
    setSubmissionStateVerified,
    setApplication,
    setExternalSubmissionState,
    setPreliminaryEligibility,
    applyConfirmation,
    setShowConfirmationDetails
  ]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const baData =
      applicationData?.programCode === "BA"
          ? applicationData.programSpecificData
          : null;

  const programSpecificDataComplete =
      !!baData &&
      typeof baData.receivesOtherJkmMonthlyAssistance === "boolean" &&
      (
          baData.receivesOtherJkmMonthlyAssistance
              ? !!baData.currentJkmAssistanceProgram?.trim()
              : !baData.currentJkmAssistanceProgram?.trim()
      ) &&
      (
          baData.additionalCircumstances?.otherCircumstances !== true ||
          !!baData.additionalCircumstances.description?.trim()
      );

  const applicationReady =
      applicant?.profileReady === true &&
      programSpecificDataComplete;

  const canSave =
      canEdit &&
      applicationData?.programCode === "BA";

  const canSubmit = getCanSubmit(
      applicationReady,
      declarationAccepted
  );

  const handleProgramSpecificDataChange = (
      data: JkmApplicationDraftData
  ) => {
    if (
        !canEdit ||
        operationRef.current ||
        data.programCode !== programCode
    ) {
      return;
    }

    setApplicationData(data);
    setDeclarationAccepted(false);
  };

  const refreshSubmissionState = async (
      applicationId: string
  ) => {
    try {
      const submissionState =
          await getJkmExternalSubmissionState(applicationId);

      setExternalSubmissionState(submissionState);
      setSubmissionStateVerified(true);
    } catch {
      setSubmissionStateVerified(false);
    }
  };

  const handleSaveDraft = async () => {
    if (
        !application ||
        !applicationData ||
        !canSave ||
        operationRef.current
    ) {
      return;
    }

    operationRef.current = true;

    try {
      setSaving(true);
      setError(null);

      const submissionState =
          await getJkmExternalSubmissionState(
              application.id
          );

      setExternalSubmissionState(submissionState);
      setSubmissionStateVerified(true);

      if (isExistingSubmission(submissionState)) {
        throw new Error(
            "applications.jkm.messages.applicationLocked"
        );
      }

      const savedData =
          await saveJkmApplicationData(
              application.id,
              applicationData
          );

      setApplicationData(savedData);

      Alert.alert(
          t("applications.jkm.buttons.saveDraft"),
          t("applications.jkm.messages.draftSaved")
      );
    } catch (err) {
      const message =
          err instanceof Error
              ? err.message
              : "applications.jkm.messages.draftSaveError";

      setError(message);

      await refreshSubmissionState(application.id);

      Alert.alert(
          t("applications.jkm.messages.attentionRequired"),
          t(message, { defaultValue: message })
      );
    } finally {
      operationRef.current = false;
      setSaving(false);
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
          await getJkmExternalSubmissionState(
              application.id
          );

      setExternalSubmissionState(submissionState);
      setSubmissionStateVerified(true);

      if (!isExistingSubmission(submissionState)) {
        if (
            !applicationData ||
            !applicationReady ||
            !declarationAccepted ||
            alreadySubmitted ||
            requiresRecovery
        ) {
          throw new Error(
              "applications.jkm.messages.incompleteApplication"
          );
        }

        await saveJkmApplicationData(
            application.id,
            applicationData
        );

        const assessment =
            await assessApplicantEligibility(
                programCode
            );

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
          await submitJkmApplication(
              application.id,
              programCode
          );

      applyConfirmation(result, application);
      setShowConfirmationDetails(true);

      Alert.alert(
          result.alreadySubmitted
              ? t("applications.jkm.messages.alreadySubmittedTitle")
              : t("applications.jkm.messages.successTitle"),

          t("applications.jkm.messages.successDescription", {
            referenceNo: result.referenceNo
          })
      );
    } catch (err) {
      const message =
          err instanceof Error
              ? err.message
              : "applications.jkm.messages.submissionError";

      setError(message);

      await refreshSubmissionState(application.id);

      Alert.alert(
          t("applications.jkm.messages.attentionRequired"),
          t(message, { defaultValue: message })
      );
    } finally {
      operationRef.current = false;
      setSubmitting(false);
    }
  };

  return (
      <ApplicationScreenLayout
          provider="jkm"
          programCode={programCode}
          loading={loading}
          error={error}
          actions={
            <ApplicationSubmissionActions
                provider="jkm"
                mode={mode}
                canSubmit={canSubmit}
                canSave={canSave}
                submitting={submitting}
                refreshing={loading}
                saving={saving}
                onSubmit={handleSubmit}
                onRefresh={loadApplication}
                onSaveDraft={
                  applicationData?.programCode === "BA"
                      ? handleSaveDraft
                      : undefined
                }
            />
          }
      >
        <ApplicationSummaryCard
            provider="jkm"
            application={application}
            confirmation={confirmation}
        />

        <ApplicantInformationSection
            provider="jkm"
            applicant={applicant}
            expanded={showApplicantDetails}
            onExpandedChange={setShowApplicantDetails}
        />

        <ApplicationReadinessSection
            provider="jkm"
            applicant={applicant}
            programSpecificDataComplete={programSpecificDataComplete}
            applicationLocked={applicationLocked}
            expanded={showReadiness}
            onExpandedChange={setShowReadiness}
        />

        {applicationData && (
            <View className="gap-2">
              <JkmProgramSpecificSection
                  data={applicationData}
                  onChange={handleProgramSpecificDataChange}
                  disabled={!canEdit}
                  expanded={showProgramSpecificData}
                  onExpandedChange={setShowProgramSpecificData}
              />

              {applicationLocked && (
                  <Text className="text-xs text-muted-foreground">
                    {t("applications.jkm.messages.applicationLocked")}
                  </Text>
              )}
            </View>
        )}

        {application && (
            <PreliminaryEligibilitySection
                provider="jkm"
                assessment={preliminaryEligibility}
                alreadySubmitted={alreadySubmitted}
                requiresRecovery={requiresRecovery}
                expanded={showPreliminaryEligibility}
                onExpandedChange={setShowPreliminaryEligibility}
            />
        )}

        <ApplicationDetailsSection
            provider="jkm"
            application={application}
            expanded={showApplicationDetails}
            onExpandedChange={setShowApplicationDetails}
        />

        {externalSubmissionState === "pending" && (
            <ApplicationAlert
                variant="warning"
                title={t("applications.jkm.messages.pendingTitle")}
            >
              {t("applications.jkm.messages.pendingDescription")}
            </ApplicationAlert>
        )}

        {externalSubmissionState === "unknown" && (
            <ApplicationAlert
                variant="warning"
                title={t("applications.jkm.messages.unknownTitle")}
            >
              {t("applications.jkm.messages.unknownDescription")}
            </ApplicationAlert>
        )}

        {externalSubmissionState === "failed" && (
            <ApplicationAlert
                variant="error"
                title={t("applications.jkm.messages.failedTitle")}
            >
              {t("applications.jkm.messages.failedDescription")}
            </ApplicationAlert>
        )}

        <SubmissionConfirmationSection
            provider="jkm"
            confirmation={confirmation}
            alreadySubmitted={alreadySubmitted}
            expanded={showConfirmationDetails}
            onExpandedChange={setShowConfirmationDetails}
        />

        {application && !applicationLocked && (
            <View className="gap-2">
              <Text className="text-sm text-muted-foreground">
                {t("applications.jkm.messages.reviewDescription")}
              </Text>

              <ApplicationDeclaration
                  title={t("applications.jkm.sections.applicationReview")}
                  description={t("applications.jkm.messages.declaration")}
                  accepted={declarationAccepted}
                  onChange={setDeclarationAccepted}
                  disabled={!canEdit}
              />
            </View>
        )}

        <ApplicationAlert variant="info">
          {t("applications.jkm.messages.simulationDisclaimer")}
        </ApplicationAlert>
      </ApplicationScreenLayout>
  );
}
