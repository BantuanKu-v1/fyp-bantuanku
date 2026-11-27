import { View } from "react-native";
import { useTranslation } from "react-i18next";

import CollapsibleSection from "../../layout/CollapsibleSection";
import Badge from "../../ui/Badge";
import Alert from "../../ui/Alert";

import ApplicationDetailRow from "./ApplicationDetailRow";

import { formatDateTime } from "../../../utils/dateUtils";
import { humanize } from "../../../utils/stringUtils";

import type {
  ExternalApplicationProvider,
} from "../../../types/applications";

import type {
  PreliminaryEligibilitySnapshot,
} from "../../../types/eligibility";

const ELIGIBILITY_STATUS_VARIANTS = {
  potentially_eligible: "success",
  potentially_ineligible: "error",
  insufficient_information: "warning",
  manual_verification: "info",
} as const;

export type PreliminaryEligibilitySectionProps = {
  provider: ExternalApplicationProvider;

  assessment: PreliminaryEligibilitySnapshot | null;

  alreadySubmitted: boolean;
  requiresRecovery: boolean;

  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function PreliminaryEligibilitySection({
    provider,
    assessment,
    alreadySubmitted,
    requiresRecovery,
    defaultExpanded = false,
    expanded,
    onExpandedChange
}: PreliminaryEligibilitySectionProps) {
  const { t, i18n } = useTranslation();

  const language =
      i18n.resolvedLanguage ?? i18n.language;

  const notAvailable = t(
      `applications.${provider}.messages.notAvailable`
  );

  const title =
      provider === "jkm"
          ? t("applications.jkm.sections.preliminaryEligibility")
          : t("applications.eligibility.title", {
            defaultValue: "Preliminary Eligibility"
          });

  const disclaimer =
      provider === "jkm"
          ? t("applications.jkm.messages.eligibilityDisclaimer")
          : t("applications.eligibility.disclaimer", {
            defaultValue:
                "This preliminary assessment is provided by BantuanKu and does not represent an official STR application decision."
          });

  const notAssessed =
      requiresRecovery || alreadySubmitted
          ? t("applications.eligibility.notAvailable", {
            defaultValue:
                "No preliminary eligibility assessment is available for this submission."
          })
          : t("applications.eligibility.notAssessed", {
            defaultValue:
                "Your preliminary eligibility will be assessed before submission."
          });

  const statusLabel = assessment
      ? t(
          `applications.eligibility.statuses.${assessment.status}`,
          {
            defaultValue: humanize(assessment.status)
          }
      )
      : null;

  const statusVariant = assessment
      ? ELIGIBILITY_STATUS_VARIANTS[assessment.status] ?? "default"
      : "default";

  return (
      <CollapsibleSection
          title={title}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          summaryAlwaysVisible
          summary={
            statusLabel ? (
                <View className="items-start">
                  <Badge variant={statusVariant}>
                    {statusLabel}
                  </Badge>
                </View>
            ) : undefined
          }
      >
        <View className="gap-3">
          {assessment && statusLabel ? (
              <>
                <ApplicationDetailRow
                    label={t("applications.eligibility.status", {
                      defaultValue: "Eligibility Status"
                    })}
                    value={statusLabel}
                    fallback={notAvailable}
                />

                <ApplicationDetailRow
                    label={t("applications.eligibility.criteriaVersion", {
                      defaultValue: "Criteria Version"
                    })}
                    value={assessment.criteriaVersion}
                    fallback={notAvailable}
                />

                <ApplicationDetailRow
                    label={t("applications.eligibility.assessedAt", {
                      defaultValue: "Assessed At"
                    })}
                    value={formatDateTime(
                        assessment.assessedAt,
                        language,
                        notAvailable
                    )}
                    fallback={notAvailable}
                />
              </>
          ) : (
              <Alert variant="info">
                {notAssessed}
              </Alert>
          )}

          <Alert variant="info">
            {disclaimer}
          </Alert>
        </View>
      </CollapsibleSection>
  );
}
