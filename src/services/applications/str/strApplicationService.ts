import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from "@supabase/supabase-js";

import { supabase } from "../../../lib/supabase.ts";

import {
  STR_REQUIRED_ADDRESS_FIELDS,
  STR_REQUIRED_PROFILE_FIELDS,
  STR_APPLICATION_LABELS,
} from "../../../constants/applications/strApplication.ts";

import type {
  ApiResponse,
  StrApplicantReview,
  StrSubmissionResult,
} from "../../../types/applications.ts";

export type StrExternalSubmissionState =
    | "pending"
    | "submitted"
    | "failed"
    | "unknown";

function hasValue(value: unknown): boolean {
  return (
      typeof value === "string" &&
      value.trim().length > 0
  );
}

function isStrExternalSubmissionState(
    value: unknown,
): value is StrExternalSubmissionState {
  return (
      value === "pending" ||
      value === "submitted" ||
      value === "failed" ||
      value === "unknown"
  );
}

export async function getStrApplicantReview(
    profileId: string,
): Promise<StrApplicantReview> {
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
        .eq("is_primary", true)
        .limit(1)
        .maybeSingle(),

    supabase
        .from("household_members")
        .select(`
          full_name,
          relationship
        `)
        .eq("profile_id", profileId),
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
      STR_REQUIRED_PROFILE_FIELDS.every(
          (field) => hasValue(profile[field]),
      );

  const addressComplete =
      address !== null &&
      STR_REQUIRED_ADDRESS_FIELDS.every(
          (field) => hasValue(address[field]),
      );

  const householdMembersComplete =
      householdMembers.every(
          (member) =>
              hasValue(member.full_name) &&
              hasValue(member.relationship),
      );

  return {
    fullName: profile.full_name,
    identificationNo: profile.identification_no,
    dateOfBirth: profile.date_of_birth,
    citizenship: profile.citizenship,
    householdComplete: profile.household_members_complete === true,
    addressComplete,
    householdMembersComplete,
  };
}

export async function getStrExternalSubmissionState(
    applicationId: string,
): Promise<StrExternalSubmissionState | null> {
  const { data, error } = await supabase
      .from("external_application_submissions")
      .select(`
        submission_state
      `)
      .eq("application_id", applicationId)
      .eq("provider", "str")
      .maybeSingle();

  if (error) {
    throw new Error(
        `Unable to retrieve STR submission state: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  if (!isStrExternalSubmissionState(data.submission_state)) {
    throw new Error(
        "Invalid STR external submission state.",
    );
  }

  return data.submission_state;
}

export async function submitStrApplication(
    applicationId: string,
): Promise<StrSubmissionResult> {
  const labels = STR_APPLICATION_LABELS.messages;

  const { data, error } =
      await supabase.functions.invoke<
          ApiResponse<StrSubmissionResult>
      >("submit-str-application", {
        body: {
          applicationId,
        },
      });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      let serverMessage: string | undefined;

      try {
        const response = await error.context.json() as
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

      throw new Error(
          serverMessage ?? labels.submissionError,
      );
    }

    if (
        error instanceof FunctionsFetchError ||
        error instanceof FunctionsRelayError
    ) {
      throw new Error(labels.submissionUncertain);
    }

    throw new Error(labels.submissionUncertain);
  }

  if (!data?.success || !data.data) {
    throw new Error(
        data?.message ?? labels.submissionError,
    );
  }

  const result = data.data;

  if (
      result.applicationId !== applicationId ||
      result.provider !== "str" ||
      result.submissionState !== "submitted" ||
      !hasValue(result.providerApplicationId) ||
      !hasValue(result.referenceNo) ||
      !hasValue(result.submittedAt) ||
      Number.isNaN(Date.parse(result.submittedAt))
  ) {
    throw new Error(labels.invalidConfirmation);
  }

  return result;
}
