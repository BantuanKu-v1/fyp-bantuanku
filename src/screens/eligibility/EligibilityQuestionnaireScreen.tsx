import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { HomeStackParamList } from "../../navigation/HomeStackNavigation";
import EligibilityQuestionnaire from "../../components/eligibility/EligibilityQuestionnaire";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";

type Props = NativeStackScreenProps<HomeStackParamList, "EligibilityQuestionnaire">;

export default function EligibilityQuestionnaireScreen({
    route,
    navigation
}: Props) {
  const { t } = useTranslation();
  const { programCode } = route.params;

  const handleSaved = () => {
    navigation.popTo("HomeScreen", {
      refreshEligibility: true
    });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
      <Screen scroll={false}>
        <ScreenHeader
            title={t("eligibility.questionnaire.title", { programCode })}
            onBack={handleCancel}
            className="mb-6"
        />

        <EligibilityQuestionnaire
            programCode={programCode}
            onSaved={handleSaved}
            onCancel={handleCancel}
        />
      </Screen>
  );
}
