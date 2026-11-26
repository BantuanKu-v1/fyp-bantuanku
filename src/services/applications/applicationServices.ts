import { supabase } from "../../lib/supabase";
import { getCurrentProfileId } from "../profile/profileService";

import type {
  ApplicationSummary,
  ApplicationStatus,
  ExternalApplicationProvider,
  ExternalApplicationSubmission,
  ExternalSubmissionState,
  ExternalProviderStatus,
  JkmProgramCode,
} from "../../types/applications";

interface ExternalSubmissionRow {
  provider: ExternalApplicationProvider;
  submission_state: ExternalSubmissionState;
  provider_application_id: string | null;
  reference_no: string | null;
  provider_status: string | null;
  submitted_at: string | null;
  provider_updated_at: string | null;
  last_synced_at: string | null;
}

interface ApplicationRow {
  id: string;
  profile_id: string;
  program_id: string;
  status: ApplicationStatus;
  current_step: string | null;
  simulated_submitted_at: string | null;
  created_at: string;
  updated_at: string;
  aid_programs: {
    code: string;
    name: string;
    agency: string;
  } | null;
  external_application_submissions?: ExternalSubmissionRow[] | null;
}

// Validate supported JKM application programmes
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

// Identify the external provider for a supported programme
function getExternalProvider(
    programCode: string,
): ExternalApplicationProvider | null {
  const normalizedProgramCode = programCode
      .trim()
      .toUpperCase();

  if (normalizedProgramCode === "STR") {
    return "str";
  }

  if (isJkmProgramCode(normalizedProgramCode)) {
    return "jkm";
  }

  return null;
}

// Validate external provider statuses before exposing them to the UI
function normalizeProviderStatus(
    provider: ExternalApplicationProvider,
    status: string | null,
): ExternalProviderStatus | null {
  switch (status) {
    case "submitted":
    case "under_review":
    case "approved":
    case "rejected":
      return status;

    case "additional_information_required":
    case "cancelled":
      return provider === "jkm" ? status : null;

    default:
      return null;
  }
}

// Convert an external submission database row into the frontend model
function toExternalSubmission(
    submission: ExternalSubmissionRow,
): ExternalApplicationSubmission {
  return {
    provider: submission.provider,
    submissionState: submission.submission_state,
    providerApplicationId: submission.provider_application_id,
    referenceNo: submission.reference_no,
    providerStatus: normalizeProviderStatus(
        submission.provider,
        submission.provider_status,
    ),
    submittedAt: submission.submitted_at,
    providerUpdatedAt: submission.provider_updated_at,
    lastSyncedAt: submission.last_synced_at,
  };
}

// Select the external submission belonging to the application's provider
function getExternalSubmission(
    application: ApplicationRow,
): ExternalApplicationSubmission | null {
  const programCode = application.aid_programs?.code;

  if (!programCode) {
    return null;
  }

  const provider = getExternalProvider(programCode);

  if (!provider) {
    return null;
  }

  const submission = application.external_application_submissions?.find(
      (item) => item.provider === provider,
  );

  return submission
      ? toExternalSubmission(submission)
      : null;
}

// Retrieve all applications belonging to the current applicant
export async function getMyApplications(): Promise<ApplicationSummary[]> {
  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
      .from("applications")
      .select(`
      id,
      profile_id,
      program_id,
      status,
      current_step,
      simulated_submitted_at,
      created_at,
      updated_at,
      aid_programs (
        code,
        name,
        agency
      ),
      external_application_submissions (
        provider,
        submission_state,
        provider_application_id,
        reference_no,
        provider_status,
        submitted_at,
        provider_updated_at,
        last_synced_at
      )
    `)
      .eq("profile_id", profileId)
      .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as ApplicationRow[]).map(
      (application) => ({
        id: application.id,
        profileId: application.profile_id,
        programId: application.program_id,
        programCode: application.aid_programs?.code ?? "",
        programName: application.aid_programs?.name ?? "Unknown Program",
        agency: application.aid_programs?.agency ?? "",
        status: application.status,
        currentStep: application.current_step,
        simulatedSubmittedAt: application.simulated_submitted_at,
        createdAt: application.created_at,
        updatedAt: application.updated_at,
        externalSubmission: getExternalSubmission(application),
      }),
  );
}

