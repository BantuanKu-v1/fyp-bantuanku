import { supabase} from "../../lib/supabase";
import { getCurrentProfileId } from "../profile/profileService";
import type { ApplicationSummary, ApplicationStatus } from "../../types/applications";

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
}

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
      }),
  );
}

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
      application: Omit<ApplicationRow, "aid_programs">
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
