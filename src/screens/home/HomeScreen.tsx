import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";
import { getJkmEligibilityCriteria } from "../../services/api";

interface JkmEligibilityRule {
  ruleCode: string;
  name: string;
  result: string;
  assessmentNotes?: string;
}

interface JkmEligibilityResponse {
  success: boolean;
  data: {
    programCode: string;
    programName: string;
    version: number;
    criteria: {
      rules: JkmEligibilityRule[];
    };
  };
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] =
      useState<JkmEligibilityResponse["data"] | null>(null);

  const handleTestJkmApi = async () => {
    setLoading(true);
    setError(null);
    setEligibility(null);

    try {
      const response: JkmEligibilityResponse =
          await getJkmEligibilityCriteria("BWE");

      if (!response.success) {
        throw new Error("JKM API returned an unsuccessful response");
      }

      setEligibility(response.data);
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
      <Screen>
        <ScreenHeader
            title="Home"
            description="Welcome to BantuanKu"
        />

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

        {/* Temporary JKM API Testing */}
        {__DEV__ && (
            <View className="mt-6 gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                JKM API Testing
              </Text>

              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Test the connection to the production JKM Mock API.
              </Text>

              <Pressable
                  onPress={handleTestJkmApi}
                  disabled={loading}
                  className="items-center rounded-lg bg-blue-600 px-4 py-3"
              >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text className="font-semibold text-white">
                      Test JKM API (BWE)
                    </Text>
                )}
              </Pressable>

              {error && (
                  <View className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                    <Text className="font-medium text-red-600 dark:text-red-400">
                      Connection Failed
                    </Text>

                    <Text className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </Text>
                  </View>
              )}

              {eligibility && (
                  <View className="gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                    <Text className="font-semibold text-green-700 dark:text-green-400">
                      Connection Successful
                    </Text>

                    <Text className="text-gray-900 dark:text-white">
                      Program: {eligibility.programName}
                    </Text>

                    <Text className="text-gray-900 dark:text-white">
                      Code: {eligibility.programCode}
                    </Text>

                    <Text className="text-gray-900 dark:text-white">
                      Version: {eligibility.version}
                    </Text>

                    <Text className="text-gray-900 dark:text-white">
                      Total Rules: {eligibility.criteria.rules.length}
                    </Text>

                    <View className="mt-2 gap-3">
                      {eligibility.criteria.rules.map((rule) => (
                          <View
                              key={rule.ruleCode}
                              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                          >
                            <Text className="font-semibold text-gray-900 dark:text-white">
                              {rule.ruleCode}
                            </Text>

                            <Text className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                              {rule.name}
                            </Text>

                            <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Result: {rule.result}
                            </Text>

                            {rule.assessmentNotes && (
                                <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  {rule.assessmentNotes}
                                </Text>
                            )}
                          </View>
                      ))}
                    </View>
                  </View>
              )}
            </View>
        )}
      </Screen>
  );
}
