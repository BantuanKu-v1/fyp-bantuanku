import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/home/HomeScreen";
import EligibilityQuestionnaireScreen from "../screens/eligibility/EligibilityQuestionnaireScreen";
import StrApplicationScreen from "../screens/applications/str/StrApplicationScreen";

export type HomeStackParamList = {
  HomeScreen: {
    refreshEligibility?: boolean;
  } | undefined;
  EligibilityQuestionnaire: {
    programCode: "BAT" | "BPT"
  };
  StrApplication: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
        />

        <Stack.Screen
          name="EligibilityQuestionnaire"
          component={EligibilityQuestionnaireScreen}
        />

        <Stack.Screen
            name="StrApplication"
            component={StrApplicationScreen}
        />
      </Stack.Navigator>
  );
}
