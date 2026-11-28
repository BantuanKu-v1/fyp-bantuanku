import { HttpError } from "../../_shared/response.ts";

import {
  mapCommonApplicationData,
  mapHealth,
  mapRequiredText,
  mapNullableText,
  mapNullableBoolean,
  mapNullableDate,
  mapNullableIdentificationNo,
  mapNullableCitizenship,
  mapNullableInteger,
  type JkmCommonMapperInput,
} from "./common-mapper.ts";

import type {
  JkmApplicantData,
  JkmHealthData,
  JkmCaregiverData,
  BptApplicationPathway,
  BptSelfApplicationReason,
  BptPatientData,
  BptMedicalConfirmationData,
  BptProgramSpecificData,
  BptApplicationData,
} from "../jkm-types.ts";

// BPT-specific mapper input
export interface BptPatientMapperInput {
  fullName?: unknown;
  identificationNo?: unknown;
  citizenship?: unknown;
  relationshipToApplicant?: unknown;

  isOku?: unknown;
  okuRegistered?: unknown;
  hasChronicIllness?: unknown;
  chronicIllnessDetails?: unknown;
  isBedridden?: unknown;
  requiresContinuousTreatment?: unknown;
  treatmentStartDate?: unknown;
}

export interface BptCaregiverMapperInput {
  fullName?: unknown;
  identificationNo?: unknown;
  citizenship?: unknown;
  relationship?: unknown;
  providesIntensiveCare?: unknown;
  eligiblePersonsCaredFor?: unknown;
}

export interface BptMedicalConfirmationMapperInput {
  medicalConfirmationAvailable?: unknown;
  medicalInstitution?: unknown;
  medicalOfficerName?: unknown;
  diagnosisDetails?: unknown;
  treatmentDetails?: unknown;
  specialistDetails?: unknown;
}

export interface BptSpecificMapperInput {
  applicationPathway: unknown;

  patient: BptPatientMapperInput;

  caregiver?: BptCaregiverMapperInput | null;

  medicalConfirmation: BptMedicalConfirmationMapperInput;

  reasonForSelfApplication?: unknown;
  additionalRemarks?: unknown;
}

export interface BptMapperInput
    extends JkmCommonMapperInput {
  bptSpecificData: BptSpecificMapperInput;
}

// BPT application pathway
function mapBptApplicationPathway(
    value: unknown
): BptApplicationPathway {
  if (
      value === "caregiver" ||
      value === "non_bedridden_patient" ||
      value === "bedridden_patient_without_eligible_caregiver"
  ) {
    return value;
  }

  throw new HttpError(
      422,
      "Please select a valid BPT application pathway"
  );
}

// Reason for self-application
function mapBptSelfApplicationReason(
    value: unknown
): BptSelfApplicationReason | null {
  const reason = mapNullableText(
      value,
      "Reason for self-application",
      100
  );

  if (reason === null) {
    return null;
  }

  if (
      reason === "no_caregiver" ||
      reason === "non_malaysian_caregiver"
  ) {
    return reason;
  }

  throw new HttpError(
      422,
      "Invalid reason for self-application"
  );
}

