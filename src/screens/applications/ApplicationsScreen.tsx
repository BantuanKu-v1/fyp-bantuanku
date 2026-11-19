import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react-native";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";
import Section from "../../components/layout/Section";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

import { APPLICATION_STATUS_LABELS } from "../../constants/applications";
import { getMyApplications } from "../../services/applications/applicationServices";
import type { ApplicationSummary } from "../../types/applications";

export default function ApplicationsScreen() {
  const { t, i18n } = useTranslation();

  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
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

  const formatDate = (value: string): string => {
    const locale =
        i18n.language === "ms"
            ? "ms-MY"
            : i18n.language === "zh"
                ? "zh-CN"
                : "en-MY";

    return new Date(value).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
            className="mb-6"
        />

        <View className="gap-6">
          <Card>
            <View className="flex-row items-center gap-4 py-2">
              <View className="h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <FileText size={26} color="#0352CE" />
              </View>

              <View className="flex-1">
                <Text className="text-sm text-muted-foreground">
                  {t("applications.totalApplications")}
                </Text>

                <Text className="mt-1 text-2xl font-bold text-foreground">
                  {applications.length}
                </Text>
              </View>
            </View>
          </Card>

          <Section title={t("applications.myApplications")}>
            {applications.length === 0 ? (
                <Card>
                  <View className="items-center py-10">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <FileText size={30} color="#0352CE" />
                    </View>

                    <Text className="mt-4 text-base font-semibold text-foreground">
                      {t("applications.empty.title")}
                    </Text>

                    <Text className="mt-2 px-4 text-center text-sm leading-5 text-muted-foreground">
                      {t("applications.empty.description")}
                    </Text>
                  </View>
                </Card>
            ) : (
                <View className="gap-3">
                  {applications.map((application) => (
                      <Card key={application.id}>
                        <View className="gap-4 py-2">
                          <View>
                            <Text className="text-base font-semibold text-foreground">
                              {application.programName}
                            </Text>

                            {application.agency ? (
                                <Text className="mt-1 text-xs text-muted-foreground">
                                  {application.agency}
                                </Text>
                            ) : null}
                          </View>

                          <View className="h-px bg-border" />

                          <View className="flex-row items-center justify-between gap-3">
                            <Text className="text-sm text-muted-foreground">
                              {t("applications.status")}
                            </Text>

                            <Text className="text-right text-sm font-semibold text-primary">
                              {t(
                                  APPLICATION_STATUS_LABELS[application.status],
                              )}
                            </Text>
                          </View>

                          <View className="flex-row items-center justify-between gap-3">
                            <Text className="text-sm text-muted-foreground">
                              {t("applications.lastUpdated")}
                            </Text>

                            <Text className="text-right text-sm font-medium text-foreground">
                              {formatDate(application.updatedAt)}
                            </Text>
                          </View>
                        </View>
                      </Card>
                  ))}
                </View>
            )}
          </Section>
        </View>
      </Screen>
  );
}
