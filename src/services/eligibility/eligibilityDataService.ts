import { supabase } from "../../lib/supabase";
import { getCurrentProfileId } from "../profile/profileService";
import { EligibilityFactsInput } from "../../utils/eligibility/eligibilityFacts";

// Normalize citizenship values to match JKM eligibility criteria
function normalizeCitizenship(
    value: string | null
): string | null {
  if (!value) {
    return null;
  }

  switch (value.trim().toLowerCase()) {
    case "malaysian":
      return "Malaysian";

    case "non_malaysian":
      return "Non-Malaysian";

    default:
      return null;
  }
}

// Normalize country codes to match JKM eligibility criteria
function normalizeCountry(
    value: string | null
): string | null {
  if (!value) {
    return null;
  }

  switch (value.trim().toUpperCase()) {
    case "MY":
    case "MALAYSIA":
      return "Malaysia";

    default:
      return null;
  }
}

// Convert numeric database values safely
function toNullableNumber(
    value: number | string | null | undefined
): number | null {
  if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
      ? number
      : null;
}

// Retrieve all information required to build eligibility facts
export async function getApplicantEligibilityData(): Promise<EligibilityFactsInput> {
  // Step 1: Resolve the authenticated applicant's profile
  const profileId = await getCurrentProfileId();

  // Step 2: Retrieve the applicant's personal information
  const {
    data: profile,
    error: profileError,
  } = await supabase
      .from("profiles")
      .select(`
      date_of_birth,
      citizenship,
      marital_status,
      is_student,
      study_mode
    `)
      .eq("id", profileId)
      .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new Error("Applicant profile not found.");
  }

  // Step 3: Retrieve eligibility-related records
  const [
    addressResult,
    financialResult,
    householdResult,
    healthResult,
    livingResult,
    caregiverResult,
    welfareResult,
  ] = await Promise.all([
    // Primary residential address
    supabase
        .from("addresses")
        .select(`
        state_territory,
        country_code
      `)
        .eq("profile_id", profileId)
        .eq("address_type", "residential")
        .eq("is_primary", true)
        .maybeSingle(),

    // Financial information
    supabase
        .from("financial_profiles")
        .select(`
        monthly_personal_income,
        monthly_household_income
      `)
        .eq("profile_id", profileId)
        .maybeSingle(),

    // Household members
    supabase
        .from("household_members")
        .select(`
        relationship,
        date_of_birth,
        is_dependent
      `)
        .eq("profile_id", profileId),

    // Health and disability information
    supabase
        .from("health_profiles")
        .select(`
        is_oku,
        oku_registered,
        has_chronic_illness,
        is_bedridden,
        requires_continuous_treatment,
        treatment_start_date
      `)
        .eq("profile_id", profileId)
        .maybeSingle(),

    // Living arrangements
    supabase
        .from("living_arrangements")
        .select(`
        lives_with_family,
        depends_on_family,
        depends_on_caregiver,
        is_in_institution,
        institution_type
      `)
        .eq("profile_id", profileId)
        .maybeSingle(),

    // Caregiver information
    supabase
        .from("caregivers")
        .select(`
        citizenship,
        provides_intensive_care
      `)
        .eq("profile_id", profileId),

    // Existing welfare assistance
    supabase
        .from("welfare_assistance")
        .select(`
        program_name,
        agency,
        assistance_type,
        is_active,
        start_date,
        end_date
      `)
        .eq("profile_id", profileId),
  ]);

  // Step 4: Validate database query results
  if (addressResult.error) {
    throw addressResult.error;
  }

  if (financialResult.error) {
    throw financialResult.error;
  }

  if (householdResult.error) {
    throw householdResult.error;
  }

  if (healthResult.error) {
    throw healthResult.error;
  }

  if (livingResult.error) {
    throw livingResult.error;
  }

  if (caregiverResult.error) {
    throw caregiverResult.error;
  }

  if (welfareResult.error) {
    throw welfareResult.error;
  }

  // Step 5: Build the input structure expected by eligibilityFacts.ts
  return {
    // Personal information
    profile: {
      date_of_birth: profile.date_of_birth,

      citizenship:
          normalizeCitizenship(profile.citizenship),

      marital_status: profile.marital_status,

      is_student: profile.is_student,

      study_mode: profile.study_mode,
    },

    // Residential address
    address: addressResult.data
        ? {
          state_territory:
          addressResult.data.state_territory,

          country_code:
              normalizeCountry(
                  addressResult.data.country_code
              ),
        }
        : null,

    // Financial information
    financialProfile: financialResult.data
        ? {
          monthly_personal_income:
              toNullableNumber(
                  financialResult.data.monthly_personal_income
              ),

          monthly_household_income:
              toNullableNumber(
                  financialResult.data.monthly_household_income
              ),
        }
        : null,

    // Household members
    householdMembers: (householdResult.data ?? []).map(
        (member) => ({
          relationship: member.relationship,

          date_of_birth: member.date_of_birth,

          is_dependent: member.is_dependent,
        })
    ),

    // Health and disability information
    healthProfile: healthResult.data
        ? {
          is_oku: healthResult.data.is_oku,

          oku_registered:
          healthResult.data.oku_registered,

          has_chronic_illness:
          healthResult.data.has_chronic_illness,

          is_bedridden:
          healthResult.data.is_bedridden,

          requires_continuous_treatment:
          healthResult.data.requires_continuous_treatment,

          treatment_start_date:
          healthResult.data.treatment_start_date,
        }
        : null,

    // Living arrangement information
    livingArrangement: livingResult.data
        ? {
          lives_with_family:
          livingResult.data.lives_with_family,

          depends_on_family:
          livingResult.data.depends_on_family,

          depends_on_caregiver:
          livingResult.data.depends_on_caregiver,

          is_in_institution:
          livingResult.data.is_in_institution,

          institution_type:
          livingResult.data.institution_type,
        }
        : null,

    // Caregiver information
    caregivers: (caregiverResult.data ?? []).map(
        (caregiver) => ({
          citizenship:
              normalizeCitizenship(
                  caregiver.citizenship
              ),

          provides_intensive_care:
          caregiver.provides_intensive_care,
        })
    ),

    // Existing welfare assistance
    welfareAssistance: (welfareResult.data ?? []).map(
        (assistance) => ({
          program_name: assistance.program_name,

          agency: assistance.agency,

          assistance_type:
          assistance.assistance_type,

          is_active: assistance.is_active,

          start_date: assistance.start_date,

          end_date: assistance.end_date,
        })
    ),
  };
}