// BPT patient information
export function mapBptPatient(
    input: BptPatientMapperInput,
    pathway: BptApplicationPathway,
    applicant: JkmApplicantData,
    applicantHealth: JkmHealthData
): BptPatientData {
  const patientIsApplicant =
      pathway !== "caregiver";

  const declaredName = mapNullableText(
      input.fullName,
      "Patient full name",
      150
  );

  const declaredIdentificationNo =
      mapNullableIdentificationNo(
          input.identificationNo,
          "Patient identification number"
      );

  const declaredCitizenship =
      mapNullableCitizenship(
          input.citizenship,
          "Patient citizenship"
      );

  // Applicant is also the patient
  if (patientIsApplicant) {
    if (
        declaredName !== null &&
        declaredName !== applicant.fullName
    ) {
      throw new HttpError(
          422,
          "The patient name must match the applicant name"
      );
    }

    if (
        declaredIdentificationNo !== null &&
        declaredIdentificationNo !==
        applicant.identificationNo
    ) {
      throw new HttpError(
          422,
          "The patient identification number must match the applicant identification number"
      );
    }

    if (
        declaredCitizenship !== null &&
        declaredCitizenship !== applicant.citizenship
    ) {
      throw new HttpError(
          422,
          "The patient citizenship must match the applicant citizenship"
      );
    }

    // Applicant health information takes precedence
    // Patient-specific answers are used when profile information is unavailable
    return {
      fullName: applicant.fullName,

      identificationNo:
      applicant.identificationNo,

      citizenship: applicant.citizenship,

      relationshipToApplicant: null,

      isOku:
          applicantHealth.isOku ??
          mapNullableBoolean(
              input.isOku,
              "Patient OKU status"
          ),

      okuRegistered:
          applicantHealth.okuRegistered ??
          mapNullableBoolean(
              input.okuRegistered,
              "Patient OKU registration"
          ),

      hasChronicIllness:
          applicantHealth.hasChronicIllness ??
          mapNullableBoolean(
              input.hasChronicIllness,
              "Patient chronic illness status"
          ),

      chronicIllnessDetails:
          applicantHealth.chronicIllnessDetails ??
          mapNullableText(
              input.chronicIllnessDetails,
              "Patient chronic illness details",
              2000
          ),

      isBedridden:
          applicantHealth.isBedridden ??
          mapNullableBoolean(
              input.isBedridden,
              "Patient bedridden status"
          ),

      requiresContinuousTreatment:
          applicantHealth.requiresContinuousTreatment ??
          mapNullableBoolean(
              input.requiresContinuousTreatment,
              "Patient continuous treatment requirement"
          ),

      treatmentStartDate:
          applicantHealth.treatmentStartDate ??
          mapNullableDate(
              input.treatmentStartDate,
              "Patient treatment start date"
          ),
    };
  }

  // Applicant is applying as a caregiver
  // Patient information must describe another individual
  if (
      declaredIdentificationNo !== null &&
      declaredIdentificationNo ===
      applicant.identificationNo
  ) {
    throw new HttpError(
        422,
        "The patient must not have the same identification number as the caregiver applicant"
    );
  }

  return {
    fullName: mapRequiredText(
        input.fullName,
        "Patient full name",
        150
    ),

    identificationNo:
    declaredIdentificationNo,

    citizenship: declaredCitizenship,

    relationshipToApplicant: mapRequiredText(
        input.relationshipToApplicant,
        "Patient relationship to applicant",
        50
    ),

    // Never substitute the caregiver applicant's health information for the patient's information
    isOku: mapNullableBoolean(
        input.isOku,
        "Patient OKU status"
    ),

    okuRegistered: mapNullableBoolean(
        input.okuRegistered,
        "Patient OKU registration"
    ),

    hasChronicIllness: mapNullableBoolean(
        input.hasChronicIllness,
        "Patient chronic illness status"
    ),

    chronicIllnessDetails: mapNullableText(
        input.chronicIllnessDetails,
        "Patient chronic illness details",
        2000
    ),

    isBedridden: mapNullableBoolean(
        input.isBedridden,
        "Patient bedridden status"
    ),

    requiresContinuousTreatment: mapNullableBoolean(
        input.requiresContinuousTreatment,
        "Patient continuous treatment requirement"
    ),

    treatmentStartDate: mapNullableDate(
        input.treatmentStartDate,
        "Patient treatment start date"
    ),
  };
}

