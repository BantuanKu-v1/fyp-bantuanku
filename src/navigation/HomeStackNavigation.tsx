import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import HomeScreen from "../screens/home/HomeScreen";
import EligibilityQuestionnaireScreen from "../screens/eligibility/EligibilityQuestionnaireScreen";
import StrApplicationScreen from "../screens/applications/str/StrApplicationScreen";
import JkmApplicationScreen from "../screens/applications/jkm/JkmApplicationScreen";
import type { JkmProgramCode } from "../types/applications";

export type HomeStackParamList = {
  HomeScreen: {
    refreshEligibility?: boolean;
  } | undefined;

  EligibilityQuestionnaire: {
    programCode: "BAT" | "BPT";
  };

  StrApplication: undefined;

  JkmApplication: {
    programCode: JkmProgramCode;
  };
};

type JkmApplicationRouteProps = NativeStackScreenProps<
    HomeStackParamList,
    "JkmApplication"
>;

function JkmApplicationRoute({
    route
}: JkmApplicationRouteProps) {
  return (
      <JkmApplicationScreen
          programCode={route.params.programCode}
      />
  );
}

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

        <Stack.Screen
            name="JkmApplication"
            component={JkmApplicationRoute}
        />
      </Stack.Navigator>
  );
}