// Retrieve or create an STR application
export async function getOrCreateStrApplication(): Promise<ApplicationSummary> {
  const profileId = await getCurrentProfileId();

  // Retrieve the active STR aid program
  const { data: program, error: programError } = await supabase
      .from("aid_programs")
      .select("id, code, name, agency, is_active")
      .ilike("code", "STR")
      .eq("is_active", true)
      .maybeSingle();

  if (programError) {
    throw new Error(
        `Unable to retrieve STR program: ${programError.message}`,
    );
  }

  if (!program) {
    throw new Error(
        "The STR aid program is unavailable or inactive.",
    );
  }

  // Convert a db application row into ApplicationSummary
  const toApplicationSummary = (
      application: Omit<ApplicationRow, "aid_programs">,
  ): ApplicationSummary => ({
    id: application.id,
    profileId: application.profile_id,
    programId: application.program_id,
    programCode: program.code,
    programName: program.name,
    agency: program.agency ?? "",
    status: application.status,
    currentStep: application.current_step,
    simulatedSubmittedAt: application.simulated_submitted_at,
    createdAt: application.created_at,
    updatedAt: application.updated_at,
  });

  // Look for an existing unfinished STR application
  const { data: existing, error: existingError } = await supabase
      .from("applications")
      .select(`
        id,
        profile_id,
        program_id,
        status,
        current_step,
        simulated_submitted_at,
        created_at,
        updated_at
      `)
      .eq("profile_id", profileId)
      .eq("program_id", program.id)
      .in("status", ["draft", "in_progress", "ready_for_review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingError) {
    throw new Error(
        `Unable to retrieve STR application: ${existingError.message}`,
    );
  }

  // Resume the existing application instead of creating a duplicate
  if (existing) {
    return toApplicationSummary(existing);
  }

  // Create a new STR application using db defaults:
  // id = gen_random_uuid()
  // status = draft
  // created_at = now()
  // updated_at = now()
  const { data: created, error: createError } = await supabase
      .from("applications")
      .insert({
        profile_id: profileId,
        program_id: program.id,
      })
      .select(`
        id,
        profile_id,
        program_id,
        status,
        current_step,
        simulated_submitted_at,
        created_at,
        updated_at
      `)
      .single();

  if (createError) {
    throw new Error(
        `Unable to create STR application: ${createError.message}`,
    );
  }

  if (!created) {
    throw new Error(
        "STR application was not created successfully.",
    );
  }

  return toApplicationSummary(created);
}

// Retrieve or create a JKM application
export async function getOrCreateJkmApplication(
    programCode: JkmProgramCode,
): Promise<ApplicationSummary> {
  // Validate the requested JKM programme
  if (!isJkmProgramCode(programCode)) {
    throw new Error(
        "Unsupported JKM aid program.",
    );
  }

  const profileId = await getCurrentProfileId();

  // Retrieve the requested active JKM aid programme
  const { data: program, error: programError } = await supabase
      .from("aid_programs")
      .select("id, code, name, agency, is_active")
      .ilike("code", programCode)
      .eq("is_active", true)
      .maybeSingle();

  if (programError) {
    throw new Error(
        `Unable to retrieve ${programCode} program: ${programError.message}`,
    );
  }

  if (!program) {
    throw new Error(
        `The ${programCode} aid program is unavailable or inactive.`,
    );
  }

  // Convert a db application row into ApplicationSummary
  const toApplicationSummary = (
      application: Omit<ApplicationRow, "aid_programs">,
  ): ApplicationSummary => ({
    id: application.id,
    profileId: application.profile_id,
    programId: application.program_id,
    programCode: program.code,
    programName: program.name,
    agency: program.agency ?? "",
    status: application.status,
    currentStep: application.current_step,
    simulatedSubmittedAt: application.simulated_submitted_at,
    createdAt: application.created_at,
    updatedAt: application.updated_at,
    externalSubmission: getExternalSubmission({
      ...application,
      aid_programs: {
        code: program.code,
        name: program.name,
        agency: program.agency ?? "",
      },
    }),
  });

  // Look for an existing unfinished JKM application
  const { data: existing, error: existingError } = await supabase
      .from("applications")
      .select(`
        id,
        profile_id,
        program_id,
        status,
        current_step,
        simulated_submitted_at,
        created_at,
        updated_at,
        external_application_submissions (
          provider,
          submission_state,
          provider_application_id,
          reference_no,
          provider_status,
          submitted_at,
          provider_updated_at,
          last_synced_at
        )
      `)
      .eq("profile_id", profileId)
      .eq("program_id", program.id)
      .in("status", ["draft", "in_progress", "ready_for_review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingError) {
    throw new Error(
        `Unable to retrieve ${programCode} application: ${existingError.message}`,
    );
  }

  // Resume the existing application instead of creating a duplicate
  if (existing) {
    return toApplicationSummary(
        existing as unknown as Omit<ApplicationRow, "aid_programs">,
    );
  }

  // Create a new JKM application using db defaults:
  // id = gen_random_uuid()
  // status = draft
  // created_at = now()
  // updated_at = now()
  const { data: created, error: createError } = await supabase
      .from("applications")
      .insert({
        profile_id: profileId,
        program_id: program.id,
      })
      .select(`
        id,
        profile_id,
        program_id,
        status,
        current_step,
        simulated_submitted_at,
        created_at,
        updated_at
      `)
      .single();

  if (createError) {
    throw new Error(
        `Unable to create ${programCode} application: ${createError.message}`,
    );
  }

  if (!created) {
    throw new Error(
        `${programCode} application was not created successfully.`,
    );
  }

  return toApplicationSummary(created);
}
