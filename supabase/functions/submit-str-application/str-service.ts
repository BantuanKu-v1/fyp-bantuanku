import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../_shared/supabase.ts";
import { HttpError } from "../_shared/response.ts";
import { nullableText } from "../_shared/validators.ts";
import {
  mapToStrApplication,
  type StrMapperInput,
  type StrSupportingDocumentInput,
    type StrPreliminaryEligibility,
    type StrPreliminaryEligibilityStatus
} from "./str-mapper.ts";
import {
  findStrApplicationByExternalId,
  isDefinitiveStrSubmissionRejection,
  submitToStrApi,
  type StrSubmissionConfirmation,
} from "./str-api.ts";

interface SubmitStrApplicationInput {
  applicationId: string;
  userId: string;
}

interface SubmissionResult {
  applicationId: string;
  provider: "str";
  submissionState: "submitted";
  providerApplicationId: string | null;
  referenceNo: string | null;
  providerStatus: string | null;
  submittedAt: string | null;
  alreadySubmitted: boolean;
}

type DatabaseRow = Record<string, unknown>;

type SubmissionState = "pending" | "submitted" | "failed" | "unknown";

interface TrackingRecord {
  id: string;
  application_id: string;
  external_application_id: string;
  submission_state: SubmissionState;
  provider_application_id: string | null;
  reference_no: string | null;
  provider_status: string | null;
  submitted_at: string | null;
  updated_at: string;
}

const PROVIDER = "str";
const STR_APPLICATION_YEAR = 2027;
const STALE_PENDING_MS = 2 * 60 * 1000; // 2 minutes
const MAX_SUPPORTING_DOCUMENTS = 100;

