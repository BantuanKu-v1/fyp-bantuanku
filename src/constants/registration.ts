import {RegistrationDocumentSection} from "../types/documents";

export const CITIZENSHIP_VALUES = [
  "malaysian",
  "non_malaysian",
] as const;

export type CitizenshipValue = typeof CITIZENSHIP_VALUES[number];

export const STATE_TERRITORY_VALUES = [
  "johor",
  "kedah",
  "kelantan",
  "melaka",
  "negeri_sembilan",
  "pahang",
  "penang",
  "perak",
  "perlis",
  "sabah",
  "sarawak",
  "selangor",
  "terengganu",
  "kuala_lumpur",
  "labuan",
  "putrajaya",
] as const;

export type StateTerritoryValue = typeof STATE_TERRITORY_VALUES[number];

export const STATE_TERRITORY_MAP: Record<StateTerritoryValue, string> = {
  johor: "Johor",
  kedah: "Kedah",
  kelantan: "Kelantan",
  melaka: "Melaka",
  negeri_sembilan: "Negeri Sembilan",
  pahang: "Pahang",
  penang: "Pulau Pinang",
  perak: "Perak",
  perlis: "Perlis",
  sabah: "Sabah",
  sarawak: "Sarawak",
  selangor: "Selangor",
  terengganu: "Terengganu",
  kuala_lumpur: "Kuala Lumpur",
  labuan: "Labuan",
  putrajaya: "Putrajaya",
};

export const EMPLOYMENT_STATUS_VALUES = [
  "employed",
  "self_employed",
  "unemployed",
  "retired",
  "homemaker",
  "not_working",
] as const;

export type EmploymentStatusValue = typeof EMPLOYMENT_STATUS_VALUES[number];

export const INCOME_SOURCE_VALUES = [
  "salary",
  "self_employment",
  "pension",
  "government_assistance",
  "family_support",
  "savings",
  "other",
  "no_income",
] as const;

export type IncomeSourceValue = typeof INCOME_SOURCE_VALUES[number];

export const HOUSEHOLD_RELATIONSHIP_VALUES = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "grandchild",
  "other",
] as const;

export type HouseholdRelationshipValue = typeof HOUSEHOLD_RELATIONSHIP_VALUES[number];

export const REGISTRATION_DOCUMENT_SECTIONS:
    RegistrationDocumentSection[] = [
  {
    type: "identity_document",
    titleKey: "auth.register.documents.identity.title",
    descriptionKey: "auth.register.documents.identity.description",
    multiple: false,
  },
  {
    type: "income_proof",
    titleKey: "auth.register.documents.income.title",
    descriptionKey: "auth.register.documents.income.description",
    multiple: true,
    maxFiles: 3,
  },
  {
    type: "utility_bill",
    titleKey: "auth.register.documents.address.title",
    descriptionKey: "auth.register.documents.address.description",
    multiple: false,
  },
  {
    type: "bank_account_proof",
    titleKey: "auth.register.documents.bank.title",
    descriptionKey: "auth.register.documents.bank.description",
    multiple: false,
  },
];

// Link: https://www.jpn.gov.my/en/information/state-code/
export const MYKAD_BIRTHPLACE_CODES = [
  "01", "21", "22", "23", "24",
  "02", "25", "26", "27",
  "03", "28", "29",
  "04", "30",
  "05", "31", "59",
  "06", "32", "33",
  "07", "34", "35",
  "08", "36", "37", "38", "39",
  "09", "40",
  "10", "41", "42", "43", "44",
  "11", "45", "46",
  "12", "47", "48", "49",
  "13", "50", "51", "52", "53",
  "14", "54", "55", "56", "57",
  "15", "58",
  "16",
  "82"
] as const;
