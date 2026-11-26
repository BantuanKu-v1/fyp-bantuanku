import { Text, View } from "react-native";

import CollapsibleSection from "../../components/layout/CollapsibleSection";
import ApplicationDetailRow from "./ApplicationDetailRow";

import { formatDate } from "../../utils/dateUtils";

export type ApplicantInformation = {
  fullName: string | null;
  identificationNo: string | null;
  dateOfBirth: string | null;
  citizenship: string | null;
};

export type ApplicantInformationLabels = {
  title: string;
  fullName: string;
  identificationNo: string;
  dateOfBirth: string;
  citizenship: string;
  notProvided: string;
};

export type ApplicantInformationSectionProps = {
  applicant: ApplicantInformation;
  labels: ApplicantInformationLabels;
  language?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function ApplicantInformationSection({
  applicant,
  labels,
  language,
  defaultExpanded = false,
  expanded,
  onExpandedChange
}: ApplicantInformationSectionProps) {
  const fullName =
      applicant.fullName?.trim() ||
      labels.notProvided;

  const identificationNo =
      applicant.identificationNo?.trim() ||
      labels.notProvided;

  const dateOfBirth = formatDate(
      applicant.dateOfBirth,
      language,
      labels.notProvided
  );

  return (
      <CollapsibleSection
          title={labels.title}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          summary={
            <View className="gap-1">
              <Text className="text-base font-medium text-foreground">
                {fullName}
              </Text>

              <Text className="text-sm text-muted-foreground">
                {identificationNo}
              </Text>
            </View>
          }
      >
        <View className="gap-4">
          <ApplicationDetailRow
              label={labels.fullName}
              value={applicant.fullName}
              fallback={labels.notProvided}
          />

          <ApplicationDetailRow
              label={labels.identificationNo}
              value={applicant.identificationNo}
              fallback={labels.notProvided}
          />

          <ApplicationDetailRow
              label={labels.dateOfBirth}
              value={dateOfBirth}
              fallback={labels.notProvided}
          />

          <ApplicationDetailRow
              label={labels.citizenship}
              value={applicant.citizenship}
              fallback={labels.notProvided}
          />
        </View>
      </CollapsibleSection>
  );
}
