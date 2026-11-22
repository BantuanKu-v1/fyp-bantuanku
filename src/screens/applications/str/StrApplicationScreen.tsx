import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import Screen from "../../../components/layout/Screen";
import ScreenHeader from "../../../components/layout/ScreenHeader";

import { getOrCreateStrApplication } from "../../../services/applications/applicationServices";
import { getStrApplicantReview, submitStrApplication } from "../../../services/applications/strApplicationService";

import { APPLICATION_STATUS_LABELS } from "../../../constants/applications/applications";
import { STR_APPLICATION_LABELS } from "../../../constants/applications/strApplication";

import type {
  ApplicationSummary,
  StrApplicantReview,
  StrSubmissionResult,
} from "../../../types/applications";

function hasValue(value: string | null): boolean {
  return !!value?.trim();
}

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
}

function ReadinessRow({
  label,
  complete,
  completeLabel,
  incompleteLabel
}: ReadinessRowProps) {
  return (
      <View className="flex-row items-center gap-3 py-2">
        <View
            className={
              complete
                  ? "h-6 w-6 items-center justify-center rounded-full bg-green-100"
                  : "h-6 w-6 items-center justify-center rounded-full bg-amber-100"
            }
        >
          <Text
              className={
                complete
                    ? "text-xs font-bold text-green-700"
                    : "text-xs font-bold text-amber-700"
              }
          >
            {complete ? "✓" : "!"}
          </Text>
        </View>

        <Text className="flex-1 text-sm text-gray-700">
          {label}
        </Text>

        <Text
            className={
              complete
                  ? "text-xs font-medium text-green-700"
                  : "text-xs font-medium text-amber-700"
            }
        >
          {complete ? completeLabel : incompleteLabel}
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

export default function StrApplicationScreen() {
  const { t } = useTranslation();

  const labels = STR_APPLICATION_LABELS;
  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [applicant, setApplicant] = useState<StrApplicantReview | null>(null);
  const [confirmation, setConfirmation] = useState<StrSubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [showApplicantDetails, setShowApplicantDetails] = useState(false);
  const [showReadiness, setShowReadiness] = useState(true);
  const [showConfirmationDetails, setShowConfirmationDetails] = useState(false);
  const submittingRef = useRef(false);

  const loadApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const strApplication =
          await getOrCreateStrApplication();

      const applicantReview =
          await getStrApplicantReview(
              strApplication.profileId,
          );

      setApplication(strApplication);
      setApplicant(applicantReview);
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : labels.messages.loadError,
      );
    } finally {
      setLoading(false);
    }
  }, [labels.messages.loadError]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const profileComplete =
      !!applicant &&
      hasValue(applicant.fullName) &&
      hasValue(applicant.identificationNo) &&
      hasValue(applicant.dateOfBirth) &&
      hasValue(applicant.citizenship);

  const applicationReady =
      profileComplete && applicant?.addressComplete && applicant?.householdComplete && applicant?.householdMembersComplete;

  const alreadySubmitted = application?.status === "simulated_submitted";

  const canSubmit =
      !!application &&
      applicationReady &&
      !alreadySubmitted &&
      !loading &&
      !submitting;

  const completedChecks = applicant
      ? [
        profileComplete,
        applicant.addressComplete,
        applicant.householdComplete,
        applicant.householdMembersComplete,
      ].filter(Boolean).length
      : 0;

  const handleSubmit = async () => {
    if (!application || !canSubmit || submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    try {
      setSubmitting(true);
      setError(null);

      const result = await submitStrApplication(
          application.id,
      );

      setConfirmation(result);
      setShowConfirmationDetails(true);

      setApplication((previous) =>
          previous
              ? {
                ...previous,
                status: "simulated_submitted",
                simulatedSubmittedAt: result.submittedAt,
              }
              : previous,
      );

      Alert.alert(
          t(labels.messages.successTitle),
          t(labels.messages.successDescription, {
            referenceNo: result.referenceNo,
          }),
      );
    } catch (err) {
      const message =
          err instanceof Error
              ? err.message
              : labels.messages.submissionError;

      const translatedMessage = t(message, {
        defaultValue: message,
      });

      setError(translatedMessage);

      Alert.alert(
          t(labels.messages.submissionError),
          translatedMessage,
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const confirmSubmission = () => {
    if (!canSubmit) {
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

  if (loading) {
    return (
        <Screen>
          <ScreenHeader
              title={t(labels.title)}
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
            title={t(labels.title)}
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
                      {t(APPLICATION_STATUS_LABELS[application.status])}
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
                    {completedChecks}/4
                  </Text>
                </View>

                <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <View
                      className={
                        applicationReady
                            ? "h-full rounded-full bg-green-500"
                            : "h-full rounded-full bg-blue-500"
                      }
                      style={{ width: `${completedChecks * 25}%` }}
                  />
                </View>

                {showReadiness && (
                    <View className="mt-3 border-t border-gray-100 pt-2">
                      <ReadinessRow
                          label={t(labels.readiness.applicant)}
                          complete={profileComplete}
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
                      />

                      <ReadinessRow
                          label={t(labels.readiness.householdMembers)}
                          complete={applicant.householdMembersComplete}
                          completeLabel={t(labels.readiness.complete)}
                          incompleteLabel={t(labels.readiness.incomplete)}
                      />

                      {!applicationReady && (
                          <Text className="mt-2 text-sm leading-5 text-amber-700">
                            {t(labels.messages.missingInformation)}
                          </Text>
                      )}
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
                          value={t(
                              APPLICATION_STATUS_LABELS[application.status],
                          )}
                          fallback={fallback}
                      />
                    </View>
                )}
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
                    {confirmation.referenceNo || fallback}
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
                          value={confirmation.providerStatus}
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
                  {alreadySubmitted
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
              disabled={loading || submitting}
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
