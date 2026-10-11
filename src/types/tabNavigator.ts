export type MainTabParamList = {
  Home: undefined;
  Programs: undefined;
  Applications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  PersonalInformation: undefined;
  Household: undefined;
  HouseholdMember: {
    memberId: string;
  };
  AddHouseholdMember: undefined;
  ResidentialAddress: undefined;
};
