import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import CollapsibleSection from "../../layout/CollapsibleSection";
import Alert from "../../ui/Alert";

import ApplicationDetailRow from "./ApplicationDetailRow";

import {
  EXTERNAL_PROVIDER_STATUS_LABELS
} from "../../../constants/applications/applications";

import { formatDateTime } from "../../../utils/dateUtils";
import { humanize } from "../../../utils/stringUtils";

import type {
  ExternalApplicationProvider,
  ExternalProviderStatus,
  JkmSubmissionResult,
  StrSubmissionResult,
} from "../../../types/applications";

export type SubmissionConfirmationSectionProps = {
  provider: ExternalApplicationProvider;

  confirmation:
      | JkmSubmissionResult
      | StrSubmissionResult
      | null;

  alreadySubmitted: boolean;

  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function SubmissionConfirmationSection({
    provider,
    confirmation,
    alreadySubmitted,
    defaultExpanded = false,
    expanded,
    onExpandedChange
}: SubmissionConfirmationSectionProps) {
  const { t, i18n } = useTranslation();

  const language =
      i18n.resolvedLanguage ?? i18n.language;

  const notAvailable = t(
      `applications.${provider}.messages.notAvailable`
  );

  if (!confirmation) {
    if (!alreadySubmitted) {
      return null;
    }

    return (
        <Alert
            variant="success"
            title={t(
                `applications.${provider}.messages.alreadySubmittedTitle`
            )}
        >
          {t(
              `applications.${provider}.messages.alreadySubmittedDescription`
          )}
        </Alert>
    );
  }

  const providerStatus = confirmation.providerStatus;

  const providerStatusLabel = providerStatus
      ? t(
          EXTERNAL_PROVIDER_STATUS_LABELS[
              providerStatus as ExternalProviderStatus
              ] ?? providerStatus,
          {
            defaultValue: humanize(providerStatus)
          }
      )
      : notAvailable;

  return (
      <CollapsibleSection
          title={t(
              `applications.${provider}.sections.submissionConfirmation`
          )}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          summaryAlwaysVisible
          summary={
            <View className="gap-1 rounded-lg border border-green-200 bg-green-50 p-3">
              <Text className="text-xs font-medium text-green-700">
                {t(
                    `applications.${provider}.fields.referenceNo`
                )}
              </Text>

              <Text
                  className="text-lg font-semibold text-green-800"
                  selectable
              >
                {confirmation.referenceNo}
              </Text>
            </View>
          }
      >
        <View className="gap-3">
          <ApplicationDetailRow
              label={t(
                  `applications.${provider}.fields.providerApplicationId`
              )}
              value={confirmation.providerApplicationId}
              fallback={notAvailable}
          />

          <ApplicationDetailRow
              label={t(
                  `applications.${provider}.fields.providerStatus`
              )}
              value={providerStatusLabel}
              fallback={notAvailable}
          />

          <ApplicationDetailRow
              label={t(
                  `applications.${provider}.fields.submittedAt`
              )}
              value={formatDateTime(
                  confirmation.submittedAt,
                  language,
                  notAvailable
              )}
              fallback={notAvailable}
          />

          {confirmation.alreadySubmitted && (
              <Alert variant="info">
                {t(
                    `applications.${provider}.messages.existingConfirmation`
                )}
              </Alert>
          )}
        </View>
      </CollapsibleSection>
  );
}
