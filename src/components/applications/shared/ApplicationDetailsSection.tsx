import { View } from "react-native";

import CollapsibleSection from "../../layout/CollapsibleSection.tsx";
import ApplicationDetailRow from "./ApplicationDetailRow.tsx";

export type ApplicationDetails = {
  programName: string;
  agency: string;
  applicationId: string;
  statusLabel: string;
};

export type ApplicationDetailsLabels = {
  title: string;
  program: string;
  agency: string;
  applicationId: string;
  status: string;
  notAvailable: string;
};

export type ApplicationDetailsSectionProps = {
  application: ApplicationDetails;
  labels: ApplicationDetailsLabels;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function ApplicationDetailsSection({
    application,
    labels,
    defaultExpanded = false,
    expanded,
    onExpandedChange
}: ApplicationDetailsSectionProps) {
  return (
      <CollapsibleSection
          title={labels.title}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
      >
        <View>
          <ApplicationDetailRow
              label={labels.program}
              value={application.programName}
              fallback={labels.notAvailable}
          />

          <ApplicationDetailRow
              label={labels.agency}
              value={application.agency}
              fallback={labels.notAvailable}
          />

          <ApplicationDetailRow
              label={labels.applicationId}
              value={application.applicationId}
              fallback={labels.notAvailable}
          />

          <ApplicationDetailRow
              label={labels.status}
              value={application.statusLabel}
              fallback={labels.notAvailable}
          />
        </View>
      </CollapsibleSection>
  );
}
