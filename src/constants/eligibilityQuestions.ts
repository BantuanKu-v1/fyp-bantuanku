import type { EligibilityQuestion } from "../types/eligibilityQuestions";

export const BAT_ELIGIBILITY_QUESTIONS: EligibilityQuestion[] = [
  {
    id: "bat_target_group",
    programCode: "BAT",
    field: "isJkmTargetGroup",
    label: "Are you part of a JKM target group?",
    description:
        "Select your known status. JKM may need to verify this.",
    type: "boolean",
    required: true,
  },
  {
    id: "bat_recommendation",
    programCode: "BAT",
    field: "hasMedicalOrJkmRecommendation",
    label:
        "Do you have a recommendation from a medical professional or JKM?",
    type: "boolean",
    required: true,
  },
  {
    id: "bat_equipment",
    programCode: "BAT",
    field: "requestedAssistiveEquipment",
    label: "Are you requesting assistive equipment?",
    type: "boolean",
    required: true,
  },
  {
    id: "bat_equipment_cost",
    programCode: "BAT",
    field: "estimatedEquipmentCost",
    label: "What is the estimated equipment cost (RM)?",
    description:
        "Enter an estimate if known. You may leave it unanswered.",
    type: "number",
    required: false,
    showWhen: {
      field: "requestedAssistiveEquipment",
      equals: true,
    },
  },
];

export const BPT_ELIGIBILITY_QUESTIONS: EligibilityQuestion[] = [
  {
    id: "bpt_role",
    programCode: "BPT",
    field: "applicantRole",
    label: "Are you applying as a patient or caregiver?",
    type: "select",
    required: true,
    options: [
      { label: "Patient", value: "patient" },
      { label: "Caregiver", value: "caregiver" },
    ],
  },
  {
    id: "bpt_patient_citizenship",
    programCode: "BPT",
    field: "patient.citizenship",
    label: "Is the patient a Malaysian citizen?",
    type: "select",
    required: true,
    options: [
      { label: "Yes", value: "Malaysian" },
      { label: "No", value: "Non-Malaysian" },
    ],
  },
  {
    id: "bpt_patient_residence",
    programCode: "BPT",
    field: "patient.residenceCountry",
    label: "Does the patient currently reside in Malaysia?",
    type: "select",
    required: true,
    options: [
      { label: "Yes", value: "Malaysia" },
      { label: "No", value: "Other" },
    ],
  },
  {
    id: "bpt_patient_oku",
    programCode: "BPT",
    field: "patient.isOku",
    label: "Is the patient a person with disabilities (OKU)?",
    type: "boolean",
    required: true,
  },
  {
    id: "bpt_chronic_illness",
    programCode: "BPT",
    field: "patient.hasChronicIllness",
    label: "Does the patient have a chronic illness?",
    type: "boolean",
    required: true,
  },
  {
    id: "bpt_bedridden",
    programCode: "BPT",
    field: "patient.isBedridden",
    label: "Is the patient bedridden?",
    type: "boolean",
    required: true,
  },
  {
    id: "bpt_continuous_treatment",
    programCode: "BPT",
    field: "patient.requiresContinuousTreatment",
    label: "Does the patient require continuous treatment?",
    type: "boolean",
    required: true,
    showWhen: {
      field: "patient.isBedridden",
      equals: false,
    },
  },
  {
    id: "bpt_treatment_start",
    programCode: "BPT",
    field: "patient.treatmentStartDate",
    label: "When did continuous treatment begin?",
    type: "date",
    required: true,
    showWhen: {
      field: "patient.requiresContinuousTreatment",
      equals: true,
    },
  },
  {
    id: "bpt_has_caregiver",
    programCode: "BPT",
    field: "patient.hasCaregiver",
    label: "Does the patient have a caregiver?",
    type: "boolean",
    required: true,
  },
  {
    id: "bpt_caregiver_citizenship",
    programCode: "BPT",
    field: "caregiverCitizenship",
    label: "Is the caregiver a Malaysian citizen?",
    type: "select",
    required: true,
    options: [
      { label: "Yes", value: "Malaysian" },
      { label: "No", value: "Non-Malaysian" },
    ],
    showWhen: {
      field: "patient.hasCaregiver",
      equals: true,
    },
  },
  {
    id: "bpt_intensive_care",
    programCode: "BPT",
    field: "caregiverProvidesIntensiveCare",
    label: "Does the caregiver provide intensive care?",
    type: "boolean",
    required: true,
    showWhen: {
      field: "applicantRole",
      equals: "caregiver",
    },
  },
];

export const ELIGIBILITY_QUESTIONS = [
  ...BAT_ELIGIBILITY_QUESTIONS,
  ...BPT_ELIGIBILITY_QUESTIONS,
];
