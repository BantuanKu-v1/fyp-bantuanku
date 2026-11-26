import type {
  JkmProgramCode,
  JkmProviderStatus,
} from "../../types/applications";

export const JKM_SUPPORTED_PROGRAM_CODES: readonly JkmProgramCode[] = [
  "BA",
  "BAT",
  "BPT",
  "BWE",
];

export const JKM_REQUIRED_PROFILE_FIELDS = [
  "full_name",
  "identification_no",
  "date_of_birth",
  "citizenship",
] as const;

export const JKM_REQUIRED_ADDRESS_FIELDS = [
  "address_line_1",
  "postcode",
  "city",
  "state_territory",
  "country_code",
] as const;

export const JKM_HOUSEHOLD_REQUIRED_PROGRAM_CODES: readonly JkmProgramCode[] = [
  "BA",
  "BAT",
  "BWE",
];

export const JKM_PROVIDER_STATUSES: readonly JkmProviderStatus[] = [
  "submitted",
  "under_review",
  "additional_information_required",
  "approved",
  "rejected",
  "cancelled",
];

export const JKM_APPLICATION_LABELS = {
  title: "applications.jkm.title",
  description: "applications.jkm.description",

  sections: {
    applicationDetails: "applications.jkm.sections.applicationDetails",
    applicantInformation: "applications.jkm.sections.applicantInformation",
    applicationReadiness: "applications.jkm.sections.applicationReadiness",
    programSpecificInformation: "applications.jkm.sections.programSpecificInformation",
    supportingDocuments: "applications.jkm.sections.supportingDocuments",
    preliminaryEligibility: "applications.jkm.sections.preliminaryEligibility",
    applicationReview: "applications.jkm.sections.applicationReview",
    submissionConfirmation: "applications.jkm.sections.submissionConfirmation",
  },

  fields: {
    program: "applications.jkm.fields.program",
    agency: "applications.jkm.fields.agency",
    applicationId: "applications.jkm.fields.applicationId",
    status: "applications.jkm.fields.status",

    fullName: "applications.jkm.fields.fullName",
    identificationNo: "applications.jkm.fields.identificationNo",
    dateOfBirth: "applications.jkm.fields.dateOfBirth",
    citizenship: "applications.jkm.fields.citizenship",

    referenceNo: "applications.jkm.fields.referenceNo",
    providerApplicationId: "applications.jkm.fields.providerApplicationId",
    providerStatus: "applications.jkm.fields.providerStatus",
    submittedAt: "applications.jkm.fields.submittedAt",
  },

  readiness: {
    applicant: "applications.jkm.readiness.applicant",
    address: "applications.jkm.readiness.address",
    household: "applications.jkm.readiness.household",
    householdMembers: "applications.jkm.readiness.householdMembers",
    programSpecificData: "applications.jkm.readiness.programSpecificData",
    complete: "applications.jkm.readiness.complete",
    incomplete: "applications.jkm.readiness.incomplete",
    notRequired: "applications.jkm.readiness.notRequired",
  },

  buttons: {
    submit: "applications.jkm.buttons.submit",
    alreadySubmitted: "applications.jkm.buttons.alreadySubmitted",
    refresh: "applications.jkm.buttons.refresh",
    saveDraft: "applications.jkm.buttons.saveDraft",
    review: "applications.jkm.buttons.review",
    checkSubmission: "applications.jkm.buttons.checkSubmission",
    confirm: "applications.jkm.buttons.confirm",
    submitting: "applications.jkm.buttons.submitting",
    cancel: "common.cancel",
    continue: "common.continue",
    edit: "common.edit",
    save: "common.save",
  },

  messages: {
    loading: "applications.jkm.messages.loading",
    loadError: "applications.jkm.messages.loadError",
    notProvided: "common.notProvided",
    notAvailable: "applications.jkm.messages.notAvailable",
    attentionRequired: "applications.jkm.messages.attentionRequired",
    missingInformation: "applications.jkm.messages.missingInformation",
    incompleteApplication: "applications.jkm.messages.incompleteApplication",
    draftSaved: "applications.jkm.messages.draftSaved",
    draftSaveError: "applications.jkm.messages.draftSaveError",
    reviewDescription: "applications.jkm.messages.reviewDescription",
    confirmTitle: "applications.jkm.messages.confirmTitle",
    confirmDescription: "applications.jkm.messages.confirmDescription",
    declaration: "applications.jkm.messages.declaration",
    successTitle: "applications.jkm.messages.successTitle",
    successDescription: "applications.jkm.messages.successDescription",
    submissionError: "applications.jkm.messages.submissionError",
    submissionUncertain: "applications.jkm.messages.submissionUncertain",
    invalidConfirmation: "applications.jkm.messages.invalidConfirmation",
    invalidProgram: "applications.jkm.messages.invalidProgram",
    invalidSubmissionState: "applications.jkm.messages.invalidSubmissionState",
    alreadySubmittedTitle: "applications.jkm.messages.alreadySubmittedTitle",
    alreadySubmittedDescription: "applications.jkm.messages.alreadySubmittedDescription",
    existingConfirmation: "applications.jkm.messages.existingConfirmation",
    pendingTitle: "applications.jkm.messages.pendingTitle",
    pendingDescription: "applications.jkm.messages.pendingDescription",
    unknownTitle: "applications.jkm.messages.unknownTitle",
    unknownDescription: "applications.jkm.messages.unknownDescription",
    failedTitle: "applications.jkm.messages.failedTitle",
    failedDescription: "applications.jkm.messages.failedDescription",
    applicationLocked: "applications.jkm.messages.applicationLocked",
    eligibilityDisclaimer: "applications.jkm.messages.eligibilityDisclaimer",
    simulationDisclaimer: "applications.jkm.messages.simulationDisclaimer",
  },

  form: {
    required: "applications.jkm.form.required",
    optional: "applications.jkm.form.optional",
    textPlaceholder: "applications.jkm.form.textPlaceholder",
    amountPlaceholder: "applications.jkm.form.amountPlaceholder",
    countPlaceholder: "applications.jkm.form.countPlaceholder",
    validation: {
      required: "applications.jkm.form.validation.required",
      boolean: "applications.jkm.form.validation.boolean",
      select: "applications.jkm.form.validation.select",
      number: "applications.jkm.form.validation.number",
      nonNegative: "applications.jkm.form.validation.nonNegative",
      integer: "applications.jkm.form.validation.integer",
      date: "applications.jkm.form.validation.date",
      identificationNo: "applications.jkm.form.validation.identificationNo",
      maxLength: "applications.jkm.form.validation.maxLength",
      declarationRequired: "applications.jkm.form.validation.declarationRequired",
    },
  },

  options: {
    yes: "common.yes",
    no: "common.no",
    selectOption: "common.selectOption",
    selectDate: "common.selectDate",

    citizenship: {
      malaysian: "applications.jkm.options.citizenship.malaysian",
      nonMalaysian: "applications.jkm.options.citizenship.nonMalaysian",
    },

    relationship: {
      spouse: "applications.jkm.options.relationship.spouse",
      child: "applications.jkm.options.relationship.child",
      parent: "applications.jkm.options.relationship.parent",
      sibling: "applications.jkm.options.relationship.sibling",
      grandchild: "applications.jkm.options.relationship.grandchild",
      other: "applications.jkm.options.relationship.other",
    },
  },

  health: {
    title: "applications.jkm.health.title",
    isOku: "applications.jkm.health.isOku",
    okuRegistered: "applications.jkm.health.okuRegistered",
    disabilityDescription: "applications.jkm.health.disabilityDescription",
    hasChronicIllness: "applications.jkm.health.hasChronicIllness",
    chronicIllnessDetails: "applications.jkm.health.chronicIllnessDetails",
    isBedridden: "applications.jkm.health.isBedridden",
    requiresContinuousTreatment: "applications.jkm.health.requiresContinuousTreatment",
    treatmentStartDate: "applications.jkm.health.treatmentStartDate",
  },

  programs: {
    ba: "applications.jkm.programs.ba",
    bat: "applications.jkm.programs.bat",
    bpt: "applications.jkm.programs.bpt",
    bwe: "applications.jkm.programs.bwe",
  },
} as const;
