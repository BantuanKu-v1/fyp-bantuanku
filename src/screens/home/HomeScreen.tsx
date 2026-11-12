import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";

import { useEligibility } from "../../hooks/useEligibility";

import type {
  ProgramEligibilityCheck,
  SupportedProgramCode,
} from "../../services/eligibility/eligibility";

// ============================================================
// PROGRAM INFORMATION
// ============================================================

const PROGRAM_NAMES: Record<SupportedProgramCode, string> = {
  BWE: "Bantuan Warga Emas",
  BA: "Bantuan Am",
  BAT: "Bantuan Alat Tiruan / Alat Sokongan",
  BPT: "Bantuan Penjagaan",
  STR: "Sumbangan Tunai Rahmah (2026)",
};

// ============================================================
// ELIGIBILITY STATUS HELPERS
// ============================================================

function getStatusLabel(status: string | undefined): string {
  switch (status) {
    case "potentially_eligible":
      return "Potentially Eligible";

    case "potentially_ineligible":
      return "Potentially Ineligible";

    case "insufficient_information":
      return "Insufficient Information";

    case "manual_verification":
      return "Manual Verification Required";

    default:
      return "Assessment Unavailable";
  }
}

function getStatusColor(status: string | undefined): string {
  switch (status) {
    case "potentially_eligible":
      return "text-green-700 dark:text-green-400";

    case "potentially_ineligible":
      return "text-red-600 dark:text-red-400";

    case "insufficient_information":
      return "text-amber-700 dark:text-amber-400";

    case "manual_verification":
      return "text-blue-700 dark:text-blue-400";

    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

// ============================================================
// PROGRAM RESULT CARD
// ============================================================

interface ProgramResultProps {
  item: ProgramEligibilityCheck;
}

function ProgramResult({ item }: ProgramResultProps) {
  const { programCode, assessment, error } = item;

  const result = assessment?.result;
  const status = result?.status;

  const missingInformation = result?.missingInformation ?? [];

  return (
      <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        {/* Program name */}
        <View className="gap-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            {PROGRAM_NAMES[programCode]}
          </Text>

          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {programCode}
          </Text>
        </View>

        {/* Eligibility status */}
        <Text
            className={`text-sm font-semibold ${getStatusColor(status)}`}
        >
          {error ? "Assessment Failed" : getStatusLabel(status)}
        </Text>

        {/* Criteria version */}
        {assessment && (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              Criteria Version: {assessment.criteriaVersion}
            </Text>
        )}

        {/* Matched rules */}
        {result && result.matchedRuleIds.length > 0 && (
            <View className="gap-1">
              <Text className="text-sm font-medium text-gray-900 dark:text-white">
                Matched Rules
              </Text>

              <Text className="text-xs text-gray-600 dark:text-gray-400">
                {result.matchedRuleIds.join(", ")}
              </Text>
            </View>
        )}

        {/* Missing information */}
        {missingInformation.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-medium text-gray-900 dark:text-white">
                Missing Information
              </Text>

              {missingInformation.map((condition, index) => (
                  <Text
                      key={`${programCode}-missing-${index}`}
                      className="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {JSON.stringify(condition)}
                  </Text>
              ))}
            </View>
        )}

        {/* Individual program error */}
        {error && (
            <Text className="text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
        )}

        {/* Assessment timestamp */}
        {assessment && (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              Assessed At:{" "}
              {new Date(assessment.assessedAt).toLocaleString()}
            </Text>
        )}
      </View>
  );
}

// ============================================================
// RESULT SECTION
// ============================================================

interface ResultSectionProps {
  title: string;
  items: ProgramEligibilityCheck[];
}

function ResultSection({
                         title,
                         items,
                       }: ResultSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
      <View className="gap-3">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </Text>

        {items.map((item) => (
            <ProgramResult
                key={item.programCode}
                item={item}
            />
        ))}
      </View>
  );
}

// ============================================================
// HOME SCREEN
// ============================================================

