import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";

import { useEligibility } from "../../hooks/useEligibility";

import type { HomeStackParamList } from "../../navigation/HomeStackNavigation";

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

type QuestionnaireProgramCode = "BAT" | "BPT";

type Props = NativeStackScreenProps<
    HomeStackParamList,
    "HomeScreen"
>;

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
      return "text-success-foreground";

    case "potentially_ineligible":
      return "text-error";

    case "insufficient_information":
      return "text-warning-foreground";

    case "manual_verification":
      return "text-info";

    default:
      return "text-muted-foreground";
  }
}

// ============================================================
// PROGRAM RESULT CARD
// ============================================================

interface ProgramResultProps {
  item: ProgramEligibilityCheck;
  onOpenQuestionnaire: (programCode: QuestionnaireProgramCode) => void;
}

function ProgramResult({
                         item,
                         onOpenQuestionnaire,
                       }: ProgramResultProps) {
  const { programCode, assessment, error } = item;

  const result = assessment?.result;
  const status = result?.status;

  const missingInformation = result?.missingInformation ?? [];

  const hasQuestionnaire =
      programCode === "BAT" || programCode === "BPT";

  return (
      <View className="gap-3 rounded-xl border border-border bg-background p-4">
        {/* Program name */}
        <View className="gap-1">
          <Text className="text-base font-semibold text-foreground">
            {PROGRAM_NAMES[programCode]}
          </Text>

          <Text className="text-xs text-muted-foreground">
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
            <Text className="text-xs text-muted-foreground">
              Criteria Version: {assessment.criteriaVersion}
            </Text>
        )}

        {/* Matched rules */}
        {result && result.matchedRuleIds.length > 0 && (
            <View className="gap-1">
              <Text className="text-sm font-medium text-foreground">
                Matched Rules
              </Text>

              <Text className="text-xs text-muted-foreground">
                {result.matchedRuleIds.join(", ")}
              </Text>
            </View>
        )}

        {/* Missing information */}
        {missingInformation.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Missing Information
              </Text>

              {missingInformation.map((condition, index) => (
                  <Text
                      key={`${programCode}-missing-${index}`}
                      className="text-xs text-muted-foreground"
                  >
                    {JSON.stringify(condition)}
                  </Text>
              ))}
            </View>
        )}

        {/* Questionnaire action */}
        {hasQuestionnaire && (
            <Pressable
                onPress={() => onOpenQuestionnaire(programCode)}
                accessibilityRole="button"
                className="items-center rounded-xl border border-primary px-4 py-3"
            >
              <Text className="font-semibold text-primary">
                {status === "insufficient_information"
                    ? "Complete Questionnaire"
                    : "View / Update Answers"}
              </Text>
            </Pressable>
        )}

        {/* Individual program error */}
        {error && (
            <Text className="text-sm text-error">
              {error}
            </Text>
        )}

        {/* Assessment timestamp */}
        {assessment && (
            <Text className="text-xs text-muted-foreground">
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
  onOpenQuestionnaire: (programCode: QuestionnaireProgramCode) => void;
}

function ResultSection({
                         title,
                         items,
                         onOpenQuestionnaire,
                       }: ResultSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
      <View className="gap-3">
        <Text className="text-lg font-semibold text-foreground">
          {title}
        </Text>

        {items.map((item) => (
            <ProgramResult
                key={item.programCode}
                item={item}
                onOpenQuestionnaire={onOpenQuestionnaire}
            />
        ))}
      </View>
  );
}

// ============================================================
// HOME SCREEN
// ============================================================

