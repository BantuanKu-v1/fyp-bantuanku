import { Text, View } from "react-native";

import CollapsibleSection from "../../layout/CollapsibleSection.tsx";
import ProgressBar from "../../ui/ProgressBar.tsx";
import ApplicationReadinessRow from "./ApplicationReadinessRow.tsx";

export type ApplicationReadinessRequirement = {
  id: string;
  label: string;
  complete: boolean;
};

export type ApplicationReadinessLabels = {
  title: string;
  complete: string;
  incomplete: string;
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
  const totalCount = requirements.length;

  const completedCount = requirements.filter(
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
                <Text
                    className={
                      isComplete
                          ? "text-sm font-medium text-success"
                          : "text-sm font-medium text-muted-foreground"
                    }
                >
                  {isComplete
                      ? labels.complete
                      : labels.incomplete}
                </Text>

                <Text className="text-sm font-semibold text-foreground">
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
        <View className="gap-4">
          {requirements.map((requirement) => (
              <ApplicationReadinessRow
                  key={requirement.id}
                  label={requirement.label}
                  complete={requirement.complete}
                  completeLabel={labels.complete}
                  incompleteLabel={labels.incomplete}
              />
          ))}
        </View>
      </CollapsibleSection>
  );
}
