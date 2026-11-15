import { ELIGIBILITY_QUESTIONS } from "../../constants/eligibilityQuestions";
import type { EligibilityQuestion } from "../../types/eligibilityQuestions";
import type { ProgramEligibilityAnswers } from "../../services/eligibility/eligibilityDataService";

type QuestionProgramCode = "BAT" | "BPT";

type AnswerValues = Record<string, unknown>;

// Read a nested answer using a field path
function getNestedValue(
    values: AnswerValues,
    path: string
): unknown {
  return path.split(".").reduce<unknown>(
      (current, key) => {
        if (
            current === null ||
            typeof current !== "object"
        ) {
          return undefined;
        }

        return (current as AnswerValues)[key];
      },
      values
  );
}

// Determine whether a conditional question is visible
function isQuestionVisible(
    question: EligibilityQuestion,
    values: AnswerValues
): boolean {
  if (!question.showWhen) {
    return true;
  }

  if (
      question.field === "patient.treatmentStartDate" &&
      getNestedValue(values, "patient.isBedridden") !== false
  ) {
    return false;
  }

  return (
      getNestedValue(values, question.showWhen.field) ===
      question.showWhen.equals
  );
}

// Return the visible questions for one program
export function getQuestionsForProgram(
    programCode: QuestionProgramCode,
    answers: ProgramEligibilityAnswers = {}
): EligibilityQuestion[] {
  const values = (
      answers[programCode.toLowerCase() as "bat" | "bpt"] ??
      {}
  ) as AnswerValues;

  return ELIGIBILITY_QUESTIONS.filter(
      (question) =>
          question.programCode === programCode &&
          isQuestionVisible(question, values)
  );
}

// Return unanswered visible questions
export function getUnansweredQuestions(
    programCode: QuestionProgramCode,
    answers: ProgramEligibilityAnswers = {}
): EligibilityQuestion[] {
  const values = (
      answers[programCode.toLowerCase() as "bat" | "bpt"] ??
      {}
  ) as AnswerValues;

  return getQuestionsForProgram(
      programCode,
      answers
  ).filter((question) => {
    const value = getNestedValue(
        values,
        question.field
    );

    return (
        value === null ||
        value === undefined ||
        value === ""
    );
  });
}
