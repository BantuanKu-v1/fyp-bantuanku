import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";

export default function HomeScreen() {
  return (
      <Screen>
        <ScreenHeader title="Home" description="Welcome to BantuanKu" />

        {/*
         TODO:
          1. Welcome Section
          - Display personalized greeting

          2. Profile Completion - TBC
          - Calculate profile completion percentage
          - Highlight missing profile information
          - Navigate to ProfileScreen

          3. Recommended Assistance
          - Fetch assistance programs from db
          - Match programs against user's profile
          - Navigate to program details
          - Avoid guaranteeing official eligibility

          3. My Applications
          - Display recent applications
          - Navigate to Applications screen

          4. Government Announcements - TBC
          - Retrieve verified assistance announcements
          - Display official source
          - Display last verified date
          - Handle unavailable or outdated information

          5. Upcoming Reminders
          - Fetch upcoming reminders
          - Navigate to program for application
        */}
      </Screen>
  );
}
