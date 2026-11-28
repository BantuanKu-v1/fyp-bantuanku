import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  APPLICATION_STATUS_LABELS,
  EXTERNAL_PROVIDER_STATUS_LABELS
} from "../../../constants/applications/applications";

import { humanize } from "../../../utils/stringUtils";

import type {
  ApplicationSummary,
  ExternalApplicationProvider,
  ExternalProviderStatus,
  JkmSubmissionResult,
  StrSubmissionResult
} from "../../../types/applications";

export type ApplicationSummaryCardProps = {
  provider: ExternalApplicationProvider;
  application: ApplicationSummary | null;

  confirmation?:
      | JkmSubmissionResult
      | StrSubmissionResult
      | null;

  className?: string;
};

export default function ApplicationSummaryCard({
    provider,
    application,
    confirmation = null,
    className = ""
}: ApplicationSummaryCardProps) {
  const { t } = useTranslation();

  if (!application) {
    return null;
  }

  const localStatusLabel = t(
      APPLICATION_STATUS_LABELS[application.status]
  );

  const providerStatus = confirmation?.providerStatus;

  const providerStatusLabel = providerStatus
      ? t(
          EXTERNAL_PROVIDER_STATUS_LABELS[
              providerStatus as ExternalProviderStatus
              ] ?? providerStatus,
          {
            defaultValue: humanize(providerStatus)
          }
      )
      : null;

  const statusLabel =
      provider === "jkm"
          ? providerStatusLabel ?? localStatusLabel
          : localStatusLabel;

  return (
      <View className={`gap-4 rounded-xl bg-primary p-4 ${className}`}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-sm font-medium text-primary-foreground/80">
              {application.programCode.toUpperCase()}
            </Text>

            <Text className="text-xl font-bold text-primary-foreground">
              {application.programName}
            </Text>

            <Text className="text-sm text-primary-foreground/80">
              {application.agency}
            </Text>
          </View>

          <View className="rounded-full bg-white/20 px-3 py-1.5">
            <Text className="text-xs font-medium text-primary-foreground">
              {statusLabel}
            </Text>
          </View>
        </View>

        <View className="gap-1 border-t border-white/20 pt-3">
          <Text className="text-xs text-primary-foreground/80">
            {t(`applications.${provider}.fields.applicationId`)}
          </Text>

          <Text
              className="text-xs font-medium text-primary-foreground"
              selectable
          >
            {application.id}
          </Text>
        </View>
      </View>
  );
}
