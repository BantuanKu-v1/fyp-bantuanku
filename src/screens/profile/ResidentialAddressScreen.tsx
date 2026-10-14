import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../types/tabNavigator";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getResidentialAddress,
  ResidentialAddress,
  updateResidentialAddress
} from "../../services/profile/residentialAddressService";
import { RegisterResidenceFormData, registerResidenceSchema } from "../../schemas/registration";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { STATE_TERRITORY_MAP, STATE_TERRITORY_VALUES, StateTerritoryValue } from "../../constants/registration";
import { lookupPostcode } from "../../services/postcodeService";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";
import Button from "../../components/ui/Button";
import Section from "../../components/layout/Section";
import Card from "../../components/ui/Card";
import AlertDialog from "../../components/ui/AlertDialog";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

type ResidentialAddressScreenProps = NativeStackScreenProps<ProfileStackParamList, "ResidentialAddress">;

type InformationRowProps = {
  label: string;
  value: string;
  showDivider?: boolean;
};

function InformationRow({
    label,
    value,
    showDivider = true
}: InformationRowProps) {
  return (
      <View>
        <View className="py-4">
          <Text className="text-sm text-muted-foreground">
            {label}
          </Text>

          <Text className="mt-1 text-base font-medium text-foreground">
            {value}
          </Text>
        </View>

        {showDivider && (
            <View className="h-px bg-border" />
        )}
      </View>
  );
}

