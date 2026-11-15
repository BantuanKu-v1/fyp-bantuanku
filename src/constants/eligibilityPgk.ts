import type { EligibilityThresholds } from "../utils/eligibility/eligibilityThresholds";

// Static PGK thresholds for preliminary JKM eligibility assessments
// Based on the 2024 PGK adopted by JKM affective 1 January 2026
// All values are in RM per month

export const ELIGIBILITY_PGK_YEAR = 2024;
export const ELIGIBILITY_PGK_SOURCE = "https://www.bernama.com/en/general/news.php?id=2514989";

// JKM food PGK and per capita PGK
export const JKM_PGK_HOUSEHOLD = 1236;
export const JKM_PGK_PER_CAPITA = 348;

// Static thresholds used by the eligibility engine
export const DEFAULT_ELIGIBILITY_THRESHOLDS = {
  BAT_POOR_HOUSEHOLD_PGK: JKM_PGK_HOUSEHOLD,
  BAT_POOR_PER_CAPITA_PGK: JKM_PGK_PER_CAPITA,
} satisfies EligibilityThresholds;
