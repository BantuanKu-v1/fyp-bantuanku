import type { EligibilityOperator } from "../types/eligibility";

export const JKM_PROGRAM_CODES = [
  "BA",
  "BAT",
  "BPT",
  "BWE",
] as const;

export const ELIGIBILITY_LOGIC_OPERATORS = [
  "AND",
  "OR",
] as const;

export const ELIGIBILITY_LIST_OPERATORS: readonly EligibilityOperator[] = [
  "in",
  "not_in",
] as const;

export const SUPPORTED_ELIGIBILITY_OPERATORS: readonly EligibilityOperator[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "not_in",
] as const;

export const JKM_OUTCOMES = [
  "preliminary_match",
  "no_preliminary_match",
  "further_assessment_required",
  "further_approval_required",
] as const;

export type JkmEligibilityOutcome = (typeof JKM_OUTCOMES[number]);

export const JKM_MANUAL_VERIFICATION_OUTCOMES: readonly JkmEligibilityOutcome[] = [
  "further_assessment_required",
  "further_approval_required",
];

export const REQUEST_TIMEOUT_MS = 10000;

export const RELATIONSHIP_CHILD_LABELS: readonly string[] = [
  "child",
  "son",
  "daughter",
] as const;

export const INVALID_COUNTRY_PLACEHOLDERS: readonly string[] = [
  "XX",
  "ZZ",
  "UNKNOWN",
  "N/A",
  "NA",
] as const;

export const MALAYSIA_COUNTRY_VALUES: readonly string[] = [
  "MY",
  "MALAYSIA",
] as const;

export const VALID_ISO_ALPHA2_COUNTRY_CODES = new Set([
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR",
  "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
  "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ",
  "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
  "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR",
  "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI",
  "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS",
  "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK",
  "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
  "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ",
  "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU",
  "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS",
  "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
  "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV",
  "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
  "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA",
  "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
]);
