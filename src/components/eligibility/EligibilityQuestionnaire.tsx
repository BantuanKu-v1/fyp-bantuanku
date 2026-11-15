import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { getQuestionsForProgram } from "../../utils/eligibility/eligibilityQuestions";
import { ELIGIBILITY_QUESTIONS } from "../../constants/eligibilityQuestions";
import { getSavedEligibilityAnswers, saveEligibilityAnswers } from "../../services/eligibility/eligibilityQuestionnaireService";
import type { EligibilityQuestion, EligibilityProgramCode } from "../../types/eligibilityQuestions";
import type { ProgramEligibilityAnswers } from "../../services/eligibility/eligibilityDataService";

type ProgramCode = EligibilityProgramCode;
type Answers = Record<string, unknown>;
type ErrorCode =
    | "required"
    | "boolean"
    | "select"
    | "number"
    | "nonNegative"
    | "integer"
    | "decimalPlaces"
    | "min"
    | "max"
    | "date"
    | "futureDate";

interface Props {
  programCode: ProgramCode;
  onSaved?: () => void;
  onCancel?: () => void;
}

const BASE = "eligibility.questionnaire";

function getValue(object: Answers, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
      return undefined;
    }

    return (value as Answers)[key];
  }, object);
}

function setValue(
    object: Answers,
    path: string,
    value: unknown
): Answers {
  const keys = path.split(".");
  const result = { ...object };
  let current: Answers = result;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }

    const previous = current[key];

    current[key] =
        previous !== null &&
        typeof previous === "object" &&
        !Array.isArray(previous)
            ? { ...(previous as Answers) }
            : {};

    current = current[key] as Answers;
  });

  return result;
}

function removeValue(
    object: Answers,
    path: string
): Answers {
  const keys = path.split(".");
  const result = { ...object };
  let current: Answers = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const previous = current[keys[i]];

    if (
        previous === null ||
        typeof previous !== "object" ||
        Array.isArray(previous)
    ) {
      return result;
    }

    current[keys[i]] = { ...(previous as Answers) };
    current = current[keys[i]] as Answers;
  }

  delete current[keys[keys.length - 1]];

  return result;
}

function programAnswers(
    programCode: ProgramCode,
    answers: Answers
): ProgramEligibilityAnswers {
  return programCode === "BAT"
      ? { bat: answers as ProgramEligibilityAnswers["bat"] }
      : { bpt: answers as ProgramEligibilityAnswers["bpt"] };
}

function answered(value: unknown): boolean {
  return (
      value !== null &&
      value !== undefined &&
      (typeof value !== "string" || value.trim() !== "")
  );
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
  );
}

function futureDate(value: string): boolean {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return value > today;
}

function validationCode(
    question: EligibilityQuestion,
    value: unknown,
    draft?: string
): ErrorCode | null {
  const raw =
      question.type === "number"
          ? draft ?? (typeof value === "number" ? String(value) : "")
          : undefined;

  if (question.type === "number") {
    if (!answered(raw)) {
      return question.required ? "required" : null;
    }
  } else if (!answered(value)) {
    return question.required ? "required" : null;
  }

  if (question.type === "boolean" && typeof value !== "boolean") {
    return "boolean";
  }

  if (
      question.type === "select" &&
      !question.options?.some((o) => o.value === value)
  ) {
    return "select";
  }

  if (question.type === "number") {
    if (!/^\d+(?:\.\d+)?$/.test(raw ?? "")) {
      return "number";
    }

    const number = Number(raw);

    if (!Number.isFinite(number)) {
      return "number";
    }

    if (number < 0) {
      return "nonNegative";
    }

    if (
        question.inputMode === "integer" &&
        !Number.isInteger(number)
    ) {
      return "integer";
    }

    if (
        question.decimalPlaces !== undefined &&
        (raw?.split(".")[1]?.length ?? 0) > question.decimalPlaces
    ) {
      return "decimalPlaces";
    }

    if (question.min !== undefined && number < question.min) {
      return "min";
    }

    if (question.max !== undefined && number > question.max) {
      return "max";
    }
  }

  if (question.type === "date") {
    if (typeof value !== "string" || !validDate(value)) {
      return "date";
    }

    if (!question.allowFutureDate && futureDate(value)) {
      return "futureDate";
    }
  }

  return null;
}

