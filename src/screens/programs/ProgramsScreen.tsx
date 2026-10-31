import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";

export default function ProgramsScreen() {
  return (
      <Screen>
        <ScreenHeader title="Aid Programs" description="Find assistance that may match your needs." />

        {/*
        TODO:
          1. Programs Overview
          - Display selected government assistance programs
          - Sort programs by relevance or name

          2. Search Programs
          - Search programs by name
          - Search programs by keywords
          - Display results based on search query
          - Display empty state when no programs match

          3. Program Cards
          - Display program name
          - Display short program description
          - Display assistance category
          - Display eligibility indicator
          - Navigate to program details

          4. Program Details
          - Display full program details
          - Display eligibility requirements
          - Display assistance benefits
          - Display required docs
          - Display last verified date

          5. Saved Programs
          - Allow users to save programs - maybe will show in ProfileScreen (TBC)
          - Allow users to remove saved programs
          - Sync saved programs with db

          6. Application Preparation
          - Allow users to start preparing an application
          - Check whether an application draft is available
          - Navigate to application preparation screen
          - Display required information checklist
          - Display required docs checklist

          7.
        */}
      </Screen>
  );
}
