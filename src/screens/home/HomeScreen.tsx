import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";

import {
  getAllJkmEligibilityCriteria,
  getJkmEligibilityCriteria,
  type JkmAllEligibilityResponse,
  type JkmEligibilityResponse,
} from "../../services/api";

import {
  adaptJkmEligibilityResponse,
} from "../../adapters/jkmEligibilityAdapter";

import {
  evaluateProgramEligibility,
} from "../../utils/eligibility/eligibilityEngine";
import { useEligibility } from "../../hooks/useEligibility";

import type {
  EligibilityFacts,
  EligibilityResult,
  EligibilityRule,
  EligibilityStatus,
} from "../../types/eligibility";

// ============================================================
// TYPES
// ============================================================

type RuleMatchState = boolean | null;

interface EngineTestCase {
  id: string;
  name: string;
  description: string;
  expectedStatus: EligibilityStatus;
  expectedRuleStates: Record<string, RuleMatchState>;
  facts: EligibilityFacts;
}

interface RuleStateComparison {
  ruleId: string;
  expected: RuleMatchState;
  actual: RuleMatchState | undefined;
  passed: boolean;
}

interface EngineTestResult {
  id: string;
  name: string;
  description: string;

  expectedStatus: EligibilityStatus;
  actualStatus: EligibilityStatus;

  statusPassed: boolean;
  ruleStatesPassed: boolean;
  passed: boolean;

  ruleComparisons: RuleStateComparison[];

  result: EligibilityResult;
}

interface ExpressionSummary {
  type: string;
  count: number;
}

// ============================================================
// TEST FACTS
// ============================================================

// Build complete simulated facts without changing Supabase data
function createTestFacts(
    overrides: Partial<EligibilityFacts> = {}
): EligibilityFacts {
  return {
    // Personal information
    age: null,
    ageByBirthYear: null,
    citizenship: null,
    residenceCountry: null,
    state: null,
    maritalStatus: null,

    // Financial information
    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: null,
    householdSize: null,
    perCapitaHouseholdIncome: null,

    // Household information
    numberOfDependents: null,
    numberOfEligibleChildren: null,
    hasChildren: null,
    hasEligibleChildren: null,
    isFullTimeStudent: null,
    isFullTimeIptaIptsStudent: null,

    // Welfare assistance information
    receivesJkmMonthlyAssistance: null,
    isJkmTargetGroup: null,

    // Health and disability information
    isOku: null,
    okuRegistered: null,
    hasChronicIllness: null,
    isBedridden: null,
    requiresContinuousTreatment: null,
    continuousTreatmentMonths: null,

    // Living arrangement information
    residesInJkmInstitution: null,
    residesInExcludedCareCentre: null,
    residesInExcludedInstitution: null,
    livesWithFamilyOrCaregiver: null,
    dependsOnFamilyOrCaregiver: null,
    familyOrCaregiverIncomeExceedsPgk: null,

    // Caregiver and patient information
    applicantIsPatient: null,
    applicantIsCaregiver: null,
    patientCitizenship: null,
    patientResidenceCountry: null,
    patientIsOku: null,
    patientHasChronicIllness: null,
    patientIsBedridden: null,
    patientRequiresContinuousTreatment: null,
    patientContinuousTreatmentMonths: null,
    hasCaregiver: null,
    caregiverCitizenship: null,
    caregiverProvidesIntensiveCare: null,

    // Medical and assistive equipment information
    hasMedicalOrJkmRecommendation: null,
    requestedAssistiveEquipment: null,
    estimatedEquipmentCost: null,
    hasHospitalReferral: null,

    // External verification information
    socioeconomicAssessmentRequired: null,
    medicalAssessmentRequired: null,

    // JKM-specific assessment information
    baAdditionalCircumstancesRequireReview: null,
    batRecommendationOrEquipmentRequiresReview: null,
    batSpecialConsiderationRequested: null,
    bptMedicalOrCaregiverReviewRequired: null,

    ...overrides,
  };
}

// ============================================================
// BWE TEST CASES
// ============================================================

