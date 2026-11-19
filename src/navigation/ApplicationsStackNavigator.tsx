import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ApplicationsScreen from "../screens/applications/ApplicationsScreen.tsx";
import StrApplicationScreen from "../screens/applications/str/StrApplicationScreen.tsx";

export type ApplicationsStackParamList = {
  ApplicationsScreen: undefined;
  StrApplication: {
    applicationId?: string;
  } | undefined;
};

const Stack = createNativeStackNavigator<ApplicationsStackParamList>();

export default function ApplicationsStackNavigator() {
  return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
            name="ApplicationsScreen"
            component={ApplicationsScreen}
        />

        <Stack.Screen
            name="StrApplication"
            component={StrApplicationScreen}
        />
      </Stack.Navigator>
  );
}