function visibleAnswers(
    programCode: ProgramCode,
    answers: Answers
): Answers {
  const visibleFields = new Set(
      getQuestionsForProgram(
          programCode,
          programAnswers(programCode, answers)
      ).map((question) => question.field)
  );

  return ELIGIBILITY_QUESTIONS
      .filter(
          (question) =>
              question.programCode === programCode &&
              !visibleFields.has(question.field)
      )
      .reduce(
          (result, question) => removeValue(result, question.field),
          answers
      );
}

export default function EligibilityQuestionnaire({
                                                   programCode,
                                                   onSaved,
                                                   onCancel,
                                                 }: Props) {
  const { t } = useTranslation();

  const [answers, setAnswers] = useState<Answers>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [review, setReview] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<
      ErrorCode | "saveFailed" | null
  >(null);

  const translate = (key: string, fallback?: string) =>
      t(key, { defaultValue: fallback ?? key });

  const label = (q: EligibilityQuestion) =>
      translate(
          `${BASE}.questions.${programCode}.${q.id}.label`,
          q.label
      );

  const description = (q: EligibilityQuestion) =>
      q.description
          ? translate(
              `${BASE}.questions.${programCode}.${q.id}.description`,
              q.description
          )
          : undefined;

  const optionLabel = (
      q: EligibilityQuestion,
      option: { value: unknown; label: string }
  ) => {
    if (option.label === "Yes") {
      return t("common.yes");
    }

    if (option.label === "No") {
      return t("common.no");
    }

    return translate(
        `${BASE}.questions.${programCode}.${q.id}.options.${String(option.value)}`,
        option.label
    );
  };

  useEffect(() => {
    let active = true;

    setLoading(true);
    setLoadFailed(false);
    setError(null);
    setAnswers({});
    setDrafts({});
    setIndex(0);
    setReview(false);
    setEditingReview(false);

    getSavedEligibilityAnswers(programCode)
        .then((saved) => {
          if (active) {
            setAnswers(
                saved &&
                typeof saved === "object" &&
                !Array.isArray(saved)
                    ? { ...saved }
                    : {}
            );
          }
        })
        .catch(() => {
          if (active) setLoadFailed(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

    return () => {
      active = false;
    };
  }, [programCode]);

  const questions = useMemo(
      () =>
          getQuestionsForProgram(
              programCode,
              programAnswers(programCode, answers)
          ),
      [programCode, answers]
  );

  const count = questions.length;
  const safeIndex = Math.min(index, Math.max(count - 1, 0));
  const question = questions[safeIndex];

  const completed = questions.filter(
      (q) =>
          answered(getValue(answers, q.field)) &&
          !validationCode(
              q,
              getValue(answers, q.field),
              drafts[q.field]
          )
  ).length;

  const progress = count ? (completed / count) * 100 : 100;

  const update = (field: string, value: unknown) => {
    setAnswers((previous) => setValue(previous, field, value));
    setError(null);
  };

  const updateNumber = (field: string, text: string) => {
    if (!/^\d*(?:\.\d*)?$/.test(text)) return;

    setDrafts((previous) => ({
      ...previous,
      [field]: text,
    }));

    if (!text) {
      update(field, null);
    } else if (
        /^\d+(?:\.\d+)?$/.test(text) &&
        Number.isFinite(Number(text))
    ) {
      update(field, Number(text));
    } else {
      setError(null);
    }
  };

  const next = () => {
    if (!question) return;

    const issue = validationCode(
        question,
        getValue(answers, question.field),
        drafts[question.field]
    );

    if (issue) {
      setError(issue);
      return;
    }

    setError(null);
    Keyboard.dismiss();

    if (editingReview || safeIndex === count - 1) {
      setReview(true);
      setEditingReview(false);
    } else {
      setIndex(safeIndex + 1);
    }
  };

  const back = () => {
    Keyboard.dismiss();
    setError(null);

    if (review) {
      setReview(false);
      setEditingReview(false);
    } else if (editingReview) {
      setReview(true);
      setEditingReview(false);
    } else if (safeIndex > 0) {
      setIndex(safeIndex - 1);
    } else {
      onCancel?.();
    }
  };

  const save = async () => {
    if (saving || loadFailed) return;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      const issue = validationCode(
          q,
          getValue(answers, q.field),
          drafts[q.field]
      );

      if (issue) {
        setIndex(i);
        setReview(false);
        setEditingReview(false);
        setError(issue);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const cleanedAnswers = visibleAnswers(programCode, answers);

      if (programCode === "BAT") {
        await saveEligibilityAnswers(
            "BAT",
            cleanedAnswers as NonNullable<ProgramEligibilityAnswers["bat"]>
        );
      } else {
        await saveEligibilityAnswers(
            "BPT",
            cleanedAnswers as NonNullable<ProgramEligibilityAnswers["bpt"]>
        );
      }

      onSaved?.();
    } catch {
      setError("saveFailed");
    } finally {
      setSaving(false);
    }
  };

  const displayAnswer = (q: EligibilityQuestion) => {
    const value = getValue(answers, q.field);

    if (!answered(value)) {
      return t("common.notProvided");
    }

    if (q.type === "boolean") {
      return t(value ? "common.yes" : "common.no");
    }

    if (q.type === "select") {
      const option = q.options?.find((o) => o.value === value);

      return option
          ? optionLabel(q, option)
          : t(`${BASE}.unknownSelection`);
    }

    if (q.type === "number" && q.inputMode === "currency") {
      return `RM ${Number(value).toFixed(q.decimalPlaces ?? 2)}`;
    }

    return String(value);
  };

  const radio = (
      q: EligibilityQuestion,
      value: unknown,
      option: { label: string; value: unknown }
  ) => {
    const selected = value === option.value;

    return (
        <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: saving }}
            disabled={saving}
            onPress={() => update(q.field, option.value)}
            className={`flex-row items-center rounded-2xl border p-4 ${
                selected
                    ? "border-primary bg-info-background"
                    : "border-border bg-surface"
            }`}
        >
          <View
              className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
                  selected ? "border-primary" : "border-border"
              }`}
          >
            {selected && (
                <View className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </View>

          <Text
              className={`flex-1 text-base ${
                  selected
                      ? "font-semibold text-primary-dark"
                      : "text-foreground"
              }`}
          >
            {option.label}
          </Text>
        </Pressable>
    );
  };

  if (loading) {
    return (
        <View className="flex-1 items-center justify-center gap-3 bg-background">
          <ActivityIndicator size="large" color="#0352CE" />
          <Text className="text-sm text-muted-foreground">
            {t(`${BASE}.loading`)}
          </Text>
        </View>
    );
  }

  if (loadFailed) {
    return (
        <View className="flex-1 justify-center gap-4 bg-background px-5">
          <Text
              accessibilityRole="alert"
              className="text-center text-error"
          >
            {t(`${BASE}.errors.loadFailed`)}
          </Text>

          <Pressable
              accessibilityRole="button"
              className="rounded-2xl bg-primary p-4"
              onPress={() => {
                setLoading(true);
                setLoadFailed(false);

                getSavedEligibilityAnswers(programCode)
                    .then((saved) => {
                      setAnswers(
                          saved &&
                          typeof saved === "object" &&
                          !Array.isArray(saved)
                              ? { ...saved }
                              : {}
                      );
                    })
                    .catch(() => setLoadFailed(true))
                    .finally(() => setLoading(false));
              }}
          >
            <Text className="text-center font-semibold text-white">
              {t("common.retry")}
            </Text>
          </Pressable>

          {onCancel && (
              <Pressable accessibilityRole="button" onPress={onCancel}>
                <Text className="text-center text-foreground">
                  {t("common.cancel")}
                </Text>
              </Pressable>
          )}
        </View>
    );
  }

  return (
      <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="px-5 pb-12 pt-6"
          keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6">
          {/*<Text className="mb-2 text-2xl font-bold text-foreground">*/}
          {/*  {t(`${BASE}.title`, { programCode })}*/}
          {/*</Text>*/}

          <Text className="text-sm leading-6 text-muted-foreground">
            {t(`${BASE}.subtitle`)}
          </Text>
        </View>

        <View className="mb-6 rounded-2xl bg-surface p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">
              {t(`${BASE}.${review ? "reviewProgress" : "yourProgress"}`)}
            </Text>

            <Text className="text-sm font-semibold text-primary">
              {t(`${BASE}.answeredCount`, {
                answered: completed,
                total: count,
              })}
            </Text>
          </View>

          <View className="h-2 overflow-hidden rounded-full bg-border">
            <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
            />
          </View>

          {!review && question && (
              <Text className="mt-3 text-xs text-muted-foreground">
                {t(`${BASE}.questionCount`, {
                  current: safeIndex + 1,
                  total: count,
                })}
              </Text>
          )}
        </View>

        {error && (
            <View
                accessibilityRole="alert"
                className="mb-5 rounded-2xl border border-error bg-error-background p-4"
            >
              <Text className="text-sm text-error-foreground">
                {error === "required"
                    ? t("validation.required")
                    : error === "saveFailed"
                        ? t(`${BASE}.errors.saveFailed`)
                        : t(`${BASE}.validation.${error}`, {
                          min: question?.min,
                          max: question?.max,
                          count: question?.decimalPlaces,
                        })}
              </Text>
            </View>
        )}

        {review ? (
            <View>
              <Text className="mb-2 text-xl font-bold text-foreground">
                {t(`${BASE}.reviewTitle`)}
              </Text>

              <Text className="mb-5 text-sm leading-6 text-muted-foreground">
                {t(`${BASE}.reviewDescription`)}
              </Text>

              <View className="gap-3">
                {questions.map((q, i) => (
                    <View
                        key={q.id}
                        className="rounded-2xl border border-border bg-background p-4"
                    >
                      <Text className="mb-2 text-sm text-muted-foreground">
                        {label(q)}
                      </Text>

                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="flex-1 text-base font-semibold text-foreground">
                          {displayAnswer(q)}
                        </Text>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t(`${BASE}.editAnswer`, {
                              question: label(q),
                            })}
                            disabled={saving}
                            className="rounded-xl bg-info-background px-4 py-2"
                            onPress={() => {
                              setIndex(i);
                              setReview(false);
                              setEditingReview(true);
                              setError(null);
                            }}
                        >
                          <Text className="text-sm font-semibold text-primary-dark">
                            {t("common.edit")}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                ))}
              </View>
            </View>
        ) : question ? (
            <View className="rounded-3xl border border-border bg-background p-5">
              <View className="mb-4 flex-row">
                <View className="rounded-full bg-info-background px-3 py-1">
                  <Text className="text-xs font-semibold text-info-foreground">
                    {t(
                        `${BASE}.${question.required ? "required" : "optional"}`
                    )}
                  </Text>
                </View>
              </View>

              <Text className="mb-3 text-xl font-bold leading-8 text-foreground">
                {label(question)}
              </Text>

              {description(question) ? (
                  <Text className="mb-6 text-sm leading-6 text-muted-foreground">
                    {description(question)}
                  </Text>
              ) : (
                  <View className="mb-5" />
              )}

              {question.type === "boolean" && (
                  <View className="gap-3" accessibilityRole="radiogroup">
                    {radio(question, getValue(answers, question.field), {
                      label: t("common.yes"),
                      value: true,
                    })}
                    {radio(question, getValue(answers, question.field), {
                      label: t("common.no"),
                      value: false,
                    })}
                  </View>
              )}

              {question.type === "select" && (
                  <View className="gap-3" accessibilityRole="radiogroup">
                    {question.options?.map((option) =>
                        radio(question, getValue(answers, question.field), {
                          value: option.value,
                          label: optionLabel(question, option),
                        })
                    )}
                  </View>
              )}

              {question.type === "number" && (
                  <View>
                    <View className="flex-row items-center rounded-2xl border border-border bg-surface">
                      {question.inputMode === "currency" && (
                          <Text className="pl-4 text-lg font-semibold text-foreground">
                            RM
                          </Text>
                      )}

                      <TextInput
                          accessibilityLabel={label(question)}
                          className="flex-1 px-4 py-4 text-lg text-foreground"
                          keyboardType={
                            question.inputMode === "integer"
                                ? "number-pad"
                                : "decimal-pad"
                          }
                          placeholder={t(
                              `${BASE}.${
                                  question.inputMode === "currency"
                                      ? "amountPlaceholder"
                                      : question.inputMode === "integer"
                                          ? "countPlaceholder"
                                          : "numberPlaceholder"
                              }`
                          )}
                          placeholderTextColor="#626775"
                          value={
                              drafts[question.field] ??
                              (typeof getValue(answers, question.field) === "number"
                                  ? String(getValue(answers, question.field))
                                  : "")
                          }
                          onChangeText={(text) =>
                              updateNumber(question.field, text)
                          }
                          editable={!saving}
                          maxLength={16}
                      />
                    </View>

                    <Text className="mt-3 text-xs text-muted-foreground">
                      {t(`${BASE}.numberHint`)}
                    </Text>
                  </View>
              )}

              {question.type === "date" && (
                  <View>
                    <TextInput
                        accessibilityLabel={label(question)}
                        className="rounded-2xl border border-border bg-surface px-4 py-4 text-lg text-foreground"
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#626775"
                        value={
                          typeof getValue(answers, question.field) === "string"
                              ? String(getValue(answers, question.field))
                              : ""
                        }
                        onChangeText={(text) =>
                            update(question.field, text)
                        }
                        keyboardType="numbers-and-punctuation"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={10}
                        editable={!saving}
                    />

                    <Text className="mt-3 text-xs text-muted-foreground">
                      {t(`${BASE}.dateHint`)}
                    </Text>
                  </View>
              )}
            </View>
        ) : (
            <View className="rounded-2xl border border-border p-5">
              <Text className="text-foreground">
                {t(`${BASE}.noQuestions`)}
              </Text>
            </View>
        )}

        <View className="mt-7 flex-row gap-3">
          {(safeIndex > 0 || review || editingReview || onCancel) && (
              <Pressable
                  accessibilityRole="button"
                  className="flex-1 items-center justify-center rounded-2xl border border-border bg-background px-4 py-4"
                  onPress={back}
                  disabled={saving}
              >
                <Text className="font-semibold text-foreground">
                  {t("common.back")}
                </Text>
              </Pressable>
          )}

          <Pressable
              accessibilityRole="button"
              className={`flex-1 items-center justify-center rounded-2xl bg-primary px-4 py-4 ${
                  saving ? "opacity-50" : ""
              }`}
              onPress={() => {
                if (review || count === 0) {
                  void save();
                } else {
                  next();
                }
              }}
              disabled={saving}
          >
            {saving ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text className="font-semibold text-white">
                  {review || count === 0
                      ? t(`${BASE}.saveAnswers`)
                      : editingReview
                          ? t(`${BASE}.reviewAnswers`)
                          : safeIndex === count - 1
                              ? t(`${BASE}.reviewAnswers`)
                              : t("common.continue")}
                </Text>
            )}
          </Pressable>
        </View>

        <Text className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          {t(`${BASE}.disclaimer`)}
        </Text>
      </ScrollView>
  );
}
