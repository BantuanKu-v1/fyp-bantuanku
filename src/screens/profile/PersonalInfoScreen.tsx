import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../types/tabNavigator";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import {
  FinancialInformationInput,
  getPersonalInformation,
  PersonalCircumstancesInput,
  PersonalInformation,
  updateFinancialInformation,
  updateHomePhone,
  updateMobileNumber,
  updatePersonalCircumstances
} from "../../services/profile/personalInfoService";
import { Mars, UserRound, Venus } from "lucide-react-native";
import { mobileNumberSchema } from "../../schemas/registration";
import { homePhoneSchema } from "../../schemas/profile";
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_KEYS,
  INSTITUTION_TYPES,
  INSTITUTION_TYPE_KEYS,
  MARITAL_STATUSES,
  STUDY_MODES,
  STUDY_MODE_KEYS
} from "../../constants/profile";
import {
  formatDateOfBirth,
  formatHomePhone,
  formatIdentificationNumber,
  formatIncome,
  formatMobileNumber,
  parseIncome
} from "../../utils/profile";

import Screen from "../../components/layout/Screen";
import ScreenHeader from "../../components/layout/ScreenHeader";
import Button from "../../components/ui/Button";
import Section from "../../components/layout/Section";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import AlertDialog from "../../components/ui/AlertDialog";

type PersonalInfoScreensProps = NativeStackScreenProps<ProfileStackParamList, "PersonalInformation">;

type InformationRowProps = {
  label: string;
  value: string;
};

type EditingSection = "circumstances" | "financial" | "mobile" | "homePhone" | null;

type FinancialForm = {
  monthlyPersonalIncome: string;
  monthlyHouseholdIncome: string;
};

