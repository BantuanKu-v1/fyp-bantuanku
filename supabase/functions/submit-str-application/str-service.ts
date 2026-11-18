import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../_shared/supabase.ts";
import { HttpError } from "../_shared/response.ts";
import { nullableText } from "../_shared/validators.ts";
import { mapToStrApplication, type StrMapperInput } from "./str-mapper.ts";
import { findStrApplicationByExternalId, submitToStrApi, type StrSubmissionConfirmation } from "./str-api.ts";

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
const MIN_APPLICATION_YEAR = 2027;
const STALE_PENDING_MS = 2 * 60 * 1000; // 2 minutes

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
    throw new HttpError(500, "Unable to load applicant address.");
  }

  if (!addressResult.data) {
    throw new HttpError(422, "A primary address is required.");
  }

  if (financialResult.error) {
    throw new HttpError(500, "Unable to load financial information.");
  }

  if (householdResult.error) {
    throw new HttpError(500, "Unable to load household information.");
  }

  return {
    address: addressResult.data,
    financialProfile: financialResult.data,
    householdMembers: householdResult.data ?? [],
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
    console.error("STR submission claim failed:", error.message);

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
    console.error(
        "Failed to save STR confirmation:",
        error.message,
    );

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
    console.error(
        "Failed to synchronize STR application status:",
        error?.message ?? "Application not found",
    );

    throw new HttpError(
        500,
        "STR submission was confirmed but the application status couldn't be synchronized.",
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
    console.error(
        "Unable to mark STR submission as unknown:",
        error.message,
    );
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

  // The lookup can return null only for an explicit HTTP 404
  // Network errors, timeouts and invalid responses throw instead
  const recovered = await findStrApplicationByExternalId(
      tracking.external_application_id,
  );

  if (!recovered) {
    // A 404 does not prove that a previous POST cannot still complete
    // Keep the record blocked from automatic resubmission
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
    // Another request may have completed recovery first
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

  const applicantData = await loadApplicantData(
      supabase,
      String(profile.id),
  );

  validateAddress(applicantData.address);
  validateHouseholdMembers(applicantData.householdMembers);

  const applicationYear = Math.max(
      MIN_APPLICATION_YEAR,
      new Date().getUTCFullYear(),
  );

  const mapperInput: StrMapperInput = {
    applicationId: input.applicationId,
    applicationYear,
    profile,
    address: applicantData.address,
    financialProfile: applicantData.financialProfile,
    householdMembers: applicantData.householdMembers,
  };

  const payload = mapToStrApplication(mapperInput);

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

  let confirmation: StrSubmissionConfirmation;

  try {
    confirmation = await submitToStrApi(payload);
  } catch (error) {
    // STR might have accepted the application before the error
    await markUnknown(supabase, tracking.id);
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
