import { Text } from "react-native";
import { useTranslation } from "react-i18next";

import CollapsibleSection from "../../layout/CollapsibleSection.tsx";
import BaApplicationForm from "./forms/BaApplicationForm.tsx";

import {
  JKM_APPLICATION_LABELS,
} from "../../../constants/applications/jkmApplication.ts";

import type {
  JkmApplicationDraftData,
} from "../../../types/applications.ts";

export type JkmProgramSpecificSectionProps = {
  data: JkmApplicationDraftData | null;
  onChange: (data: JkmApplicationDraftData) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function JkmProgramSpecificSection({
    data,
    onChange,
    disabled = false,
    defaultExpanded = true,
    expanded,
    onExpandedChange
}: JkmProgramSpecificSectionProps) {
  const { t } = useTranslation();

  const labels = JKM_APPLICATION_LABELS;

  const renderProgramForm = () => {
    if (!data) {
      return (
          <Text className="text-sm leading-5 text-muted-foreground">
            {t(labels.messages.notAvailable)}
          </Text>
      );
    }

    switch (data.programCode) {
      case "BA":
        return (
            <BaApplicationForm
                data={data.programSpecificData}
                disabled={disabled}
                onChange={(programSpecificData) => {
                  if (disabled) {
                    return;
                  }

                  onChange({
                    ...data,
                    programSpecificData,
                  });
                }}
            />
        );

      case "BAT":
      case "BPT":
      case "BWE":
        return (
            <Text className="text-sm leading-5 text-muted-foreground">
              {t(labels.messages.notAvailable)}
            </Text>
        );

      default: {
        // const unsupportedProgram: never = data;

        return null;
      }
    }
  };

  return (
      <CollapsibleSection
          title={t(labels.sections.programSpecificInformation)}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
      >
        {renderProgramForm()}
      </CollapsibleSection>
  );
}
