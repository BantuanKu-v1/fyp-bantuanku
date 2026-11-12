import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

import { getQuestionsForProgram } from "../../utils/eligibility/eligibilityQuestions";
import { getSavedEligibilityAnswers, saveEligibilityAnswers } from "../../services/eligibility/eligibilityQuestionnaireService";
import type { EligibilityQuestion } from "../../types/eligibilityQuestions";
import type { ProgramEligibilityAnswers } from "../../services/eligibility/eligibilityDataService";

type ProgramCode = "BAT" | "BPT";
type AnswerObject = Record<string, unknown>;

interface EligibilityQuestionnaireProps {
  programCode: ProgramCode;
  onSaved?: () => void;
  onCancel?: () => void;
}

function getValue(
    object: AnswerObject,
    path: string
): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
      return undefined;
    }

    return (value as AnswerObject)[key];
  }, object);
}

function setValue(
    object: AnswerObject,
    path: string,
    value: unknown
): AnswerObject {
  const keys = path.split(".");
  const result: AnswerObject = { ...object };
  let current = result;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }

    const existing = current[key];

    current[key] =
        existing !== null &&
        typeof existing === "object" &&
        !Array.isArray(existing)
            ? { ...(existing as AnswerObject) }
            : {};

    current = current[key] as AnswerObject;
  });

  return result;
}

function toProgramAnswers(
    programCode: ProgramCode,
    answers: AnswerObject
): ProgramEligibilityAnswers {
  return programCode === "BAT"
      ? { bat: answers as ProgramEligibilityAnswers["bat"] }
      : { bpt: answers as ProgramEligibilityAnswers["bpt"] };
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
  );
}

