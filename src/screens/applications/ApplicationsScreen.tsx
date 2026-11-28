import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react-native";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

import {
  APPLICATION_STATUS_LABELS,
  EXTERNAL_PROVIDER_STATUS_LABELS,
  EXTERNAL_SUBMISSION_STATE_LABELS,
} from "../../constants/applications/applications.ts";

import { getMyApplications } from "../../services/applications/applicationServices";

import { formatDate } from "../../utils/dateUtils";

import type { ApplicationSummary } from "../../types/applications";

export default function ApplicationsScreen() {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language;

  const [applications, setApplications] =
      useState<ApplicationSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const loadApplications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(false);

      const result = await getMyApplications();

      setApplications(result);
    } catch (loadError) {
      if (__DEV__) {
        console.error(
            "[APPLICATIONS] Failed to load applications:",
            loadError,
        );
      }

      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
      useCallback(() => {
        void loadApplications();
      }, [loadApplications]),
  );

  const handleRefresh = () => {
    void loadApplications(true);
  };

  // Resolve the application status displayed to the applicant
  const getApplicationStatusLabel = (
      application: ApplicationSummary
  ): string => {
    const externalSubmission = application.externalSubmission;

    // Applications without external submissions retain their internal status
    if (!externalSubmission) {
      return APPLICATION_STATUS_LABELS[application.status];
    }

    // A confirmed submission should display the latest provider status
    if (externalSubmission.submissionState === "submitted") {
      if (externalSubmission.providerStatus) {
        return EXTERNAL_PROVIDER_STATUS_LABELS[
            externalSubmission.providerStatus
            ];
      }

      return EXTERNAL_SUBMISSION_STATE_LABELS.submitted;
    }

    // Pending, failed and uncertain submissions are displayed separately
    return EXTERNAL_SUBMISSION_STATE_LABELS[
        externalSubmission.submissionState
        ];
  };

  const getApplicationStatusColor = (
      application: ApplicationSummary
  ): string => {
    const externalSubmission = application.externalSubmission;

    if (!externalSubmission) {
      switch (application.status) {
        case "draft":
          return "text-muted-foreground";

        case "in_progress":
          return "text-primary";

        case "ready_for_review":
          return "text-amber-600";

        case "simulated_submitted":
          return "text-primary";
      }
    }

    switch (externalSubmission?.submissionState) {
      case "pending":
      case "unknown":
        return "text-amber-600";

      case "failed":
        return "text-red-600";

      case "submitted":
        switch (externalSubmission.providerStatus) {
          case "approved":
            return "text-green-600";

          case "rejected":
            return "text-red-600";

          case "cancelled":
            return "text-muted-foreground";

          case "additional_information_required":
            return "text-amber-600";

          case "submitted":
          case "under_review":
          default:
            return "text-primary";
        }

      default:
        return "text-muted-foreground";
    }
  };

  // Resolve the timestamp associated with the displayed application status
  const getApplicationUpdatedAt = (
      application: ApplicationSummary
  ): string => {
    const externalSubmission = application.externalSubmission;

    if (externalSubmission?.submissionState === "submitted") {
      return (
          externalSubmission.providerUpdatedAt ??
          externalSubmission.submittedAt ??
          application.updatedAt
      );
    }

    return application.updatedAt;
  };

  if (loading) {
    return (
        <Screen scroll={false}>
          <ScreenHeader title={t("applications.title")} />

          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0352CE" />
          </View>
        </Screen>
    );
  }

  if (error) {
    return (
        <Screen scroll={false}>
          <ScreenHeader title={t("applications.title")} />

          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-base font-semibold text-foreground">
              {t("applications.errors.loadTitle")}
            </Text>

            <Text className="mt-2 text-center text-sm leading-5 text-muted-foreground">
              {t("applications.errors.loadDescription")}
            </Text>

            <View className="mt-5">
              <Button onPress={() => void loadApplications()}>
                {t("profile.errors.tryAgain")}
              </Button>
            </View>
          </View>
        </Screen>
    );
  }

  return (
      <Screen
          refreshing={refreshing}
          onRefresh={handleRefresh}
      >
        <ScreenHeader
            title={t("applications.title")}
            description={t("applications.description")}
            className="mb-5"
        />

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">
              {t("applications.myApplications")}
            </Text>

            <View className="rounded-full bg-muted px-2.5 py-1">
              <Text className="text-xs font-medium text-muted-foreground">
                {applications.length}
              </Text>
            </View>
          </View>

          {applications.length === 0 ? (
              <Card>
                <View className="items-center py-8">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FileText size={24} color="#0352CE" />
                  </View>

                  <Text className="mt-3 text-base font-semibold text-foreground">
                    {t("applications.empty.title")}
                  </Text>

                  <Text className="mt-2 text-center text-sm leading-5 text-muted-foreground">
                    {t("applications.empty.description")}
                  </Text>
                </View>
              </Card>
          ) : (
              <View className="gap-3">
                {applications.map(application => (
                    <Card key={application.id}>
                      <View className="gap-3">
                        <View className="flex-row items-start gap-3">
                          <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText size={20} color="#0352CE" />
                          </View>

                          <View className="flex-1 gap-1">
                            <Text className="text-sm font-semibold text-foreground">
                              {application.programName}
                            </Text>

                            <Text className="text-xs text-muted-foreground">
                              {[
                                application.programCode.toUpperCase(),
                                application.agency
                              ].filter(Boolean).join(" · ")}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row flex-wrap items-center justify-between gap-2">
                          <Text
                              className={`flex-shrink text-xs font-semibold ${
                                  getApplicationStatusColor(application)
                              }`}
                          >
                            {t(getApplicationStatusLabel(application))}
                          </Text>

                          <Text className="text-xs text-muted-foreground">
                            {formatDate(
                                getApplicationUpdatedAt(application),
                                language,
                                t("common.notProvided")
                            )}
                          </Text>
                        </View>
                      </View>
                    </Card>
                ))}
              </View>
          )}
        </View>
      </Screen>
  );
}
