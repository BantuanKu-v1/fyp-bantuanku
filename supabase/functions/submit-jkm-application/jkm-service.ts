import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "../_shared/supabase.ts";
import { HttpError } from "../_shared/response.ts";
import { requiredUuid } from "../_shared/validators.ts";

import {
  mapToJkmApplication,
  normalizeJkmProgramCode,
} from "./jkm-mapper.ts";

import {
  findJkmApplicationByExternalId,
  getJkmApplicationStatus,
  isDefinitiveJkmSubmissionRejection,
  submitToJkmApi,
} from "./jkm-api.ts";

import {
  isRecord,
  mapNullableCitizenship,
  type JkmCommonMapperInput,
  type JkmSourceRecord,
} from "./mappers/common-mapper.ts";

import type {
  JkmApplicationPayload,
  JkmApplicationStatus,
  JkmProgramCode,
  JkmSubmissionConfirmation,
} from "./jkm-types.ts";

interface SubmitJkmApplicationInput {
  applicationId: string;
  userId: string;
}

interface SubmissionResult {
  applicationId: string;
  provider: "jkm";
  submissionState: "submitted";
  providerApplicationId: string;
  referenceNo: string;
  providerStatus: JkmApplicationStatus;
  submittedAt: string;
  alreadySubmitted: boolean;
}

type SubmissionState =
    | "pending"
    | "submitted"
    | "failed"
    | "unknown";

interface ApplicationRecord {
  id: string;
  profile_id: string;
  program_id: string;
  status: string;
}

interface TrackingRecord {
  id: string;
  application_id: string;
  external_application_id: string;
  submission_state: SubmissionState;
  provider_application_id: string | null;
  reference_no: string | null;
  provider_status: string | null;
  submitted_at: string | null;
  provider_updated_at: string | null;
  updated_at: string;
}

interface JkmApplicationContext {
  application: ApplicationRecord;
  profile: JkmSourceRecord;
  programCode: JkmProgramCode;
  programActive: boolean;
}

interface JkmSavedApplicationData {
  programSpecificData: JkmSourceRecord;
  preliminaryEligibility: JkmSourceRecord;
}

interface JkmConfirmation extends JkmSubmissionConfirmation {
  updatedAt: string;
}

const PROVIDER = "jkm";

const STALE_PENDING_MS = 2 * 60 * 1000; // 2 minutes

const MAX_SUPPORTING_DOCUMENTS = 100;

const EDITABLE_APPLICATION_STATUSES = [
  "draft",
  "in_progress",
  "ready_for_review",
];

const JKM_STATUSES: readonly JkmApplicationStatus[] = [
  "submitted",
  "under_review",
  "additional_information_required",
  "approved",
  "rejected",
  "cancelled",
];

// Log database errors without exposing applicant information
function logDatabaseError(
    operation: string,
    error: {
      code?: string;
    },
): void {
  console.error(`[JKM] ${operation}`, {
    code: error.code,
  });
}

// Validate required database objects
function requireRecord(
    value: unknown,
    fieldName: string,
): JkmSourceRecord {
  if (!isRecord(value)) {
    throw new HttpError(
        422,
        `Invalid or missing ${fieldName}.`,
    );
  }

  return value;
}

// Validate optional database objects
function optionalRecord(
    value: unknown,
    fieldName: string,
): JkmSourceRecord | null {
  if (value === null || value === undefined) {
    return null;
  }

  return requireRecord(value, fieldName);
}

// Validate provider statuses
function isJkmApplicationStatus(
    value: unknown,
): value is JkmApplicationStatus {
  return (
      typeof value === "string" &&
      JKM_STATUSES.some(
          (status) => status === value,
      )
  );
}