const BWE_TEST_CASES: EngineTestCase[] = [
  // ----------------------------------------------------------
  // SCENARIO 1: PRELIMINARY MATCH
  // ----------------------------------------------------------
  {
    id: "eligible",

    name: "Scenario 1: Preliminary Match",

    description:
        "Malaysian resident, 65 years old, RM1,000 household income, " +
        "RM500 per-capita income, and not residing in an excluded institution.",

    expectedStatus: "potentially_eligible",

    expectedRuleStates: {
      "BWE-001": true,
      "BWE-002": false,
      "BWE-003": false,
    },

    facts: createTestFacts({
      age: 65,
      ageByBirthYear: 65,

      citizenship: "Malaysian",
      residenceCountry: "Malaysia",

      monthlyHouseholdIncome: 1000,
      perCapitaHouseholdIncome: 500,

      residesInExcludedInstitution: false,

      // Ensure BWE-002 does not match
      hasChildren: true,
      dependsOnFamilyOrCaregiver: false,
    }),
  },

  // ----------------------------------------------------------
  // SCENARIO 2: NO PRELIMINARY MATCH
  // ----------------------------------------------------------
  {
    id: "ineligible",

    name: "Scenario 2: No Preliminary Match",

    description:
        "Malaysian resident, 45 years old. Both qualifying BWE rules " +
        "fail because the applicant does not meet the age requirement.",

    expectedStatus: "potentially_ineligible",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": false,
      "BWE-003": true,
    },

    facts: createTestFacts({
      age: 45,
      ageByBirthYear: 45,

      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
    }),
  },

  // ----------------------------------------------------------
  // SCENARIO 3: INSUFFICIENT INFORMATION
  // ----------------------------------------------------------
  {
    id: "insufficient",

    name: "Scenario 3: Insufficient Information",

    description:
        "Malaysian resident, 65 years old, but household income, " +
        "children, dependency, and institution information are unknown.",

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": null,
      "BWE-003": null,
    },

    facts: createTestFacts({
      age: 65,
      ageByBirthYear: 65,

      citizenship: "Malaysian",
      residenceCountry: "Malaysia",
    }),
  },

  // ----------------------------------------------------------
  // SCENARIO 4: MANUAL VERIFICATION
  // ----------------------------------------------------------
  {
    id: "manual",

    name: "Scenario 4: Manual Verification",

    description:
        "Malaysian resident, 65 years old, no children, dependent on " +
        "family or caregiver, and family or caregiver income exceeds " +
        "the applicable PGK. Standard BWE income limits are not met.",

    expectedStatus: "manual_verification",

    expectedRuleStates: {
      "BWE-001": false,
      "BWE-002": true,
      "BWE-003": false,
    },

    facts: createTestFacts({
      age: 65,
      ageByBirthYear: 65,

      citizenship: "Malaysian",
      residenceCountry: "Malaysia",

      // Explicitly verified for this simulated applicant
      hasChildren: false,
      dependsOnFamilyOrCaregiver: true,
      familyOrCaregiverIncomeExceedsPgk: true,
      residesInExcludedInstitution: false,

      // Ensure BWE-001 does not match
      monthlyHouseholdIncome: 2000,
      perCapitaHouseholdIncome: 1000,
    }),
  },

  // ----------------------------------------------------------
  // SCENARIO 5: UNKNOWN RULE DEPENDENCIES
  // ----------------------------------------------------------
  {
    id: "unknown-dependencies",

    name: "Scenario 5: Unknown Rule Dependencies",

    description:
        "Malaysian resident, 65 years old, with missing income, " +
        "children, dependency, PGK assessment, and institution " +
        "information. All three BWE rules must remain unknown.",

    expectedStatus: "insufficient_information",

    expectedRuleStates: {
      "BWE-001": null,
      "BWE-002": null,
      "BWE-003": null,
    },

    facts: createTestFacts({
      age: 65,
      ageByBirthYear: 65,

      citizenship: "Malaysian",
      residenceCountry: "Malaysia",

      monthlyHouseholdIncome: null,
      perCapitaHouseholdIncome: null,

      hasChildren: null,
      dependsOnFamilyOrCaregiver: null,
      familyOrCaregiverIncomeExceedsPgk: null,

      residesInExcludedInstitution: null,
    }),
  },
];