export default function EligibilityQuestionnaire({
                                                   programCode,
                                                   onSaved,
                                                   onCancel
                                                 }: EligibilityQuestionnaireProps) {
  const [answers, setAnswers] = useState<AnswerObject>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAnswers() {
      setLoading(true);
      setError(null);
      setAnswers({});

      try {
        const saved = await getSavedEligibilityAnswers(programCode);

        if (active) {
          setAnswers(
              saved && typeof saved === "object"
                  ? { ...saved }
                  : {}
          );
        }
      } catch (err) {
        if (active) {
          setError(
              err instanceof Error
                  ? err.message
                  : "Failed to load questionnaire."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAnswers();

    return () => {
      active = false;
    };
  }, [programCode]);

  const visibleQuestions = useMemo(
      () =>
          getQuestionsForProgram(
              programCode,
              toProgramAnswers(programCode, answers)
          ),
      [programCode, answers]
  );

  function updateAnswer(field: string, value: unknown) {
    setAnswers((prev) => setValue(prev, field, value));
    setError(null);
  }

  function validate(): string | null {
    for (const question of visibleQuestions) {
      const value = getValue(answers, question.field);

      if (
          question.required &&
          (value === null || value === undefined || value === "")
      ) {
        return `Please answer: ${question.label}`;
      }

      if (
          question.type === "number" &&
          value !== null &&
          value !== undefined &&
          value !== ""
      ) {
        if (
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            value < 0
        ) {
          return `Please enter a valid number for: ${question.label}`;
        }
      }

      if (
          question.type === "date" &&
          value !== null &&
          value !== undefined &&
          value !== ""
      ) {
        if (
            typeof value !== "string" ||
            !isValidDate(value)
        ) {
          return `Please enter a valid date (YYYY-MM-DD) for: ${question.label}`;
        }
      }

      if (
          question.type === "select" &&
          value !== null &&
          value !== undefined &&
          value !== ""
      ) {
        if (
            !question.options?.some(
                (option) => option.value === value
            )
        ) {
          return `Please select a valid option for: ${question.label}`;
        }
      }
    }

    return null;
  }

  async function handleSave() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (programCode === "BAT") {
        await saveEligibilityAnswers(
            "BAT",
            answers as NonNullable<ProgramEligibilityAnswers["bat"]>
        );
      } else {
        await saveEligibilityAnswers(
            "BPT",
            answers as NonNullable<ProgramEligibilityAnswers["bpt"]>
        );
      }

      onSaved?.();
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : "Failed to save questionnaire."
      );
    } finally {
      setSaving(false);
    }
  }

  function renderQuestion(question: EligibilityQuestion) {
    const value = getValue(answers, question.field);

    return (
        <View
            key={question.id}
            className="mb-4 rounded-2xl border border-border bg-background p-4"
        >
          <Text className="mb-2 text-base font-semibold leading-6 text-foreground">
            {question.label}
            {question.required ? (
                <Text className="text-error"> *</Text>
            ) : null}
          </Text>

          {question.description ? (
              <Text className="mb-4 text-sm leading-5 text-muted-foreground">
                {question.description}
              </Text>
          ) : null}

          {question.type === "boolean" && (
              <View className="flex-row gap-3">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false }
                ].map((option) => {
                  const selected = value === option.value;

                  return (
                      <Pressable
                          key={option.label}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          className={`flex-1 items-center rounded-xl border px-4 py-3 ${
                              selected
                                  ? "border-primary bg-info-background"
                                  : "border-border bg-surface"
                          }`}
                          onPress={() =>
                              updateAnswer(
                                  question.field,
                                  option.value
                              )
                          }
                      >
                        <Text
                            className={`text-sm ${
                                selected
                                    ? "font-semibold text-primary-dark"
                                    : "text-foreground"
                            }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                  );
                })}
              </View>
          )}

          {question.type === "select" && (
              <View className="gap-2">
                {question.options?.map((option) => {
                  const selected = value === option.value;

                  return (
                      <Pressable
                          key={String(option.value)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          className={`flex-row items-center rounded-xl border px-4 py-3 ${
                              selected
                                  ? "border-primary bg-info-background"
                                  : "border-border bg-surface"
                          }`}
                          onPress={() =>
                              updateAnswer(
                                  question.field,
                                  option.value
                              )
                          }
                      >
                        <View
                            className={`mr-3 h-5 w-5 items-center justify-center rounded-full border ${
                                selected
                                    ? "border-primary"
                                    : "border-border"
                            }`}
                        >
                          {selected ? (
                              <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                          ) : null}
                        </View>

                        <Text
                            className={`flex-1 text-sm ${
                                selected
                                    ? "font-semibold text-primary-dark"
                                    : "text-foreground"
                            }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                  );
                })}
              </View>
          )}

          {question.type === "number" && (
              <TextInput
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground"
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor="#626775"
                  value={
                    typeof value === "number"
                        ? String(value)
                        : ""
                  }
                  onChangeText={(text) => {
                    if (text.trim() === "") {
                      updateAnswer(question.field, null);
                      return;
                    }

                    const number = Number(text);

                    if (Number.isFinite(number)) {
                      updateAnswer(question.field, number);
                    }
                  }}
              />
          )}

          {question.type === "date" && (
              <TextInput
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#626775"
                  value={
                    typeof value === "string"
                        ? value
                        : ""
                  }
                  onChangeText={(text) =>
                      updateAnswer(question.field, text)
                  }
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
              />
          )}
        </View>
    );
  }

  if (loading) {
    return (
        <View className="flex-1 items-center justify-center gap-3 bg-background">
          <ActivityIndicator size="large" color="#0352CE" />
          <Text className="text-sm text-muted-foreground">
            Loading questionnaire...
          </Text>
        </View>
    );
  }

  return (
      <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="px-5 pb-10 pt-6"
          keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6">
          <Text className="mb-2 text-2xl font-bold text-foreground">
            {programCode} Eligibility Questionnaire
          </Text>

          <Text className="text-sm leading-6 text-muted-foreground">
            Please provide the additional information required
            for your preliminary eligibility assessment.
          </Text>
        </View>

        <View className="mb-5 flex-row items-center justify-between rounded-xl bg-info-background px-4 py-3">
          <Text className="text-sm font-medium text-info-foreground">
            Additional Information
          </Text>

          <Text className="text-xs text-info-foreground">
            {visibleQuestions.length} questions
          </Text>
        </View>

        {error ? (
            <View className="mb-5 rounded-xl border border-error bg-error-background p-4">
              <Text className="text-sm text-error-foreground">
                {error}
              </Text>
            </View>
        ) : null}

        {visibleQuestions.map(renderQuestion)}

        <View className="mt-5 flex-row gap-3">
          {onCancel ? (
              <Pressable
                  className="flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 py-4"
                  onPress={onCancel}
                  disabled={saving}
              >
                <Text className="font-semibold text-foreground">
                  Cancel
                </Text>
              </Pressable>
          ) : null}

          <Pressable
              className={`flex-1 items-center justify-center rounded-xl bg-primary px-4 py-4 ${
                  saving ? "opacity-50" : ""
              }`}
              onPress={() => void handleSave()}
              disabled={saving}
          >
            {saving ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text className="font-semibold text-white">
                  Save Answers
                </Text>
            )}
          </Pressable>
        </View>

        <Text className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          Your answers are used for preliminary eligibility
          assessment and do not guarantee approval.
        </Text>
      </ScrollView>
  );
}
