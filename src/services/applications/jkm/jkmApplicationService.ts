import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError
} from "@supabase/supabase-js";
import { supabase} from "../../../lib/supabase.ts";
import {
  JKM_SUPPORTED_PROGRAM_CODES,
  JKM_REQUIRED_PROFILE_FIELDS,
  JKM_REQUIRED_ADDRESS_FIELDS,
  JKM_HOUSEHOLD_REQUIRED_PROGRAM_CODES,
  JKM_PROVIDER_STATUSES,
  JKM_APPLICATION_LABELS,
} from "../../../constants/applications/jkmApplication.ts";
import type {
  ApiResponse,
  ExternalSubmissionState,
  JkmApplicantReview,
  JkmProgramCode,
  JkmProviderStatus,
  JkmSubmissionResult
} from "../../../types/applications.ts";

export type JkmExternalSubmissionState = ExternalSubmissionState;

function hasValue(value: unknown): boolean {
  return (
      typeof value === "string" && value.trim().length > 0
  );
}

function isJkmProgramCode(
    value: unknown
): value is JkmProgramCode {
  return JKM_SUPPORTED_PROGRAM_CODES.some(
      (programCode) => programCode === value
  );
}

function isJkmExternalSubmissionState(
    value: unknown
): value is JkmExternalSubmissionState {
  return (
      value === "pending" ||
      value === "submitted"  ||
      value === "failed" ||
      value === "unknown"
  );
}

function isJkmProviderStatus(
    value: unknown
): value is JkmProviderStatus {
  return JKM_PROVIDER_STATUSES.some(
      (status) => status === value
  );
}

function isValidJkmReferenceNo(
    value: unknown,
    expectedProgramCode?: JkmProgramCode
): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const match = value.match(/^JKM-(BA|BAT|BPT|BWE)-\d{4}-[A-F0-9]{12}$/);

  if (!match) {
    return false;
  }

  return !(expectedProgramCode !== undefined && match[1] !== expectedProgramCode);
}

// Retrieve applicant information and check profile readiness
export async function getJkmApplicantReview(
    profileId: string,
    programCode: JkmProgramCode
): Promise<JkmApplicantReview> {
  if (!isJkmProgramCode(programCode)) {
    throw new Error(
        JKM_APPLICATION_LABELS.messages.invalidProgram,
    );
  }

  const householdRequired =
      JKM_HOUSEHOLD_REQUIRED_PROGRAM_CODES.includes(
          programCode,
      );

  const [
    profileResult,
    addressResult,
    householdResult,
  ] = await Promise.all([
    supabase
        .from("profiles")
        .select(`
          full_name,
          identification_no,
          date_of_birth,
          citizenship,
          household_members_complete
        `)
        .eq("id", profileId)
        .single(),

    supabase
        .from("addresses")
        .select(`
          address_line_1,
          postcode,
          city,
          state_territory,
          country_code
        `)
        .eq("profile_id", profileId)
        .eq("address_type", "residential")
        .eq("is_primary", true)
        .maybeSingle(),

    householdRequired
        ? supabase
            .from("household_members")
            .select(`
              full_name,
              relationship
            `)
            .eq("profile_id", profileId)
        : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (addressResult.error) {
    throw addressResult.error;
  }

  if (householdResult.error) {
    throw householdResult.error;
  }

  const profile = profileResult.data;
  const address = addressResult.data;
  const householdMembers = householdResult.data ?? [];

  const profileComplete =
      JKM_REQUIRED_PROFILE_FIELDS.every(
          (field) => hasValue(profile[field]),
      );

  const addressComplete =
      address !== null &&
      JKM_REQUIRED_ADDRESS_FIELDS.every(
          (field) => hasValue(address[field]),
      );

  const householdComplete = profile.household_members_complete === true;

  const householdMembersComplete =
      householdRequired &&
      householdMembers.every(
          (member) =>
              hasValue(member.full_name) &&
              hasValue(member.relationship),
      );

  const profileReady =
      profileComplete &&
      addressComplete &&
      (
          !householdRequired ||
          (
              householdComplete &&
              householdMembersComplete
          )
      );

  return {
    programCode,
    fullName: profile.full_name,
    identificationNo: profile.identification_no,
    dateOfBirth: profile.date_of_birth,
    citizenship: profile.citizenship,
    profileComplete,
    addressComplete,
    householdRequired,
    householdComplete,
    householdMembersComplete,
    profileReady,
  };
}

// Retrieve the current JKM external submission state
export async function getJkmExternalSubmissionState(
    applicationId: string
): Promise<JkmExternalSubmissionState | null> {
  const { data, error } = await supabase
      .from("external_application_submissions")
      .select(`
        submission_state
      `)
      .eq("application_id", applicationId)
      .eq("provider", "jkm")
      .maybeSingle();

  if (error) {
    throw new Error(
        `Unable to retrieve JKM submission state: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  if (
      !isJkmExternalSubmissionState(
          data.submission_state,
      )
  ) {
    throw new Error(
        JKM_APPLICATION_LABELS.messages
            .invalidSubmissionState,
    );
  }

  return data.submission_state;
}

// Submit or recover a JKM application
export async function submitJkmApplication(
    applicationId: string,
    expectedProgramCode?: JkmProgramCode
): Promise<JkmSubmissionResult> {
  const labels = JKM_APPLICATION_LABELS.messages;

  if (
      expectedProgramCode !== undefined &&
      !isJkmProgramCode(expectedProgramCode)
  ) {
    throw new Error(labels.invalidProgram);
  }

  const { data, error } =
      await supabase.functions.invoke<
          ApiResponse<JkmSubmissionResult>
      >("submit-jkm-application", {
        body: {
          applicationId,
        },
      });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      let serverMessage: string | undefined;

      try {
        const response =
            await error.context.json() as
                Partial<ApiResponse<unknown>>;

        if (
            typeof response?.message === "string" &&
            response.message.trim().length > 0
        ) {
          serverMessage = response.message;
        }
      } catch {
        // The server response was not valid JSON
      }

      const status = error.context?.status;

      const submissionUncertain =
          typeof status !== "number" ||
          status === 408 ||
          status >= 500;

      throw new Error(
          serverMessage ??
          (
              submissionUncertain
                  ? labels.submissionUncertain
                  : labels.submissionError
          ),
      );
    }

    if (
        error instanceof FunctionsFetchError ||
        error instanceof FunctionsRelayError
    ) {
      throw new Error(
          labels.submissionUncertain,
      );
    }

    throw new Error(
        labels.submissionUncertain,
    );
  }

  if (data?.success === false) {
    throw new Error(
        typeof data.message === "string" &&
        data.message.trim().length > 0
            ? data.message
            : labels.submissionError,
    );
  }

  if (
      data?.success !== true ||
      !data.data
  ) {
    throw new Error(
        labels.invalidConfirmation,
    );
  }

  const result = data.data;

  if (
      result.applicationId !==
      applicationId.toLowerCase() ||

      result.provider !== "jkm" ||

      result.submissionState !== "submitted" ||

      !hasValue(
          result.providerApplicationId,
      ) ||

      !isValidJkmReferenceNo(
          result.referenceNo,
          expectedProgramCode,
      ) ||

      !isJkmProviderStatus(
          result.providerStatus,
      ) ||

      typeof result.submittedAt !== "string" ||

      !Number.isFinite(
          Date.parse(result.submittedAt),
      ) ||

      typeof result.alreadySubmitted !== "boolean"
  ) {
    throw new Error(
        labels.invalidConfirmation,
    );
  }

  return result;
}