function InformationRow({
    label,
    value
}: InformationRowProps) {
  return (
      <View className="flex-1">
        <Text className="text-xs text-muted-foreground">
          {label}
        </Text>

        <Text className="mt-1 text-sm font-medium text-foreground">
          {value}
        </Text>
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

  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [savingSection, setSavingSection] = useState(false);
  const [sectionError, setSectionError] = useState("");

  const [circumstancesForm, setCircumstancesForm] = useState<PersonalCircumstancesInput>({
    maritalStatus: null,
    employmentStatus: null,
    occupation: null,
    isStudent: null,
    studyMode: null,
    institutionType: null,
    isOku: null,
    okuRegistered: null
  });

  const [financialForm, setFinancialForm] = useState<FinancialForm>({
    monthlyPersonalIncome: "",
    monthlyHouseholdIncome: ""
  });

  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [originalMobileNumber, setOriginalMobileNumber] = useState("");

  const [homePhone, setHomePhone] = useState("");
  const [homePhoneError, setHomePhoneError] = useState("");
  const [originalHomePhone, setOriginalHomePhone] = useState("");

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

    return personalInformation.citizenship === "malaysian"
        ? t("profile.personalInformation.malaysian")
        : t("profile.personalInformation.nonMalaysian");
  };

  const getBooleanLabel = (
      value: boolean | null
  ) => {
    if (value === null) {
      return t("common.notProvided");
    }

    return t(value ? "common.yes" : "common.no");
  };

  const getMaritalStatusLabel = (
      status: string | null
  ) => {
    if (!status) {
      return t("common.notProvided");
    }

    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

    return t(`auth.register.personalDetails.maritalStatusOptions.${status}`, {
      defaultValue: formattedStatus
    });
  };

  const getEmploymentStatusLabel = (
      status: string | null
  ) => {
    if (!status) {
      return t("common.notProvided");
    }

    const translationKey = EMPLOYMENT_STATUS_KEYS[status];

    return translationKey
        ? t(`auth.register.householdIncome.employmentStatusOptions.${translationKey}`)
        : status;
  };

  const getStudyModeLabel = (
      studyMode: string | null
  ) => {
    if (!studyMode) {
      return t("common.notProvided");
    }

    const translationKey = STUDY_MODE_KEYS[studyMode];

    return translationKey
        ? t(`profile.household.add.options.${translationKey}`)
        : studyMode;
  };

  const getInstitutionTypeLabel = (
      institutionType: string | null
  ) => {
    if (!institutionType) {
      return t("common.notProvided");
    }

    const translationKey = INSTITUTION_TYPE_KEYS[institutionType];

    return translationKey
        ? t(`profile.household.add.options.${translationKey}`)
        : institutionType;
  };

  const maritalStatusOptions = MARITAL_STATUSES.map((value) => ({
    value,
    label: getMaritalStatusLabel(value)
  }));

  const employmentOptions = EMPLOYMENT_STATUSES.map((value) => ({
    value,
    label: getEmploymentStatusLabel(value)
  }));

  const studyModeOptions = STUDY_MODES.map((value) => ({
    value,
    label: getStudyModeLabel(value)
  }));

  const institutionTypeOptions = INSTITUTION_TYPES.map((value) => ({
    value,
    label: getInstitutionTypeLabel(value)
  }));

  const booleanOptions = [
    {
      value: "true",
      label: t("common.yes")
    },
    {
      value: "false",
      label: t("common.no")
    }
  ];

  const isWorking =
      circumstancesForm.employmentStatus === "employed" ||
      circumstancesForm.employmentStatus === "self_employed";

  const normalizedCircumstances: PersonalCircumstancesInput = {
    maritalStatus: circumstancesForm.maritalStatus,
    employmentStatus: circumstancesForm.employmentStatus,
    occupation: isWorking
        ? circumstancesForm.occupation?.trim() || null
        : null,
    isStudent: circumstancesForm.isStudent,
    studyMode: circumstancesForm.isStudent === true
        ? circumstancesForm.studyMode
        : null,
    institutionType: circumstancesForm.isStudent === true
        ? circumstancesForm.institutionType
        : null,
    isOku: circumstancesForm.isOku,
    okuRegistered: circumstancesForm.isOku === true
        ? circumstancesForm.okuRegistered
        : null
  };

  const originalCircumstances: PersonalCircumstancesInput | null =
      personalInformation
          ? {
            maritalStatus: personalInformation.maritalStatus,
            employmentStatus: personalInformation.employmentStatus,
            occupation: personalInformation.occupation,
            isStudent: personalInformation.isStudent,
            studyMode: personalInformation.studyMode,
            institutionType: personalInformation.institutionType,
            isOku: personalInformation.isOku,
            okuRegistered: personalInformation.okuRegistered
          }
          : null;

  const hasCircumstancesChanged =
      originalCircumstances !== null &&
      JSON.stringify(normalizedCircumstances) !==
      JSON.stringify(originalCircumstances);

  const normalizedFinancial: FinancialInformationInput = {
    monthlyPersonalIncome: parseIncome(financialForm.monthlyPersonalIncome),
    monthlyHouseholdIncome: parseIncome(financialForm.monthlyHouseholdIncome)
  };

  const hasFinancialChanged =
      personalInformation !== null &&
      (
          normalizedFinancial.monthlyPersonalIncome !== personalInformation.monthlyPersonalIncome ||
          normalizedFinancial.monthlyHouseholdIncome !== personalInformation.monthlyHouseholdIncome
      );

  const hasMobileChanged =
      mobileNumber.replace(/\D/g, "") !==
      originalMobileNumber.replace(/\D/g, "");

  const hasHomePhoneChanged =
      homePhone.replace(/\D/g, "") !==
      originalHomePhone.replace(/\D/g, "");

  const hasUnsavedChanges = () => {
    if (editingSection === "circumstances") {
      return hasCircumstancesChanged;
    }

    if (editingSection === "financial") {
      return hasFinancialChanged;
    }

    if (editingSection === "mobile") {
      return hasMobileChanged;
    }

    if (editingSection === "homePhone") {
      return hasHomePhoneChanged;
    }

    return false;
  };

  const resetEditing = () => {
    setEditingSection(null);
    setSavingSection(false);
    setSectionError("");
    setMobileError("");
    setHomePhoneError("");
    setMobileNumber("");
    setOriginalMobileNumber("");
    setHomePhone("");
    setOriginalHomePhone("");
  };

  const handleEditCircumstances = () => {
    if (!personalInformation || editingSection !== null) {
      return;
    }

    setCircumstancesForm({
      maritalStatus: personalInformation.maritalStatus,
      employmentStatus: personalInformation.employmentStatus,
      occupation: personalInformation.occupation,
      isStudent: personalInformation.isStudent,
      studyMode: personalInformation.studyMode,
      institutionType: personalInformation.institutionType,
      isOku: personalInformation.isOku,
      okuRegistered: personalInformation.okuRegistered
    });

    setSectionError("");
    setEditingSection("circumstances");
  };

  const handleEditFinancial = () => {
    if (!personalInformation || editingSection !== null) {
      return;
    }

    setFinancialForm({
      monthlyPersonalIncome:
          personalInformation.monthlyPersonalIncome?.toString() ?? "",
      monthlyHouseholdIncome:
          personalInformation.monthlyHouseholdIncome?.toString() ?? ""
    });

    setSectionError("");
    setEditingSection("financial");
  };

  const handleEditMobile = () => {
    if (!personalInformation || editingSection !== null) {
      return;
    }

    const currentMobileNumber =
        formatMobileNumber(personalInformation.mobilePhone) ?? "";

    setOriginalMobileNumber(currentMobileNumber);
    setMobileNumber(currentMobileNumber);
    setMobileError("");
    setEditingSection("mobile");
  };

  const handleEditHomePhone = () => {
    if (!personalInformation || editingSection !== null) {
      return;
    }

    const currentHomePhone =
        formatHomePhone(personalInformation.homePhone) ?? "";

    setOriginalHomePhone(currentHomePhone);
    setHomePhone(currentHomePhone);
    setHomePhoneError("");
    setEditingSection("homePhone");
  };

  const handleCancelEditing = () => {
    if (hasUnsavedChanges()) {
      setShowCancelDialog(true);

      return;
    }

    resetEditing();
  };

  const handleDiscardEditing = () => {
    setShowCancelDialog(false);
    resetEditing();
  };

  const handleSaveCircumstances =
      async () => {
        if (!hasCircumstancesChanged) {
          return;
        }

        try {
          setSavingSection(true);
          setSectionError("");

          await updatePersonalCircumstances(
              normalizedCircumstances
          );

          const updatedInformation = await getPersonalInformation();

          setPersonalInformation(updatedInformation);
          resetEditing();
        } catch (saveError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to update personal circumstances:", saveError
            );
          }

          setSectionError(
              t("profile.personalInformation.updateCircumstancesFailed")
          );
        } finally {
          setSavingSection(false);
        }
      };

  const handleSaveFinancial =
      async () => {
        if (!hasFinancialChanged) {
          return;
        }

        const values = [
          normalizedFinancial.monthlyPersonalIncome,
          normalizedFinancial.monthlyHouseholdIncome
        ];

        if (values.some((value) =>
            value !== null &&
            (!Number.isFinite(value) || value < 0)
        )) {
          setSectionError(
              t("validation.monthlyIncomeInvalid")
          );

          return;
        }

        try {
          setSavingSection(true);
          setSectionError("");

          await updateFinancialInformation(
              normalizedFinancial
          );

          const updatedInformation = await getPersonalInformation();

          setPersonalInformation(updatedInformation);
          resetEditing();
        } catch (saveError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to update financial information:", saveError
            );
          }

          setSectionError(
              t("profile.personalInformation.updateFinancialFailed")
          );
        } finally {
          setSavingSection(false);
        }
      };

  const handleSaveMobile =
      async () => {
        const result = mobileNumberSchema(t).safeParse(mobileNumber);

        if (!result.success) {
          setMobileError(
              result.error.issues[0]?.message ??
              t("validation.mobileNumberInvalid")
          );

          return;
        }

        try {
          setSavingSection(true);
          setMobileError("");

          await updateMobileNumber(result.data);

          const updatedInformation = await getPersonalInformation();

          setPersonalInformation(updatedInformation);
          resetEditing();
        } catch (saveError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to update mobile number:", saveError
            );
          }

          setMobileError(
              t("profile.personalInformation.updateFailed")
          );
        } finally {
          setSavingSection(false);
        }
      };

  const handleSaveHomePhone =
      async () => {
        const result = homePhoneSchema.safeParse(homePhone);

        if (!result.success) {
          setHomePhoneError(
              t(result.error.issues[0]?.message ?? "validation.homePhoneInvalid")
          );

          return;
        }

        try {
          setSavingSection(true);
          setHomePhoneError("");

          await updateHomePhone(result.data || null);

          const updatedInformation = await getPersonalInformation();

          setPersonalInformation(updatedInformation);
          resetEditing();
        } catch (saveError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to update home phone:", saveError
            );
          }

          setHomePhoneError(
              t("profile.personalInformation.updateHomePhoneFailed")
          );
        } finally {
          setSavingSection(false);
        }
      };

  const initials = personalInformation?.fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "";

  if (loading) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.personalInformation.title")}
              onBack={() => navigation.goBack()}
          />

          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0352CE" />
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
            onBack={() => navigation.goBack()}
            className="mb-6"
        />

        <View className="gap-6">
          {/* Personal Details */}
          <Section title={t("profile.personalInformation.personalDetails")}>
            <Card>
              <View className="flex-row items-center py-4">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  {initials ? (
                      <Text className="text-lg font-semibold text-primary">
                        {initials}
                      </Text>
                  ) : (
                      <UserRound size={26} color="#0352CE" />
                  )}
                </View>

                <View className="ml-4 flex-1">
                  <Text className="text-lg font-semibold text-foreground">
                    {personalInformation.fullName}
                  </Text>

                  <View className="mt-1 flex-row flex-wrap items-center gap-2">
                    {personalInformation.gender === "male" && (
                        <Mars size={15} color="#0352CE" />
                    )}

                    {personalInformation.gender === "female" && (
                        <Venus size={15} color="#FFC0CB" />
                    )}

                    <Text className="text-sm text-muted-foreground">
                      {getGenderLabel()} · {getCitizenshipLabel()}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="my-2 h-px bg-border" />

              <View className="flex-row gap-4 py-4">
                <InformationRow
                    label={t("profile.personalInformation.identificationNumber")}
                    value={formatIdentificationNumber(personalInformation.identificationNumber)}
                />

                <InformationRow
                    label={t("profile.personalInformation.dateOfBirth")}
                    value={formatDateOfBirth(personalInformation.dateOfBirth)}
                />
              </View>
            </Card>
          </Section>

          {/* Personal Circumstances */}
          <Section title={t("profile.personalInformation.personalCircumstances")}>
            <Card>
              {editingSection === "circumstances" ? (
                  <View className="gap-4 py-2">
                    <Select
                        label={t("profile.personalInformation.maritalStatus")}
                        value={circumstancesForm.maritalStatus ?? undefined}
                        options={maritalStatusOptions}
                        onChange={(value) =>
                            setCircumstancesForm((previous) => ({
                              ...previous,
                              maritalStatus: value
                            }))
                        }
                        disabled={savingSection}
                    />

                    <Select
                        label={t("auth.register.householdIncome.employmentStatus")}
                        value={circumstancesForm.employmentStatus ?? undefined}
                        options={employmentOptions}
                        onChange={(value) => {
                          setCircumstancesForm((previous) => ({
                            ...previous,
                            employmentStatus: value,
                            occupation:
                                value === "employed" || value === "self_employed"
                                    ? previous.occupation
                                    : null
                          }));
                        }}
                        disabled={savingSection}
                    />

                    {isWorking && (
                        <Input
                            label={t("profile.household.add.fields.occupation")}
                            value={circumstancesForm.occupation ?? ""}
                            onChangeText={(value) =>
                                setCircumstancesForm((previous) => ({
                                  ...previous,
                                  occupation: value
                                }))
                            }
                            editable={!savingSection}
                        />
                    )}

                    <Select
                        label={t("profile.personalInformation.studentStatus")}
                        value={
                          circumstancesForm.isStudent === null
                              ? undefined
                              : String(circumstancesForm.isStudent)
                        }
                        options={booleanOptions}
                        onChange={(value) => {
                          const isStudent = value === "true";

                          setCircumstancesForm((previous) => ({
                            ...previous,
                            isStudent,
                            studyMode: isStudent ? previous.studyMode : null,
                            institutionType: isStudent ? previous.institutionType : null
                          }));
                        }}
                        disabled={savingSection}
                    />

                    {circumstancesForm.isStudent === true && (
                        <>
                          <Select
                              label={t("profile.household.add.fields.studyMode")}
                              value={circumstancesForm.studyMode ?? undefined}
                              options={studyModeOptions}
                              onChange={(value) =>
                                  setCircumstancesForm((previous) => ({
                                    ...previous,
                                    studyMode: value
                                  }))
                              }
                              disabled={savingSection}
                          />

                          <Select
                              label={t("profile.household.add.fields.institutionType")}
                              value={circumstancesForm.institutionType ?? undefined}
                              options={institutionTypeOptions}
                              onChange={(value) =>
                                  setCircumstancesForm((previous) => ({
                                    ...previous,
                                    institutionType: value
                                  }))
                              }
                              disabled={savingSection}
                          />
                        </>
                    )}

                    <Select
                        label={t("profile.personalInformation.okuStatus")}
                        value={
                          circumstancesForm.isOku === null
                              ? undefined
                              : String(circumstancesForm.isOku)
                        }
                        options={booleanOptions}
                        onChange={(value) => {
                          const isOku = value === "true";

                          setCircumstancesForm((previous) => ({
                            ...previous,
                            isOku,
                            okuRegistered: isOku ? previous.okuRegistered : null
                          }));
                        }}
                        disabled={savingSection}
                    />

                    {circumstancesForm.isOku === true && (
                        <Select
                            label={t("profile.household.add.fields.okuRegistered")}
                            value={
                              circumstancesForm.okuRegistered === null
                                  ? undefined
                                  : String(circumstancesForm.okuRegistered)
                            }
                            options={booleanOptions}
                            onChange={(value) =>
                                setCircumstancesForm((previous) => ({
                                  ...previous,
                                  okuRegistered: value === "true"
                                }))
                            }
                            disabled={savingSection}
                        />
                    )}

                    {sectionError ? (
                        <Text className="text-sm text-red-600">
                          {sectionError}
                        </Text>
                    ) : null}

                    <View className="flex-row justify-end gap-3">
                      <Button
                          variant="outline"
                          size="sm"
                          disabled={savingSection}
                          onPress={handleCancelEditing}
                      >
                        {t("common.cancel")}
                      </Button>

                      <Button
                          size="sm"
                          loading={savingSection}
                          disabled={!hasCircumstancesChanged}
                          onPress={() => void handleSaveCircumstances()}
                      >
                        {t("common.save")}
                      </Button>
                    </View>
                  </View>
              ) : (
                  <>
                    <View className="flex-row gap-4 py-3">
                      <InformationRow
                          label={t("profile.personalInformation.maritalStatus")}
                          value={getMaritalStatusLabel(personalInformation.maritalStatus)}
                      />

                      <InformationRow
                          label={t("auth.register.householdIncome.employmentStatus")}
                          value={getEmploymentStatusLabel(personalInformation.employmentStatus)}
                      />
                    </View>

                    {(personalInformation.employmentStatus === "employed" ||
                            personalInformation.employmentStatus === "self_employed") &&
                        personalInformation.occupation && (
                            <>
                              <View className="h-px bg-border" />

                              <View className="py-3">
                                <InformationRow
                                    label={t("profile.household.add.fields.occupation")}
                                    value={personalInformation.occupation}
                                />
                              </View>
                            </>
                        )}

                    <View className="h-px bg-border" />

                    <View className="flex-row gap-4 py-3">
                      <InformationRow
                          label={t("profile.personalInformation.studentStatus")}
                          value={getBooleanLabel(personalInformation.isStudent)}
                      />

                      <InformationRow
                          label={t("profile.personalInformation.okuStatus")}
                          value={getBooleanLabel(personalInformation.isOku)}
                      />
                    </View>

                    {personalInformation.isStudent === true && (
                        <>
                          <View className="h-px bg-border" />

                          <View className="flex-row gap-4 py-3">
                            <InformationRow
                                label={t("profile.household.add.fields.studyMode")}
                                value={getStudyModeLabel(personalInformation.studyMode)}
                            />

                            <InformationRow
                                label={t("profile.household.add.fields.institutionType")}
                                value={getInstitutionTypeLabel(personalInformation.institutionType)}
                            />
                          </View>
                        </>
                    )}

                    {personalInformation.isOku === true && (
                        <>
                          <View className="h-px bg-border" />

                          <View className="py-3">
                            <InformationRow
                                label={t("profile.household.add.fields.okuRegistered")}
                                value={getBooleanLabel(personalInformation.okuRegistered)}
                            />
                          </View>
                        </>
                    )}

                    <View className="mt-2 flex-row justify-end">
                      <Button
                          variant="outline"
                          size="sm"
                          disabled={editingSection !== null}
                          onPress={handleEditCircumstances}
                      >
                        {t("common.edit")}
                      </Button>
                    </View>
                  </>
              )}
            </Card>
          </Section>

          {/* Financial Information */}
          <Section title={t("profile.personalInformation.financialInformation")}>
            <Card>
              {editingSection === "financial" ? (
                  <View className="gap-4 py-2">
                    <Input
                        label={t("auth.register.householdIncome.personalMonthlyIncome")}
                        value={financialForm.monthlyPersonalIncome}
                        onChangeText={(value) => {
                          setFinancialForm((previous) => ({
                            ...previous,
                            monthlyPersonalIncome: value
                          }));
                          setSectionError("");
                        }}
                        keyboardType="decimal-pad"
                        editable={!savingSection}
                    />

                    <Input
                        label={t("auth.register.householdIncome.householdMonthlyIncome")}
                        value={financialForm.monthlyHouseholdIncome}
                        onChangeText={(value) => {
                          setFinancialForm((previous) => ({
                            ...previous,
                            monthlyHouseholdIncome: value
                          }));
                          setSectionError("");
                        }}
                        keyboardType="decimal-pad"
                        editable={!savingSection}
                    />

                    {sectionError ? (
                        <Text className="text-sm text-red-600">
                          {sectionError}
                        </Text>
                    ) : null}

                    <View className="flex-row justify-end gap-3">
                      <Button
                          variant="outline"
                          size="sm"
                          disabled={savingSection}
                          onPress={handleCancelEditing}
                      >
                        {t("common.cancel")}
                      </Button>

                      <Button
                          size="sm"
                          loading={savingSection}
                          disabled={!hasFinancialChanged}
                          onPress={() => void handleSaveFinancial()}
                      >
                        {t("common.save")}
                      </Button>
                    </View>
                  </View>
              ) : (
                  <>
                    <View className="flex-row gap-4 py-3">
                      <InformationRow
                          label={t("auth.register.householdIncome.personalMonthlyIncome")}
                          value={formatIncome(personalInformation.monthlyPersonalIncome) ?? t("common.notProvided")}
                      />

                      <InformationRow
                          label={t("auth.register.householdIncome.householdMonthlyIncome")}
                          value={formatIncome(personalInformation.monthlyHouseholdIncome) ?? t("common.notProvided")}
                      />
                    </View>

                    <View className="mt-2 flex-row justify-end">
                      <Button
                          variant="outline"
                          size="sm"
                          disabled={editingSection !== null}
                          onPress={handleEditFinancial}
                      >
                        {t("common.edit")}
                      </Button>
                    </View>
                  </>
              )}
            </Card>
          </Section>

          {/* Contact Information */}
          <Section title={t("profile.personalInformation.contact")}>
            <Card>
              <View className="py-3">
                {editingSection === "mobile" ? (
                    <View className="gap-4">
                      <Input
                          label={t("profile.personalInformation.mobileNumber")}
                          value={mobileNumber}
                          onChangeText={(value) => {
                            setMobileNumber(value);
                            setMobileError("");
                          }}
                          keyboardType="phone-pad"
                          autoComplete="tel"
                          placeholder="012-3456789"
                          error={mobileError || undefined}
                          editable={!savingSection}
                      />

                      <View className="flex-row justify-end gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={savingSection}
                            onPress={handleCancelEditing}
                        >
                          {t("common.cancel")}
                        </Button>

                        <Button
                            size="sm"
                            loading={savingSection}
                            disabled={!hasMobileChanged}
                            onPress={() => void handleSaveMobile()}
                        >
                          {t("common.save")}
                        </Button>
                      </View>
                    </View>
                ) : (
                    <View className="flex-row items-center justify-between">
                      <InformationRow
                          label={t("profile.personalInformation.mobileNumber")}
                          value={formatMobileNumber(personalInformation.mobilePhone) ?? t("common.notProvided")}
                      />

                      <Button
                          variant="outline"
                          size="sm"
                          disabled={editingSection !== null}
                          onPress={handleEditMobile}
                      >
                        {t("common.edit")}
                      </Button>
                    </View>
                )}
              </View>

              <View className="h-px bg-border" />

              <View className="py-3">
                {editingSection === "homePhone" ? (
                    <View className="gap-4">
                      <Input
                          label={t("profile.personalInformation.homePhone")}
                          value={homePhone}
                          onChangeText={(value) => {
                            const digits = value.replace(/\D/g, "").slice(0, 10);

                            setHomePhone(digits);
                            setHomePhoneError("");
                          }}
                          keyboardType="phone-pad"
                          placeholder="03-12345678"
                          error={homePhoneError || undefined}
                          editable={!savingSection}
                      />

                      <View className="flex-row justify-end gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={savingSection}
                            onPress={handleCancelEditing}
                        >
                          {t("common.cancel")}
                        </Button>

                        <Button
                            size="sm"
                            loading={savingSection}
                            disabled={!hasHomePhoneChanged}
                            onPress={() => void handleSaveHomePhone()}
                        >
                          {t("common.save")}
                        </Button>
                      </View>
                    </View>
                ) : (
                    <View className="flex-row items-center justify-between">
                      <InformationRow
                          label={t("profile.personalInformation.homePhone")}
                          value={formatHomePhone(personalInformation.homePhone) ?? t("common.notProvided")}
                      />

                      <Button
                          variant="outline"
                          size="sm"
                          disabled={editingSection !== null}
                          onPress={handleEditHomePhone}
                      >
                        {t("common.edit")}
                      </Button>
                    </View>
                )}
              </View>
            </Card>
          </Section>
        </View>

        <AlertDialog
            visible={showCancelDialog}
            variant="warning"
            confirmVariant="destructive"
            title={t("common.discardChanges.title")}
            message={t("common.discardChanges.message")}
            confirmText={t("common.discard")}
            cancelText={t("common.keepEditing")}
            onConfirm={handleDiscardEditing}
            onCancel={() => setShowCancelDialog(false)}
            onDismiss={() => setShowCancelDialog(false)}
        />
      </Screen>
  );
}