export default function HomeScreen() {
  const {
    assessments,
    loading,
    error,
    assessAllEligibility,
  } = useEligibility();

  const [hasChecked, setHasChecked] = useState(false);

  // ============================================================
  // CHECK ELIGIBILITY
  // ============================================================

  const handleCheckEligibility = async () => {
    if (loading) {
      return;
    }

    setHasChecked(true);

    await assessAllEligibility();
  };

  // ============================================================
  // CLASSIFY ASSESSMENT RESULTS
  // ============================================================

  const eligiblePrograms = assessments.filter(
      (item) =>
          item.assessment?.result.status ===
          "potentially_eligible"
  );

  const manualVerificationPrograms = assessments.filter(
      (item) =>
          item.assessment?.result.status ===
          "manual_verification"
  );

  const insufficientInformationPrograms = assessments.filter(
      (item) =>
          item.assessment?.result.status ===
          "insufficient_information"
  );

  const ineligiblePrograms = assessments.filter(
      (item) =>
          item.assessment?.result.status ===
          "potentially_ineligible"
  );

  const failedPrograms = assessments.filter(
      (item) => item.error !== null
  );

  const completedCount = assessments.filter(
      (item) => item.assessment !== null
  ).length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
      <Screen>
        <ScreenHeader
            title="Home"
            description="Welcome to BantuanKu"
        />

        <ScrollView
            className="flex-1"
            contentContainerClassName="gap-5 pb-10 pt-6"
            showsVerticalScrollIndicator={false}
        >
          {/* Introduction */}
          <View className="gap-2">
            <Text className="text-xl font-semibold text-gray-900 dark:text-white">
              Check My Eligibility
            </Text>

            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Find out which government assistance programs
              you may qualify for based on your profile
              information.
            </Text>
          </View>

          {/* Eligibility check button */}
          <Pressable
              onPress={handleCheckEligibility}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Check my eligibility"
              accessibilityState={{ disabled: loading }}
              className="items-center rounded-xl bg-blue-600 px-4 py-4"
          >
            {loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                  />

                  <Text className="font-semibold text-white">
                    Checking Eligibility...
                  </Text>
                </View>
            ) : (
                <Text className="font-semibold text-white">
                  Check My Eligibility
                </Text>
            )}
          </Pressable>

          {/* Overall error */}
          {error && (
              <View className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
                <Text className="text-sm font-medium text-red-600 dark:text-red-400">
                  Eligibility Check Failed
                </Text>

                <Text className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {error}
                </Text>
              </View>
          )}

          {/* Results */}
          {hasChecked && !loading && assessments.length > 0 && (
              <View className="gap-6">
                {/* Summary */}
                <View className="gap-3 rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                    Eligibility Summary
                  </Text>

                  <Text className="text-sm text-gray-700 dark:text-gray-300">
                    Programs Assessed: {completedCount}/{assessments.length}
                  </Text>

                  <Text className="text-sm text-green-700 dark:text-green-400">
                    Potentially Eligible: {eligiblePrograms.length}
                  </Text>

                  <Text className="text-sm text-blue-700 dark:text-blue-400">
                    Manual Verification: {manualVerificationPrograms.length}
                  </Text>

                  <Text className="text-sm text-amber-700 dark:text-amber-400">
                    Insufficient Information: {insufficientInformationPrograms.length}
                  </Text>

                  <Text className="text-sm text-gray-700 dark:text-gray-300">
                    Potentially Ineligible: {ineligiblePrograms.length}
                  </Text>

                  {failedPrograms.length > 0 && (
                      <Text className="text-sm text-red-600 dark:text-red-400">
                        Failed Assessments: {failedPrograms.length}
                      </Text>
                  )}
                </View>

                {/* Potentially eligible programs */}
                {eligiblePrograms.length > 0 ? (
                    <ResultSection
                        title="Programs You May Qualify For"
                        items={eligiblePrograms}
                    />
                ) : (
                    <View className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                      <Text className="text-sm text-gray-700 dark:text-gray-300">
                        No programs were identified as potentially
                        eligible from the completed assessments.
                      </Text>
                    </View>
                )}

                {/* Programs requiring manual verification */}
                <ResultSection
                    title="Requires Manual Verification"
                    items={manualVerificationPrograms}
                />

                {/* Programs requiring additional information */}
                <ResultSection
                    title="More Information Required"
                    items={insufficientInformationPrograms}
                />

                {/* Programs not currently matched */}
                <ResultSection
                    title="Programs Not Currently Matched"
                    items={ineligiblePrograms}
                />

                {/* Failed assessments */}
                <ResultSection
                    title="Assessments That Could Not Be Completed"
                    items={failedPrograms}
                />

                {/* Disclaimer */}
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  These results are preliminary assessments
                  based on your available profile information
                  and retrieved government program criteria.
                  Final eligibility and approval are determined
                  by the relevant government agencies.
                </Text>
              </View>
          )}
        </ScrollView>
      </Screen>
  );
}