// BPT caregiver information
export function mapBptCaregiver(
    input: BptCaregiverMapperInput | null | undefined,
    pathway: BptApplicationPathway,
    applicant: JkmApplicantData
): JkmCaregiverData | null {
  // Applicant is applying as a caregiver
  if (pathway === "caregiver") {
    if (input === null || input === undefined) {
      throw new HttpError(
          422,
          "Caregiver information is required"
      );
    }

    const declaredName = mapNullableText(
        input.fullName,
        "Caregiver full name",
        150
    );

    const declaredIdentificationNo =
        mapNullableIdentificationNo(
            input.identificationNo,
            "Caregiver identification number"
        );

    const declaredCitizenship =
        mapNullableCitizenship(
            input.citizenship,
            "Caregiver citizenship"
        );

    if (
        declaredName !== null &&
        declaredName !== applicant.fullName
    ) {
      throw new HttpError(
          422,
          "The caregiver name must match the applicant name"
      );
    }

    if (
        declaredIdentificationNo !== null &&
        declaredIdentificationNo !==
        applicant.identificationNo
    ) {
      throw new HttpError(
          422,
          "The caregiver identification number must match the applicant identification number"
      );
    }

    if (
        declaredCitizenship !== null &&
        declaredCitizenship !== applicant.citizenship
    ) {
      throw new HttpError(
          422,
          "The caregiver citizenship must match the applicant citizenship"
      );
    }

    return {
      fullName: applicant.fullName,

      identificationNo:
      applicant.identificationNo,

      citizenship: applicant.citizenship,

      relationship: mapNullableText(
          input.relationship,
          "Caregiver relationship",
          50
      ),

      providesIntensiveCare: mapNullableBoolean(
          input.providesIntensiveCare,
          "Caregiver intensive care status"
      ),

      eligiblePersonsCaredFor: mapNullableInteger(
          input.eligiblePersonsCaredFor,
          "Eligible persons cared for"
      ),
    };
  }

  // Applicant is the patient
  // A separate caregiver may or may not exist
  if (input === null || input === undefined) {
    return null;
  }

  return {
    fullName: mapRequiredText(
        input.fullName,
        "Caregiver full name",
        150
    ),

    identificationNo: mapNullableIdentificationNo(
        input.identificationNo,
        "Caregiver identification number"
    ),

    citizenship: mapNullableCitizenship(
        input.citizenship,
        "Caregiver citizenship"
    ),

    relationship: mapNullableText(
        input.relationship,
        "Caregiver relationship",
        50
    ),

    providesIntensiveCare: mapNullableBoolean(
        input.providesIntensiveCare,
        "Caregiver intensive care status"
    ),

    eligiblePersonsCaredFor: mapNullableInteger(
        input.eligiblePersonsCaredFor,
        "Eligible persons cared for"
    ),
  };
}

// BPT medical confirmation
export function mapBptMedicalConfirmation(
    input: BptMedicalConfirmationMapperInput
): BptMedicalConfirmationData {
  return {
    medicalConfirmationAvailable: mapNullableBoolean(
        input.medicalConfirmationAvailable,
        "Medical confirmation availability"
    ),

    medicalInstitution: mapNullableText(
        input.medicalInstitution,
        "Medical institution",
        150
    ),

    medicalOfficerName: mapNullableText(
        input.medicalOfficerName,
        "Medical officer name",
        150
    ),

    diagnosisDetails: mapNullableText(
        input.diagnosisDetails,
        "Medical diagnosis details",
        3000
    ),

    treatmentDetails: mapNullableText(
        input.treatmentDetails,
        "Medical treatment details",
        3000
    ),

    specialistDetails: mapNullableText(
        input.specialistDetails,
        "Medical specialist details",
        2000
    ),
  };
}