// ============================================================
// HELPERS
// ============================================================

// Convert rule match states into readable labels
function formatRuleState(
    state: RuleMatchState | undefined
): string {
  if (state === true) {
    return "Matched";
  }

  if (state === false) {
    return "Not Matched";
  }

  if (state === null) {
    return "Unknown";
  }

  return "Missing Rule";
}

// ============================================================
// EXPRESSION SUMMARY
// ============================================================

// Supports AND, OR, NOT, rule references, and leaf conditions
function getExpressionSummary(
    expression: EligibilityRule["conditions"]
): ExpressionSummary {
  // AND / OR group
  if ("conditions" in expression) {
    return {
      type: expression.operator,
      count: expression.conditions.length,
    };
  }

  // NOT expression
  if ("not" in expression) {
    return {
      type: "NOT",
      count: 1,
    };
  }

  // Reference to another eligibility rule
  if ("ruleMatched" in expression) {
    return {
      type: "RULE_REFERENCE",
      count: 1,
    };
  }

  // Individual eligibility condition
  return {
    type: "CONDITION",
    count: 1,
  };
}

// ============================================================
// JKM RULE VALIDATION
// ============================================================

// Verify that the API returned the expected BWE rule set
function validateBweRules(
    rules: EligibilityRule[]
): void {
  if (!Array.isArray(rules)) {
    throw new Error(
        "JKM adapter did not return a valid rules array."
    );
  }

  const expectedRuleIds = [
    "BWE-001",
    "BWE-002",
    "BWE-003",
  ];

  const actualRuleIds = rules.map(
      (rule) => rule.id
  );

  const allExpectedRulesPresent =
      expectedRuleIds.every(
          (ruleId) => actualRuleIds.includes(ruleId)
      );

  if (
      !allExpectedRulesPresent ||
      rules.length !== expectedRuleIds.length
  ) {
    throw new Error(
        "JKM BWE eligibility rules do not match the expected specification."
    );
  }
}

// ============================================================
// API RESPONSE VALIDATION
// ============================================================

function validateJkmResponse(
    response: JkmEligibilityResponse
): void {
  if (!response?.success) {
    throw new Error(
        "JKM API returned an unsuccessful response."
    );
  }

  if (!response.data) {
    throw new Error(
        "JKM API response does not contain program data."
    );
  }

  if (!response.data.criteria) {
    throw new Error(
        "JKM API response does not contain eligibility criteria."
    );
  }

  if (!Array.isArray(response.data.criteria.rules)) {
    throw new Error(
        "JKM API eligibility criteria must contain a rules array."
    );
  }
}

// ============================================================
// ENGINE TEST
// ============================================================

// Evaluate one simulated applicant
function runEngineTest(
    testCase: EngineTestCase,
    rules: EligibilityRule[]
): EngineTestResult {
  const result = evaluateProgramEligibility(
      "BWE",
      rules,
      testCase.facts
  );

  // Verify the final eligibility status
  const statusPassed =
      result.status === testCase.expectedStatus;

  // Verify individual forward-chaining rule results
  const ruleComparisons: RuleStateComparison[] =
      Object.entries(
          testCase.expectedRuleStates
      ).map(([ruleId, expected]) => {
        const ruleResult = result.ruleResults.find(
            (rule) => rule.ruleId === ruleId
        );

        const actual = ruleResult?.matched;

        return {
          ruleId,
          expected,
          actual,
          passed: actual === expected,
        };
      });

  const ruleStatesPassed =
      ruleComparisons.every(
          (comparison) => comparison.passed
      );

  return {
    id: testCase.id,
    name: testCase.name,
    description: testCase.description,

    expectedStatus: testCase.expectedStatus,
    actualStatus: result.status,

    statusPassed,
    ruleStatesPassed,

    passed:
        statusPassed && ruleStatesPassed,

    ruleComparisons,
    result,
  };
}

// ============================================================
// HOME SCREEN
// ============================================================

