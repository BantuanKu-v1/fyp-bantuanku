import { supabase } from "../../lib/supabase";
import { getCurrentProfileId } from "../profile/profileService";
import {
  SUPPORTED_APPLICATION_PROGRAM_CODES,
  APPLICATION_ELIGIBILITY_STATUSES,
  EDITABLE_APPLICATION_STATUSES
} from "../../constants/applications/applications";
import type { ApplicationStatus } from "../../types/applications";
import type { AidProgramCode, EligibilityStatus, PreliminaryEligibilitySnapshot } from "../../types/eligibility";
import type { ApplicantEligibilityAssessment } from "../eligibility/eligibility";

type ApplicationData = Record<string, unknown>;

interface ApplicationOwnershipRow {
  id: string;
  profile_id: string;
  status: ApplicationStatus;
  aid_programs: {
    code: string;
  } | null;
}

function isRecord(
    value: unknown
): value is Record<string, unknown> {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

function isSupportedProgramCode(
    value: unknown
): value is AidProgramCode {
  return (
      typeof value === "string" &&
      SUPPORTED_APPLICATION_PROGRAM_CODES.includes(
          value as AidProgramCode
      )
  );
}

function isEligibilityStatus(
    value: unknown
): value is EligibilityStatus {
  return (
      typeof value === "string" &&
      APPLICATION_ELIGIBILITY_STATUSES.includes(
          value as EligibilityStatus
      )
  );
}

function isValidAssessmentDate(
    value: unknown
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);

  return (
      Number.isFinite(date.getTime()) &&
          date.toISOString() === value
  );
}

function isPreliminaryEligibilitySnapshot(
    value: unknown
): value is PreliminaryEligibilitySnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
      isSupportedProgramCode(value.programCode) &&
      isEligibilityStatus(value.status) &&
      typeof value.criteriaVersion === "number" &&
      Number.isSafeInteger(value.criteriaVersion) &&
      value.criteriaVersion > 0 &&
      isValidAssessmentDate(value.assessedAt)
  );
}

export function buildPreliminaryEligibilitySnapshot(
    assessment: ApplicantEligibilityAssessment
): PreliminaryEligibilitySnapshot {
  if (assessment.programCode !== assessment.result.programCode) {
    throw new Error("Eligibility assessment program mismatch.");
  }

  const snapshot: PreliminaryEligibilitySnapshot = {
    programCode: assessment.programCode,
    status: assessment.result.status,
    criteriaVersion: assessment.criteriaVersion,
    assessedAt: assessment.assessedAt,
  };

  if (!isPreliminaryEligibilitySnapshot(snapshot)) {
    throw new Error("Invalid preliminary eligibility assessment.");
  }

  return snapshot;
}

async function getOwnedApplication(
    applicationId: string
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
    throw new Error(`Unable to retrieve application: ${error.message}`);
  }

  if (!data) {
    throw new Error("Application not found or access denied.");
  }

  return data as unknown as ApplicationOwnershipRow;
}

function validateApplicationProgram(
    application: ApplicationOwnershipRow,
    programCode: AidProgramCode
): void {
  const applicationProgramCode =
      application.aid_programs?.code
          ?.trim()
          .toUpperCase();

  if (applicationProgramCode !== programCode) {
    throw new Error("The eligibility assessment does not belong to this aid program.");
  }
}

// Verify that the application can still be modified
function validateApplicationEditable(
    application: ApplicationOwnershipRow
): void {
  if (!EDITABLE_APPLICATION_STATUSES.includes(application.status)) {
    throw new Error("Preliminary eligibility cannot be modified for this application.");
  }
}

// Persist the assessment snapshot without replacing other application data
export async function saveApplicationPreliminaryEligibility(
    applicationId: string,
    snapshot: PreliminaryEligibilitySnapshot
): Promise<PreliminaryEligibilitySnapshot> {
  if (!isPreliminaryEligibilitySnapshot(snapshot)) {
    throw new Error("Invalid preliminary eligibility snapshot.");
  }

  // Verify application ownership and program
  const application = await getOwnedApplication(applicationId);

  validateApplicationProgram(application, snapshot.programCode);

  validateApplicationEditable(application);

  // Perform the protected JSONB merge in the database
  const { error } = await supabase.rpc(
      "save_application_preliminary_eligibility",
      {
        p_application_id: applicationId,
        p_snapshot: snapshot,
      },
  );

  if (error) {
    throw new Error(`Unable to save preliminary eligibility: ${error.message}`);
  }

  return snapshot;
}

// Retrieve the assessment snapshot previously saved for an application
export async function getApplicationPreliminaryEligibility(
    applicationId: string
): Promise<PreliminaryEligibilitySnapshot | null> {
  // Verify application ownership
  const application = await getOwnedApplication(applicationId);

  const { data, error } = await supabase
      .from("application_data")
      .select("data")
      .eq("application_id", applicationId)
      .maybeSingle();

  if (error) {
    throw new Error(`Unable to retrieve preliminary eligibility: ${error.message}`);
  }

  // An application may not have been assessed yet
  if (!data) {
    return null;
  }

  if (!isRecord(data.data)) {
    throw new Error("Invalid stored application data.");
  }

  const applicationData: ApplicationData = data.data;

  const snapshot = applicationData.preliminaryEligibility;

  if (snapshot === null || snapshot === undefined) {
    return null;
  }

  if (!isPreliminaryEligibilitySnapshot(snapshot)) {
    throw new Error("Invalid stored preliminary eligibility snapshot.");
  }

  validateApplicationProgram(application, snapshot.programCode);

  return snapshot;
}

// Convert a completed eligibility assessment into a snapshot and persist it against
// corresponding application
export async function persistApplicationEligibilityAssessment(
    applicationId: string,
    assessment: ApplicantEligibilityAssessment
): Promise<PreliminaryEligibilitySnapshot> {
  const snapshot = buildPreliminaryEligibilitySnapshot(assessment);

  return saveApplicationPreliminaryEligibility(applicationId, snapshot);
}
