import { supabase } from "../../../lib/supabase.ts";
import { getCurrentProfileId } from "../../profile/profileService.ts";

import {
  EDITABLE_APPLICATION_STATUSES,
} from "../../../constants/applications/applications.ts";

import type {
  ApplicationStatus,
  JkmProgramCode,
  JkmApplicationDraftData,
} from "../../../types/applications.ts";

type ApplicationData = Record<string, unknown>;

interface ApplicationOwnershipRow {
  id: string;
  profile_id: string;
  status: ApplicationStatus;
  aid_programs: {
    code: string;
  } | null;
}

// Validate an object
function isRecord(
    value: unknown,
): value is Record<string, unknown> {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

// Validate supported JKM programmes
function isJkmProgramCode(
    value: unknown,
): value is JkmProgramCode {
  return (
      value === "BA" ||
      value === "BAT" ||
      value === "BPT" ||
      value === "BWE"
  );
}

// Validate the structure of a JKM application draft
function hasValidJkmApplicationDraftStructure(
    value: unknown,
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (
      value.schemaVersion !== 1 ||
      !isJkmProgramCode(value.programCode) ||
      !isRecord(value.programSpecificData)
  ) {
    return false;
  }

  const programSpecificData = value.programSpecificData;

  switch (value.programCode) {
    case "BA":
      return (
          programSpecificData.additionalCircumstances === undefined ||
          programSpecificData.additionalCircumstances === null ||
          isRecord(programSpecificData.additionalCircumstances)
      );

    case "BAT":
      return (
          isRecord(programSpecificData.beneficiary) &&
          isRecord(programSpecificData.equipment) &&
          isRecord(programSpecificData.recommendation)
      );

    case "BPT":
      return (
          isRecord(programSpecificData.patient) &&
          isRecord(programSpecificData.medicalConfirmation) &&
          (
              programSpecificData.caregiver === undefined ||
              programSpecificData.caregiver === null ||
              isRecord(programSpecificData.caregiver)
          )
      );

    case "BWE":
      return (
          programSpecificData.specialConsiderationRequested === null ||
          typeof programSpecificData.specialConsiderationRequested
          === "boolean"
      );

    default:
      return false;
  }
}

// Retrieve an application belonging to the current applicant
async function getOwnedApplication(
    applicationId: string,
): Promise<ApplicationOwnershipRow> {
  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        profile_id,
        status,
        aid_programs(code)
      `)
      .eq("id", applicationId)
      .eq("profile_id", profileId)
      .maybeSingle();

  if (error) {
    throw new Error(
        `Unable to retrieve application: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
        "Application not found or access denied.",
    );
  }

  return data as unknown as ApplicationOwnershipRow;
}

// Retrieve and validate the application's JKM programme
function getApplicationProgramCode(
    application: ApplicationOwnershipRow,
): JkmProgramCode {
  const programCode = application.aid_programs?.code
      ?.trim()
      .toUpperCase();

  if (!isJkmProgramCode(programCode)) {
    throw new Error(
        "The application does not belong to a supported JKM program.",
    );
  }

  return programCode;
}

// Verify that the declaration belongs to the application
function validateApplicationProgram(
    application: ApplicationOwnershipRow,
    programCode: JkmProgramCode,
): void {
  const applicationProgramCode =
      getApplicationProgramCode(application);

  if (applicationProgramCode !== programCode) {
    throw new Error(
        "The application data does not belong to this aid program.",
    );
  }
}

// Verify that the application remains editable
function validateApplicationEditable(
    application: ApplicationOwnershipRow,
): void {
  if (!EDITABLE_APPLICATION_STATUSES.includes(application.status)) {
    throw new Error(
        "JKM application data cannot be modified for this application.",
    );
  }
}