export default function HomeScreen({
                                     navigation,
                                     route,
                                   }: Props) {
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
  // QUESTIONNAIRE NAVIGATION
  // ============================================================

  const handleOpenQuestionnaire = (
      programCode: QuestionnaireProgramCode
  ) => {
    navigation.navigate("EligibilityQuestionnaire", {
      programCode,
    });
  };

  // ============================================================
  // REFRESH ELIGIBILITY AFTER QUESTIONNAIRE
  // ============================================================

  useEffect(() => {
    const shouldRefresh = route.params?.refreshEligibility;

    if (!shouldRefresh) {
      return;
    }

    navigation.setParams({
      refreshEligibility: false,
    });

    if (hasChecked) {
      void assessAllEligibility();
    }
  }, [
    route.params?.refreshEligibility,
    hasChecked,
    assessAllEligibility,
    navigation,
  ]);

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
            <Text className="text-xl font-semibold text-foreground">
              Check My Eligibility
            </Text>

            <Text className="text-sm text-muted-foreground">
              Find out which government assistance programs
              you may qualify for based on your profile
              information.
            </Text>
          </View>

          {/* Additional eligibility information */}
          <View className="gap-3 rounded-xl border border-border bg-surface p-4">
            <View className="gap-1">
              <Text className="text-base font-semibold text-foreground">
                Additional Eligibility Information
              </Text>

              <Text className="text-sm text-muted-foreground">
                Complete these questionnaires to help us assess
                your eligibility for BAT and BPT more accurately.
              </Text>
            </View>

            {/* BAT questionnaire */}
            <Pressable
                onPress={() => handleOpenQuestionnaire("BAT")}
                accessibilityRole="button"
                accessibilityLabel="Open BAT questionnaire"
                className="gap-1 rounded-lg border border-border bg-background p-4"
            >
              <Text className="text-sm font-semibold text-foreground">
                BAT Questionnaire
              </Text>

              <Text className="text-xs text-muted-foreground">
                Assistive equipment and medical recommendations
              </Text>

              <Text className="mt-1 text-xs font-semibold text-primary">
                Open Questionnaire
              </Text>
            </Pressable>

            {/* BPT questionnaire */}
            <Pressable
                onPress={() => handleOpenQuestionnaire("BPT")}
                accessibilityRole="button"
                accessibilityLabel="Open BPT questionnaire"
                className="gap-1 rounded-lg border border-border bg-background p-4"
            >
              <Text className="text-sm font-semibold text-foreground">
                BPT Questionnaire
              </Text>

              <Text className="text-xs text-muted-foreground">
                Patient health and caregiver information
              </Text>

              <Text className="mt-1 text-xs font-semibold text-primary">
                Open Questionnaire
              </Text>
            </Pressable>
          </View>

          {/* Eligibility check button */}
          <Pressable
              onPress={handleCheckEligibility}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Check my eligibility"
              accessibilityState={{ disabled: loading }}
              className={`items-center rounded-xl px-4 py-4 ${
                  loading ? "bg-primary-dark" : "bg-primary"
              }`}
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
              <View className="rounded-lg bg-error-background p-4">
                <Text className="text-sm font-medium text-error">
                  Eligibility Check Failed
                </Text>

                <Text className="mt-1 text-sm text-error">
                  {error}
                </Text>
              </View>
          )}

          {/* Results */}
          {hasChecked && !loading && assessments.length > 0 && (
              <View className="gap-6">
                {/* Summary */}
                <View className="gap-3 rounded-xl bg-surface p-4">
                  <Text className="text-lg font-semibold text-foreground">
                    Eligibility Summary
                  </Text>

                  <Text className="text-sm text-foreground">
                    Programs Assessed: {completedCount}/{assessments.length}
                  </Text>

                  <Text className="text-sm text-success-foreground">
                    Potentially Eligible: {eligiblePrograms.length}
                  </Text>

                  <Text className="text-sm text-info">
                    Manual Verification: {manualVerificationPrograms.length}
                  </Text>

                  <Text className="text-sm text-warning-foreground">
                    Insufficient Information: {insufficientInformationPrograms.length}
                  </Text>

                  <Text className="text-sm text-foreground">
                    Potentially Ineligible: {ineligiblePrograms.length}
                  </Text>

                  {failedPrograms.length > 0 && (
                      <Text className="text-sm text-error">
                        Failed Assessments: {failedPrograms.length}
                      </Text>
                  )}
                </View>

                {/* Potentially eligible programs */}
                {eligiblePrograms.length > 0 ? (
                    <ResultSection
                        title="Programs You May Qualify For"
                        items={eligiblePrograms}
                        onOpenQuestionnaire={handleOpenQuestionnaire}
                    />
                ) : (
                    <View className="rounded-xl bg-surface p-4">
                      <Text className="text-sm text-foreground">
                        No programs were identified as potentially
                        eligible from the completed assessments.
                      </Text>
                    </View>
                )}

                {/* Programs requiring manual verification */}
                <ResultSection
                    title="Requires Manual Verification"
                    items={manualVerificationPrograms}
                    onOpenQuestionnaire={handleOpenQuestionnaire}
                />

                {/* Programs requiring additional information */}
                <ResultSection
                    title="More Information Required"
                    items={insufficientInformationPrograms}
                    onOpenQuestionnaire={handleOpenQuestionnaire}
                />

                {/* Programs not currently matched */}
                <ResultSection
                    title="Programs Not Currently Matched"
                    items={ineligiblePrograms}
                    onOpenQuestionnaire={handleOpenQuestionnaire}
                />

                {/* Failed assessments */}
                <ResultSection
                    title="Assessments That Could Not Be Completed"
                    items={failedPrograms}
                    onOpenQuestionnaire={handleOpenQuestionnaire}
                />

                {/* Disclaimer */}
                <Text className="text-xs text-muted-foreground">
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