export default function ResidentialAddressScreen({
    navigation
}: ResidentialAddressScreenProps) {
  const { t, i18n } = useTranslation();

  const [address, setAddress] = useState<ResidentialAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [allowManualLocation, setAllowManualLocation] = useState(false);
  const [postcodeLookingUp, setPostcodeLookingUp] = useState(false);

  const postcodeRequestId = useRef(0);

  const schema = useMemo(
      () => registerResidenceSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError: setFormError,
    clearErrors,
    trigger,
    formState: { errors, isDirty, submitCount }
  } = useForm<RegisterResidenceFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      addressLine1: "",
      addressLine2: "",
      postcode: "",
      city: "",
      stateTerritory: "",
    },
  });

  const loadResidentialAddress =
      useCallback(async () => {
        try {
          setLoading(true);
          setError(false);

          const data = await getResidentialAddress();

          setAddress(data);
        } catch (loadError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to load residential address:", loadError
            );
          }

          setError(true);
        } finally {
          setLoading(false);
        }
      }, []);

  useEffect(() => {
    void loadResidentialAddress();
  }, [loadResidentialAddress]);

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
            value
          })),
      []
  );

  const getStateTerritoryLabel = (
      value: string
  ): string => {
    if (!value) {
      return t("common.notProvided");
    }

    if (value === "kuala_lumpur" || value === "Kuala Lumpur") {
      return "W.P. Kuala Lumpur";
    }

    if (value === "labuan" || value === "Labuan") {
      return "W.P. Labuan";
    }

    if (value === "putrajaya" || value === "Putrajaya") {
      return "W.P. Putrajaya";
    }

    const stateKey = value as StateTerritoryValue;

    return STATE_TERRITORY_MAP[stateKey] ?? value;
  };

  const getStateTerritoryFormValue = (
      value: string
  ): StateTerritoryValue | "" => {
    if (!value) {
      return "";
    }

    const matchingValue = STATE_TERRITORY_VALUES.find(
        (stateValue) =>
            stateValue === value ||
            STATE_TERRITORY_MAP[stateValue] === value ||
            (
              stateValue === "kuala_lumpur" && value === "Kuala Lumpur"
            ) ||
            (
                stateValue === "labuan" && value === "Labuan"
            ) ||
            (
                stateValue === "putrajaya" && value === "Putrajaya"
            )
    );

    return matchingValue ?? "";
  };

  const handleEdit = () => {
    if (!address) {
      return;
    }

    postcodeRequestId.current += 1;

    reset({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      postcode: address.postcode,
      city: address.city,
      stateTerritory: getStateTerritoryFormValue(address.stateTerritory),
    });

    setAllowManualLocation(false);
    setPostcodeLookingUp(false);
    setSaveError("");
    setEditing(true);
  };

  const handlePostcodeChange = async (
      postcode: string,
      onChange: (value: string) => void
  ) => {
    const formattedPostcode = postcode.replace(/\D/g, "").slice(0, 5);

    const requestId = ++postcodeRequestId.current;

    onChange(formattedPostcode);

    setAllowManualLocation(false);
    setPostcodeLookingUp(false);
    setSaveError("");

    setValue("city", "", {
      shouldDirty: true,
      shouldValidate: true
    });

    setValue("stateTerritory", "", {
      shouldDirty: true,
      shouldValidate: true
    });

    if (formattedPostcode.length !== 5) {
      clearErrors("postcode");
      return;
    }

    try {
      setPostcodeLookingUp(true);

      const result = await lookupPostcode(formattedPostcode);

      if (requestId !== postcodeRequestId.current) {
        return;
      }

      if (!result) {
        setFormError("postcode", {
          type: "manual",
          message: t("validation.postcodeInvalid")
        });

        return;
      }

      clearErrors("postcode");

      setValue("city", result.city, {
        shouldDirty: true,
        shouldValidate: true,
      });

      setValue("stateTerritory", result.stateTerritory, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (lookupError) {
      if (requestId !== postcodeRequestId.current) {
        return;
      }

      if (__DEV__) {
        console.error(
            "[POSTCODE] Failed to look up postcode:", lookupError
        );
      }

      setAllowManualLocation(true);
    } finally {
      if (requestId === postcodeRequestId.current) {
        setPostcodeLookingUp(false);
      }
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
      return;
    }

    postcodeRequestId.current += 1;
    setPostcodeLookingUp(false);
    setEditing(false);
    setSaveError("");
  };

  const handleDiscard = () => {
    postcodeRequestId.current += 1;

    setShowCancelDialog(false);
    setPostcodeLookingUp(false);
    setEditing(false);
    setSaveError("");
    setAllowManualLocation(false);
  };

  const handleSave = async (
      values: RegisterResidenceFormData
  )=> {
    if (!address) {
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      await updateResidentialAddress(address.id, values);

      const updatedAddress = await getResidentialAddress();

      setAddress(updatedAddress);
      setEditing(false);
      setAllowManualLocation(false);
    } catch (saveError) {
      if (__DEV__) {
        console.error(
            "[PROFILE] Failed to update residential address:", saveError
        );
      }

      setSaveError(t("profile.residentialAddress.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.residentialAddress.title")}
              onBack={() => navigation.goBack()}
          />

          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0352CE" />
          </View>
        </Screen>
    );
  }

  if (error) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.residentialAddress.title")}
              onBack={() => navigation.goBack()}
          />

          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-base font-semibold text-foreground">
              {t("profile.errors.loadTitle")}
            </Text>

            <Text className="mt-2 text-center text-sm leading-5 text-muted-foreground">
              {t("profile.errors.loadDescription")}
            </Text>

            <View className="mt-5">
              <Button onPress={() => void loadResidentialAddress()}>
                {t("profile.errors.tryAgain")}
              </Button>
            </View>
          </View>
        </Screen>
    );
  }

  if (!address) {
    return (
        <Screen>
          <ScreenHeader
              title={t("profile.residentialAddress.title")}
              onBack={() => navigation.goBack()}
              className="mb-8"
          />

          <Section title={t("profile.residentialAddress.title")}>
            <Card>
              <Text className="py-4 text-sm text-muted-foreground">
                {t("profile.residentialAddress.noAddress")}
              </Text>
            </Card>
          </Section>
        </Screen>
    );
  }

  return (
      <Screen>
        <ScreenHeader
            title={t("profile.residentialAddress.title")}
            onBack={() => navigation.goBack()}
            className="mb-8"
        />
        <Section title={t("profile.residentialAddress.title")}>
          <Card>
            {editing ? (
                <View className="gap-5">
                  {/* Address Line 1 */}
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
                              editable={!saving}
                              required
                          />
                      )}
                  />

                  {/* Address Line 2 */}
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
                              editable={!saving}
                          />
                      )}
                  />

                  {/* Postcode */}
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
                              editable={!saving}
                              required
                          />
                      )}
                  />

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      {/* City */}
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
                                  editable={allowManualLocation && !saving}
                                  required
                              />
                          )}
                      />
                    </View>

                    <View className="flex-1">
                      {/* State Territory */}
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
                                      value={getStateTerritoryLabel(value)}
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

                  {saveError ? (
                      <Text className="text-sm text-destructive">
                        {saveError}
                      </Text>
                  ) : null}

                  <View className="flex-row justify-end gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onPress={handleCancel}
                    >
                      {t("common.cancel")}
                    </Button>

                    <Button
                        size="sm"
                        loading={saving}
                        disabled={!isDirty || postcodeLookingUp}
                        onPress={handleSubmit(handleSave)}
                    >
                      {t("common.save")}
                    </Button>
                  </View>
                </View>
            ) : (
                <View>
                  {/* Address Line 1 */}
                  <InformationRow
                      label={t("auth.register.residence.addressLine1")}
                      value={address.addressLine1}
                  />

                  {/* Address Line 2 */}
                  <InformationRow
                      label={t("auth.register.residence.addressLine2")}
                      value={address.addressLine2 || t("common.notProvided")}
                  />

                  {/* Postcode */}
                  <InformationRow
                      label={t("auth.register.residence.postcode")}
                      value={address.postcode}
                  />

                  {/* City */}
                  <InformationRow
                      label={t("auth.register.residence.city")}
                      value={address.city}
                  />

                  {/* State Territory */}
                  <InformationRow
                      label={t("auth.register.residence.stateTerritory")}
                      value={getStateTerritoryLabel(address.stateTerritory)}
                  />

                  {/* Country */}
                  <InformationRow
                      label={t("profile.residentialAddress.country")}
                      value={address.countryCode === "MY" ? "Malaysia" : address.countryCode}
                      showDivider={false}
                  />

                  <View className="items-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onPress={handleEdit}
                    >
                      {t("common.edit")}
                    </Button>
                  </View>
                </View>
            )}
          </Card>
        </Section>

        <AlertDialog
            visible={showCancelDialog}
            variant="warning"
            confirmVariant="destructive"
            title={t("profile.personalInformation.discardChanges.title")}
            message={t("profile.personalInformation.discardChanges.message")}
            confirmText={t("common.discard")}
            cancelText={t("common.keepEditing")}
            onConfirm={handleDiscard}
            onCancel={() => setShowCancelDialog(false)}
            onDismiss={() => setShowCancelDialog(false)}
        />
      </Screen>
  );
}