// Log database errors without exposing applicant data or credentials
function logDatabaseError(
    operation: string,
    error: {
      code?: string;
      message: string;
      details?: string;
      hint?: string;
    },
): void {
  console.error(`[STR] ${operation}:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function requireField(value: unknown, fieldName: string): string {
  const text = nullableText(value);

  if (!text) {
    throw new HttpError(422, `Missing required field: ${fieldName}`);
  }

  return text;
}

function validateProfile(profile: DatabaseRow): void {
  requireField(profile.full_name, "full_name");
  requireField(profile.identification_no, "identification_no");
  requireField(profile.date_of_birth, "date_of_birth");
  requireField(profile.citizenship, "citizenship");

  if (profile.household_members_complete !== true) {
    throw new HttpError(
        422,
        "Household information must be marked as complete.",
    );
  }
}

function validateAddress(address: DatabaseRow): void {
  requireField(address.address_line_1, "address_line_1");
  requireField(address.postcode, "postcode");
  requireField(address.city, "city");
  requireField(address.state_territory, "state_territory");
  requireField(address.country_code, "country_code");
}

function validateHouseholdMembers(members: DatabaseRow[]): void {
  for (const member of members) {
    requireField(member.full_name, "household member full_name");
    requireField(member.relationship, "household member relationship");
  }
}

async function loadApplication(
    supabase: SupabaseClient,
    applicationId: string,
    userId: string,
): Promise<{
  application: DatabaseRow;
  profile: DatabaseRow;
}> {
  const { data: application, error: applicationError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

  if (applicationError) {
    logDatabaseError("Load application failed", applicationError);
    throw new HttpError(500, "Unable to load application.");
  }

  if (!application) {
    throw new HttpError(404, "Application not found.");
  }

  const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", application.profile_id)
      .eq("user_id", userId)
      .maybeSingle();

  if (profileError) {
    logDatabaseError("Verify application ownership failed", profileError);
    throw new HttpError(500, "Unable to verify application ownership.");
  }

  if (!profile) {
    throw new HttpError(404, "Application not found.");
  }

  return { application, profile };
}

async function validateStrProgram(
    supabase: SupabaseClient,
    programId: unknown,
): Promise<void> {
  const { data, error } = await supabase
      .from("aid_programs")
      .select("code")
      .eq("id", programId)
      .maybeSingle();

  if (error) {
    logDatabaseError("Verify STR program failed", error);
    throw new HttpError(500, "Unable to verify aid program.");
  }

  if (!data || data.code?.toLowerCase() !== PROVIDER) {
    throw new HttpError(
        422,
        "This application does not belong to the STR program.",
    );
  }
}

async function loadApplicantData(
    supabase: SupabaseClient,
    profileId: string,
): Promise<{
  address: DatabaseRow;
  financialProfile: DatabaseRow | null;
  householdMembers: DatabaseRow[];
}> {
  const [addressResult, financialResult, householdResult] =
      await Promise.all([
        supabase
            .from("addresses")
            .select("*")
            .eq("profile_id", profileId)
            .eq("is_primary", true)
            .limit(1)
            .maybeSingle(),

        supabase
            .from("financial_profiles")
            .select("*")
            .eq("profile_id", profileId)
            .limit(1)
            .maybeSingle(),

        supabase
            .from("household_members")
            .select("*")
            .eq("profile_id", profileId)
            .order("created_at", { ascending: true }),
      ]);

  if (addressResult.error) {
    logDatabaseError("Load applicant address failed", addressResult.error);
    throw new HttpError(500, "Unable to load applicant address.");
  }

  if (!addressResult.data) {
    throw new HttpError(422, "A primary address is required.");
  }

  if (financialResult.error) {
    logDatabaseError("Load financial information failed", financialResult.error);
    throw new HttpError(500, "Unable to load financial information.");
  }

  if (householdResult.error) {
    logDatabaseError("Load household information failed", householdResult.error);
    throw new HttpError(500, "Unable to load household information.");
  }

  return {
    address: addressResult.data,
    financialProfile: financialResult.data,
    householdMembers: householdResult.data ?? [],
  };
}

// Load only documents attached to the current application
// Explicitly verify document ownership because the admin client bypasses RLS
async function loadSupportingDocuments(
    supabase: SupabaseClient,
    applicationId: string,
    profileId: string,
): Promise<StrSupportingDocumentInput[]> {
  const {
    data: applicationDocuments,
    error: applicationDocumentsError,
  } = await supabase
      .from("application_documents")
      .select("id, document_id, requirement_type")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(MAX_SUPPORTING_DOCUMENTS + 1);

  if (applicationDocumentsError) {
    logDatabaseError(
        "Load application supporting documents failed",
        applicationDocumentsError,
    );

    throw new HttpError(
        500,
        "Unable to load application supporting documents.",
    );
  }

  if (!applicationDocuments || applicationDocuments.length === 0) {
    return [];
  }

  if (applicationDocuments.length > MAX_SUPPORTING_DOCUMENTS) {
    throw new HttpError(
        422,
        `A maximum of ${MAX_SUPPORTING_DOCUMENTS} supporting documents is allowed.`,
    );
  }

  // Retrieve each unique document only once
  const documentIds = [
    ...new Set(
        applicationDocuments.map((item) =>
            requireField(item.document_id, "document_id")
        ),
    ),
  ];

  // Retrieve metadata only. Private storage paths are excluded
  const { data: documents, error: documentsError } = await supabase
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
        "Load supporting document metadata failed",
        documentsError,
    );

    throw new HttpError(
        500,
        "Unable to load supporting document metadata.",
    );
  }

  const documentsById = new Map<string, DatabaseRow>();

  for (const document of documents ?? []) {
    documentsById.set(
        String(document.id),
        document,
    );
  }

  // Reject the submission if any linked document is missing or does not belong to the applicant's profile
  return applicationDocuments.map((item) => {
    const documentId = requireField(
        item.document_id,
        "document_id",
    );

    const requirementType = requireField(
        item.requirement_type,
        "requirement_type",
    );

    const document = documentsById.get(documentId);

    if (!document) {
      throw new HttpError(
          422,
          "An attached supporting document is missing or does not belong to the applicant.",
      );
    }

    return {
      requirementType,
      document,
    };
  });
}

function isPreliminaryEligibilityStatus(
    value: unknown
): value is StrPreliminaryEligibilityStatus {
  return (
      value === "potentially_eligible" ||
      value === "potentially_ineligible" ||
      value === "insufficient_information" ||
      value === "manual_verification"
  );
}

async function loadPreliminaryEligibility(
    supabase: SupabaseClient,
    applicationId: string
): Promise<StrPreliminaryEligibility> {
  const { data, error } = await supabase
      .from("application_data")
      .select("data")
      .eq("application_id", applicationId)
      .maybeSingle();

  if (error) {
    logDatabaseError("Log STR preliminary eligibility failed", error);

    throw new HttpError(
        500,
        "Unable to load STR preliminary eligibility."
    );
  }

  if (
      !data ||
      !data.data ||
      typeof data.data !== "object" ||
      Array.isArray(data.data)
  ) {
    throw new HttpError(
        422,
        "A preliminary eligibility assessment is required."
    );
  }

  const applicationData = data.data as DatabaseRow;
  const preliminaryEligibility = applicationData.preliminaryEligibility;

  if (
      !preliminaryEligibility ||
      typeof preliminaryEligibility !== "object" ||
      Array.isArray(preliminaryEligibility)
  ) {
    throw new HttpError(
        422,
        "A preliminary eligibility assessment is required."
    );
  }

  const snapshot = preliminaryEligibility as DatabaseRow;

  if (snapshot.programCode !== "STR") {
    throw new HttpError(
        422,
        "The preliminary eligibility assessment does not belong to STR."
    );
  }

  const status = snapshot.status;
  const criteriaVersion = snapshot.criteriaVersion;
  const assessedAt = snapshot.assessedAt;

  if (!isPreliminaryEligibilityStatus(status)) {
    throw new HttpError(
        422,
        "Invalid STR preliminary eligibility status."
    );
  }

  if (
      typeof criteriaVersion !== "number" ||
      !Number.isSafeInteger(criteriaVersion) ||
      criteriaVersion <= 0
  ) {
    throw new HttpError(
        422,
        "Invalid STR eligibility criteria version"
    );
  }

  if (typeof assessedAt !== "string") {
    throw new HttpError(
        422,
        "Invalid STR eligibility assessment timestamp."
    );
  }

  const assessmentDate = new Date(assessedAt);

  if (
      !Number.isFinite(assessmentDate.getTime()) ||
      assessmentDate.toISOString() !== assessedAt
  ) {
    throw new HttpError(
        422,
        "Invalid STR eligibility assessment timestamp."
    );
  }

  return {
    status,
    criteriaVersion,
    assessedAt,
  };
}

async function getTrackingRecord(
    supabase: SupabaseClient,
    applicationId: string,
): Promise<TrackingRecord | null> {
  const { data, error } = await supabase
      .from("external_application_submissions")
      .select("*")
      .eq("application_id", applicationId)
      .eq("provider", PROVIDER)
      .maybeSingle();

  if (error) {
    logDatabaseError("STR tracking SELECT failed", error);

    throw new HttpError(
        500,
        "Unable to load external submission tracking.",
    );
  }

  return data as TrackingRecord | null;
}

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
    logDatabaseError("STR submission claim failed", error);

    throw new HttpError(
        500,
        "Unable to prepare STR submission.",
    );
  }

  const records = data as TrackingRecord[] | null;

  if (!records || records.length === 0) {
    return null;
  }

  const tracking = records[0];

  if (
      tracking.application_id !== applicationId ||
      tracking.external_application_id !== applicationId ||
      tracking.submission_state !== "pending"
  ) {
    throw new HttpError(
        500,
        "Invalid STR submission tracking record.",
    );
  }

  return tracking;
}

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
        "STR submission tracking identity does not match.",
    );
  }
}

function isStalePending(tracking: TrackingRecord): boolean {
  if (tracking.submission_state !== "pending") {
    return false;
  }

  const updatedAt = Date.parse(tracking.updated_at);

  if (!Number.isFinite(updatedAt)) {
    return false;
  }

  return Date.now() - updatedAt >= STALE_PENDING_MS;
}

function toSubmissionResult(
    tracking: TrackingRecord,
    alreadySubmitted: boolean,
): SubmissionResult {
  if (tracking.submission_state !== "submitted") {
    throw new HttpError(
        409,
        "The STR application has not been confirmed.",
    );
  }

  if (
      !tracking.provider_application_id ||
      !tracking.reference_no ||
      !tracking.submitted_at
  ) {
    throw new HttpError(
        500,
        "The saved STR confirmation is incomplete.",
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

async function saveConfirmation(
    supabase: SupabaseClient,
    trackingId: string,
    confirmation: StrSubmissionConfirmation,
    allowedStates: SubmissionState[],
): Promise<boolean> {
  const { data, error } = await supabase
      .from("external_application_submissions")
      .update({
        submission_state: "submitted",
        provider_application_id: confirmation.id,
        reference_no: confirmation.referenceNo,
        provider_status: confirmation.status,
        submitted_at: confirmation.submittedAt,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", trackingId)
      .in("submission_state", allowedStates)
      .select("id")
      .maybeSingle();

  if (error) {
    logDatabaseError("Save STR confirmation failed", error);

    throw new HttpError(
        500,
        "STR may have accepted the application, but confirmation could not be saved.",
    );
  }

  return data !== null;
}

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

  if (error || !data) {
    if (error) {
      logDatabaseError("Synchronize STR application status failed", error);
    } else {
      console.error(
          "[STR] Synchronize application status failed: Application not found",
      );
    }

    throw new HttpError(
        500,
        "STR submission was confirmed but the application status couldn't be synchronized.",
    );
  }
}

async function markFailed(
    supabase: SupabaseClient,
    tracking: TrackingRecord
): Promise<void> {
  const { data, error } = await supabase
      .from("external_application_submissions")
      .update({
        submission_state: "failed"
      })
      .eq("id", tracking.id)
      .eq("submission_state", "pending")
      .eq("updated_at", tracking.updated_at)
      .select("id")
      .maybeSingle();

  if (error) {
    logDatabaseError("Mark STR submission as failed failed", error);

    throw new HttpError(
        500,
        "Unable to release the STR submission claim."
    );
  }

  if (!data) {
    throw new HttpError(
        409,
        "The STR submission state changed. Refresh and try again."
    );
  }
}

async function markUnknown(
    supabase: SupabaseClient,
    trackingId: string,
): Promise<void> {
  const { error } = await supabase
      .from("external_application_submissions")
      .update({
        submission_state: "unknown",
      })
      .eq("id", trackingId)
      .eq("submission_state", "pending");

  if (error) {
    logDatabaseError("Mark STR submission as unknown failed", error);
  }
}

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
        "STR confirmation tracking could not be retrieved.",
    );
  }

  validateTrackingIdentity(tracking, applicationId);

  const result = toSubmissionResult(
      tracking,
      alreadySubmitted,
  );

  await syncApplicationStatus(
      supabase,
      applicationId,
      result.submittedAt!,
  );

  return result;
}

async function recoverSubmission(
    supabase: SupabaseClient,
    tracking: TrackingRecord,
): Promise<SubmissionResult> {
  validateTrackingIdentity(
      tracking,
      tracking.application_id,
  );

  if (tracking.submission_state === "submitted") {
    return getConfirmedResult(
        supabase,
        tracking.application_id,
        true,
    );
  }

  if (
      tracking.submission_state !== "unknown" &&
      tracking.submission_state !== "pending"
  ) {
    throw new HttpError(
        409,
        "This STR submission is not eligible for recovery.",
    );
  }

  if (
      tracking.submission_state === "pending" &&
      !isStalePending(tracking)
  ) {
    throw new HttpError(
        409,
        "The STR submission is still being processed. Please try again later.",
    );
  }

  const recovered = await findStrApplicationByExternalId(
      tracking.external_application_id,
  );

  if (!recovered) {
    if (tracking.submission_state === "pending") {
      await markUnknown(supabase, tracking.id);
    }

    throw new HttpError(
        409,
        "STR has not confirmed this application. " +
        "The submission remains uncertain and will not be sent again automatically.",
    );
  }

  // STR returned a valid application belonging to this external ID
  const confirmation: StrSubmissionConfirmation = {
    id: recovered.id,
    referenceNo: recovered.referenceNo,
    status: recovered.status,
    submittedAt: recovered.submittedAt,
  };

  const saved = await saveConfirmation(
      supabase,
      tracking.id,
      confirmation,
      ["pending", "unknown"],
  );

  if (!saved) {
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
        "The STR submission state changed during recovery. Please try again.",
    );
  }

  return getConfirmedResult(
      supabase,
      tracking.application_id,
      true,
  );
}

export async function submitStrApplication(
    input: SubmitStrApplicationInput,
): Promise<SubmissionResult> {
  const supabase = createAdminClient();

  // Verify ownership before reading or modifying submission details
  const { application, profile } = await loadApplication(
      supabase,
      input.applicationId,
      input.userId,
  );

  // Verify the program. Eligibility criteria remain external
  await validateStrProgram(
      supabase,
      application.program_id,
  );

  const existing = await getTrackingRecord(
      supabase,
      input.applicationId,
  );

  if (existing) {
    validateTrackingIdentity(existing, input.applicationId);

    if (existing.submission_state === "submitted") {
      return getConfirmedResult(
          supabase,
          input.applicationId,
          true,
      );
    }

    if (
        existing.submission_state === "unknown" ||
        existing.submission_state === "pending"
    ) {
      return recoverSubmission(supabase, existing);
    }
  }

  // Only new or previously failed submissions reach this point
  validateProfile(profile);

  const profileId = requireField(
      profile.id,
      "profile_id",
  );

  // Load applicant information and application-specific documents.
  const [applicantData, supportingDocuments] =
      await Promise.all([
        loadApplicantData(
            supabase,
            profileId,
        ),

        loadSupportingDocuments(
            supabase,
            input.applicationId,
            profileId,
        ),
      ]);

  validateAddress(applicantData.address);
  validateHouseholdMembers(applicantData.householdMembers);

  // const applicationYear = Math.max(
  //     MIN_APPLICATION_YEAR,
  //     new Date().getUTCFullYear(),
  // );

  const applicationYear = STR_APPLICATION_YEAR;

  const mapperInput: StrMapperInput = {
    applicationId: input.applicationId,
    applicationYear,
    profile,
    address: applicantData.address,
    financialProfile: applicantData.financialProfile,
    householdMembers: applicantData.householdMembers,
    supportingDocuments,
  };

  // Validate and map the payload before claiming the submission
  mapToStrApplication(mapperInput);

  // Verify that a preliminary eligibility assessment exists before claiming the submission
  await loadPreliminaryEligibility(supabase, input.applicationId);

  // Atomically claim the application before contacting STR
  const tracking = await claimSubmission(
      supabase,
      input.applicationId,
  );

  if (!tracking) {
    // Another request claimed or completed the submission
    const current = await getTrackingRecord(
        supabase,
        input.applicationId,
    );

    if (!current) {
      throw new HttpError(
          409,
          "The STR submission could not be claimed.",
      );
    }

    validateTrackingIdentity(current, input.applicationId);

    if (current.submission_state === "submitted") {
      return getConfirmedResult(
          supabase,
          input.applicationId,
          true,
      );
    }

    if (
        current.submission_state === "unknown" ||
        current.submission_state === "pending"
    ) {
      return recoverSubmission(supabase, current);
    }

    throw new HttpError(
        409,
        "The STR submission could not be started safely.",
    );
  }

  let payload: ReturnType<typeof mapToStrApplication>;

  try {
    // Retrieve the final preliminary eligibility snapshot after claiming the submission
    const preliminaryEligibility = await loadPreliminaryEligibility(supabase, input.applicationId);

    payload = mapToStrApplication({
      ...mapperInput,
      preliminaryEligibility,
    });
  } catch (error) {
    // STR hasn't been contacted so the submission can be safely marked as failed
    await markFailed(supabase, tracking);

    throw error;
  }

  let confirmation: StrSubmissionConfirmation;

  try {
    confirmation = await submitToStrApi(payload);
  } catch (error) {
    if (isDefinitiveStrSubmissionRejection(error)) {
      // STR explicitly rejected the request before creating an application
      // Allow a corrected submission retry
      await markFailed(supabase, tracking);

      console.info(
          "[STR] Submission definitively rejected",
          {
            applicationId: input.applicationId,
            submissionsState: "failed",
          },
      );
    } else {
      // STR might have accepted the application before the error occurred
      // Preserver duplicate protection
      await markUnknown(supabase, tracking.id);

      console.warn(
          "[STR] Submission outcome remains uncertain",
          {
            applicationId: input.applicationId,
            submissionsState: "unknown",
          },
      );
    }

    throw error;
  }

  let saved: boolean;

  try {
    saved = await saveConfirmation(
        supabase,
        tracking.id,
        confirmation,
        ["pending"],
    );
  } catch (error) {
    await markUnknown(supabase, tracking.id);
    throw error;
  }

  if (!saved) {
    // Recovery may have saved the confirmation concurrently
    const current = await getTrackingRecord(
        supabase,
        input.applicationId,
    );

    if (current?.submission_state === "submitted") {
      return getConfirmedResult(
          supabase,
          input.applicationId,
          true,
      );
    }

    await markUnknown(supabase, tracking.id);

    throw new HttpError(
        500,
        "STR accepted the application but confirmation couldn't be saved.",
    );
  }

  return getConfirmedResult(
      supabase,
      input.applicationId,
      false,
  );
}
