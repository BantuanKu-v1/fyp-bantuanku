import { RegisterPersonalFormData, registerPersonalSchema } from "../../../schemas/registration";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { CitizenshipValue } from "../../../constants/registration";
import { formatMyKad, getDobFromMyKad } from "../../../utils/myKad";

import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import DateInput from "../../../components/ui/DatePicker";
import RegistrationProgress from "../../../components/auth/RegistrationProgress";

type RegisterPersonalStepProps = {
  defaultValues?: RegisterPersonalFormData;
  onBack: () => void;
  onContinue: (data: RegisterPersonalFormData) => void;
  myKadError?: string;
};

const formatMobileNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
};

export default function RegisterPersonalStep({
    defaultValues,
    onBack,
    onContinue,
    myKadError
}: RegisterPersonalStepProps) {
  const { t, i18n } = useTranslation();

  const schema = useMemo(
      () => registerPersonalSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const [dobDerivedFromMyKad, setDobDerivedFromMyKad] =
      useState(defaultValues?.dateOfBirth !== undefined);

  const citizenshipOptions = useMemo<
      {
        label: string;
        value: CitizenshipValue;
      }[]
  >(
      () => [
        {
          label: t("auth.register.personal.malaysian"),
          value: "malaysian",
        },
        {
          label: t("auth.register.personal.nonMalaysian"),
          value: "non_malaysian",
        },
      ],
      [t, i18n.resolvedLanguage]
  );

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, submitCount },
  } = useForm<RegisterPersonalFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      fullName: "",
      myKadNumber: "",
      dateOfBirth: undefined,
      citizenship: "malaysian",
      mobileNumber: "",
    },
  });

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  return (
      <View>
        <View className="mb-8">
          <RegistrationProgress currentStep={2} />

          <Text className="text-3xl font-bold text-foreground">
            {t("auth.register.personal.title")}
          </Text>

          <Text className="mt-2 text-base leading-6 text-muted-foreground">
            {t("auth.register.personal.subtitle")}
          </Text>
        </View>

        <View className="gap-5">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t("auth.register.personal.fullName")}
                placeholder={t("auth.register.personal.fullNamePlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
                autoCapitalize="words"
                autoCorrect={false}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="myKadNumber"
            render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth.register.personal.icNumber")}
                  placeholder={t("auth.register.personal.icNumberPlaceholder")}
                  value={value}
                  onChangeText={(text) => {
                    const formatted = formatMyKad(text);

                    onChange(formatted);

                    const dateOfBirth = getDobFromMyKad(formatted);

                    if (dateOfBirth) {
                      setValue(
                          "dateOfBirth",
                          dateOfBirth,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                      );

                      setDobDerivedFromMyKad(true);
                    } else {
                      setValue(
                          "dateOfBirth",
                          undefined,
                          {
                            shouldValidate: false,
                            shouldDirty: true,
                          }
                      );

                      setDobDerivedFromMyKad(false);
                    }

                    if (formatted.length === 14) {
                      void trigger("myKadNumber");
                    }
                  }}
                  onBlur={onBlur}
                  error={errors.myKadNumber?.message ?? myKadError}
                  keyboardType="number-pad"
                  maxLength={14}
                  required
                />
            )}
          />

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { value } }) => (
                <DateInput
                  label={t("auth.register.personal.dateOfBirth")}
                  placeholder={t("auth.register.personal.dobFromIc")}
                  value={value}
                  // minimumDate={new Date(1900, 0, 1)}
                  // maximumDate={new Date()}
                  error={errors.dateOfBirth?.message}
                  helperText={
                    dobDerivedFromMyKad
                      ? t("auth.register.personal.dobFromIc")
                      : undefined
                  }
                  disabled
                  required
                />
            )}
          />

          <Controller
            control={control}
            name="citizenship"
            render={({ field: { onChange, value, } }) => (
                <Select
                  label={t("auth.register.personal.citizenship")}
                  title={t("auth.register.personal.selectCitizenship")}
                  value={value}
                  onChange={onChange}
                  options={citizenshipOptions}
                  error={errors.citizenship?.message}
                  required
                />
            )}
          />

          <Controller
            control={control}
            name="mobileNumber"
            render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth.register.personal.mobileNumber")}
                  placeholder={t("auth.register.personal.mobilePlaceholder")}
                  value={value}
                  onChangeText={(text) => onChange(formatMobileNumber(text))}
                  onBlur={onBlur}
                  error={errors.mobileNumber?.message}
                  keyboardType="number-pad"
                  maxLength={12}
                  required
                />
            )}
          />

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
      </View>
  );
}
