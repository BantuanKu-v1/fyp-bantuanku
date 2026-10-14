import { RegisterHouseholdIncomeFormData, registerHouseholdIncomeSchema } from "../../../schemas/registration";
import { useTranslation } from "react-i18next";
import {useEffect, useMemo, useState} from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, Text, View } from "react-native";
import {ChevronDown, ChevronUp, Plus, Trash2} from "lucide-react-native";
import { EmploymentStatusValue, HouseholdRelationshipValue, IncomeSourceValue } from "../../../constants/registration";

import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input";
import Card from "../../../components/ui/Card";
import DateInput from "../../../components/ui/DatePicker";
import Button from "../../../components/ui/Button";
import RegistrationProgress from "../../../components/auth/RegistrationProgress";
import AlertDialog from "../../../components/ui/AlertDialog";

type RegisterHouseholdIncomeStepProps = {
  defaultValues?: RegisterHouseholdIncomeFormData;
  onBack: () => void;
  onContinue: (data: RegisterHouseholdIncomeFormData) => void;
};

export default function RegisterHouseholdIncomeStep({
    defaultValues,
    onBack,
    onContinue
}: RegisterHouseholdIncomeStepProps) {
  const {t, i18n} = useTranslation();

  const schema = useMemo(
      () => registerHouseholdIncomeSchema(t),
      [t, i18n.resolvedLanguage]
  );


  const employmentStatusOptions = useMemo<
      {
        label: string;
        value: EmploymentStatusValue;
      }[]
  >(
      () => [
        {
          label: t("auth.register.householdIncome.employmentStatusOptions.employed"),
          value: "employed",
        },
        {
          label: t("auth.register.householdIncome.employmentStatusOptions.selfEmployed"),
          value: "self_employed",
        },
        {
          label: t("auth.register.householdIncome.employmentStatusOptions.unemployed"),
          value: "unemployed",
        },
        {
          label: t("auth.register.householdIncome.employmentStatusOptions.retired"),
          value: "retired",
        },
        {
          label: t("auth.register.householdIncome.employmentStatusOptions.notWorking"),
          value: "not_working",
        },
      ], [t, i18n.resolvedLanguage]
  );

  const incomeSourceOptions = useMemo<
      {
        label: string;
        value: IncomeSourceValue;
      }[]
  >(
      () => [
        {
          label: t("auth.register.householdIncome.incomeSourceOptions.salary"),
          value: "salary",
        },
        {
          label: t("auth.register.householdIncome.incomeSourceOptions.selfEmployment"),
          value: "self_employment",
        },
        {
          label: t("auth.register.householdIncome.incomeSourceOptions.pension"),
          value: "pension",
        },
        {
          label: t("auth.register.householdIncome.incomeSourceOptions.governmentAssistance"),
          value: "government_assistance",
        },
        {
          label: t("auth.register.householdIncome.incomeSourceOptions.familySupport"),
          value: "family_support",
        },
        {
          label: t("auth.register.householdIncome.incomeSourceOptions.savings"),
          value: "savings",
        },
        {
          label: t("auth.register.householdIncome.incomeSourceOptions.other"),
          value: "other",
        },
        {
          label: t("auth.register.householdIncome.incomeSourceOptions.noIncome"),
          value: "no_income",
        },
      ], [t, i18n.resolvedLanguage]
  );

  const relationshipOptions = useMemo<
      {
        label: string;
        value: HouseholdRelationshipValue;
      }[]
  >(
      () => [
        {
          label: t("auth.register.householdIncome.relationshipOptions.spouse"),
          value: "spouse",
        },
        {
          label: t("auth.register.householdIncome.relationshipOptions.child"),
          value: "child",
        },
        {
          label: t("auth.register.householdIncome.relationshipOptions.parent"),
          value: "parent",
        },
        {
          label: t("auth.register.householdIncome.relationshipOptions.sibling"),
          value: "sibling",
        },
        {
          label: t("auth.register.householdIncome.relationshipOptions.grandchild"),
          value: "grandchild",
        },
        {
          label: t("auth.register.householdIncome.relationshipOptions.other"),
          value: "other",
        },
      ], [t, i18n.resolvedLanguage]
  );

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    clearErrors,
    formState: {errors, submitCount}
  } = useForm<RegisterHouseholdIncomeFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      employmentStatus: "",
      incomeSource: "",
      personalMonthlyIncome: "",
      householdMonthlyIncome: "",
      householdMembers: []
    },
  });

  const {
    fields,
    append,
    remove
  } = useFieldArray({
    control,
    name: "householdMembers"
  });

  const householdMembers = watch("householdMembers");
  const employmentStatus = watch("employmentStatus");
  const incomeSource = watch("incomeSource");

  const availableIncomeSourceOptions = useMemo(() => {
    if (employmentStatus === "employed") {
      return incomeSourceOptions.filter(
          (option) => option.value === "salary"
      );
    }

    if (employmentStatus === "self_employed") {
      return incomeSourceOptions.filter(
          (option) => option.value === "self_employment"
      );
    }

    if (employmentStatus === "retired") {
      return incomeSourceOptions.filter(
          (option) =>
              option.value !== "salary" &&
              option.value !== "self_employment"
      );
    }

    return incomeSourceOptions.filter(
        (option) =>
            option.value !== "salary" &&
            option.value !== "self_employment" &&
            option.value !== "pension"
    );
  }, [employmentStatus, incomeSourceOptions]);

  const [expandedMemberIndex, setExpandedMemberIndex] =
    useState<number | null>(
        fields.length > 0 ? 0 : null
    );

  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  useEffect(() => {
    if (employmentStatus === "employed") {
      if (incomeSource !== "salary") {
        setValue(
            "incomeSource",
            "salary",
            {
              shouldValidate: true
            }
        );
      }

      return;
    }

    if (employmentStatus === "self_employed") {
      if (incomeSource !== "self_employment") {
        setValue(
            "incomeSource",
            "self_employment",
            {
              shouldValidate: true
            }
        );
      }

      return;
    }

    if (incomeSource && !availableIncomeSourceOptions.some(
        (option) => option.value === incomeSource
    )
    ) {
      setValue(
          "incomeSource",
          "",
          {
            shouldValidate: false
          }
      );

      clearErrors("incomeSource");
    }
  }, [employmentStatus, incomeSource, availableIncomeSourceOptions, setValue, clearErrors]);

  useEffect(() => {
    if (incomeSource === "no_income") {
      setValue(
          "personalMonthlyIncome",
          "0",
          {
            shouldValidate: true
          }
      );
    }
  }, [incomeSource, setValue]);

  useEffect(() => {
    const householdMemberErrors = errors.householdMembers;

    if (!householdMemberErrors) {
      return;
    }

    const firstErrorIndex =
        fields.findIndex(
            (_, index) =>
                errors.householdMembers?.[index] !== undefined
        );

    if (firstErrorIndex >= 0) {
      setExpandedMemberIndex(firstErrorIndex);
    }
  }, [errors.householdMembers]);

  const addHouseholdMember = () => {
    const newIndex = fields.length;

    append({
      fullName: "",
      relationship: "",
      dateOfBirth: null,
    });

    setExpandedMemberIndex(newIndex);
  };

  const minimumDateOfBirth = useMemo(
      () => new Date(1900, 0, 1), []
  );

  const maximumDateOfBirth = useMemo(
      () => new Date(), []
  );

  const handleRemoveHouseholdMember = () => {
    if (memberToRemove == null) {
      return;
    }

    remove(memberToRemove);

    if (expandedMemberIndex === memberToRemove) {
      setExpandedMemberIndex(null);
    } else if (
        expandedMemberIndex !== null &&
        expandedMemberIndex > memberToRemove
    ) {
      setExpandedMemberIndex(expandedMemberIndex - 1);
    }

    setMemberToRemove(null);
  }

  const handleCancelRemoveHouseholdMember = () => { setMemberToRemove(null) };

  return (
      <View>
        <View className="mb-8">
          <RegistrationProgress currentStep={4} />

          <Text className="text-3xl font-bold text-foreground">
            {t("auth.register.householdIncome.title")}
          </Text>

          <Text className="mt-2 text-base leading-6 text-muted-foreground">
            {t("auth.register.householdIncome.subtitle")}
          </Text>
        </View>

        <View className="gap-5">
          <Controller
            control={control}
            name="employmentStatus"
            render={({ field: { onChange, value } }) => (
                <Select
                  label={t("auth.register.householdIncome.employmentStatus")}
                  title={t("auth.register.householdIncome.selectEmploymentStatus")}
                  value={value}
                  onChange={onChange}
                  options={employmentStatusOptions}
                  error={errors.employmentStatus?.message}
                  required
                />
            )}
          />

          <Controller
              control={control}
              name="incomeSource"
              render={({ field: { onChange, value } }) => (
                  <Select
                      label={t("auth.register.householdIncome.incomeSource")}
                      title={t("auth.register.householdIncome.selectIncomeSource")}
                      value={value}
                      onChange={onChange}
                      options={availableIncomeSourceOptions}
                      error={errors.incomeSource?.message}
                      required
                  />
              )}
          />

          <Controller
              control={control}
              name="personalMonthlyIncome"
              render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                      label={t("auth.register.householdIncome.personalMonthlyIncome")}
                      placeholder="0.00"
                      value={value}
                      onChangeText={(text) => {
                        const formatted = text
                            .replace(/[^0-9.]/g, "")
                            .replace(/(\..*)\./g, "$1");
                        onChange(formatted);
                      }}
                      onBlur={onBlur}
                      error={errors.personalMonthlyIncome?.message}
                      keyboardType="decimal-pad"
                      editable={incomeSource !== "no_income"}
                      required
                  />
              )}
          />

          <Controller
              control={control}
              name="householdMonthlyIncome"
              render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                      label={t("auth.register.householdIncome.householdMonthlyIncome")}
                      placeholder="0.00"
                      value={value}
                      onChangeText={(text) => {
                        const formatted = text
                            .replace(/[^0-9.]/g, "")
                            .replace(/(\..*)\./g, "$1");
                        onChange(formatted);
                      }}
                      onBlur={onBlur}
                      error={errors.householdMonthlyIncome?.message}
                      keyboardType="decimal-pad"
                      required
                  />
              )}
          />

          <View className="mt-4">
            <Text className="text-xl font-bold text-foreground">
              {t("auth.register.householdIncome.householdMembers")}
            </Text>

            <Text className="mt-2 text-sm leading-5 text-muted-foreground">
              {t("auth.register.householdIncome.householdMembersHelper")}
            </Text>
          </View>

          {fields.map((field, index) => (
              <Card
                key={field.id}
                className="gap-5"
              >
                <View className="flex-row items-center justify-between">
                  <Pressable
                    className="flex-1 flex-row items-center justify-between"
                    onPress={() => {
                      setExpandedMemberIndex(
                          expandedMemberIndex === index
                            ? null
                            : index
                      );
                    }}
                    accessibilityRole="button"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-semibold text-foreground">
                        {householdMembers[index]?.fullName ||
                          t(
                              "auth.register.householdIncome.householdMember",
                              { number: index + 1 }
                          )}
                      </Text>

                        {householdMembers[index]?.relationship && (
                            <Text className="mt-1 text-sm text-muted-foreground">
                              {relationshipOptions.find(
                                  (option) =>
                                      option.value === householdMembers[index]?.relationship
                              )?.label}
                            </Text>
                        )}
                    </View>

                    {expandedMemberIndex === index ? (
                        <ChevronUp size={20} color="#626775" />
                    ) : (
                        <ChevronDown size={20} color="#626775" />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => setMemberToRemove(index)}
                    accessibilityRole="button"
                    accessibilityLabel={t("auth.register.householdIncome.removeHouseholdMember")}
                    hitSlop={8}
                    className="ml-2 h-10 w-10 items-center justify-center rounded-full"
                  >
                    <Trash2 size={20} color="#F5222D" />
                  </Pressable>
                </View>

                {expandedMemberIndex === index && (
                    <>
                      <Controller
                          control={control}
                          name={`householdMembers.${index}.fullName`}
                          render={({ field: { onChange, onBlur, value } }) => (
                              <Input
                                  label={t("auth.register.householdIncome.memberFullName")}
                                  placeholder={t("auth.register.householdIncome.memberFullNamePlaceholder")}
                                  value={value}
                                  onChangeText={onChange}
                                  onBlur={onBlur}
                                  error={errors.householdMembers?.[index]?.fullName?.message}
                                  autoCapitalize="words"
                                  autoCorrect={false}
                                  required
                              />
                          )}
                      />

                      <Controller
                          control={control}
                          name={`householdMembers.${index}.relationship`}
                          render={({ field: { onChange, value } }) => (
                              <Select
                                  label={t("auth.register.householdIncome.relationship")}
                                  title={t("auth.register.householdIncome.selectRelationship")}
                                  value={value}
                                  onChange={onChange}
                                  options={relationshipOptions}
                                  error={errors.householdMembers?.[index]?.relationship?.message}
                                  required
                              />
                          )}
                      />



                      <Controller
                          control={control}
                          name={`householdMembers.${index}.dateOfBirth`}
                          render={({ field: { onChange, value } }) => (
                              <DateInput
                                  label={t("auth.register.householdIncome.memberDateOfBirth")}
                                  value={value ?? undefined}
                                  onChange={onChange}
                                  minimumDate={minimumDateOfBirth}
                                  maximumDate={maximumDateOfBirth}
                                  error={errors.householdMembers?.[index]?.dateOfBirth?.message}
                                  required
                              />
                          )}
                      />
                    </>
                )}
              </Card>
          ))}

          <Pressable
            onPress={addHouseholdMember}
            accessibilityRole="button"
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-primary
                    bg-background px-4"
          >
            <Plus size={20} color="#0352CE" />

            <Text className="font-semibold text-primary">
              {t("auth.register.householdIncome.addHouseholdMember")}
            </Text>
          </Pressable>

          <Text className="text-sm leading-5 text-muted-foreground">
            {t("auth.register.householdIncome.livingAloneHelper")}
          </Text>

          <View className="mt-2 flex-row gap-3">
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-border bg-background"
            >
              <Text className="font-semibold text-foreground">
                {t("common.back")}
              </Text>
            </Pressable>

            <View className="flex-1">
              <Button
                fullWidth
                onPress={handleSubmit(onContinue)}
              >
                {t("common.continue")}
              </Button>
            </View>
          </View>
        </View>

        <AlertDialog
          visible={memberToRemove !== null}
          variant="warning"
          confirmVariant="destructive"
          title={t("auth.register.householdIncome.removeMemberDialog.title")}
          message={t("auth.register.householdIncome.removeMemberDialog.message")}
          confirmText={t("common.remove")}
          onConfirm={handleRemoveHouseholdMember}
          onCancel={handleCancelRemoveHouseholdMember}
          onDismiss={handleCancelRemoveHouseholdMember}
        />
      </View>
  );
}
