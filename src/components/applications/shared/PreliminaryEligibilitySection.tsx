import { Text, View } from "react-native";

import CollapsibleSection from "../../layout/CollapsibleSection.tsx";
import Badge from "../../ui/Badge.tsx";
import ApplicationDetailRow from "./ApplicationDetailRow.tsx";

import { formatDateTime } from "../../../utils/dateUtils.ts";

export type PreliminaryEligibilityDetails = {
  statusLabel: string;
  statusVariant: "default" | "info" | "success" | "warning" | "error";
  criteriaVersion: number | string | null;
  assessedAt: string | null;
};

export type PreliminaryEligibilityLabels = {
  title: string;
  status: string;
  criteriaVersion: string;
  assessedAt: string;
  notAvailable: string;
  notAssessed: string;
  disclaimer: string;
};

export type PreliminaryEligibilitySectionProps = {
  assessment: PreliminaryEligibilityDetails | null;
  labels: PreliminaryEligibilityLabels;
  language?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function PreliminaryEligibilitySection({
    assessment,
    labels,
    language,
    defaultExpanded = false,
    expanded,
    onExpandedChange
}: PreliminaryEligibilitySectionProps) {
  const statusLabel =
      assessment?.statusLabel ??
      labels.notAssessed;

  const statusVariant =
      assessment?.statusVariant ??
      "default";

  const assessedAt = formatDateTime(
      assessment?.assessedAt,
      language,
      labels.notAvailable
  );

  return (
      <CollapsibleSection
          title={labels.title}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          summary={
            <View className="items-start">
              <Badge variant={statusVariant}>
                {statusLabel}
              </Badge>
            </View>
          }
      >
        <View>
          {assessment ? (
              <>
                <ApplicationDetailRow
                    label={labels.status}
                    value={statusLabel}
                    fallback={labels.notAvailable}
                />

                <ApplicationDetailRow
                    label={labels.criteriaVersion}
                    value={assessment.criteriaVersion}
                    fallback={labels.notAvailable}
                />

                <ApplicationDetailRow
                    label={labels.assessedAt}
                    value={assessedAt}
                    fallback={labels.notAvailable}
                />
              </>
          ) : (
              <Text className="py-2 text-sm text-muted-foreground">
                {labels.notAssessed}
              </Text>
          )}

          <View className="mt-3 rounded-lg bg-surface p-3">
            <Text className="text-sm leading-5 text-muted-foreground">
              {labels.disclaimer}
            </Text>
          </View>
        </View>
      </CollapsibleSection>
  );
}
