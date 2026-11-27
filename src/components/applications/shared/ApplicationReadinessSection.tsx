import { Text, View } from "react-native";

import CollapsibleSection from "../../layout/CollapsibleSection.tsx";
import ProgressBar from "../../ui/ProgressBar.tsx";
import ApplicationReadinessRow from "./ApplicationReadinessRow.tsx";

export type ApplicationReadinessRequirement = {
  id: string;
  label: string;
  complete: boolean;
  notRequired?: boolean;
};

export type ApplicationReadinessLabels = {
  title: string;
  complete: string;
  incomplete: string;
  notRequired?: string;
  missingInformation?: string;
};

export type ApplicationReadinessSectionProps = {
  requirements: readonly ApplicationReadinessRequirement[];
  labels: ApplicationReadinessLabels;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function ApplicationReadinessSection({
    requirements,
    labels,
    defaultExpanded = true,
    expanded,
    onExpandedChange
}: ApplicationReadinessSectionProps) {
  const requiredRequirements = requirements.filter(
      (requirement) => !requirement.notRequired
  );

  const totalCount = requiredRequirements.length;

  const completedCount = requiredRequirements.filter(
      (requirement) => requirement.complete
  ).length;

  const isComplete =
      totalCount > 0 &&
      completedCount === totalCount;

  return (
      <CollapsibleSection
          title={labels.title}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          summaryAlwaysVisible
          summary={
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  {isComplete
                      ? labels.complete
                      : labels.incomplete}
                </Text>

                <Text
                    className={
                      isComplete
                          ? "text-sm font-bold text-green-700"
                          : "text-sm font-bold text-amber-700"
                    }
                >
                  {completedCount}/{totalCount}
                </Text>
              </View>

              <ProgressBar
                  value={completedCount}
                  total={totalCount}
                  variant={isComplete ? "success" : "primary"}
                  accessibilityLabel={labels.title}
              />
            </View>
          }
      >
        <View>
          {requirements.map((requirement) => (
              <ApplicationReadinessRow
                  key={requirement.id}
                  label={requirement.label}
                  complete={requirement.complete}
                  completeLabel={labels.complete}
                  incompleteLabel={labels.incomplete}
                  notRequired={requirement.notRequired}
                  notRequiredLabel={labels.notRequired}
              />
          ))}

          {!isComplete && labels.missingInformation && (
              <Text className="mt-2 text-sm leading-5 text-amber-700">
                {labels.missingInformation}
              </Text>
          )}
        </View>
      </CollapsibleSection>
  );
}
