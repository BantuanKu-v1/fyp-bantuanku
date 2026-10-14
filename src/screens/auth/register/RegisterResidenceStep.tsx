import { RegisterResidenceFormData, registerResidenceSchema } from "../../../schemas/registration";
import { useTranslation } from "react-i18next";
import {useEffect, useMemo, useState} from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, Text, View } from "react-native";
import { STATE_TERRITORY_MAP, STATE_TERRITORY_VALUES, StateTerritoryValue } from "../../../constants/registration";
import { lookupPostcode } from "../../../services/postcodeService";

import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import RegistrationProgress from "../../../components/auth/RegistrationProgress";
import Select from "../../../components/ui/Select";

type RegisterResidenceStepProps = {
  defaultValues?: RegisterResidenceFormData;
  onBack: () => void;
  onContinue: (data: RegisterResidenceFormData) => void;
};

export default function RegisterResidenceStep({
    defaultValues,
    onBack,
    onContinue
}: RegisterResidenceStepProps) {
  const { t, i18n } = useTranslation();

  const schema = useMemo(
      () => registerResidenceSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const [allowManualLocation, setAllowManualLocation] = useState(false);

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    setError,
    clearErrors,
    formState: { errors, submitCount }
  } = useForm<RegisterResidenceFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      addressLine1: "",
      addressLine2: "",
      postcode: "",
      city: "",
      stateTerritory: "",
    },
  });

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  const stateTerritoryOptions = useMemo<
      {
        label: string;
        value: StateTerritoryValue;
      }[]
  >(
      () =>
          STATE_TERRITORY_VALUES.map((value) => ({
            label:
                value === "kuala_lumpur"
                    ? "W.P. Kuala Lumpur"
                    : value === "labuan"
                        ? "W.P. Labuan"
                        : value === "putrajaya"
                            ? "W.P. Putrajaya"
                            : STATE_TERRITORY_MAP[value],
            value,
          })),
      []
  );

  const handlePostcodeChange = async (
      postcode: string,
      onChange: (value: string) => void
  ) => {
    const formattedPostcode = postcode
        .replace(/\D/g, "")
        .slice(0, 5);

    onChange(formattedPostcode);

    setAllowManualLocation(false);

    if (formattedPostcode.length !== 5) {
      setValue("city", "");
      setValue("stateTerritory", "");
      clearErrors("postcode");

      return;
    }

    try {
      const result = await lookupPostcode(formattedPostcode);

      if (!result) {
        setValue("city", "");
        setValue("stateTerritory", "");

        setError(
            "postcode",
            {
              type: "manual",
              message: t("validation.postcodeInvalid")
            }
        );

        return;
      }

      clearErrors("postcode");

      setValue(
          "city",
          result.city,
          {
            shouldValidate: true
          }
      );

      setValue(
          "stateTerritory",
          result.stateTerritory,
          {
            shouldValidate: true
          }
      );
    } catch (error) {
      if (__DEV__) {
        console.error(
            "[POSTCODE] Failed to look up postcode:",
            error
        );
      }

      setValue("city", "");
      setValue("stateTerritory", "");
      setAllowManualLocation(true);
    }
  };

  return (
      <View>
        <View className="mb-8">
          <RegistrationProgress currentStep={3} />

          <Text className="text-3xl font-bold text-foreground">
            {t("auth.register.residence.title")}
          </Text>

          <Text className="mt-2 text-base leading-6 text-muted-foreground">
            {t("auth.register.residence.subtitle")}
          </Text>
        </View>

        <View className="gap-5">
          <Controller
            control={control}
            name="addressLine1"
            render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth.register.residence.addressLine1")}
                  placeholder={t("auth.register.residence.addressLine1Placeholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.addressLine1?.message}
                  autoCapitalize="words"
                  autoCorrect={false}
                  required
                />
            )}
          />

          <Controller
            control={control}
            name="addressLine2"
            render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth.register.residence.addressLine2")}
                  placeholder={t("auth.register.residence.addressLine2Placeholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.addressLine2?.message}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
            )}
          />

          <Controller
            control={control}
            name="postcode"
            render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth.register.residence.postcode")}
                  placeholder={t("auth.register.residence.postcodePlaceholder")}
                  value={value}
                  onChangeText={(text) => {
                    void handlePostcodeChange(text, onChange);
                  }}
                  onBlur={onBlur}
                  error={errors.postcode?.message}
                  keyboardType="number-pad"
                  maxLength={5}
                  required
                />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                          label={t("auth.register.residence.city")}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={errors.city?.message}
                          autoCapitalize="words"
                          autoCorrect={false}
                          editable={allowManualLocation}
                          required
                      />
                  )}
              />
            </View>

            <View className="flex-1">
              {allowManualLocation ? (
                  <Controller
                      control={control}
                      name="stateTerritory"
                      render={({ field: { onChange, value } }) => (
                          <Select
                              label={t("auth.register.residence.stateTerritory")}
                              placeholder={t("auth.register.residence.selectStateTerritory")}
                              value={value}
                              onChange={onChange}
                              options={stateTerritoryOptions}
                              error={errors.stateTerritory?.message}
                              required
                          />
                      )}
                  />
              ) : (
                  <Controller
                      control={control}
                      name="stateTerritory"
                      render={({ field: { value } }) => (
                          <Input
                              label={t("auth.register.residence.stateTerritory")}
                              value={
                                value
                                    ? value === "kuala_lumpur"
                                        ? "W.P. Kuala Lumpur"
                                        : value === "labuan"
                                            ? "W.P. Labuan"
                                            : value === "putrajaya"
                                                ? "W.P. Putrajaya"
                                                : STATE_TERRITORY_MAP[value]
                                    : ""
                              }
                              error={errors.stateTerritory?.message}
                              editable={false}
                              required
                          />
                      )}
                  />
              )}
            </View>
          </View>

          <Text className="text-sm text-muted-foreground">
            {allowManualLocation
                ? t("auth.register.residence.locationManualHelper")
                : t("auth.register.residence.locationAutoHelper")
            }
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
      </View>
  );
}
