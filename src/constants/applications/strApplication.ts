export const STR_REQUIRED_PROFILE_FIELDS = [
  "full_name",
  "identification_no",
  "date_of_birth",
  "citizenship",
] as const;

export const STR_REQUIRED_ADDRESS_FIELDS = [
  "address_line_1",
  "postcode",
  "city",
  "state_territory",
  "country_code",
] as const;

export const STR_APPLICATION_LABELS = {
  title: "applications.str.title",
  description: "applications.str.description",

  sections: {
    applicationDetails: "applications.str.sections.applicationDetails",
    applicantInformation: "applications.str.sections.applicantInformation",
    applicationReadiness: "applications.str.sections.applicationReadiness",
    submissionConfirmation: "applications.str.sections.submissionConfirmation",
  },

  fields: {
    program: "applications.str.fields.program",
    agency: "applications.str.fields.agency",
    applicationId: "applications.str.fields.applicationId",
    status: "applications.str.fields.status",
    fullName: "applications.str.fields.fullName",
    identificationNo: "applications.str.fields.identificationNo",
    dateOfBirth: "applications.str.fields.dateOfBirth",
    citizenship: "applications.str.fields.citizenship",
    referenceNo: "applications.str.fields.referenceNo",
    providerApplicationId: "applications.str.fields.providerApplicationId",
    providerStatus: "applications.str.fields.providerStatus",
    submittedAt: "applications.str.fields.submittedAt",
  },

  readiness: {
    applicant: "applications.str.readiness.applicant",
    address: "applications.str.readiness.address",
    household: "applications.str.readiness.household",
    householdMembers: "applications.str.readiness.householdMembers",
    complete: "applications.str.readiness.complete",
    incomplete: "applications.str.readiness.incomplete",
  },

  buttons: {
    submit: "applications.str.buttons.submit",
    refresh: "applications.str.buttons.refresh",
    alreadySubmitted: "applications.str.buttons.alreadySubmitted",
    cancel: "applications.str.buttons.cancel",
    confirm: "applications.str.buttons.confirm",
  },

  messages: {
    loading: "applications.str.messages.loading",
    notProvided: "applications.str.messages.notProvided",
    attentionRequired: "applications.str.messages.attentionRequired",
    missingInformation: "applications.str.messages.missingInformation",
    loadError: "applications.str.messages.loadError",
    submissionError: "applications.str.messages.submissionError",
    submissionUncertain: "applications.str.messages.submissionUncertain",
    invalidConfirmation: "applications.str.messages.invalidConfirmation",
    confirmTitle: "applications.str.messages.confirmTitle",
    confirmDescription: "applications.str.messages.confirmDescription",
    successTitle: "applications.str.messages.successTitle",
    successDescription: "applications.str.messages.successDescription",
    alreadySubmittedTitle: "applications.str.messages.alreadySubmittedTitle",
    alreadySubmittedDescription: "applications.str.messages.alreadySubmittedDescription",
    existingConfirmation: "applications.str.messages.existingConfirmation",
    notAvailable: "applications.str.messages.notAvailable",
  },
} as const;
