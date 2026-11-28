export const HOUSEHOLD_RELATIONSHIP_KEYS = {
  spouse: "profile.household.relationship.spouse",
  child: "profile.household.relationship.child",
  parent: "profile.household.relationship.parent",
  sibling: "profile.household.relationship.sibling",
  grandchild: "profile.household.relationship.grandchild",
  other: "profile.household.relationship.other"
} as const;

export const HOUSEHOLD_GENDER_KEYS = {
  male: "profile.household.add.options.male",
  female: "profile.household.add.options.female"
} as const;

export const HOUSEHOLD_CITIZENSHIP_KEYS = {
  malaysian: "profile.household.add.options.malaysian",
  non_malaysian: "profile.household.add.options.nonMalaysian"
} as const;

export const HOUSEHOLD_EMPLOYMENT_KEYS = {
  employed: "profile.household.add.options.employed",
  self_employed: "profile.household.add.options.selfEmployed",
  unemployed: "profile.household.add.options.unemployed",
  retired: "profile.household.add.options.retired",
  homemaker: "profile.household.add.options.homemaker",
  not_working: "profile.household.add.options.notWorking"
} as const;

export const HOUSEHOLD_STUDY_MODE_KEYS = {
  full_time: "profile.household.add.options.fullTime",
  part_time: "profile.household.add.options.partTime"
} as const;

export const HOUSEHOLD_INSTITUTION_TYPE_KEYS = {
  school: "profile.household.add.options.school",
  college: "profile.household.add.options.college",
  university: "profile.household.add.options.university",
  other: "profile.household.add.options.other"
} as const;

export const HOUSEHOLD_YES_NO_KEYS = {
  yes: "common.yes",
  no: "common.no"
} as const;

export const HOUSEHOLD_OPTIONAL_YES_NO_KEYS = {
  "": "common.notProvided",
  ...HOUSEHOLD_YES_NO_KEYS
} as const;