// Validate BPT application pathway
function validateBptApplicationPathway(
    pathway: BptApplicationPathway,
    patient: BptPatientData,
    caregiver: JkmCaregiverData | null,
    reasonForSelfApplication: BptSelfApplicationReason | null
): void {
  // Patient and caregiver must be different individuals
  if (
      caregiver !== null &&
      patient.identificationNo !== null &&
      caregiver.identificationNo !== null &&
      patient.identificationNo ===
      caregiver.identificationNo
  ) {
    throw new HttpError(
        422,
        "The patient and caregiver must be different individuals"
    );
  }

  // Pathway 1 - Caregiver application
  if (pathway === "caregiver") {
    if (caregiver === null) {
      throw new HttpError(
          422,
          "Caregiver information is required"
      );
    }

    if (caregiver.providesIntensiveCare !== true) {
      throw new HttpError(
          422,
          "The caregiver must confirm that intensive care is provided"
      );
    }

    if (patient.relationshipToApplicant === null) {
      throw new HttpError(
          422,
          "The patient's relationship to the applicant is required"
      );
    }

    if (patient.isBedridden !== true) {
      throw new HttpError(
          422,
          "The patient must be bedridden for the caregiver application pathway"
      );
    }

    if (reasonForSelfApplication !== null) {
      throw new HttpError(
          422,
          "A reason for self-application is not applicable to the caregiver pathway"
      );
    }

    return;
  }

  // Pathway 2 - Non-bedridden patient
  if (pathway === "non_bedridden_patient") {
    if (patient.isBedridden !== false) {
      throw new HttpError(
          422,
          "Please confirm that the patient is not bedridden"
      );
    }

    if (patient.hasChronicIllness !== true) {
      throw new HttpError(
          422,
          "Please confirm the patient's chronic illness"
      );
    }

    if (
        patient.requiresContinuousTreatment !== true
    ) {
      throw new HttpError(
          422,
          "Please confirm that the patient requires continuous treatment"
      );
    }

    if (patient.treatmentStartDate === null) {
      throw new HttpError(
          422,
          "The patient's treatment start date is required"
      );
    }

    if (reasonForSelfApplication !== null) {
      throw new HttpError(
          422,
          "A reason for self-application is not applicable to the non-bedridden patient pathway"
      );
    }

    return;
  }

  // Pathway 3 - Bedridden patient without an eligible caregiver
  if (patient.isBedridden !== true) {
    throw new HttpError(
        422,
        "Please confirm that the patient is bedridden"
    );
  }

  if (reasonForSelfApplication === null) {
    throw new HttpError(
        422,
        "Please provide a reason for self-application"
    );
  }

  if (
      reasonForSelfApplication === "no_caregiver" &&
      caregiver !== null
  ) {
    throw new HttpError(
        422,
        "Caregiver information must not be provided when no caregiver is declared"
    );
  }

  if (
      reasonForSelfApplication ===
      "non_malaysian_caregiver" &&
      caregiver === null
  ) {
    throw new HttpError(
        422,
        "Please provide the non-Malaysian caregiver's information"
    );
  }
}

// BPT program-specific data
export function mapBptProgramSpecificData(
    input: BptSpecificMapperInput,
    applicant: JkmApplicantData,
    applicantHealth: JkmHealthData
): BptProgramSpecificData {
  const applicationPathway =
      mapBptApplicationPathway(
          input.applicationPathway
      );

  const patient = mapBptPatient(
      input.patient,
      applicationPathway,
      applicant,
      applicantHealth
  );

  const caregiver = mapBptCaregiver(
      input.caregiver,
      applicationPathway,
      applicant
  );

  const reasonForSelfApplication =
      mapBptSelfApplicationReason(
          input.reasonForSelfApplication
      );

  validateBptApplicationPathway(
      applicationPathway,
      patient,
      caregiver,
      reasonForSelfApplication
  );

  return {
    applicationPathway,

    patient,

    caregiver,

    medicalConfirmation:
        mapBptMedicalConfirmation(
            input.medicalConfirmation
        ),

    reasonForSelfApplication,

    additionalRemarks: mapNullableText(
        input.additionalRemarks,
        "Additional BPT remarks",
        3000
    ),
  };
}

// Assemble BPT application data
export function mapBptApplicationData(
    input: BptMapperInput
): BptApplicationData {
  // Map shared applicant information
  const commonData = mapCommonApplicationData(
      input,
      "BPT",
      {
        includeLivingArrangement: true,
      }
  );

  const applicantHealth = mapHealth(
      input.healthProfile
  );

  // Map required BPT application sections
  return {
    ...commonData,

    health: applicantHealth,

    programSpecificData:
        mapBptProgramSpecificData(
            input.bptSpecificData,
            commonData.applicant,
            applicantHealth
        ),
  };
}
