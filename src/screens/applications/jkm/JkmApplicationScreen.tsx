import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import Screen from "../../../components/layout/Screen";
import ScreenHeader from "../../../components/layout/ScreenHeader";

import {
  getJkmApplicantReview,
  getJkmExternalSubmissionState,
  submitJkmApplication,
} from "../../../services/applications/jkm/jkmApplicationService.ts";

import type {
  JkmExternalSubmissionState,
} from "../../../services/applications/jkm/jkmApplicationService.ts";

import {
  buildInitialJkmApplicationData,
  getJkmApplicationData,
  saveJkmApplicationData,
} from "../../../services/applications/jkm/jkmApplicationDataService";

import {
  getApplicationPreliminaryEligibility,
  persistApplicationEligibilityAssessment,
} from "../../../services/applications/applicationEligibilityService";

import {
  getOrCreateJkmApplication,
} from "../../../services/applications/applicationServices";

import {
  assessApplicantEligibility,
} from "../../../services/eligibility/eligibility";

import type {
  PreliminaryEligibilitySnapshot,
} from "../../../types/eligibility";

import {
  APPLICATION_STATUS_LABELS,
} from "../../../constants/applications/applications";

import {
  JKM_APPLICATION_LABELS,
} from "../../../constants/applications/jkmApplication";

import type {
  ApplicationSummary,
  JkmApplicantReview,
  JkmApplicationDraftData,
  JkmProgramCode,
  JkmSubmissionResult,
} from "../../../types/applications";

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("en-MY");
}

function isExistingSubmission(
    state: JkmExternalSubmissionState | null
): boolean {
  return (
      state === "pending" ||
      state === "unknown" ||
      state === "submitted"
  );
}

interface DetailRowProps {
  label: string;
  value: string | null;
  fallback: string;
}

function DetailRow({
  label,
  value,
  fallback
}: DetailRowProps) {
  return (
      <View className="flex-row items-start justify-between gap-4 py-2">
        <Text className="max-w-[42%] text-xs text-gray-500">
          {label}
        </Text>

        <Text
            className="flex-1 text-right text-sm font-medium text-gray-900"
            selectable
        >
          {value || fallback}
        </Text>
      </View>
  );
}

interface ReadinessRowProps {
  label: string;
  complete: boolean;
  completeLabel: string;
  incompleteLabel: string;
  notRequired?: boolean;
  notRequiredLabel?: string;
}

function ReadinessRow({
    label,
    complete,
    completeLabel,
    incompleteLabel,
    notRequired = false,
    notRequiredLabel
}: ReadinessRowProps) {
  return (
      <View className="flex-row items-center gap-3 py-2">
        <View
            className={
              notRequired
                  ? "h-6 w-6 items-center justify-center rounded-full bg-gray-100"
                  : complete
                      ? "h-6 w-6 items-center justify-center rounded-full bg-green-100"
                      : "h-6 w-6 items-center justify-center rounded-full bg-amber-100"
            }
        >
          <Text
              className={
                notRequired
                    ? "text-xs font-bold text-gray-500"
                    : complete
                        ? "text-xs font-bold text-green-700"
                        : "text-xs font-bold text-amber-700"
              }
          >
            {notRequired ? "−" : complete ? "✓" : "!"}
          </Text>
        </View>

        <Text className="flex-1 text-sm text-gray-700">
          {label}
        </Text>

        <Text
            className={
              notRequired
                  ? "text-xs font-medium text-gray-500"
                  : complete
                      ? "text-xs font-medium text-green-700"
                      : "text-xs font-medium text-amber-700"
            }
        >
          {notRequired
              ? notRequiredLabel
              : complete
                  ? completeLabel
                  : incompleteLabel}
        </Text>
      </View>
  );
}

interface SectionHeaderProps {
  title: string;
  expanded: boolean;
  onPress: () => void;
}

function SectionHeader({
    title,
    expanded,
    onPress
}: SectionHeaderProps) {
  return (
      <Pressable
          className="flex-row items-center justify-between gap-3 py-1"
          onPress={onPress}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
      >
        <Text className="flex-1 text-base font-bold text-gray-900">
          {title}
        </Text>

        <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <Text className="text-base font-semibold text-gray-600">
            {expanded ? "−" : "+"}
          </Text>
        </View>
      </Pressable>
  );
}

