import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../types/tabNavigator";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import { getPersonalInformation, PersonalInformation, updateMobileNumber } from "../../services/profile/personalInfoService";
import { Mars, Venus } from "lucide-react-native";
import { mobileNumberSchema } from "../../schemas/registration";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";
import Button from "../../components/ui/Button";
import Section from "../../components/layout/Section";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import AlertDialog from "../../components/ui/AlertDialog";

type PersonalInfoScreensProps = NativeStackScreenProps<ProfileStackParamList, "PersonalInformation">;

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

export default function PersonalInfoScreen({
    navigation
}: PersonalInfoScreensProps) {
  const { t } = useTranslation();

  const [personalInformation, setPersonalInformation] = useState<PersonalInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingMobile, setEditingMobile] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [savingMobile, setSavingMobile] = useState(false);
  const [originalMobileNumber, setOriginalMobileNumber] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const loadPersonalInformation =
      useCallback(async () => {
        try {
          setLoading(true);
          setError(false);

          const data = await getPersonalInformation();

          setPersonalInformation(data);
        } catch (loadError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to load personal information:", loadError
            );
          }

          setError(true);
        } finally {
          setLoading(false);
        }
      }, []);

  useEffect(() => {
    void loadPersonalInformation();
  }, [loadPersonalInformation]);

  const formatDateOfBirth = (
      dateOfBirth: string
  ) => {
    const [year, month, day] = dateOfBirth.split("-");

    if (!year || !month || !day) {
      return dateOfBirth;
    }

    return `${day}/${month}/${year}`;
  };

  const formatIdentificationNumber = (
      identificationNumber: string
  ) => {
    const digits = identificationNumber.replace(/\D/g, "");

    if (digits.length !== 12) {
      return identificationNumber;
    }

    return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  };

  const formatMobileNumber = (
      mobileNumber: string | null
  ) => {
    if (!mobileNumber) {
      return t("common.notProvided");
    }

    if (mobileNumber.length <= 3) {
      return mobileNumber;
    }

    return `${mobileNumber.slice(0, 3)}-${mobileNumber.slice(3)}`;
  };

  const getGenderLabel = () => {
    if (!personalInformation?.gender) {
      return t("common.notProvided");
    }

    return t(`profile.personalInformation.${personalInformation.gender}`);
  };

  const getCitizenshipLabel = () => {
    if (!personalInformation) {
      return "";
    }

    return personalInformation.citizenship ===
        "malaysian"
        ? t(
            "profile.personalInformation.malaysian"
        )
        : t(
            "profile.personalInformation.nonMalaysian"
        );
  };

  const hasMobileChanged =
      mobileNumber.replace(/\D/g, "") !==
      originalMobileNumber.replace(/\D/g, "");

  const handleEditMobile = () => {
    const currentMobileNumber =
        personalInformation?.mobilePhone
            ? formatMobileNumber(personalInformation.mobilePhone)
            : "";

    setOriginalMobileNumber(currentMobileNumber);
    setMobileNumber(currentMobileNumber);
    setMobileError("");
    setEditingMobile(true);
  };

  const handleMobileChange = (
      value: string
  ) => {
    setMobileNumber(value);

    if (mobileError) {
      setMobileError("");
    }
  };

  const handleCancelMobile = () => {
    if (hasMobileChanged) {
      setShowCancelDialog(true);

      return;
    }

    setEditingMobile(false);
    setMobileNumber("");
    setOriginalMobileNumber("");
    setMobileError("");
  };

  const handleDiscardMobile = () => {
    setShowCancelDialog(false);
    setEditingMobile(false);
    setMobileNumber("");
    setOriginalMobileNumber("");
    setMobileError("");
  };

  const handleSaveMobile =
      async () => {
        const result =
            mobileNumberSchema(t).safeParse(
                mobileNumber
            );

        if (!result.success) {
          setMobileError(
              result.error.issues[0]?.message ??
              t("validation.mobileNumberInvalid")
          );

          return;
        }

        try {
          setSavingMobile(true);
          setMobileError("");

          await updateMobileNumber(
              result.data
          );

          const updatedInformation =
              await getPersonalInformation();

          setPersonalInformation(
              updatedInformation
          );

          setEditingMobile(false);
          setMobileNumber("");
          setOriginalMobileNumber("");
        } catch (saveError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to update mobile number:", saveError
            );
          }

          setMobileError(
              t(
                  "profile.personalInformation.updateFailed"
              )
          );
        } finally {
          setSavingMobile(false);
        }
      };

  if (loading) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.personalInformation.title")}
              onBack={() => navigation.goBack()}
          />
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0352CE"/>
          </View>
        </Screen>
    );
  }

  if (error || !personalInformation) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.personalInformation.title")}
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
              <Button
                onPress={() => void loadPersonalInformation()}
              >
                {t("profile.errors.tryAgain")}
              </Button>
            </View>
          </View>
        </Screen>
    );
  }

  return (
      <Screen>
        <ScreenHeader
            title={t("profile.personalInformation.title")}
            // description={t("profile.personalInformation.description")}
            onBack={() => navigation.goBack()}
            className="mb-8"
        />

        <View className="gap-8">
          <Section title={t("profile.personalInformation.personalDetails")}>
            <Card>
              {/* Full name */}
              <InformationRow
                  label={t("profile.personalInformation.fullName")}
                  value={personalInformation.fullName}
              />

              {/* IC number */}
              <InformationRow
                  label={t("profile.personalInformation.identificationNumber")}
                  value={formatIdentificationNumber(personalInformation.identificationNumber)}
              />

              {/* DOB */}
              <InformationRow
                  label={t("profile.personalInformation.dateOfBirth")}
                  value={formatDateOfBirth(personalInformation.dateOfBirth)}
              />

              {/* Gender */}
              <View>
                <View className="py-4">
                  <Text className="text-sm text-muted-foreground">
                    {t("profile.personalInformation.gender")}
                  </Text>

                  <View className="mt-1 flex-row items-center gap-2">
                    {personalInformation.gender === "male" && (
                        <Mars size={18} color="#0352CE" />
                    )}

                    {personalInformation.gender === "female" && (
                        <Venus size={18} color="#FFC0CB" />
                    )}

                    <Text className="text-base font-medium text-foreground">
                      {getGenderLabel()}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-border" />
              </View>

              {/* Citizenship */}
              <InformationRow
                  label={t("profile.personalInformation.citizenship")}
                  value={getCitizenshipLabel()}
                  showDivider={false}
              />
            </Card>
          </Section>

          {/* Contact - mobile (editable) */}
          <Section title={t("profile.personalInformation.contact")}>
            <Card>
              {editingMobile ? (
                  <View className="gap-4">
                    <Input
                        label={t("profile.personalInformation.mobileNumber")}
                        value={mobileNumber}
                        onChangeText={handleMobileChange}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        placeholder="012-3456789"
                        error={mobileError || undefined}
                        editable={!savingMobile}
                    />

                    <View className="flex-row justify-end gap-3">
                      <Button
                          variant="outline"
                          size="sm"
                          disabled={savingMobile}
                          onPress={handleCancelMobile}
                      >
                        {t("common.cancel")}
                      </Button>

                      <Button
                          size="sm"
                          loading={savingMobile}
                          disabled={!hasMobileChanged}
                          onPress={() => void handleSaveMobile()}
                      >
                        {t("common.save")}
                      </Button>
                    </View>
                  </View>
              ) : (
                  <View>
                    <InformationRow
                        label={t("profile.personalInformation.mobileNumber")}
                        value={formatMobileNumber(personalInformation.mobilePhone)}
                        showDivider={false}
                    />

                    <View className="items-end">
                      <Button
                          variant="outline"
                          size="sm"
                          onPress={handleEditMobile}
                      >
                        {t("common.edit")}
                      </Button>
                    </View>
                  </View>
              )}
            </Card>
          </Section>
        </View>

        <AlertDialog
            visible={showCancelDialog}
            variant="warning"
            confirmVariant="destructive"
            title={t("profile.personalInformation.discardChanges.title")}
            message={t("profile.personalInformation.discardChanges.message")}
            confirmText={t("common.discard")}
            cancelText={t("common.keepEditing")}
            onConfirm={handleDiscardMobile}
            onCancel={() => setShowCancelDialog(false)}
            onDismiss={() => setShowCancelDialog(false)}
        />
      </Screen>
  );
}
