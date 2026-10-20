import { supabase } from "../../lib/supabase";
import { getCurrentProfileId } from "./profileService";
import { getMissingHouseholdFields } from "../../utils/household/householdCompleteness";

export type HouseholdMemberSummary = {
  id: string;
  fullName: string;
  identificationNumber: string | null;
  relationship: string;
  dateOfBirth: string | null;
  missingFields: string[];
};

export type HouseholdMember = {
  id: string;
  fullName: string;
  identificationNumber: string | null;
  relationship: string;
  dateOfBirth: string | null;
  gender: string | null;
  citizenship: string | null;
  isDependent: boolean | null;
  employmentStatus: string | null;
  occupation: string | null;
  monthlyIncome: number | null;
  isStudent: boolean | null;
  studyMode: string | null;
  institutionType: string | null;
  isOku: boolean | null;
  okuRegistered: boolean | null;
};

// Retrieve a summary of all household members for the household list
export const getHouseholdMembers =
    async (): Promise<HouseholdMemberSummary[]> => {
      const profileId = await getCurrentProfileId();

      const {
        data,
        error
      } = await supabase
          .from("household_members")
          .select(`
            id,
            full_name,
            identification_no,
            relationship,
            date_of_birth,
            gender,
            citizenship,
            is_student,
            study_mode,
            institution_type,
            is_oku,
            oku_registered
          `)
          .eq("profile_id", profileId)
          .order("created_at", {
            ascending: true
          });

      if (error) {
        throw error;
      }

      return data.map((member) => {
        const missingFields = getMissingHouseholdFields({
          fullName: member.full_name,
          relationship: member.relationship,
          identificationNumber: member.identification_no,
          dateOfBirth: member.date_of_birth,
          gender: member.gender,
          citizenship: member.citizenship,
          isStudent: member.is_student,
          studyMode: member.study_mode,
          institutionType: member.institution_type,
          isOku: member.is_oku,
          okuRegistered: member.oku_registered
        });

        return {
          id: member.id,
          fullName: member.full_name,
          identificationNumber: member.identification_no,
          relationship: member.relationship,
          dateOfBirth: member.date_of_birth,
          missingFields
        };
      });
    };

// Retrieve the full details of a specific household member by ID
export const getHouseholdMember =
    async (
        memberId: string
    ): Promise<HouseholdMember> => {
      const profileId = await getCurrentProfileId();

      const {
        data,
        error
      } = await supabase
          .from("household_members")
          .select(`
        id,
        full_name,
        identification_no,
        relationship,
        date_of_birth,
        gender,
        citizenship,
        is_dependent,
        employment_status,
        occupation,
        monthly_income,
        is_student,
        study_mode,
        institution_type,
        is_oku,
        oku_registered
      `)
          .eq("id", memberId)
          .eq("profile_id", profileId)
          .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        fullName: data.full_name,
        identificationNumber: data.identification_no,
        relationship: data.relationship,
        dateOfBirth: data.date_of_birth,
        gender: data.gender,
        citizenship: data.citizenship,
        isDependent: data.is_dependent,
        employmentStatus: data.employment_status,
        occupation: data.occupation,
        monthlyIncome:
            data.monthly_income === null
                ? null
                : Number(data.monthly_income),
        isStudent: data.is_student,
        studyMode: data.study_mode,
        institutionType: data.institution_type,
        isOku: data.is_oku,
        okuRegistered: data.oku_registered
      };
    };

export type CreateHouseholdMemberInput = {
  fullName: string;
  relationship: string;
  dateOfBirth: Date;
  identificationNumber: string;
  gender: string;
  citizenship: string;
  isDependent: boolean | null;
  employmentStatus: string;
  occupation: string;
  monthlyIncome: string;
  isStudent: boolean | null;
  studyMode: string;
  institutionType: string;
  isOku: boolean | null;
  okuRegistered: boolean | null;
};

export const createHouseholdMember =
    async (
        input: CreateHouseholdMemberInput
    ): Promise<string> => {
      const profileId = await getCurrentProfileId();

      const year = input.dateOfBirth.getFullYear();
      const month = String(input.dateOfBirth.getMonth() + 1).padStart(2, "0");
      const day = String(input.dateOfBirth.getDate()).padStart(2, "0");

      const {
        data,
        error
      } = await supabase
          .from("household_members")
          .insert({
            profile_id: profileId,
            full_name: input.fullName.trim(),
            identification_no: input.identificationNumber.trim() || null,
            relationship: input.relationship,
            date_of_birth: `${year}-${month}-${day}`,
            gender: input.gender || null,
            citizenship: input.citizenship || null,
            is_dependent: input.isDependent,
            employment_status: input.employmentStatus || null,
            occupation:
                input.employmentStatus === "employed" ||
                input.employmentStatus === "self_employed"
                    ? input.occupation.trim() || null
                    : null,
            monthly_income:
                input.monthlyIncome.trim() === ""
                    ? null
                    : Number(input.monthlyIncome),
            is_student: input.isStudent,
            study_mode:
                input.isStudent === true
                    ? input.studyMode || null
                    : null,
            institution_type:
                input.isStudent === true
                    ? input.institutionType || null
                    : null,
            is_oku: input.isOku,
            oku_registered:
                input.isOku === true
                    ? input.okuRegistered
                    : null
          })
          .select("id")
          .single();

      if (error) {
        throw error;
      }

      return data.id;
    };

export const updateHouseholdMember =
    async (
        memberId: string,
        input: CreateHouseholdMemberInput
    ): Promise<void> => {
      const profileId = await getCurrentProfileId();

      const year = input.dateOfBirth.getFullYear();
      const month = String(input.dateOfBirth.getMonth() + 1).padStart(2, "0");
      const day = String(input.dateOfBirth.getDate()).padStart(2, "0");

      const {
        data,
        error
      } = await supabase
          .from("household_members")
          .update({
            full_name: input.fullName.trim(),
            identification_no: input.identificationNumber.trim() || null,
            relationship: input.relationship,
            date_of_birth: `${year}-${month}-${day}`,
            gender: input.gender || null,
            citizenship: input.citizenship || null,
            is_dependent: input.isDependent,
            employment_status: input.employmentStatus || null,
            occupation:
                input.employmentStatus === "employed" ||
                input.employmentStatus === "self_employed"
                    ? input.occupation.trim() || null
                    : null,
            monthly_income:
                input.monthlyIncome.trim() === ""
                    ? null
                    : Number(input.monthlyIncome),
            is_student: input.isStudent,
            study_mode:
                input.isStudent === true
                    ? input.studyMode || null
                    : null,
            institution_type:
                input.isStudent === true
                    ? input.institutionType || null
                    : null,
            is_oku: input.isOku,
            oku_registered:
                input.isOku === true
                    ? input.okuRegistered
                    : null
          })
          .eq("id", memberId)
          .eq("profile_id", profileId)
          .select("id")
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Household member not found or update not permitted.");
      }
    };
