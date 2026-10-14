import { supabase } from "../../lib/supabase";

export type PersonalInformation = {
  fullName: string;
  identificationNumber: string;
  dateOfBirth: string;
  gender: "male" | "female" | null;
  citizenship: "malaysian" | "non_malaysian";
  maritalStatus: string | null;
  mobilePhone: string | null;
  homePhone: string | null;
  employmentStatus: string | null;
  occupation: string | null;
  isStudent: boolean | null;
  studyMode: string | null;
  institutionType: string | null;
  isOku: boolean | null;
  okuRegistered: boolean | null;
  monthlyPersonalIncome: number | null;
  monthlyHouseholdIncome: number | null;
};

export type PersonalCircumstancesInput = {
  maritalStatus: string | null;
  employmentStatus: string | null;
  occupation: string | null;
  isStudent: boolean | null;
  studyMode: string | null;
  institutionType: string | null;
  isOku: boolean | null;
  okuRegistered: boolean | null;
};

export type FinancialInformationInput = {
  monthlyPersonalIncome: number | null;
  monthlyHouseholdIncome: number | null;
};

const getAuthenticatedUser =
    async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (!user) {
        throw new Error("No authenticated user.");
      }

      return user;
    };

const getCurrentProfileId =
    async (): Promise<string> => {
      const user = await getAuthenticatedUser();

      const {
        data,
        error
      } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

      if (error) {
        throw error;
      }

      return data.id;
    };

export const getPersonalInformation =
    async (): Promise<PersonalInformation> => {
      const user = await getAuthenticatedUser();

      const {
        data: profile,
        error: profileError
      } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            identification_no,
            date_of_birth,
            gender,
            citizenship,
            marital_status,
            mobile_phone,
            home_phone,
            employment_status,
            occupation,
            is_student,
            study_mode,
            institution_type
          `)
          .eq("user_id", user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      const [
        financialResult,
        healthResult
      ] = await Promise.all([
        supabase
            .from("financial_profiles")
            .select(`
              monthly_personal_income,
              monthly_household_income
            `)
            .eq("profile_id", profile.id)
            .maybeSingle(),

        supabase
            .from("health_profiles")
            .select(`
              is_oku,
              oku_registered
            `)
            .eq("profile_id", profile.id)
            .maybeSingle()
      ]);

      if (financialResult.error) {
        throw financialResult.error;
      }

      if (healthResult.error) {
        throw healthResult.error;
      }

      const financial = financialResult.data;
      const health = healthResult.data;

      return {
        fullName: profile.full_name,
        identificationNumber: profile.identification_no,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender as "male" | "female" | null,
        citizenship: profile.citizenship as "malaysian" | "non_malaysian",
        maritalStatus: profile.marital_status,
        mobilePhone: profile.mobile_phone,
        homePhone: profile.home_phone,

        employmentStatus: profile.employment_status,
        occupation: profile.occupation,

        isStudent: profile.is_student,
        studyMode: profile.study_mode,
        institutionType: profile.institution_type,

        isOku: health?.is_oku ?? null,
        okuRegistered: health?.oku_registered ?? null,

        monthlyPersonalIncome: financial?.monthly_personal_income == null
            ? null
            : Number(financial.monthly_personal_income),

        monthlyHouseholdIncome: financial?.monthly_household_income == null
            ? null
            : Number(financial.monthly_household_income)
      };
    };


export const updateMobileNumber =
    async (
        mobilePhone: string
    ): Promise<void> => {
      const user = await getAuthenticatedUser();

      const normalizedMobilePhone = mobilePhone.replace(/\D/g, "");

      const { error } = await supabase
          .from("profiles")
          .update({ mobile_phone: normalizedMobilePhone })
          .eq("user_id", user.id);

      if (error) {
        throw error;
      }
    };


export const updateHomePhone =
    async (
        homePhone: string | null
    ): Promise<void> => {
      const user = await getAuthenticatedUser();

      const normalizedHomePhone =
          homePhone?.replace(/\D/g, "") || null;

      const { error } = await supabase
          .from("profiles")
          .update({
            home_phone: normalizedHomePhone
          })
          .eq("user_id", user.id);

      if (error) {
        throw error;
      }
    };


export const updatePersonalCircumstances =
    async (
        input: PersonalCircumstancesInput
    ): Promise<void> => {
      const user = await getAuthenticatedUser();

      const profileId = await getCurrentProfileId();

      const isWorking =
          input.employmentStatus === "employed" ||
          input.employmentStatus === "self_employed";

      const {
        error: profileError
      } = await supabase
          .from("profiles")
          .update({
            marital_status: input.maritalStatus,
            employment_status: input.employmentStatus,
            occupation: isWorking
                ? input.occupation?.trim() || null
                : null,
            is_student: input.isStudent,
            study_mode: input.isStudent === true
                ? input.studyMode
                : null,
            institution_type: input.isStudent === true
                ? input.institutionType
                : null
          })
          .eq("user_id", user.id);

      if (profileError) {
        throw profileError;
      }

      const {
        error: healthError
      } = await supabase
          .from("health_profiles")
          .upsert(
              {
                profile_id: profileId,
                is_oku: input.isOku,
                oku_registered: input.isOku === true
                    ? input.okuRegistered
                    : null
              },
              {
                onConflict: "profile_id"
              }
          );

      if (healthError) {
        throw healthError;
      }
    };


export const updateFinancialInformation =
    async (
        input: FinancialInformationInput
    ): Promise<void> => {
      const profileId = await getCurrentProfileId();

      const {
        error
      } = await supabase
          .from("financial_profiles")
          .upsert(
              {
                profile_id: profileId,
                monthly_personal_income: input.monthlyPersonalIncome,
                monthly_household_income: input.monthlyHouseholdIncome
              },
              {
                onConflict: "profile_id"
              }
          );

      if (error) {
        throw error;
      }
    };
