import { supabase } from "../../lib/supabase";
import { getCurrentProfileId } from "../profile/profileService";
import type { ProgramEligibilityAnswers } from "./eligibilityDataService";

type QuestionnaireProgramCode = "BAT" | "BPT";

type QuestionnaireAnswers = {
  BAT: NonNullable<ProgramEligibilityAnswers["bat"]>;
  BPT: NonNullable<ProgramEligibilityAnswers["bpt"]>;
};

const QUESTIONNAIRE_SCHEMA_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

// Load saved questionnaire answers
export async function getSavedEligibilityAnswers<
    T extends QuestionnaireProgramCode
>(
    programCode: T
): Promise<QuestionnaireAnswers[T] | null> {
  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
      .from("eligibility_questionnaire_answers")
      .select("answers, schema_version")
      .eq("profile_id", profileId)
      .eq("program_code", programCode)
      .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.schema_version !== QUESTIONNAIRE_SCHEMA_VERSION) {
    throw new Error(
        `Unsupported questionnaire version: ${data.schema_version}`
    );
  }

  if (!isRecord(data.answers)) {
    throw new Error("Invalid saved questionnaire answers.");
  }

  return data.answers as QuestionnaireAnswers[T];
}

// Save or update questionnaire answers
export async function saveEligibilityAnswers<
    T extends QuestionnaireProgramCode
>(
    programCode: T,
    answers: QuestionnaireAnswers[T]
): Promise<void> {
  const profileId = await getCurrentProfileId();

  if (!isRecord(answers)) {
    throw new Error("Questionnaire answers must be an object.");
  }

  const { error } = await supabase
      .from("eligibility_questionnaire_answers")
      .upsert(
          {
            profile_id: profileId,
            program_code: programCode,
            answers,
            schema_version: QUESTIONNAIRE_SCHEMA_VERSION,
          },
          {
            onConflict: "profile_id,program_code",
          }
      );

  if (error) throw error;
}
