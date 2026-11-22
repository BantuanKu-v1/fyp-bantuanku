import type { SupabaseClient } from "@supabase/supabase-js";

export type ExternalProvider = "str" | "jkm";
export type SubmissionState = "pending" | "submitted" | "failed" | "unknown";

export interface ExternalSubmission {
  id: string,
  application_id: string;
  provider: ExternalProvider;
  external_application_id: string;
  provider_application_id: string | null;
  reference_no: string | null;
  provider_status: string | null;
  submission_state: SubmissionState;
  submitted_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionConfirmation {
  providerApplicationId: string;
  referenceNo: string;
  status: string;
  submittedAt: string;
}

export async function getExternalSubmission(
    db: SupabaseClient,
    applicationId: string,
    provider: ExternalProvider
): Promise<ExternalSubmission | null> {
  const { data, error } = await db
      .from("external_application_submissions")
      .select("*")
      .eq("application_id", applicationId)
      .eq("provider", provider)
      .maybeSingle();

  if (error) {
    throw new Error("Failed to retrieve external submission");
  }

  return data as ExternalSubmission | null;
}