// Construct the initial programme-specific application draft
export function buildInitialJkmApplicationData(
    programCode: JkmProgramCode,
): JkmApplicationDraftData {
  switch (programCode) {

      // Bantuan Am Persekutuan
    case "BA":
      return {
        schemaVersion: 1,
        programCode: "BA",
        programSpecificData: {
          receivesOtherJkmMonthlyAssistance: null,
          currentJkmAssistanceProgram: null,

          additionalCircumstances: {
            economicHardship: null,
            healthRelatedNeeds: null,
            dependentRelatedNeeds: null,
            otherCircumstances: null,
            description: null,
          },
        },
      };

      // Bantuan Alat Tiruan / Alat Sokongan
    case "BAT":
      return {
        schemaVersion: 1,
        programCode: "BAT",
        programSpecificData: {
          beneficiary: {
            type: null,
            fullName: null,
            identificationNo: null,
            relationshipToApplicant: null,
            health: null,
          },

          functionalLimitationDescription: null,

          equipment: {
            equipmentType: null,
            equipmentDescription: null,
            purpose: null,
            estimatedCost: null,
            supplierName: null,
            quotationAvailable: null,
          },

          recommendation: {
            recommendationAvailable: null,
            recommendingAuthority: null,
            recommendationOfficerName: null,
            recommendationInstitution: null,
            recommendationDetails: null,
          },

          additionalJustification: null,
        },
      };

      // Bantuan Penjagaan OKU / Pesakit Kronik
    case "BPT":
      return {
        schemaVersion: 1,
        programCode: "BPT",
        programSpecificData: {
          applicationPathway: null,

          patient: {
            fullName: null,
            identificationNo: null,
            citizenship: null,
            relationshipToApplicant: null,

            isOku: null,
            okuRegistered: null,
            hasChronicIllness: null,
            chronicIllnessDetails: null,
            isBedridden: null,
            requiresContinuousTreatment: null,
            treatmentStartDate: null,
          },

          caregiver: null,

          medicalConfirmation: {
            medicalConfirmationAvailable: null,
            medicalInstitution: null,
            medicalOfficerName: null,
            diagnosisDetails: null,
            treatmentDetails: null,
            specialistDetails: null,
          },

          reasonForSelfApplication: null,
          additionalRemarks: null,
        },
      };

      // Bantuan Warga Emas
    case "BWE":
      return {
        schemaVersion: 1,
        programCode: "BWE",
        programSpecificData: {
          hasChildren: null,
          dependsOnFamilyOrCaregiver: null,
          familyOrCaregiverMonthlyIncome: null,
          incomeDeclarationDetails: null,
          specialConsiderationRequested: null,
          specialConsiderationReason: null,
        },
      };

    default:
      throw new Error(
          "Unsupported JKM application program.",
      );
  }
}

// Persist programme-specific JKM application declarations
export async function saveJkmApplicationData(
    applicationId: string,
    applicationData: JkmApplicationDraftData,
): Promise<JkmApplicationDraftData> {
  // Validate the application draft structure
  if (!hasValidJkmApplicationDraftStructure(applicationData)) {
    throw new Error(
        "Invalid JKM application data.",
    );
  }

  // Verify application ownership
  const application = await getOwnedApplication(applicationId);

  // Verify programme consistency and editability
  validateApplicationProgram(
      application,
      applicationData.programCode,
  );

  validateApplicationEditable(application);

  // Perform the protected JSONB merge
  const { error } = await supabase.rpc(
      "save_jkm_application_data",
      {
        p_application_id: applicationId,
        p_jkm_application: applicationData,
      },
  );

  if (error) {
    throw new Error(
        `Unable to save JKM application data: ${error.message}`,
    );
  }

  return applicationData;
}

// Retrieve previously saved JKM application declarations
export async function getJkmApplicationData(
    applicationId: string,
): Promise<JkmApplicationDraftData | null> {
  // Verify application ownership
  const application = await getOwnedApplication(applicationId);

  // Verify supported JKM programme
  const programCode = getApplicationProgramCode(application);

  const { data, error } = await supabase
      .from("application_data")
      .select("data")
      .eq("application_id", applicationId)
      .maybeSingle();

  if (error) {
    throw new Error(
        `Unable to retrieve JKM application data: ${error.message}`,
    );
  }

  // The application may not contain declarations yet
  if (!data) {
    return null;
  }

  if (!isRecord(data.data)) {
    throw new Error(
        "Invalid stored application data.",
    );
  }

  const applicationData: ApplicationData = data.data;

  const jkmApplication = applicationData.jkmApplication;

  if (
      jkmApplication === null ||
      jkmApplication === undefined
  ) {
    return null;
  }

  if (!hasValidJkmApplicationDraftStructure(jkmApplication)) {
    throw new Error(
        "Invalid stored JKM application data.",
    );
  }

  // The draft structure has been checked.
  // Full field validation is performed before submission.
  const draft = jkmApplication as JkmApplicationDraftData;

  if (draft.programCode !== programCode) {
    throw new Error(
        "Stored JKM application program mismatch.",
    );
  }

  return draft;
}
