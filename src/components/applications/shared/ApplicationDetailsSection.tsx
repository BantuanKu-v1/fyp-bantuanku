import { View } from "react-native";
import { useTranslation } from "react-i18next";

import CollapsibleSection from "../../layout/CollapsibleSection";
import ApplicationDetailRow from "./ApplicationDetailRow";

import {
  APPLICATION_STATUS_LABELS
} from "../../../constants/applications/applications";

import type {
  ApplicationSummary,
  ExternalApplicationProvider
} from "../../../types/applications";

export type ApplicationDetailsSectionProps = {
  provider: ExternalApplicationProvider;
  application: ApplicationSummary | null;

  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function ApplicationDetailsSection({
    provider,
    application,
    defaultExpanded = false,
    expanded,
    onExpandedChange
}: ApplicationDetailsSectionProps) {
  const { t } = useTranslation();

  if (!application) {
    return null;
  }

  const notAvailable = t(
      `applications.${provider}.messages.notAvailable`
  );

  const statusLabel = t(
      APPLICATION_STATUS_LABELS[application.status]
  );

  return (
      <CollapsibleSection
          title={t(`applications.${provider}.sections.applicationDetails`)}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
      >
        <View className="gap-3">
          <ApplicationDetailRow
              label={t(`applications.${provider}.fields.program`)}
              value={application.programName}
              fallback={notAvailable}
          />

          <ApplicationDetailRow
              label={t(`applications.${provider}.fields.agency`)}
              value={application.agency}
              fallback={notAvailable}
          />

          <ApplicationDetailRow
              label={t(`applications.${provider}.fields.applicationId`)}
              value={application.id}
              fallback={notAvailable}
          />

          <ApplicationDetailRow
              label={t(`applications.${provider}.fields.status`)}
              value={statusLabel}
              fallback={notAvailable}
          />
        </View>
      </CollapsibleSection>
  );
}
