import { Text } from "react-native";
import { useTranslation } from "react-i18next";

import CollapsibleSection from "../../layout/CollapsibleSection.tsx";
import BaApplicationForm from "./forms/BaApplicationForm.tsx";

import type {
  JkmApplicationDraftData
} from "../../../types/applications";

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

  const renderProgramForm = () => {
    if (!data) {
      return (
          <Text className="text-sm text-muted-foreground">
            {t("applications.jkm.messages.notAvailable")}
          </Text>
      );
    }

    switch (data.programCode) {
      case "BA":
        return (
            <BaApplicationForm
                data={data.programSpecificData}
                disabled={disabled}
                onChange={programSpecificData =>
                    onChange({
                      ...data,
                      programSpecificData
                    })
                }
            />
        );

      case "BAT":
      case "BPT":
      case "BWE":
        return (
            <Text className="text-sm text-muted-foreground">
              {t("applications.jkm.messages.notAvailable")}
            </Text>
        );

      default: {
        const unsupportedProgram: never = data;
        void unsupportedProgram;

        return null;
      }
    }
  };

  return (
      <CollapsibleSection
          title={t("applications.jkm.sections.programSpecificInformation")}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
      >
        {renderProgramForm()}
      </CollapsibleSection>
  );
}