export default function HomeScreen() {
  const {
    assessment,
    loading: eligibilityLoading,
    error: eligibilityError,
    assessEligibility,
  } = useEligibility();
  // API integration loading state
  const [loading, setLoading] = useState(false);

  // Eligibility engine loading state
  const [engineLoading, setEngineLoading] =
      useState(false);

  // Error states
  const [error, setError] = useState<
      string | null
  >(null);

  const [engineError, setEngineError] = useState<
      string | null
  >(null);

  // Original JKM API response
  const [eligibility, setEligibility] = useState<
      JkmEligibilityResponse["data"] | null
  >(null);

  // Adapted BantuanKu eligibility rules
  const [adaptedRules, setAdaptedRules] = useState<
      EligibilityRule[]
  >([]);

  // Simulated eligibility engine test results
  const [engineResults, setEngineResults] = useState<
      EngineTestResult[]
  >([]);

  // Independent development-only API viewer; never changes BWE test state.
  const [allCriteria, setAllCriteria] = useState<
      JkmAllEligibilityResponse["data"]
  >([]);
  const [criteriaLoading, setCriteriaLoading] = useState(__DEV__);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [criteriaFetchedAt, setCriteriaFetchedAt] = useState<string | null>(null);
  const [criteriaRefreshKey, setCriteriaRefreshKey] = useState(0);
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    // Ignore stale results after refresh, unmount, or effect cleanup.
    let active = true;

    const fetchAllCriteria = async () => {
      setCriteriaLoading(true);
      setCriteriaError(null);

      try {
        const response = await getAllJkmEligibilityCriteria();

        if (active) {
          setAllCriteria(response.data);
          setCriteriaFetchedAt(new Date().toISOString());
        }
      } catch (err) {
        if (active) {
          setCriteriaError(
              err instanceof Error
                  ? err.message
                  : "Unable to fetch JKM eligibility criteria."
          );
        }
      } finally {
        if (active) {
          setCriteriaLoading(false);
        }
      }
    };

    void fetchAllCriteria();

    return () => {
      active = false;
    };
  }, [criteriaRefreshKey]);

  const handleRefreshAllCriteria = () => {
    if (!__DEV__ || criteriaLoading) {
      return;
    }

    setCriteriaLoading(true);
    setCriteriaRefreshKey((previous) => previous + 1);
  };

  const handleToggleProgramCriteria = (programCode: string) => {
    setExpandedPrograms((previous) => ({
      ...previous,
      [programCode]: !previous[programCode],
    }));
  };

  // ==========================================================
  // TEST JKM API + ADAPTER
  // ==========================================================

  const handleTestJkmApi = async () => {
    setLoading(true);

    setError(null);
    setEngineError(null);

    setEligibility(null);
    setAdaptedRules([]);
    setEngineResults([]);

    try {
      // Step 1: Fetch current BWE eligibility criteria
      const response =
          await getJkmEligibilityCriteria("BWE");

      // Step 2: Validate API response
      validateJkmResponse(response);

      // Step 3: Adapt JKM rules
      const rules = adaptJkmEligibilityResponse(
          response,
          "BWE"
      );

      // Step 4: Validate expected BWE rules
      validateBweRules(rules);

      // Step 5: Log integration results
      console.log(
          "[JKM API] BWE eligibility response:",
          JSON.stringify(response, null, 2)
      );

      console.log(
          "[JKM Adapter] Adapted BWE rules:",
          JSON.stringify(rules, null, 2)
      );

      // Step 6: Update UI
      setEligibility(response.data);
      setAdaptedRules(rules);
    } catch (err) {
      console.error(
          "[JKM API] Integration failed:",
          err
      );

      setError(
          err instanceof Error
              ? err.message
              : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // TEST ELIGIBILITY ENGINE
  // ==========================================================

  const handleTestEligibilityEngine = async () => {
    setEngineLoading(true);

    setEngineError(null);
    setError(null);
    setEngineResults([]);

    try {
      // Step 1: Retrieve current JKM BWE criteria
      const response =
          await getJkmEligibilityCriteria("BWE");

      // Step 2: Validate API response
      validateJkmResponse(response);

      // Step 3: Adapt JKM rules
      const rules = adaptJkmEligibilityResponse(
          response,
          "BWE"
      );

      // Step 4: Validate the expected rule set
      validateBweRules(rules);

      // Step 5: Evaluate all simulated tests
      const results = BWE_TEST_CASES.map(
          (testCase) => runEngineTest(testCase, rules)
      );

      // Step 6: Log complete results for debugging
      console.log(
          "[JKM Engine] BWE test results:",
          JSON.stringify(results, null, 2)
      );

      // Step 7: Ensure comparison arrays are available
      const normalizedResults = results.map(
          (result) => ({
            ...result,
            ruleComparisons:
                result.ruleComparisons ?? [],
          })
      );

      // Step 8: Update UI
      setEligibility(response.data);
      setAdaptedRules(rules);
      setEngineResults(normalizedResults);
    } catch (err) {
      console.error(
          "[JKM Engine] Test failed:",
          err
      );

      setEngineError(
          err instanceof Error
              ? err.message
              : "An unexpected error occurred"
      );
    } finally {
      setEngineLoading(false);
    }
  };

  const handleTestMyEligibility = async () => {
    try {
      const result = await assessEligibility("BWE");
      console.log(
          "[Eligibility] My BWE assessment result:",
          JSON.stringify(result, null, 2)
      );
    } catch (err) {
      console.error(
          "[Eligibility] My BWE assessment failed:",
          err
      );
    }
  };

  // ==========================================================
  // TEST SUMMARY
  // ==========================================================

  const passedTests = engineResults.filter(
      (result) => result.passed
  ).length;

  const allTestsPassed =
      engineResults.length > 0 &&
      passedTests === engineResults.length;

  // ==========================================================
  // RENDER
  // ==========================================================

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

        4. My Applications
        - Display recent applications
        - Navigate to Applications screen

        5. Government Announcements - TBC
        - Retrieve verified assistance announcements
        - Display official source
        - Display last verified date
        - Handle unavailable or outdated information

        6. Upcoming Reminders
        - Fetch upcoming reminders
        - Navigate to program for application
      */}

        {/* ===================================================== */}
        {/* DEVELOPMENT-ONLY JKM INTEGRATION TESTING              */}
        {/* ===================================================== */}

        {__DEV__ && (
            <View className="mt-6 gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              {/* Section title */}
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                JKM Eligibility Integration Testing
              </Text>

              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Test the JKM Mock API, eligibility adapter,
                and forward-chaining eligibility engine.
              </Text>

              {/* ================================================= */}
              {/* TEST BUTTONS                                      */}
              {/* ================================================= */}

              {/* Raw API criteria viewer: independent of the existing BWE tests. */}
              <View className="gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 font-semibold text-gray-900 dark:text-white">
                    Live JKM Criteria ({allCriteria.length} programs)
                  </Text>
                  <Pressable
                      onPress={handleRefreshAllCriteria}
                      disabled={criteriaLoading}
                      accessibilityRole="button"
                      accessibilityLabel="Refresh all JKM eligibility criteria"
                      accessibilityState={{ disabled: criteriaLoading }}
                      className="rounded-md bg-blue-600 px-3 py-2"
                  >
                    <Text className="text-xs font-semibold text-white">
                      {criteriaLoading ? "Fetching…" : "Refresh"}
                    </Text>
                  </Pressable>
                </View>

                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  GET /api/v1/programs/eligibility · Raw API values
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Last successful fetch: {criteriaFetchedAt ?? "Not fetched yet"}
                </Text>

                {criteriaLoading && (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="#2563EB" />
                      <Text className="text-xs text-gray-600 dark:text-gray-400">
                        Fetching current criteria…
                      </Text>
                    </View>
                )}

                {criteriaError && (
                    <Text accessibilityRole="alert" className="text-xs text-red-600 dark:text-red-400">
                      {criteriaError}
                    </Text>
                )}

                {allCriteria.length > 0 && (criteriaLoading || criteriaError) && (
                    <Text className="text-xs text-amber-600 dark:text-amber-400">
                      Showing data from the last successful fetch.
                    </Text>
                )}

                {!criteriaLoading && !criteriaError && allCriteria.length === 0 && criteriaFetchedAt && (
                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                      The API returned no programs.
                    </Text>
                )}

                {allCriteria.map((program) => {
                  const expanded = !!expandedPrograms[program.programCode];

                  return (
                      <View key={program.programCode} className="rounded-md border border-gray-200 dark:border-gray-700">
                        <Pressable
                            onPress={() => handleToggleProgramCriteria(program.programCode)}
                            accessibilityRole="button"
                            accessibilityState={{ expanded }}
                            accessibilityLabel={`${program.programCode}: ${program.programName}`}
                            className="gap-1 p-3"
                        >
                          <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                            {expanded ? "▾" : "▸"} {program.programCode} · {program.programName}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Version {program.version} · {program.criteria.rules.length} rules
                          </Text>
                        </Pressable>

                        {expanded && (
                            <View className="gap-2 px-3 pb-3">
                              <Text className="text-xs text-gray-500 dark:text-gray-400">
                                Criteria schema version: {program.criteria.schemaVersion}
                              </Text>
                              {program.criteria.rules.length === 0 && (
                                  <Text className="text-xs text-gray-600 dark:text-gray-400">
                                    No rules returned for this program.
                                  </Text>
                              )}
                              {program.criteria.rules.map((rule, index) => (
                                  <View key={`${rule.ruleCode}-${index}`} className="gap-1 rounded-md bg-gray-50 p-2 dark:bg-gray-800">
                                    <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                                      {rule.ruleCode} · {rule.name}
                                    </Text>
                                    <Text className="text-xs text-gray-700 dark:text-gray-300">
                                      Outcome: {rule.result}
                                    </Text>
                                    <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      Conditions (raw API JSON)
                                    </Text>
                                    <Text selectable className="text-xs text-gray-600 dark:text-gray-400">
                                      {JSON.stringify(rule.conditions, null, 2)}
                                    </Text>
                                  </View>
                              ))}
                            </View>
                        )}
                      </View>
                  );
                })}
              </View>

              {/* API and adapter test */}
              <Pressable
                  onPress={handleTestJkmApi}
                  disabled={loading || engineLoading}
                  className="items-center rounded-lg bg-blue-600 px-4 py-3"
              >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text className="font-semibold text-white">
                      Test JKM Integration (BWE)
                    </Text>
                )}
              </Pressable>

              {/* Eligibility engine test */}
              <Pressable
                  onPress={handleTestEligibilityEngine}
                  disabled={
                      loading ||
                      engineLoading ||
                      eligibilityLoading
                  }
                  className="items-center rounded-lg bg-indigo-600 px-4 py-3"
              >
                {engineLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text className="font-semibold text-white">
                      Test BWE Eligibility Engine
                    </Text>
                )}
              </Pressable>

              <Pressable
                  onPress={handleTestMyEligibility}
                  disabled={
                      loading ||
                      engineLoading ||
                      eligibilityLoading
                  }
                  className="items-center rounded-lg bg-emerald-600 px-4 py-3"
              >
                {eligibilityLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text className="font-semibold text-white">
                      Test My Eligibility (BWE)
                    </Text>
                )}
              </Pressable>

              {/* ================================================= */}
              {/* ERROR MESSAGES                                    */}
              {/* ================================================= */}

              {/* API integration error */}
              {error && (
                  <View className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                    <Text className="font-medium text-red-600 dark:text-red-400">
                      Integration Failed
                    </Text>

                    <Text className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </Text>
                  </View>
              )}

              {/* Eligibility engine error */}
              {engineError && (
                  <View className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                    <Text className="font-medium text-red-600 dark:text-red-400">
                      Eligibility Engine Test Failed
                    </Text>

                    <Text className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {engineError}
                    </Text>
                  </View>
              )}

              {eligibilityError && (
                  <View className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                    <Text className="font-medium text-red-600 dark:text-red-400">
                      My Eligibility Test Failed
                    </Text>

                    <Text className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {eligibilityError}
                    </Text>
                  </View>
              )}

              {/* ================================================= */}
              {/* API + ADAPTER INTEGRATION RESULTS                 */}
              {/* ================================================= */}

              {eligibility && adaptedRules.length > 0 && (
                  <View className="gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                    <Text className="font-semibold text-green-700 dark:text-green-400">
                      Integration Successful
                    </Text>

                    <Text className="text-sm text-green-700 dark:text-green-400">
                      JKM API connection and eligibility rule
                      conversion completed.
                    </Text>

                    {/* Program information */}
                    <View className="gap-1">
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
                        API Rules:{" "}
                        {Array.isArray(
                            eligibility.criteria?.rules
                        )
                            ? eligibility.criteria.rules.length
                            : 0}
                      </Text>

                      <Text className="text-gray-900 dark:text-white">
                        Adapted Rules: {adaptedRules.length}
                      </Text>
                    </View>

                    {/* Adapted eligibility rules */}
                    <View className="mt-2 gap-3">
                      <Text className="font-semibold text-gray-900 dark:text-white">
                        Adapted Eligibility Rules
                      </Text>

                      {(adaptedRules ?? []).map((rule) => {
                        const expressionSummary =
                            getExpressionSummary(
                                rule.conditions
                            );

                        return (
                            <View
                                key={rule.id}
                                className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                            >
                              <Text className="font-semibold text-gray-900 dark:text-white">
                                {rule.id}
                              </Text>

                              <Text className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                {rule.name}
                              </Text>

                              <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Government Outcome:{" "}
                                {rule.governmentOutcome}
                              </Text>

                              <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                BantuanKu Outcome: {rule.outcome}
                              </Text>

                              <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Root Operator:{" "}
                                {expressionSummary.type}
                              </Text>

                              <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Root Conditions:{" "}
                                {expressionSummary.count}
                              </Text>

                              {rule.requiresManualVerification && (
                                  <Text className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                                    Additional JKM verification required
                                  </Text>
                              )}

                              {rule.outcomeDescription && (
                                  <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    {rule.outcomeDescription}
                                  </Text>
                              )}
                            </View>
                        );
                      })}
                    </View>

                    <Text className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      These rules provide preliminary eligibility
                      guidance only. They do not represent official
                      JKM approval.
                    </Text>
                  </View>
              )}

              {/* ================================================= */}
              {/* ELIGIBILITY ENGINE TEST RESULTS                   */}
              {/* ================================================= */}

              {engineResults.length > 0 && (
                  <View className="gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    {/* Results title */}
                    <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                      BWE Eligibility Engine Results
                    </Text>

                    {/* Test summary */}
                    <View
                        className={
                          allTestsPassed
                              ? "rounded-lg bg-green-50 p-3 dark:bg-green-950"
                              : "rounded-lg bg-red-50 p-3 dark:bg-red-950"
                        }
                    >
                      <Text
                          className={
                            allTestsPassed
                                ? "font-semibold text-green-700 dark:text-green-400"
                                : "font-semibold text-red-700 dark:text-red-400"
                          }
                      >
                        Tests Passed: {passedTests}/
                        {engineResults.length}
                      </Text>

                      <Text className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {allTestsPassed
                            ? "All simulated BWE scenarios passed."
                            : "Some scenarios failed. Review the rule comparisons below."}
                      </Text>
                    </View>

                    {/* Individual scenarios */}
                    {(engineResults ?? []).map((test) => (
                        <View
                            key={test.id}
                            className="gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                        >
                          {/* Scenario name */}
                          <Text className="font-semibold text-gray-900 dark:text-white">
                            {test.name}
                          </Text>

                          {/* Scenario description */}
                          <Text className="text-sm text-gray-600 dark:text-gray-400">
                            {test.description}
                          </Text>

                          {/* Expected status */}
                          <Text className="text-sm text-gray-900 dark:text-white">
                            Expected Status: {test.expectedStatus}
                          </Text>

                          {/* Actual status */}
                          <Text className="text-sm text-gray-900 dark:text-white">
                            Actual Status: {test.actualStatus}
                          </Text>

                          {/* Status validation */}
                          <Text
                              className={
                                test.statusPassed
                                    ? "text-xs font-medium text-green-600 dark:text-green-400"
                                    : "text-xs font-medium text-red-600 dark:text-red-400"
                              }
                          >
                            Status Validation:{" "}
                            {test.statusPassed ? "PASS" : "FAIL"}
                          </Text>

                          {/* Rule validation */}
                          <Text
                              className={
                                test.ruleStatesPassed
                                    ? "text-xs font-medium text-green-600 dark:text-green-400"
                                    : "text-xs font-medium text-red-600 dark:text-red-400"
                              }
                          >
                            Rule Validation:{" "}
                            {test.ruleStatesPassed ? "PASS" : "FAIL"}
                          </Text>

                          {/* Overall scenario result */}
                          <Text
                              className={
                                test.passed
                                    ? "font-semibold text-green-600 dark:text-green-400"
                                    : "font-semibold text-red-600 dark:text-red-400"
                              }
                          >
                            Overall: {test.passed ? "PASS" : "FAIL"}
                          </Text>

                          {/* Matched rule IDs */}
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Matched Rules:{" "}
                            {Array.isArray(
                                test.result?.matchedRuleIds
                            ) &&
                            test.result.matchedRuleIds.length > 0
                                ? test.result.matchedRuleIds.join(", ")
                                : "None"}
                          </Text>

                          {/* Missing conditions */}
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Missing Conditions:{" "}
                            {Array.isArray(
                                test.result?.missingInformation
                            )
                                ? test.result.missingInformation.length
                                : 0}
                          </Text>

                          {/* ========================================= */}
                          {/* INDIVIDUAL RULE COMPARISONS               */}
                          {/* ========================================= */}

                          <View className="mt-2 gap-2">
                            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                              Forward-Chaining Rule Validation
                            </Text>

                            {(
                                test.ruleComparisons ?? []
                            ).map((comparison) => (
                                <View
                                    key={comparison.ruleId}
                                    className="rounded-md bg-gray-50 p-3 dark:bg-gray-800"
                                >
                                  <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                                    {comparison.ruleId}
                                  </Text>

                                  <Text className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    Expected: {formatRuleState(comparison.expected)}
                                  </Text>

                                  <Text className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    Actual:{" "}
                                    {formatRuleState(
                                        comparison.actual
                                    )}
                                  </Text>

                                  <Text
                                      className={
                                        comparison.passed
                                            ? "mt-1 text-xs font-semibold text-green-600 dark:text-green-400"
                                            : "mt-1 text-xs font-semibold text-red-600 dark:text-red-400"
                                      }
                                  >
                                    {comparison.passed
                                        ? "PASS"
                                        : "FAIL"}
                                  </Text>
                                </View>
                            ))}
                          </View>
                        </View>
                    ))}

                    {/* Testing disclaimer */}
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      These tests use simulated applicant information.
                      No real Supabase records are modified.
                      Results are preliminary and do not represent
                      official JKM eligibility decisions.
                    </Text>
                  </View>
              )}

              {assessment && (
                  <View className="gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-950">
                    <Text className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                      My Preliminary Eligibility (Supabase)
                    </Text>

                    <Text className="text-sm text-gray-900 dark:text-white">
                      Program Code: {assessment.programCode}
                    </Text>

                    <Text className="text-sm text-gray-900 dark:text-white">
                      Criteria Version: {assessment.criteriaVersion}
                    </Text>

                    <Text className="text-sm text-gray-900 dark:text-white">
                      Eligibility Status: {assessment.result.status}
                    </Text>

                    <Text className="text-sm text-gray-900 dark:text-white">
                      Matched Rules:{" "}
                      {assessment.result.matchedRuleIds.length > 0
                          ? assessment.result.matchedRuleIds.join(
                              ", "
                          )
                          : "None"}
                    </Text>

                    <Text className="text-sm text-gray-900 dark:text-white">
                      Missing Information:{" "}
                      {assessment.result.missingInformation.length > 0
                          ? assessment.result.missingInformation.join(
                              ", "
                          )
                          : "None"}
                    </Text>

                    <Text className="text-sm text-gray-900 dark:text-white">
                      Assessed At: {assessment.assessedAt}
                    </Text>

                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                      This is a preliminary eligibility assessment
                      and does not represent an official JKM
                      eligibility decision.
                    </Text>
                  </View>
              )}
            </View>
        )}
      </Screen>
  );
}
