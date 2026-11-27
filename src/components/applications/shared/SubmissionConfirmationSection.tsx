import { Text, View } from "react-native";
import { CircleCheck } from "lucide-react-native";

import CollapsibleSection from "../../layout/CollapsibleSection.tsx";
import Alert from "../../ui/Alert.tsx";
import ApplicationDetailRow from "./ApplicationDetailRow.tsx";

import { formatDateTime } from "../../../utils/dateUtils.ts";

export type SubmissionConfirmationDetails = {
  referenceNo: string;
  providerApplicationId: string | null;
  providerStatusLabel: string | null;
  submittedAt: string | null;
  alreadySubmitted: boolean;
};

export type SubmissionConfirmationLabels = {
  title: string;
  referenceNo: string;
  providerApplicationId: string;
  providerStatus: string;
  submittedAt: string;
  notAvailable: string;
  existingConfirmation: string;
};

export type SubmissionConfirmationSectionProps = {
  confirmation: SubmissionConfirmationDetails;
  labels: SubmissionConfirmationLabels;
  language?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function SubmissionConfirmationSection({
    confirmation,
    labels,
    language,
    defaultExpanded = false,
    expanded,
    onExpandedChange
}: SubmissionConfirmationSectionProps) {
  const submittedAt = formatDateTime(
      confirmation.submittedAt,
      language,
      labels.notAvailable
  );

  const referenceNo =
      confirmation.referenceNo.trim() ||
      labels.notAvailable;

  return (
      <CollapsibleSection
          title={labels.title}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          summaryAlwaysVisible
          summary={
            <View className="rounded-xl border border-green-200 bg-green-50 p-4">
              <View className="flex-row items-start gap-3">
                <CircleCheck
                    size={24}
                    color="#16A34A"
                />

                <View className="flex-1 gap-1">
                  <Text className="text-xs font-medium text-green-700">
                    {labels.referenceNo}
                  </Text>

                  <Text
                      selectable
                      className="text-base font-bold text-green-900"
                  >
                    {referenceNo}
                  </Text>
                </View>
              </View>
            </View>
          }
      >
        <View>
          <ApplicationDetailRow
              label={labels.providerApplicationId}
              value={confirmation.providerApplicationId}
              fallback={labels.notAvailable}
          />

          <ApplicationDetailRow
              label={labels.providerStatus}
              value={confirmation.providerStatusLabel}
              fallback={labels.notAvailable}
          />

          <ApplicationDetailRow
              label={labels.submittedAt}
              value={submittedAt}
              fallback={labels.notAvailable}
          />

          {confirmation.alreadySubmitted && (
              <View className="mt-3">
                <Alert variant="info">
                  {labels.existingConfirmation}
                </Alert>
              </View>
          )}
        </View>
      </CollapsibleSection>
  );
}
