import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";

export default function ApplicationsScreen() {
  return (
      <Screen>
        <ScreenHeader title="Applications" description="View and manage your applications." />

        {/*
        TODO:
          1. Application Screen
          - Display total applications

          2. My Applications
          - Fetch user's application from db
          - Display application cards
            - Display assistance program name
            - Display application status
            - Display last updated date
            - Display application preparation progress
            - Sort applications by most recently updated

           3. Application Details
           - Navigate to application details screen
           - Display program information
           - Display what have been submitted - personal info, docs
           - Provide application portal link

           4. Application Actions
           - Continue editing draft applications
           - View existing applications - 3. Application Details
           - Delete draft applications with confirmation

           5. Search and Filtering
           - Filter applications by status

           6. Empty State
           - Display EmptyState
           - Provide button to browse assistance programs

           7. Loading and Error State
           - Display loading indicator
           - Display error message when fetching fails
           - Provide retry functionality
           - Support pull-to-refresh
        */}
      </Screen>
  );
}