// Verify application ownership and program
async function loadApplication(
    supabase: SupabaseClient,
    applicationId: string,
    userId: string,
): Promise<JkmApplicationContext> {
  const {
    data: application,
    error: applicationError,
  } = await supabase
      .from("applications")
      .select(`
        id,
        profile_id,
        program_id,
        status
      `)
      .eq("id", applicationId)
      .maybeSingle();

  if (applicationError) {
    logDatabaseError(
        "Load application failed",
        applicationError,
    );

    throw new HttpError(
        500,
        "Unable to retrieve the application.",
    );
  }

  if (!application) {
    throw new HttpError(
        404,
        "Application not found.",
    );
  }

  // Verify that the application belongs to the authenticated user
  const {
    data: profile,
    error: profileError,
  } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        identification_no,
        date_of_birth,
        citizenship,
        gender,
        marital_status,
        mobile_phone,
        home_phone,
        email,
        occupation,
        employment_status,
        is_student,
        study_mode,
        institution_type,
        household_members_complete
      `)
      .eq("id", application.profile_id)
      .eq("user_id", userId)
      .maybeSingle();

  if (profileError) {
    logDatabaseError(
        "Load applicant profile failed",
        profileError,
    );

    throw new HttpError(
        500,
        "Unable to retrieve the applicant profile.",
    );
  }

  if (!profile) {
    throw new HttpError(
        404,
        "Application not found.",
    );
  }

  const {
    data: program,
    error: programError,
  } = await supabase
      .from("aid_programs")
      .select(`
        code,
        is_active
      `)
      .eq("id", application.program_id)
      .maybeSingle();

  if (programError) {
    logDatabaseError(
        "Load JKM program failed",
        programError,
    );

    throw new HttpError(
        500,
        "Unable to retrieve the aid programme.",
    );
  }

  if (!program) {
    throw new HttpError(
        422,
        "The application's aid programme is unavailable.",
    );
  }

  const programCode = normalizeJkmProgramCode(
      program.code,
  );

  return {
    application: application as ApplicationRecord,
    profile,
    programCode,
    programActive: program.is_active === true,
  };
}

// Validate that a new submission is permitted
function validateApplicationEditable(
    context: JkmApplicationContext,
): void {
  if (!context.programActive) {
    throw new HttpError(
        422,
        "The JKM aid programme is inactive.",
    );
  }

  if (
      !EDITABLE_APPLICATION_STATUSES.includes(
          context.application.status,
      )
  ) {
    throw new HttpError(
        409,
        "This application cannot be submitted in its current state.",
    );
  }
}

// Load applicant profile-related information
async function loadApplicantData(
    supabase: SupabaseClient,
    profileId: string,
    programCode: JkmProgramCode,
): Promise<Omit<
    JkmCommonMapperInput,
    "profile" |
    "householdMembersComplete" |
    "supportingDocuments" |
    "preliminaryEligibility"
>> {
  const [
    addressResult,
    financialResult,
    householdResult,
    healthResult,
    livingArrangementResult,
    welfareAssistanceResult,
  ] = await Promise.all([
    supabase
        .from("addresses")
        .select(`
          address_line_1,
          address_line_2,
          postcode,
          city,
          state_territory,
          country_code
        `)
        .eq("profile_id", profileId)
        .eq("address_type", "residential")
        .eq("is_primary", true)
        .maybeSingle(),

    supabase
        .from("financial_profiles")
        .select(`
          monthly_personal_income,
          monthly_household_income,
          income_source
        `)
        .eq("profile_id", profileId)
        .maybeSingle(),

    programCode !== "BPT"
        ? supabase
            .from("household_members")
            .select(`
              full_name,
              identification_no,
              date_of_birth,
              relationship,
              gender,
              citizenship,
              is_dependent,
              employment_status,
              occupation,
              monthly_income,
              is_student,
              study_mode,
              institution_type,
              is_oku,
              oku_registered
            `)
            .eq("profile_id", profileId)
            .order("created_at", {
              ascending: true,
            })
            .order("id", {
              ascending: true,
            })
        : Promise.resolve({
          data: [],
          error: null,
        }),

    programCode === "BAT" ||
    programCode === "BPT"
        ? supabase
            .from("health_profiles")
            .select(`
              is_oku,
              oku_registered,
              disability_description,
              has_chronic_illness,
              chronic_illness_details,
              is_bedridden,
              requires_continuous_treatment,
              treatment_start_date
            `)
            .eq("profile_id", profileId)
            .maybeSingle()
        : Promise.resolve({
          data: null,
          error: null,
        }),

    programCode === "BPT" ||
    programCode === "BWE"
        ? supabase
            .from("living_arrangements")
            .select(`
              arrangement_type,
              lives_with_family,
              depends_on_family,
              depends_on_caregiver,
              is_in_institution,
              institution_name,
              institution_type,
              receives_free_services,
              receives_ration_grant
            `)
            .eq("profile_id", profileId)
            .maybeSingle()
        : Promise.resolve({
          data: null,
          error: null,
        }),

    programCode === "BA"
        ? supabase
            .from("welfare_assistance")
            .select(`
              program_name,
              agency,
              assistance_type,
              monthly_amount,
              is_active,
              start_date,
              end_date
            `)
            .eq("profile_id", profileId)
            .order("created_at", {
              ascending: true,
            })
            .order("id", {
              ascending: true,
            })
        : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  const results = [
    addressResult,
    financialResult,
    householdResult,
    healthResult,
    livingArrangementResult,
    welfareAssistanceResult,
  ];

  for (const result of results) {
    if (result.error) {
      logDatabaseError(
          "Load applicant information failed",
          result.error,
      );

      throw new HttpError(
          500,
          "Unable to retrieve applicant information.",
      );
    }
  }

  if (!addressResult.data) {
    throw new HttpError(
        422,
        "A primary residential address is required.",
    );
  }

  return {
    address: addressResult.data,
    financialProfile: financialResult.data,
    householdMembers: householdResult.data ?? [],
    healthProfile: healthResult.data,
    livingArrangement: livingArrangementResult.data,
    welfareAssistance: welfareAssistanceResult.data ?? [],
    caregivers: [],
  };
}

// Load application-specific declarations and eligibility snapshot
async function loadSavedApplicationData(
    supabase: SupabaseClient,
    applicationId: string,
    programCode: JkmProgramCode,
): Promise<JkmSavedApplicationData> {
  const { data, error } = await supabase
      .from("application_data")
      .select("data")
      .eq("application_id", applicationId)
      .maybeSingle();

  if (error) {
    logDatabaseError(
        "Load saved application data failed",
        error,
    );

    throw new HttpError(
        500,
        "Unable to retrieve saved application data.",
    );
  }

  if (!data) {
    throw new HttpError(
        422,
        "Please complete the JKM application declarations.",
    );
  }

  const applicationData = requireRecord(
      data.data,
      "application data",
  );

  const jkmApplication = requireRecord(
      applicationData.jkmApplication,
      "JKM application declarations",
  );

  if (jkmApplication.schemaVersion !== 1) {
    throw new HttpError(
        422,
        "Unsupported JKM application schema version.",
    );
  }

  if (jkmApplication.programCode !== programCode) {
    throw new HttpError(
        422,
        "The saved JKM application programme does not match.",
    );
  }

  const programSpecificData = requireRecord(
      jkmApplication.programSpecificData,
      "JKM programme-specific data",
  );

  const preliminaryEligibility = requireRecord(
      applicationData.preliminaryEligibility,
      "preliminary eligibility assessment",
  );

  return {
    programSpecificData,
    preliminaryEligibility,
  };
}

// Load supporting document metadata
async function loadSupportingDocuments(
    supabase: SupabaseClient,
    applicationId: string,
    profileId: string,
): Promise<JkmSourceRecord[]> {
  const {
    data: applicationDocuments,
    error: applicationDocumentsError,
  } = await supabase
      .from("application_documents")
      .select(`
        id,
        document_id,
        requirement_type
      `)
      .eq("application_id", applicationId)
      .order("created_at", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      })
      .limit(MAX_SUPPORTING_DOCUMENTS + 1);

  if (applicationDocumentsError) {
    logDatabaseError(
        "Load application documents failed",
        applicationDocumentsError,
    );

    throw new HttpError(
        500,
        "Unable to retrieve supporting documents.",
    );
  }

  const links = applicationDocuments ?? [];

  if (links.length > MAX_SUPPORTING_DOCUMENTS) {
    throw new HttpError(
        422,
        "Too many supporting documents.",
    );
  }

  if (links.length === 0) {
    return [];
  }

  const documentIds = [
    ...new Set(
        links.map((item) =>
            requiredUuid(
                item.document_id,
                "document_id",
            ),
        ),
    ),
  ];

  const {
    data: documents,
    error: documentsError,
  } = await supabase
      .from("documents")
      .select(`
        id,
        document_type,
        original_filename,
        mime_type,
        file_size_bytes,
        issued_at,
        expires_at
      `)
      .eq("profile_id", profileId)
      .in("id", documentIds);

  if (documentsError) {
    logDatabaseError(
        "Load document metadata failed",
        documentsError,
    );

    throw new HttpError(
        500,
        "Unable to retrieve document metadata.",
    );
  }

  const documentsById = new Map(
      (documents ?? []).map(
          (document) => [
            document.id,
            document,
          ] as const,
      ),
  );

  return links.map((item) => {
    const document = documentsById.get(
        item.document_id,
    );

    if (!document) {
      throw new HttpError(
          422,
          "An attached document is missing or does not belong to the applicant.",
      );
    }

    return {
      document_id: document.id,
      requirement_type: item.requirement_type,
      document_type: document.document_type,
      original_filename: document.original_filename,
      mime_type: document.mime_type,
      file_size_bytes: document.file_size_bytes,
      issued_at: document.issued_at,
      expires_at: document.expires_at,
    };
  });
}

// Convert application health declarations into database-style fields
function mapHealthDeclaration(
    declaration: JkmSourceRecord | null,
): JkmSourceRecord | null {
  if (declaration === null) {
    return null;
  }

  return {
    is_oku: declaration.isOku,
    oku_registered: declaration.okuRegistered,
    disability_description: declaration.disabilityDescription,
    has_chronic_illness: declaration.hasChronicIllness,
    chronic_illness_details: declaration.chronicIllnessDetails,
    is_bedridden: declaration.isBedridden,
    requires_continuous_treatment: declaration.requiresContinuousTreatment,
    treatment_start_date: declaration.treatmentStartDate,
  };
}

// Use confirmed declarations when applicant health information is unavailable
function mergeApplicantHealth(
    healthProfile: JkmSourceRecord | null,
    declaration: JkmSourceRecord | null,
): JkmSourceRecord | null {
  if (declaration === null) {
    return healthProfile;
  }

  const declaredHealth = mapHealthDeclaration(
      declaration,
  );

  if (!declaredHealth) {
    return healthProfile;
  }

  const mergedHealth: JkmSourceRecord = {
    ...(healthProfile ?? {}),
  };

  for (
      const [field, declaredValue]
      of Object.entries(declaredHealth)
      ) {
    if (
        declaredValue === null ||
        declaredValue === undefined
    ) {
      continue;
    }

    const profileValue = mergedHealth[field];

    if (
        profileValue !== null &&
        profileValue !== undefined &&
        profileValue !== declaredValue
    ) {
      throw new HttpError(
          422,
          "The health declaration conflicts with the applicant's health profile. Please review the information.",
      );
    }

    mergedHealth[field] = declaredValue;
  }

  return mergedHealth;
}

// Assemble the program-specific mapper input
function buildJkmPayload(
    applicationId: string,
    programCode: JkmProgramCode,
    commonInput: JkmCommonMapperInput,
    programSpecificData: JkmSourceRecord,
): JkmApplicationPayload {
  switch (programCode) {
    case "BA": {
      const additionalCircumstances =
          optionalRecord(
              programSpecificData.additionalCircumstances,
              "BA additional circumstances",
          );

      return mapToJkmApplication({
        ...commonInput,
        applicationId,
        programCode: "BA",
        baSpecificData: {
          receivesOtherJkmMonthlyAssistance: programSpecificData.receivesOtherJkmMonthlyAssistance,
          currentJkmAssistanceProgram: programSpecificData.currentJkmAssistanceProgram,
          additionalCircumstances,
        },
      });
    }

    case "BAT": {
      const beneficiary = requireRecord(
          programSpecificData.beneficiary,
          "BAT beneficiary information",
      );

      const equipment = requireRecord(
          programSpecificData.equipment,
          "BAT equipment information",
      );

      const recommendation = requireRecord(
          programSpecificData.recommendation,
          "BAT recommendation information",
      );

      const beneficiaryHealth = optionalRecord(
          beneficiary.health,
          "BAT beneficiary health information",
      );

      const healthProfile =
          beneficiary.type === "applicant"
              ? mergeApplicantHealth(
                  commonInput.healthProfile,
                  beneficiaryHealth,
              )
              : commonInput.healthProfile;

      return mapToJkmApplication({
        ...commonInput,
        applicationId,
        programCode: "BAT",
        healthProfile,
        batSpecificData: {
          beneficiary: {
            type: beneficiary.type,
            fullName: beneficiary.fullName,
            identificationNo: beneficiary.identificationNo,
            relationshipToApplicant: beneficiary.relationshipToApplicant,
            health: mapHealthDeclaration(
                beneficiaryHealth,
            ),
          },
          functionalLimitationDescription: programSpecificData.functionalLimitationDescription,
          equipment: {
            equipmentType:
            equipment.equipmentType,
            equipmentDescription: equipment.equipmentDescription,
            purpose: equipment.purpose,
            estimatedCost: equipment.estimatedCost,
            supplierName: equipment.supplierName,
            quotationAvailable:
            equipment.quotationAvailable,
          },
          recommendation: {
            recommendationAvailable:
            recommendation.recommendationAvailable,
            recommendingAuthority: recommendation.recommendingAuthority,
            recommendationOfficerName: recommendation.recommendationOfficerName,
            recommendationInstitution: recommendation.recommendationInstitution,
            recommendationDetails: recommendation.recommendationDetails,
          },
          additionalJustification: programSpecificData.additionalJustification,
        },
      });
    }

    case "BPT": {
      const patient = requireRecord(
          programSpecificData.patient,
          "BPT patient information",
      );

      const caregiver = optionalRecord(
          programSpecificData.caregiver,
          "BPT caregiver information",
      );

      const medicalConfirmation = requireRecord(
          programSpecificData.medicalConfirmation,
          "BPT medical confirmation",
      );

      const applicationPathway =
          programSpecificData.applicationPathway;

      const reasonForSelfApplication =
          programSpecificData.reasonForSelfApplication;

      const patientIsApplicant =
          applicationPathway === "non_bedridden_patient" ||
          applicationPathway === "bedridden_patient_without_eligible_caregiver";

      const healthProfile = patientIsApplicant
          ? mergeApplicantHealth(
              commonInput.healthProfile,
              patient,
          )
          : commonInput.healthProfile;

      if (
          reasonForSelfApplication ===
          "non_malaysian_caregiver"
      ) {
        const caregiverCitizenship =
            mapNullableCitizenship(
                caregiver?.citizenship,
                "Caregiver citizenship",
            );

        if (
            caregiverCitizenship !== "Non-Malaysian"
        ) {
          throw new HttpError(
              422,
              "Please confirm the non-Malaysian caregiver's citizenship.",
          );
        }
      }

      return mapToJkmApplication({
        ...commonInput,
        applicationId,
        programCode: "BPT",
        healthProfile,
        bptSpecificData: {
          applicationPathway,
          patient,
          caregiver,
          medicalConfirmation,
          reasonForSelfApplication,
          additionalRemarks: programSpecificData.additionalRemarks,
        },
      });
    }

    case "BWE": {
      return mapToJkmApplication({
        ...commonInput,
        applicationId,
        programCode: "BWE",
        bweSpecificData: {
          hasChildren: programSpecificData.hasChildren,
          dependsOnFamilyOrCaregiver: programSpecificData.dependsOnFamilyOrCaregiver,
          familyOrCaregiverMonthlyIncome: programSpecificData.familyOrCaregiverMonthlyIncome,
          incomeDeclarationDetails: programSpecificData.incomeDeclarationDetails,
          specialConsiderationRequested: programSpecificData.specialConsiderationRequested,
          specialConsiderationReason: programSpecificData.specialConsiderationReason,
        },
      });
    }

    default:
      throw new HttpError(
          422,
          "Unsupported JKM programme.",
      );
  }
}

// Load and validate the complete submission payload
async function loadSubmissionPayload(
    supabase: SupabaseClient,
    context: JkmApplicationContext,
): Promise<JkmApplicationPayload> {
  validateApplicationEditable(context);

  const applicationId = context.application.id;

  const profileId = requiredUuid(
      context.application.profile_id,
      "profile_id",
  );

  const [
    applicantData,
    supportingDocuments,
    savedApplicationData,
  ] = await Promise.all([
    loadApplicantData(
        supabase,
        profileId,
        context.programCode,
    ),

    loadSupportingDocuments(
        supabase,
        applicationId,
        profileId,
    ),

    loadSavedApplicationData(
        supabase,
        applicationId,
        context.programCode,
    ),
  ]);

  const commonInput: JkmCommonMapperInput = {
    ...applicantData,
    profile: context.profile,
    householdMembersComplete:
        context.profile.household_members_complete === true
            ? true
            : context.profile.household_members_complete === false
                ? false
                : null,
    supportingDocuments,
    preliminaryEligibility:
    savedApplicationData.preliminaryEligibility,
  };

  return buildJkmPayload(
      applicationId,
      context.programCode,
      commonInput,
      savedApplicationData.programSpecificData,
  );
}

// Retrieve existing external submission tracking
async function getTrackingRecord(
    supabase: SupabaseClient,
    applicationId: string,
): Promise<TrackingRecord | null> {
  const { data, error } = await supabase
      .from("external_application_submissions")
      .select(`
        id,
        application_id,
        external_application_id,
        submission_state,
        provider_application_id,
        reference_no,
        provider_status,
        submitted_at,
        provider_updated_at,
        updated_at
      `)
      .eq("application_id", applicationId)
      .eq("provider", PROVIDER)
      .maybeSingle();

  if (error) {
    logDatabaseError(
        "Load submission tracking failed",
        error,
    );

    throw new HttpError(
        500,
        "Unable to retrieve JKM submission tracking.",
    );
  }

  return data as TrackingRecord | null;
}

// Validate submission tracking identity
function validateTrackingIdentity(
    tracking: TrackingRecord,
    applicationId: string,
): void {
  if (
      tracking.application_id !== applicationId ||
      tracking.external_application_id !== applicationId
  ) {
    throw new HttpError(
        500,
        "JKM submission tracking identity does not match.",
    );
  }
}

// Atomically claim a new or previously failed submission
async function claimSubmission(
    supabase: SupabaseClient,
    applicationId: string,
): Promise<TrackingRecord | null> {
  const { data, error } = await supabase.rpc(
      "claim_external_submission",
      {
        p_application_id: applicationId,
        p_provider: PROVIDER,
      },
  );

  if (error) {
    logDatabaseError(
        "Claim submission failed",
        error,
    );

    throw new HttpError(
        500,
        "Unable to prepare the JKM submission.",
    );
  }

  const records = data as TrackingRecord[] | null;

  if (!records || records.length === 0) {
    return null;
  }

  const tracking = records[0];

  validateTrackingIdentity(
      tracking,
      applicationId,
  );

  if (tracking.submission_state !== "pending") {
    throw new HttpError(
        500,
        "Invalid JKM submission tracking state.",
    );
  }

  return tracking;
}

// Determine whether a pending submission requires recovery
function isStalePending(
    tracking: TrackingRecord,
): boolean {
  if (tracking.submission_state !== "pending") {
    return false;
  }

  const updatedAt = Date.parse(
      tracking.updated_at,
  );

  return (
      Number.isFinite(updatedAt) &&
      Date.now() - updatedAt >= STALE_PENDING_MS
  );
}

// Mark an unsuccessful or uncertain submission
async function markSubmissionState(
    supabase: SupabaseClient,
    tracking: TrackingRecord,
    state: "failed" | "unknown",
): Promise<void> {
  const { error } = await supabase
      .from("external_application_submissions")
      .update({
        submission_state: state,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tracking.id)
      .eq("provider", PROVIDER)
      .eq("submission_state", "pending")
      .eq("updated_at", tracking.updated_at);

  if (error) {
    logDatabaseError(
        `Mark submission as ${state} failed`,
        error,
    );
  }
}

// Save authoritative JKM confirmation information
async function saveConfirmation(
    supabase: SupabaseClient,
    tracking: TrackingRecord,
    confirmation: JkmConfirmation,
): Promise<boolean> {
  const { data, error } = await supabase
      .from("external_application_submissions")
      .update({
        submission_state: "submitted",
        provider_application_id: confirmation.id,
        reference_no: confirmation.referenceNo,
        provider_status: confirmation.status,
        submitted_at: confirmation.submittedAt,
        provider_updated_at: confirmation.updatedAt,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tracking.id)
      .eq("provider", PROVIDER)
      .in("submission_state", [
        "pending",
        "unknown",
      ])
      .select("id")
      .maybeSingle();

  if (error) {
    logDatabaseError(
        "Save JKM confirmation failed",
        error,
    );

    throw new HttpError(
        500,
        "JKM may have accepted the application, but confirmation could not be saved.",
    );
  }

  return data !== null;
}

// Synchronize the internal application status
async function syncApplicationStatus(
    supabase: SupabaseClient,
    applicationId: string,
    submittedAt: string,
): Promise<void> {
  const { data, error } = await supabase
      .from("applications")
      .update({
        status: "simulated_submitted",
        simulated_submitted_at: submittedAt,
      })
      .eq("id", applicationId)
      .select("id")
      .maybeSingle();

  if (error) {
    logDatabaseError(
        "Synchronize application status failed",
        error,
    );

    throw new HttpError(
        500,
        "JKM confirmed the application, but its internal status could not be updated.",
    );
  }

  if (!data) {
    throw new HttpError(
        500,
        "The confirmed application could not be retrieved.",
    );
  }
}

// Convert saved tracking into the frontend submission result
function toSubmissionResult(
    tracking: TrackingRecord,
    alreadySubmitted: boolean,
): SubmissionResult {
  if (tracking.submission_state !== "submitted") {
    throw new HttpError(
        409,
        "The JKM application has not been confirmed.",
    );
  }

  if (
      !tracking.provider_application_id ||
      !tracking.reference_no ||
      !tracking.submitted_at ||
      !Number.isFinite(
          Date.parse(tracking.submitted_at),
      ) ||
      !isJkmApplicationStatus(
          tracking.provider_status,
      )
  ) {
    throw new HttpError(
        500,
        "The saved JKM confirmation is incomplete or invalid.",
    );
  }

  return {
    applicationId: tracking.application_id,
    provider: PROVIDER,
    submissionState: "submitted",
    providerApplicationId: tracking.provider_application_id,
    referenceNo: tracking.reference_no,
    providerStatus: tracking.provider_status,
    submittedAt: tracking.submitted_at,
    alreadySubmitted,
  };
}

// Retrieve the latest confirmed submission result
async function getConfirmedResult(
    supabase: SupabaseClient,
    applicationId: string,
    alreadySubmitted: boolean,
): Promise<SubmissionResult> {
  const tracking = await getTrackingRecord(
      supabase,
      applicationId,
  );

  if (!tracking) {
    throw new HttpError(
        500,
        "JKM confirmation tracking could not be retrieved.",
    );
  }

  validateTrackingIdentity(
      tracking,
      applicationId,
  );

  const result = toSubmissionResult(
      tracking,
      alreadySubmitted,
  );

  await syncApplicationStatus(
      supabase,
      applicationId,
      result.submittedAt,
  );

  return result;
}

// Resolve the authoritative timestamp of a submission confirmation
async function resolveConfirmation(
    confirmation: JkmSubmissionConfirmation,
): Promise<JkmConfirmation> {
  if (confirmation.status === "submitted") {
    return {
      ...confirmation,
      updatedAt: confirmation.submittedAt,
    };
  }

  // An existing application may already have progressed
  const latestStatus = await getJkmApplicationStatus(
      confirmation.id,
      confirmation.programCode,
  );

  if (
      latestStatus.referenceNo !==
      confirmation.referenceNo ||
      Date.parse(latestStatus.updatedAt) <
      Date.parse(confirmation.submittedAt)
  ) {
    throw new HttpError(
        502,
        "The JKM confirmation and status information do not match.",
    );
  }

  return {
    ...confirmation,
    status: latestStatus.status,
    updatedAt: latestStatus.updatedAt,
  };
}

// Recover an uncertain or stale pending submission
async function recoverSubmission(
    supabase: SupabaseClient,
    tracking: TrackingRecord,
    programCode: JkmProgramCode,
): Promise<SubmissionResult> {
  if (tracking.submission_state === "submitted") {
    return getConfirmedResult(
        supabase,
        tracking.application_id,
        true,
    );
  }

  if (
      tracking.submission_state !== "pending" &&
      tracking.submission_state !== "unknown"
  ) {
    throw new HttpError(
        409,
        "This JKM submission is not eligible for recovery.",
    );
  }

  if (
      tracking.submission_state === "pending" &&
      !isStalePending(tracking)
  ) {
    throw new HttpError(
        409,
        "The JKM submission is still being processed. Please try again later.",
    );
  }

  const recovered =
      await findJkmApplicationByExternalId(
          tracking.external_application_id,
          programCode,
      );

  if (!recovered) {
    if (tracking.submission_state === "pending") {
      await markSubmissionState(
          supabase,
          tracking,
          "unknown",
      );
    }

    const current = await getTrackingRecord(
        supabase,
        tracking.application_id,
    );

    if (current?.submission_state === "submitted") {
      return getConfirmedResult(
          supabase,
          tracking.application_id,
          true,
      );
    }

    throw new HttpError(
        409,
        "JKM has not confirmed this application. The submission remains uncertain and will not be sent again automatically.",
    );
  }

  const saved = await saveConfirmation(
      supabase,
      tracking,
      recovered,
  );

  if (!saved) {
    const current = await getTrackingRecord(
        supabase,
        tracking.application_id,
    );

    if (current?.submission_state !== "submitted") {
      throw new HttpError(
          409,
          "The JKM submission state changed during recovery. Please try again.",
      );
    }
  }

  return getConfirmedResult(
      supabase,
      tracking.application_id,
      true,
  );
}

// Submit an application to the JKM Mock API
export async function submitJkmApplication(
    input: SubmitJkmApplicationInput,
): Promise<SubmissionResult> {
  const supabase = createAdminClient();

  const applicationId = requiredUuid(
      input.applicationId,
      "applicationId",
  ).toLowerCase();

  // Verify ownership before accessing submission tracking
  const context = await loadApplication(
      supabase,
      applicationId,
      input.userId,
  );

  const existing = await getTrackingRecord(
      supabase,
      applicationId,
  );

  if (existing) {
    validateTrackingIdentity(
        existing,
        applicationId,
    );

    if (existing.submission_state === "submitted") {
      return getConfirmedResult(
          supabase,
          applicationId,
          true,
      );
    }

    if (
        existing.submission_state === "pending" ||
        existing.submission_state === "unknown"
    ) {
      return recoverSubmission(
          supabase,
          existing,
          context.programCode,
      );
    }

    if (existing.submission_state !== "failed") {
      throw new HttpError(
          500,
          "Invalid JKM submission state.",
      );
    }
  }

  // Validate the application before claiming a submission
  await loadSubmissionPayload(
      supabase,
      context,
  );

  // Atomically claim the external submission
  const tracking = await claimSubmission(
      supabase,
      applicationId,
  );

  // Another request may have claimed the same application
  if (!tracking) {
    const current = await getTrackingRecord(
        supabase,
        applicationId,
    );

    if (!current) {
      throw new HttpError(
          409,
          "Unable to claim the JKM submission. Please try again.",
      );
    }

    validateTrackingIdentity(
        current,
        applicationId,
    );

    return recoverSubmission(
        supabase,
        current,
        context.programCode,
    );
  }

  let payload: JkmApplicationPayload;

  // Reload application information after claiming the submission
  try {
    const latestContext = await loadApplication(
        supabase,
        applicationId,
        input.userId,
    );

    if (
        latestContext.programCode !==
        context.programCode ||
        latestContext.application.profile_id !==
        context.application.profile_id
    ) {
      throw new HttpError(
          409,
          "The application changed during submission preparation.",
      );
    }

    payload = await loadSubmissionPayload(
        supabase,
        latestContext,
    );
  } catch (error) {
    // No external request has been made
    await markSubmissionState(
        supabase,
        tracking,
        "failed",
    );

    throw error;
  }

  let confirmation: JkmSubmissionConfirmation;

  // Send the validated application to JKM
  try {
    confirmation = await submitToJkmApi(
        payload,
    );
  } catch (error) {
    const definitiveRejection =
        isDefinitiveJkmSubmissionRejection(
            error,
        );

    await markSubmissionState(
        supabase,
        tracking,
        definitiveRejection
            ? "failed"
            : "unknown",
    );

    if (definitiveRejection) {
      throw error;
    }

    throw new HttpError(
        502,
        "The JKM submission could not be confirmed. Please check the existing application before trying again.",
    );
  }

  // Persist the confirmed external application
  try {
    const resolvedConfirmation =
        await resolveConfirmation(
            confirmation,
        );

    const saved = await saveConfirmation(
        supabase,
        tracking,
        resolvedConfirmation,
    );

    if (!saved) {
      const current = await getTrackingRecord(
          supabase,
          applicationId,
      );

      if (
          current?.submission_state === "submitted"
      ) {
        return getConfirmedResult(
            supabase,
            applicationId,
            true,
        );
      }

      throw new HttpError(
          409,
          "The JKM submission state changed while saving confirmation.",
      );
    }
  } catch (error) {
    // JKM may already have created the application
    await markSubmissionState(
        supabase,
        tracking,
        "unknown",
    );

    throw error;
  }

  return getConfirmedResult(
      supabase,
      applicationId,
      false,
  );
}
