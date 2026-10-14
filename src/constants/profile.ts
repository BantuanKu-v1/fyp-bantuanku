export const MARITAL_STATUSES = [
  "single",
  "married",
  "divorced",
  "widowed"
] as const;

export const EMPLOYMENT_STATUSES = [
  "employed",
  "self_employed",
  "unemployed",
  "retired",
  "homemaker",
  "not_working"
] as const;

export const STUDY_MODES = [
  "full_time",
  "part_time"
] as const;

export const INSTITUTION_TYPES = [
  "school",
  "college",
  "university",
  "other"
] as const;

export const EMPLOYMENT_STATUS_KEYS: Record<string, string> = {
  employed: "employed",
  self_employed: "selfEmployed",
  unemployed: "unemployed",
  retired: "retired",
  homemaker: "homemaker",
  not_working: "notWorking"
};

export const STUDY_MODE_KEYS: Record<string, string> = {
  full_time: "fullTime",
  part_time: "partTime"
};

export const INSTITUTION_TYPE_KEYS: Record<string, string> = {
  school: "school",
  college: "college",
  university: "university",
  other: "other"
};
