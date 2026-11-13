import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {HomeStackParamList} from "../../navigation/HomeStackNavigation";
import EligibilityQuestionnaire from "../../components/eligibility/EligibilityQuestionnaire";

type Props = NativeStackScreenProps<HomeStackParamList, "EligibilityQuestionnaire">;

export default function EligibilityQuestionnaireScreen({
    route,
    navigation
}: Props) {
  const { programCode } = route.params;

  const handledSaved = () => {
    navigation.popTo("HomeScreen", {
      refreshEligibility: true
    });
  };

  const handledCancel = () => {
    navigation.goBack();
  };

  return (
      <EligibilityQuestionnaire
          programCode={programCode}
          onSaved={handledSaved}
          onCancel={handledCancel}
      />
  );
}
