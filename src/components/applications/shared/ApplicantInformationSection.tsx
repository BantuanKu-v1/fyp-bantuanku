import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import CollapsibleSection from "../../layout/CollapsibleSection";
import ApplicationDetailRow from "./ApplicationDetailRow";

import { formatDate } from "../../../utils/dateUtils";

import type {
  ExternalApplicationProvider,
  JkmApplicantReview,
  StrApplicantReview,
} from "../../../types/applications";

export type ApplicantInformationSectionProps = {
  provider: ExternalApplicationProvider;

  applicant:
      | JkmApplicantReview
      | StrApplicantReview
      | null;

  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function ApplicantInformationSection({
    provider,
    applicant,
    defaultExpanded = false,
    expanded,
    onExpandedChange
}: ApplicantInformationSectionProps) {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language;

  if (!applicant) {
    return null;
  }

  const notProvided = t("common.notProvided");

  const citizenship = applicant.citizenship?.trim();

  const normalizedCitizenship = citizenship
      ?.toLowerCase()
      .replace(/[\s_-]/g, "");

  const citizenshipLabel =
      normalizedCitizenship === "malaysian"
          ? t("profile.personalInformation.malaysian")
          : normalizedCitizenship === "nonmalaysian"
              ? t("profile.personalInformation.nonMalaysian")
              : citizenship || notProvided;

  return (
      <CollapsibleSection
          title={t(`applications.${provider}.sections.applicantInformation`)}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          summaryAlwaysVisible
          summary={
            <View className="gap-1">
              <Text className="text-base font-semibold text-foreground">
                {applicant.fullName?.trim() || notProvided}
              </Text>

              <Text className="text-sm text-muted-foreground">
                {applicant.identificationNo?.trim() || notProvided}
              </Text>
            </View>
          }
      >
        <View className="gap-3">
          <ApplicationDetailRow
              label={t(`applications.${provider}.fields.fullName`)}
              value={applicant.fullName}
              fallback={notProvided}
          />

          <ApplicationDetailRow
              label={t(`applications.${provider}.fields.identificationNo`)}
              value={applicant.identificationNo}
              fallback={notProvided}
          />

          <ApplicationDetailRow
              label={t(`applications.${provider}.fields.dateOfBirth`)}
              value={formatDate(
                  applicant.dateOfBirth,
                  language,
                  notProvided
              )}
              fallback={notProvided}
          />

          <ApplicationDetailRow
              label={t(`applications.${provider}.fields.citizenship`)}
              value={citizenshipLabel}
              fallback={notProvided}
          />
        </View>
      </CollapsibleSection>
  );
}
