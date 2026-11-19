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
