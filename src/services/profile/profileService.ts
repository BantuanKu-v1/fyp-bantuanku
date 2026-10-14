import { SupportedLanguage } from "../../i18n/types";
import { supabase } from "../../lib/supabase";

export type ProfileOverview = {
  id: string;
  fullName: string;
  identificationNumber: string;
  preferredLanguage: SupportedLanguage;
  employmentStatus: string | null;
  householdMemberCount: number;
  address: {
    city: string;
    stateTerritory: string;
  } | null;
};



export const getCurrentProfileId =
    async (): Promise<string> => {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("No authenticated user.");
      }

      const {
        data: profile,
        error: profileError
      } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("Profile not found.");
      }

      return profile.id;
    };

export const getProfileOverview = async (): Promise<ProfileOverview> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("No authenticated user.");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        identification_no,
        preferred_language,
        employment_status
      `)
      .eq(
          "user_id",
          user.id
      )
      .single();

  if(profileError) {
    throw profileError;
  }

  const [
      addressResult,
      householdResult
  ] = await Promise.all([
      supabase
          .from("addresses")
          .select(`
            city,
            state_territory
          `)
          .eq(
              "profile_id",
              profile.id
          )
          .eq(
              "is_primary",
              true
          )
          .maybeSingle(),

      supabase
          .from("household_members")
          .select(
              "*",
              {
                count: "exact",
                head: true
              }
          )
          .eq(
              "profile_id",
              profile.id
          ),
  ]);

  if (addressResult.error) {
    throw addressResult.error;
  }

  if (householdResult.error) {
    throw householdResult.error;
  }

  return {
    id: profile.id,
    fullName: profile.full_name,
    identificationNumber: profile.identification_no,
    preferredLanguage: profile.preferred_language as SupportedLanguage,
    employmentStatus: profile.employment_status,
    householdMemberCount: householdResult.count ?? 0,
    address: addressResult.data
        ? {
          city: addressResult.data.city,
          stateTerritory: addressResult.data.state_territory,
        }
        : null,
  };
};

export const updatePreferredLanguage = async (
    profileId: string,
    preferredLanguage: SupportedLanguage
) => {
  const { error } = await supabase
      .from("profiles")
      .update({ preferred_language: preferredLanguage })
      .eq("id", profileId);

  if (error) {
    throw error;
  }
};

export const getPreferredLanguage = async (
    userId: string
): Promise<SupportedLanguage | null> => {
  const { data, error } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq(
          "user_id",
          userId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (
      !data ||
      (
          data.preferred_language !== "en" &&
          data.preferred_language !== "ms" &&
          data.preferred_language !== "zh"
      )
  ) {
    return null;
  }

  return data.preferred_language;
};
