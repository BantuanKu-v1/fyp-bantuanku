import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import CollapsibleSection from "../../layout/CollapsibleSection";
import Alert from "../../ui/Alert";

import ApplicationReadinessRow from "./ApplicationReadinessRow";

import { isStrApplicantProfileComplete } from "../../../utils/applicationUtils";

import type {
  JkmApplicantReview,
  StrApplicantReview
} from "../../../types/applications";

type SharedReadinessProps = {
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export type ApplicationReadinessSectionProps =
    SharedReadinessProps & (
    | {
  provider: "jkm";
  applicant: JkmApplicantReview | null;
  programSpecificDataComplete: boolean;
  applicationLocked: boolean;
}
    | {
  provider: "str";
  applicant: StrApplicantReview | null;
}
    );

type ReadinessRequirement = {
  id: string;
  label: string;
  complete: boolean;
  notRequired?: boolean;
};

export default function ApplicationReadinessSection(
    props: ApplicationReadinessSectionProps
) {
  const { t } = useTranslation();

  const {
    provider,
    applicant,
    defaultExpanded = true,
    expanded,
    onExpandedChange
  } = props;

  if (!applicant) {
    return null;
  }

  const profileComplete =
      props.provider === "jkm"
          ? props.applicant?.profileComplete === true
          : isStrApplicantProfileComplete(props.applicant);

  const householdRequired =
      props.provider === "jkm"
          ? props.applicant?.householdRequired === true
          : true;

  const requirements: ReadinessRequirement[] = [
    {
      id: "applicant",
      label: t(`applications.${provider}.readiness.applicant`),
      complete: profileComplete
    },
    {
      id: "address",
      label: t(`applications.${provider}.readiness.address`),
      complete: applicant.addressComplete
    },
    {
      id: "household",
      label: t(`applications.${provider}.readiness.household`),
      complete: applicant.householdComplete,
      notRequired: !householdRequired
    },
    {
      id: "members",
      label: t(`applications.${provider}.readiness.householdMembers`),
      complete: applicant.householdMembersComplete,
      notRequired: !householdRequired
    }
  ];

  if (props.provider === "jkm") {
    requirements.push({
      id: "programme",
      label: t("applications.jkm.readiness.programSpecificData"),
      complete: props.programSpecificDataComplete
    });
  }

  const requiredRequirements = requirements.filter(
      requirement => !requirement.notRequired
  );

  const completedCount = requiredRequirements.filter(
      requirement => requirement.complete
  ).length;

  const totalCount = requiredRequirements.length;

  const isComplete = completedCount === totalCount;

  const completeLabel = t(
      `applications.${provider}.readiness.complete`
  );

  const incompleteLabel = t(
      `applications.${provider}.readiness.incomplete`
  );

  const notRequiredLabel =
      provider === "jkm"
          ? t("applications.jkm.readiness.notRequired")
          : undefined;

  const missingInformation: string[] = [];

  if (props.provider === "jkm") {
    if (!props.applicationLocked) {
      if (!props.applicant?.profileReady) {
        missingInformation.push(
            t("applications.jkm.messages.missingInformation")
        );
      }

      if (!props.programSpecificDataComplete) {
        missingInformation.push(
            t("applications.jkm.messages.incompleteApplication")
        );
      }
    }
  } else if (!isComplete) {
    missingInformation.push(
        t("applications.str.messages.missingInformation")
    );
  }

  return (
      <CollapsibleSection
          title={t(`applications.${provider}.sections.applicationReadiness`)}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          summaryAlwaysVisible
          summary={
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text
                    className={`text-sm font-medium ${
                        isComplete
                            ? "text-green-600"
                            : "text-muted-foreground"
                    }`}
                >
                  {isComplete ? completeLabel : incompleteLabel}
                </Text>

                <Text className="text-sm font-medium text-foreground">
                  {completedCount}/{totalCount}
                </Text>
              </View>

              <View className="h-2 overflow-hidden rounded-full bg-muted">
                <View
                    className={`h-full rounded-full ${
                        isComplete ? "bg-green-600" : "bg-primary"
                    }`}
                    style={{
                      width: `${
                          totalCount > 0
                              ? (completedCount / totalCount) * 100
                              : 0
                      }%`
                    }}
                />
              </View>
            </View>
          }
      >
        <View className="gap-3">
          {requirements.map(requirement => (
              <ApplicationReadinessRow
                  key={requirement.id}
                  label={requirement.label}
                  complete={requirement.complete}
                  completeLabel={completeLabel}
                  incompleteLabel={incompleteLabel}
                  notRequired={requirement.notRequired}
                  notRequiredLabel={notRequiredLabel}
              />
          ))}

          {!isComplete && missingInformation.length > 0 && (
              <Alert variant="warning">
                {missingInformation.join("\n")}
              </Alert>
          )}
        </View>
      </CollapsibleSection>
  );
}