interface BooleanFieldProps {
  label: string;
  value: boolean | null | undefined;
  yesLabel: string;
  noLabel: string;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

function BooleanField({
  label,
  value,
  yesLabel,
  noLabel,
  disabled,
  onChange
}: BooleanFieldProps) {
  return (
      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">
          {label}
        </Text>

        <View className="flex-row gap-2">
          {[true, false].map((option) => (
              <Pressable
                  key={String(option)}
                  className={
                    value === option
                        ? "flex-1 items-center rounded-xl border border-blue-600 bg-blue-50 px-3 py-3"
                        : "flex-1 items-center rounded-xl border border-gray-200 bg-white px-3 py-3"
                  }
                  onPress={() => onChange(option)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: value === option,
                    disabled,
                  }}
              >
                <Text
                    className={
                      value === option
                          ? "text-sm font-semibold text-blue-700"
                          : "text-sm text-gray-600"
                    }
                >
                  {option ? yesLabel : noLabel}
                </Text>
              </Pressable>
          ))}
        </View>
      </View>
  );
}

interface JkmApplicationScreenProps {
  programCode?: JkmProgramCode;
}

export default function JkmApplicationScreen({
  programCode = "BA",
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

  const labels = JKM_APPLICATION_LABELS;
  const baLabels = labels.programs.ba;

  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [applicant, setApplicant] = useState<JkmApplicantReview | null>(null);
  const [applicationData, setApplicationData] = useState<JkmApplicationDraftData | null>(null);
  const [confirmation, setConfirmation] = useState<JkmSubmissionResult | null>(null);
  const [externalSubmissionState, setExternalSubmissionState] = useState<JkmExternalSubmissionState | null>(null);
  const [preliminaryEligibility, setPreliminaryEligibility] = useState<PreliminaryEligibilitySnapshot | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStateVerified, setSubmissionStateVerified] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [showApplicantDetails, setShowApplicantDetails] = useState(false);
  const [showReadiness, setShowReadiness] = useState(true);
  const [showProgramSpecificData, setShowProgramSpecificData] = useState(true);
  const [showPreliminaryEligibility, setShowPreliminaryEligibility] = useState(false);
  const [showConfirmationDetails, setShowConfirmationDetails] = useState(true);

  const operationRef = useRef(false);
  const applicationRef = useRef<ApplicationSummary | null>(null);

  const applyConfirmation = useCallback((
      result: JkmSubmissionResult,
      currentApplication: ApplicationSummary,
  ) => {
    setConfirmation(result);
    setExternalSubmissionState("submitted");
    setShowConfirmationDetails(true);

    const updatedApplication: ApplicationSummary = {
      ...currentApplication,
      status: "simulated_submitted",
      simulatedSubmittedAt: result.submittedAt,
    };

    applicationRef.current = updatedApplication;

    setApplication(updatedApplication);
  }, []);

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
        savedApplicationData,
      ] = await Promise.all([
        getJkmApplicantReview(
            jkmApplication.profileId,
            programCode,
        ),

        getJkmExternalSubmissionState(
            jkmApplication.id,
        ),

        getApplicationPreliminaryEligibility(
            jkmApplication.id,
        ),

        getJkmApplicationData(
            jkmApplication.id,
        ),
      ]);

      setApplication(jkmApplication);
      setApplicant(applicantReview);
      setExternalSubmissionState(submissionState);
      setPreliminaryEligibility(eligibilitySnapshot);

      setApplicationData(
          savedApplicationData ??
          buildInitialJkmApplicationData(programCode),
      );

      setDeclarationAccepted(false);
      setSubmissionStateVerified(true);

      if (submissionState === "submitted") {
        const result = await submitJkmApplication(
            jkmApplication.id,
            programCode,
        );

        applyConfirmation(result, jkmApplication);
      }
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : labels.messages.loadError,
      );

      setSubmissionStateVerified(false);
    } finally {
      operationRef.current = false;
      setLoading(false);
    }
  }, [
    programCode,
    applyConfirmation,
    labels.messages.loadError,
  ]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const alreadySubmitted =
      application?.status === "simulated_submitted" ||
      externalSubmissionState === "submitted";

  const requiresRecovery =
      isExistingSubmission(externalSubmissionState);

  const applicationLocked =
      !submissionStateVerified ||
      requiresRecovery ||
      alreadySubmitted;

  const busy = loading || saving || submitting;

  const canEdit =
      !!application &&
      !applicationLocked &&
      !busy;

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

  const canSubmit =
      !!application &&
      submissionStateVerified &&
      !busy &&
      (
          requiresRecovery
              ? true
              : !alreadySubmitted &&
              applicationReady &&
              declarationAccepted
      );

  const readinessChecks = applicant
      ? [
        applicant.profileComplete,
        applicant.addressComplete,
        ...(applicant.householdRequired
            ? [
              applicant.householdComplete,
              applicant.householdMembersComplete,
            ]
            : []),
        programSpecificDataComplete,
      ]
      : [];

  const completedChecks =
      readinessChecks.filter(Boolean).length;

  const totalChecks = readinessChecks.length;

  const updateBaAssistance = (value: boolean) => {
    if (!canEdit) {
      return;
    }

    setApplicationData((current) => {
      if (current?.programCode !== "BA") {
        return current;
      }

      return {
        ...current,
        programSpecificData: {
          ...current.programSpecificData,
          receivesOtherJkmMonthlyAssistance: value,
          currentJkmAssistanceProgram: value
              ? current.programSpecificData.currentJkmAssistanceProgram
              : null,
        },
      };
    });

    setDeclarationAccepted(false);
  };

  const updateBaCurrentProgram = (value: string) => {
    if (!canEdit) {
      return;
    }

    setApplicationData((current) => {
      if (current?.programCode !== "BA") {
        return current;
      }

      return {
        ...current,
        programSpecificData: {
          ...current.programSpecificData,
          currentJkmAssistanceProgram: value,
        },
      };
    });

    setDeclarationAccepted(false);
  };

  const updateBaCircumstance = (
      field:
          | "economicHardship"
          | "healthRelatedNeeds"
          | "dependentRelatedNeeds"
          | "otherCircumstances",
      value: boolean,
  ) => {
    if (!canEdit) {
      return;
    }

    setApplicationData((current) => {
      if (current?.programCode !== "BA") {
        return current;
      }

      return {
        ...current,
        programSpecificData: {
          ...current.programSpecificData,
          additionalCircumstances: {
            ...current.programSpecificData.additionalCircumstances,
            [field]: value,
          },
        },
      };
    });

    setDeclarationAccepted(false);
  };

  const updateBaCircumstancesDescription = (
      value: string,
  ) => {
    if (!canEdit) {
      return;
    }

    setApplicationData((current) => {
      if (current?.programCode !== "BA") {
        return current;
      }

      return {
        ...current,
        programSpecificData: {
          ...current.programSpecificData,
          additionalCircumstances: {
            ...current.programSpecificData.additionalCircumstances,
            description: value,
          },
        },
      };
    });

    setDeclarationAccepted(false);
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
              application.id,
          );

      setExternalSubmissionState(submissionState);
      setSubmissionStateVerified(true);

      if (isExistingSubmission(submissionState)) {
        throw new Error(
            labels.messages.applicationLocked,
        );
      }

      const savedData =
          await saveJkmApplicationData(
              application.id,
              applicationData,
          );

      setApplicationData(savedData);

      Alert.alert(
          t(labels.buttons.saveDraft),
          t(labels.messages.draftSaved),
      );
    } catch (err) {
      const message =
          err instanceof Error
              ? err.message
              : labels.messages.draftSaveError;

      setError(message);

      try {
        const submissionState =
            await getJkmExternalSubmissionState(
                application.id,
            );

        setExternalSubmissionState(submissionState);
        setSubmissionStateVerified(true);
      } catch {
        setSubmissionStateVerified(false);
      }

      Alert.alert(
          t(labels.messages.attentionRequired),
          t(message, { defaultValue: message }),
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
              application.id,
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
              labels.messages.incompleteApplication,
          );
        }

        await saveJkmApplicationData(
            application.id,
            applicationData,
        );

        const assessment =
            await assessApplicantEligibility(
                programCode,
            );

        const snapshot =
            await persistApplicationEligibilityAssessment(
                application.id,
                assessment,
            );

        setPreliminaryEligibility(snapshot);
        setShowPreliminaryEligibility(true);
      } else {
        const snapshot =
            await getApplicationPreliminaryEligibility(
                application.id,
            );

        setPreliminaryEligibility(snapshot);
      }

      const result =
          await submitJkmApplication(
              application.id,
              programCode,
          );

      applyConfirmation(result, application);

      Alert.alert(
          t(
              result.alreadySubmitted
                  ? labels.messages.alreadySubmittedTitle
                  : labels.messages.successTitle,
          ),
          t(labels.messages.successDescription, {
            referenceNo: result.referenceNo,
          }),
      );
    } catch (err) {
      const message =
          err instanceof Error
              ? err.message
              : labels.messages.submissionError;

      setError(message);

      try {
        const submissionState =
            await getJkmExternalSubmissionState(
                application.id,
            );

        setExternalSubmissionState(submissionState);
        setSubmissionStateVerified(true);
      } catch {
        setSubmissionStateVerified(false);
      }

      Alert.alert(
          t(labels.messages.attentionRequired),
          t(message, { defaultValue: message }),
      );
    } finally {
      operationRef.current = false;
      setSubmitting(false);
    }
  };

  const confirmSubmission = () => {
    if (!canSubmit) {
      return;
    }

    if (requiresRecovery) {
      void handleSubmit();
      return;
    }

    Alert.alert(
        t(labels.messages.confirmTitle),
        t(labels.messages.confirmDescription),
        [
          {
            text: t(labels.buttons.cancel),
            style: "cancel",
          },
          {
            text: t(labels.buttons.confirm),
            onPress: () => {
              void handleSubmit();
            },
          },
        ],
    );
  };

  const fallback = t(labels.messages.notProvided);

  const eligibilityStatusLabel =
      preliminaryEligibility
          ? t(
              `applications.eligibility.statuses.${preliminaryEligibility.status}`,
              {
                defaultValue: preliminaryEligibility.status
                    .split("_")
                    .map(
                        (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1),
                    )
                    .join(" "),
              },
          )
          : null;

  const providerStatusLabel =
      confirmation
          ? t(
              `applications.statuses.${confirmation.providerStatus}`,
              {
                defaultValue: confirmation.providerStatus
                    .split("_")
                    .map(
                        (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1),
                    )
                    .join(" "),
              },
          )
          : null;

  if (loading) {
    return (
        <Screen>
          <ScreenHeader
              title={t(labels.title, { programCode })}
              description={t(labels.description)}
          />

          <View className="flex-1 items-center justify-center gap-3 px-6 py-12">
            <ActivityIndicator
                size="large"
                color="#2563EB"
            />

            <Text className="text-center text-sm text-gray-500">
              {t(labels.messages.loading)}
            </Text>
          </View>
        </Screen>
    );
  }

  return (
      <Screen>
        <ScreenHeader
            title={t(labels.title, { programCode })}
            description={t(labels.description)}
        />

        <ScrollView
            className="flex-1"
            contentContainerClassName="gap-3 px-4 pb-6 pt-3"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          {error && (
              <View className="gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
                <Text className="text-sm font-bold text-red-800">
                  {t(labels.messages.attentionRequired)}
                </Text>

                <Text className="text-sm leading-5 text-red-700">
                  {t(error, { defaultValue: error })}
                </Text>
              </View>
          )}

          {application && (
              <View className="gap-3 rounded-2xl bg-blue-600 p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-xs font-medium text-blue-100">
                      {application.agency}
                    </Text>

                    <Text className="text-xl font-bold text-white">
                      {application.programName}
                    </Text>
                  </View>

                  <View className="max-w-[45%] rounded-full bg-white/20 px-3 py-1.5">
                    <Text className="text-center text-xs font-semibold text-white">
                      {providerStatusLabel ??
                          t(APPLICATION_STATUS_LABELS[application.status])}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-white/20" />

                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-xs text-blue-100">
                    {t(labels.fields.applicationId)}
                  </Text>

                  <Text
                      className="max-w-[65%] text-right text-xs font-medium text-white"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      selectable
                  >
                    {application.id}
                  </Text>
                </View>
              </View>
          )}

          {applicant && (
              <View className="rounded-2xl border border-gray-200 bg-white p-4">
                <SectionHeader
                    title={t(labels.sections.applicantInformation)}
                    expanded={showApplicantDetails}
                    onPress={() => setShowApplicantDetails(!showApplicantDetails)}
                />

                {!showApplicantDetails && (
                    <View className="mt-2 gap-1">
                      <Text className="text-sm font-semibold text-gray-900">
                        {applicant.fullName || fallback}
                      </Text>

                      <Text className="text-xs text-gray-500">
                        {applicant.identificationNo || fallback}
                      </Text>
                    </View>
                )}

                {showApplicantDetails && (
                    <View className="mt-3 border-t border-gray-100 pt-2">
                      <DetailRow
                          label={t(labels.fields.fullName)}
                          value={applicant.fullName}
                          fallback={fallback}
                      />

                      <DetailRow
                          label={t(labels.fields.identificationNo)}
                          value={applicant.identificationNo}
                          fallback={fallback}
                      />

                      <DetailRow
                          label={t(labels.fields.dateOfBirth)}
                          value={applicant.dateOfBirth}
                          fallback={fallback}
                      />

                      <DetailRow
                          label={t(labels.fields.citizenship)}
                          value={applicant.citizenship}
                          fallback={fallback}
                      />
                    </View>
                )}
              </View>
          )}

          {applicant && (
              <View className="rounded-2xl border border-gray-200 bg-white p-4">
                <SectionHeader
                    title={t(labels.sections.applicationReadiness)}
                    expanded={showReadiness}
                    onPress={() => setShowReadiness(!showReadiness)}
                />

                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-sm text-gray-600">
                    {t(labels.readiness.complete)}
                  </Text>

                  <Text
                      className={
                        applicationReady
                            ? "text-sm font-bold text-green-700"
                            : "text-sm font-bold text-amber-700"
                      }
                  >
                    {completedChecks}/{totalChecks}
                  </Text>
                </View>

                <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <View
                      className={
                        applicationReady
                            ? "h-full rounded-full bg-green-500"
                            : "h-full rounded-full bg-blue-500"
                      }
                      style={{
                        width: `${
                            totalChecks > 0
                                ? completedChecks / totalChecks * 100
                                : 0
                        }%`,
                      }}
                  />
                </View>

                {showReadiness && (
                    <View className="mt-3 border-t border-gray-100 pt-2">
                      <ReadinessRow
                          label={t(labels.readiness.applicant)}
                          complete={applicant.profileComplete}
                          completeLabel={t(labels.readiness.complete)}
                          incompleteLabel={t(labels.readiness.incomplete)}
                      />

                      <ReadinessRow
                          label={t(labels.readiness.address)}
                          complete={applicant.addressComplete}
                          completeLabel={t(labels.readiness.complete)}
                          incompleteLabel={t(labels.readiness.incomplete)}
                      />

                      <ReadinessRow
                          label={t(labels.readiness.household)}
                          complete={applicant.householdComplete}
                          completeLabel={t(labels.readiness.complete)}
                          incompleteLabel={t(labels.readiness.incomplete)}
                          notRequired={!applicant.householdRequired}
                          notRequiredLabel={t(labels.readiness.notRequired)}
                      />

                      <ReadinessRow
                          label={t(labels.readiness.householdMembers)}
                          complete={applicant.householdMembersComplete}
                          completeLabel={t(labels.readiness.complete)}
                          incompleteLabel={t(labels.readiness.incomplete)}
                          notRequired={!applicant.householdRequired}
                          notRequiredLabel={t(labels.readiness.notRequired)}
                      />

                      <ReadinessRow
                          label={t(labels.readiness.programSpecificData)}
                          complete={programSpecificDataComplete}
                          completeLabel={t(labels.readiness.complete)}
                          incompleteLabel={t(labels.readiness.incomplete)}
                      />

                      {!applicant.profileReady && !applicationLocked && (
                          <Text className="mt-2 text-sm leading-5 text-amber-700">
                            {t(labels.messages.missingInformation)}
                          </Text>
                      )}

                      {!programSpecificDataComplete && !applicationLocked && (
                          <Text className="mt-2 text-sm leading-5 text-amber-700">
                            {t(labels.messages.incompleteApplication)}
                          </Text>
                      )}
                    </View>
                )}
              </View>
          )}

          {applicationData && (
              <View className="rounded-2xl border border-gray-200 bg-white p-4">
                <SectionHeader
                    title={t(labels.sections.programSpecificInformation)}
                    expanded={showProgramSpecificData}
                    onPress={() => setShowProgramSpecificData(!showProgramSpecificData)}
                />

                {showProgramSpecificData && baData && (
                    <View className="mt-3 gap-4 border-t border-gray-100 pt-3">
                      <Text className="text-sm leading-5 text-gray-500">
                        {t(`${baLabels}.description`)}
                      </Text>

                      <Text className="text-sm font-bold text-gray-900">
                        {t(`${baLabels}.sections.welfareAssistance`)}
                      </Text>

                      <BooleanField
                          label={t(`${baLabels}.fields.receivesOtherJkmMonthlyAssistance`)}
                          value={baData.receivesOtherJkmMonthlyAssistance}
                          yesLabel={t(labels.options.yes)}
                          noLabel={t(labels.options.no)}
                          disabled={!canEdit}
                          onChange={updateBaAssistance}
                      />

                      {baData.receivesOtherJkmMonthlyAssistance === true && (
                          <View className="gap-2">
                            <Text className="text-sm font-medium text-gray-700">
                              {t(`${baLabels}.fields.currentJkmAssistanceProgram`)}
                            </Text>

                            <TextInput
                                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900"
                                value={baData.currentJkmAssistanceProgram ?? ""}
                                onChangeText={updateBaCurrentProgram}
                                placeholder={t(labels.form.textPlaceholder)}
                                editable={canEdit}
                                maxLength={200}
                            />
                          </View>
                      )}

                      <View className="h-px bg-gray-100" />

                      <Text className="text-sm font-bold text-gray-900">
                        {t(`${baLabels}.sections.additionalCircumstances`)}
                      </Text>

                      {([
                        "economicHardship",
                        "healthRelatedNeeds",
                        "dependentRelatedNeeds",
                        "otherCircumstances",
                      ] as const).map((field) => (
                          <BooleanField
                              key={field}
                              label={t(`${baLabels}.fields.${field}`)}
                              value={baData.additionalCircumstances?.[field]}
                              yesLabel={t(labels.options.yes)}
                              noLabel={t(labels.options.no)}
                              disabled={!canEdit}
                              onChange={(value) => {
                                updateBaCircumstance(field, value);
                              }}
                          />
                      ))}

                      <View className="gap-2">
                        <Text className="text-sm font-medium text-gray-700">
                          {t(`${baLabels}.fields.description`)}
                        </Text>

                        <TextInput
                            className="min-h-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900"
                            value={baData.additionalCircumstances?.description ?? ""}
                            onChangeText={updateBaCircumstancesDescription}
                            placeholder={t(labels.form.textPlaceholder)}
                            editable={canEdit}
                            multiline
                            textAlignVertical="top"
                            maxLength={3000}
                        />
                      </View>

                      {canSave && (
                          <Pressable
                              className="items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3"
                              onPress={() => {
                                void handleSaveDraft();
                              }}
                              accessibilityRole="button"
                          >
                            <Text className="text-sm font-semibold text-blue-700">
                              {t(labels.buttons.saveDraft)}
                            </Text>
                          </Pressable>
                      )}

                      {saving && (
                          <ActivityIndicator color="#2563EB" />
                      )}
                    </View>
                )}

                {showProgramSpecificData && !baData && (
                    <Text className="mt-3 text-sm leading-5 text-gray-500">
                      {t(labels.messages.notAvailable)}
                    </Text>
                )}

                {applicationLocked && (
                    <Text className="mt-3 text-xs leading-5 text-gray-500">
                      {t(labels.messages.applicationLocked)}
                    </Text>
                )}
              </View>
          )}

          {application && (
              <View className="rounded-2xl border border-gray-200 bg-white p-4">
                <SectionHeader
                    title={t(labels.sections.preliminaryEligibility)}
                    expanded={showPreliminaryEligibility}
                    onPress={() => setShowPreliminaryEligibility(!showPreliminaryEligibility)}
                />

                {!showPreliminaryEligibility && preliminaryEligibility && (
                    <Text className="mt-2 text-sm font-semibold text-gray-900">
                      {eligibilityStatusLabel}
                    </Text>
                )}

                {showPreliminaryEligibility && (
                    <View className="mt-3 border-t border-gray-100 pt-2">
                      {preliminaryEligibility ? (
                          <>
                            <DetailRow
                                label={t("applications.eligibility.status", {
                                  defaultValue: "Eligibility Status",
                                })}
                                value={eligibilityStatusLabel}
                                fallback={fallback}
                            />

                            <DetailRow
                                label={t("applications.eligibility.criteriaVersion", {
                                  defaultValue: "Criteria Version",
                                })}
                                value={String(preliminaryEligibility.criteriaVersion)}
                                fallback={fallback}
                            />

                            <DetailRow
                                label={t("applications.eligibility.assessedAt", {
                                  defaultValue: "Assessed At",
                                })}
                                value={formatDate(preliminaryEligibility.assessedAt)}
                                fallback={fallback}
                            />
                          </>
                      ) : (
                          <Text className="text-sm leading-5 text-gray-500">
                            {requiresRecovery || alreadySubmitted
                                ? t("applications.eligibility.notAvailable")
                                : t("applications.eligibility.notAssessed")}
                          </Text>
                      )}

                      <Text className="mt-2 text-sm leading-5 text-gray-500">
                        {t(labels.messages.eligibilityDisclaimer)}
                      </Text>
                    </View>
                )}
              </View>
          )}

          {application && (
              <View className="rounded-2xl border border-gray-200 bg-white p-4">
                <SectionHeader
                    title={t(labels.sections.applicationDetails)}
                    expanded={showApplicationDetails}
                    onPress={() => setShowApplicationDetails(!showApplicationDetails)}
                />

                {showApplicationDetails && (
                    <View className="mt-3 border-t border-gray-100 pt-2">
                      <DetailRow
                          label={t(labels.fields.program)}
                          value={application.programName}
                          fallback={fallback}
                      />

                      <DetailRow
                          label={t(labels.fields.agency)}
                          value={application.agency}
                          fallback={fallback}
                      />

                      <DetailRow
                          label={t(labels.fields.applicationId)}
                          value={application.id}
                          fallback={fallback}
                      />

                      <DetailRow
                          label={t(labels.fields.status)}
                          value={t(APPLICATION_STATUS_LABELS[application.status])}
                          fallback={fallback}
                      />
                    </View>
                )}
              </View>
          )}

          {externalSubmissionState === "pending" && (
              <View className="gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-sm font-bold text-amber-800">
                  {t(labels.messages.pendingTitle)}
                </Text>

                <Text className="text-sm leading-5 text-amber-700">
                  {t(labels.messages.pendingDescription)}
                </Text>
              </View>
          )}

          {externalSubmissionState === "unknown" && (
              <View className="gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-sm font-bold text-amber-800">
                  {t(labels.messages.unknownTitle)}
                </Text>

                <Text className="text-sm leading-5 text-amber-700">
                  {t(labels.messages.unknownDescription)}
                </Text>
              </View>
          )}

          {externalSubmissionState === "failed" && (
              <View className="gap-2 rounded-2xl border border-red-200 bg-red-50 p-4">
                <Text className="text-sm font-bold text-red-800">
                  {t(labels.messages.failedTitle)}
                </Text>

                <Text className="text-sm leading-5 text-red-700">
                  {t(labels.messages.failedDescription)}
                </Text>
              </View>
          )}

          {confirmation && (
              <View className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <SectionHeader
                    title={t(labels.sections.submissionConfirmation)}
                    expanded={showConfirmationDetails}
                    onPress={() => setShowConfirmationDetails(!showConfirmationDetails)}
                />

                <View className="mt-2">
                  <Text className="text-xs text-green-700">
                    {t(labels.fields.referenceNo)}
                  </Text>

                  <Text
                      className="mt-1 text-lg font-bold text-green-900"
                      selectable
                  >
                    {confirmation.referenceNo}
                  </Text>
                </View>

                {showConfirmationDetails && (
                    <View className="mt-3 border-t border-green-200 pt-2">
                      <DetailRow
                          label={t(labels.fields.providerApplicationId)}
                          value={confirmation.providerApplicationId}
                          fallback={fallback}
                      />

                      <DetailRow
                          label={t(labels.fields.providerStatus)}
                          value={providerStatusLabel}
                          fallback={fallback}
                      />

                      <DetailRow
                          label={t(labels.fields.submittedAt)}
                          value={formatDate(confirmation.submittedAt)}
                          fallback={t(labels.messages.notAvailable)}
                      />

                      {confirmation.alreadySubmitted && (
                          <Text className="mt-2 text-sm text-green-700">
                            {t(labels.messages.existingConfirmation)}
                          </Text>
                      )}
                    </View>
                )}
              </View>
          )}

          {alreadySubmitted && !confirmation && (
              <View className="gap-2 rounded-2xl border border-green-200 bg-green-50 p-4">
                <Text className="text-sm font-bold text-green-800">
                  {t(labels.messages.alreadySubmittedTitle)}
                </Text>

                <Text className="text-sm leading-5 text-green-700">
                  {t(labels.messages.alreadySubmittedDescription)}
                </Text>
              </View>
          )}

          {application && !applicationLocked && (
              <View className="gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                <Text className="text-base font-bold text-gray-900">
                  {t(labels.sections.applicationReview)}
                </Text>

                <Text className="text-sm leading-5 text-gray-500">
                  {t(labels.messages.reviewDescription)}
                </Text>

                <Pressable
                    className="flex-row items-start gap-3"
                    onPress={() => {
                      setDeclarationAccepted(!declarationAccepted);
                    }}
                    disabled={!canEdit}
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: declarationAccepted,
                      disabled: !canEdit,
                    }}
                >
                  <View
                      className={
                        declarationAccepted
                            ? "h-5 w-5 items-center justify-center rounded border border-blue-600 bg-blue-600"
                            : "h-5 w-5 rounded border border-gray-300 bg-white"
                      }
                  >
                    {declarationAccepted && (
                        <Text className="text-xs font-bold text-white">
                          ✓
                        </Text>
                    )}
                  </View>

                  <Text className="flex-1 text-sm leading-5 text-gray-700">
                    {t(labels.messages.declaration)}
                  </Text>
                </Pressable>
              </View>
          )}

          <View className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <Text className="text-xs leading-5 text-blue-700">
              {t(labels.messages.simulationDisclaimer)}
            </Text>
          </View>
        </ScrollView>

        <View className="gap-2 border-t border-gray-200 bg-white px-4 pb-4 pt-3">
          <Pressable
              className={
                canSubmit
                    ? "min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 py-3"
                    : "min-h-12 items-center justify-center rounded-xl bg-gray-400 px-5 py-3"
              }
              onPress={confirmSubmission}
              disabled={!canSubmit}
              accessibilityRole="button"
          >
            {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text className="text-center text-sm font-bold text-white">
                  {requiresRecovery
                      ? t(labels.buttons.checkSubmission)
                      : alreadySubmitted
                          ? t(labels.buttons.alreadySubmitted)
                          : t(labels.buttons.submit)}
                </Text>
            )}
          </Pressable>

          <Pressable
              className="items-center justify-center py-2"
              onPress={() => {
                void loadApplication();
              }}
              disabled={busy}
              accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-blue-600">
              {t(labels.buttons.refresh)}
            </Text>
          </Pressable>
        </View>
      </Screen>
  );
}
