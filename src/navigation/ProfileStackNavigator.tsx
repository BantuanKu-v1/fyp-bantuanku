import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../types/tabNavigator";

import ProfileScreen from "../screens/profile/ProfileScreen";
import PersonalInfoScreen from "../screens/profile/PersonalInfoScreen";
import HouseholdScreen from "../screens/profile/household/HouseholdScreen";
import AddHouseholdMemberScreen from "../screens/profile/household/AddHouseholdMemberScreen";
import ResidentialAddressScreen from "../screens/profile/ResidentialAddressScreen";
import HouseholdMemberScreen from "../screens/profile/household/HouseholdMemberScreen";
import EditHouseholdMemberScreen from "../screens/profile/household/EditHouseholdMemberScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen
            name="ProfileOverview"
            component={ProfileScreen}
        />

        <Stack.Screen
            name="PersonalInformation"
            component={PersonalInfoScreen}
        />

        <Stack.Screen
            name="Household"
            component={HouseholdScreen}
        />

        <Stack.Screen
            name="HouseholdMember"
            component={HouseholdMemberScreen}
        />

        <Stack.Screen
            name="AddHouseholdMember"
            component={AddHouseholdMemberScreen}
        />

        <Stack.Screen
            name="EditHouseholdMember"
            component={EditHouseholdMemberScreen}
        />

        <Stack.Screen
            name="ResidentialAddress"
            component={ResidentialAddressScreen}
        />
      </Stack.Navigator>

  );
}
