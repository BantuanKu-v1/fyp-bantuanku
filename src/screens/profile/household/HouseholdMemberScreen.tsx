import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../types/tabNavigator";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import {getHouseholdMember, HouseholdMember} from "../../../services/profile/householdService";
import { useFocusEffect } from "@react-navigation/native";
import {
  HOUSEHOLD_CITIZENSHIP_KEYS, HOUSEHOLD_EMPLOYMENT_KEYS,
  HOUSEHOLD_GENDER_KEYS, HOUSEHOLD_INSTITUTION_TYPE_KEYS,
  HOUSEHOLD_RELATIONSHIP_KEYS, HOUSEHOLD_STUDY_MODE_KEYS
} from "../../../constants/household";

import Screen from "../../../components/layout/Screen";
import ScreenHeader from "../../../components/layout/ScreenHeader";
import Button from "../../../components/ui/Button";
import Section from "../../../components/layout/Section";
import Card from "../../../components/ui/Card";

type HouseholdMemberScreenProps = NativeStackScreenProps<ProfileStackParamList, "HouseholdMember">;

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
        <View className="gap-1 py-3">
          <Text className="text-sm text-muted-foreground">
            {label}
          </Text>

          <Text className="text-base font-medium text-foreground">
            {value}
          </Text>
        </View>

        {showDivider && (
            <View className="h-px bg-border" />
        )}
      </View>
  );
}

export default function HouseholdMemberScreen({
    navigation,
    route
}: HouseholdMemberScreenProps) {
  const { t } = useTranslation();
  const { memberId } = route.params;

  const [member, setMember] = useState<HouseholdMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadHouseholdMember = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const data = await getHouseholdMember(memberId);

      setMember(data);
    } catch (loadError) {
      if (__DEV__) {
        console.error("[PROFILE] Failed to load household member:", loadError);
      }

      setError(true);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  // Reload the member after returning from the edit screen
  useFocusEffect(
      useCallback(() => {
        void loadHouseholdMember();
      }, [loadHouseholdMember])
  );

  const notProvided = t("common.notProvided");

  const formatValue = (
      value: string | null
  ): string => {
    return value?.trim() || notProvided;
  };

  const formatDateOfBirth = (
      dateOfBirth: string | null
  ): string => {
    if (!dateOfBirth) {
      return notProvided;
    }

    const [year, month, day] = dateOfBirth.split("-");

    if (!year || !month || !day) {
      return dateOfBirth;
    }

    return `${day}/${month}/${year}`;
  };

  const formatBoolean = (
      value: boolean | null
  ): string => {
    if (value === null) {
      return notProvided;
    }

    return value
        ? t("common.yes")
        : t("common.no");
  };

  const formatOption = (
      value: string | null,
      options: Record<string, string>
  ): string => {
    if (!value) {
      return notProvided;
    }

    const translationKey = options[value];

    return translationKey
        ? t(translationKey)
        : value;
  };

  const formatIncome = (
      value: number | null
  ): string => {
    if (value === null) {
      return notProvided;
    }

    return `RM ${value.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (loading) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.household.members")}
              onBack={() => navigation.goBack()}
          />

          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0352CE" />
          </View>
        </Screen>
    );
  }

  if (error || !member) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.houshold.members")}
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
              <Button onPress={() => void loadHouseholdMember()}>
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
            title={member.fullName}
            onBack={() =>navigation.goBack()}
            className="mb-8"
        />

        <View className="gap-8">
          {/* Basic Information */}
          <Section title={t("profile.household.add.sections.basicInformation")}>
            <Card>
              {/* Full Name */}
              <InformationRow
                  label={t("profile.household.member.fullName")}
                  value={member.fullName}
              />

              {/* Relationship */}
              <InformationRow
                  label={t("profile.household.member.relationship")}
                  value={formatOption(member.relationship, HOUSEHOLD_RELATIONSHIP_KEYS)}
              />

              {/* Citizenship */}
              <InformationRow
                  label={t("profile.household.add.fields.citizenship")}
                  value={formatOption(member.citizenship, HOUSEHOLD_CITIZENSHIP_KEYS)}
              />

              {/* IC Number */}
              <InformationRow
                  label={t("profile.household.add.fields.identificationNumber")}
                  value={formatValue(member.identificationNumber)}
              />

              {/* DOB */}
              <InformationRow
                  label={t("profile.household.member.dateOfBirth")}
                  value={formatDateOfBirth(member.dateOfBirth)}
              />

              {/* Gender */}
              <InformationRow
                  label={t("profile.household.add.fields.gender")}
                  value={formatOption(member.gender, HOUSEHOLD_GENDER_KEYS)}
              />

              {/* Dependent */}
              <InformationRow
                  label={t("profile.household.add.fields.isDependent")}
                  value={formatBoolean(member.isDependent)}
                  showDivider={false}
              />
            </Card>
          </Section>

          {/* Employment & Education */}
          <Section title={t("profile.household.add.sections.employmentIncome")}>
            <Card>
              {/* Employment Status */}
              <InformationRow
                  label={t("profile.household.add.fields.employmentStatus")}
                  value={formatOption(member.employmentStatus, HOUSEHOLD_EMPLOYMENT_KEYS)}
              />

              {(member.employmentStatus === "employed" ||
                  member.employmentStatus === "self_employed") && (
                  <InformationRow
                      label={t("profile.household.add.fields.occupation")}
                      value={formatValue(member.occupation)}
                  />
              )}

              {/* Monthly Income */}
              <InformationRow
                  label={t("profile.household.add.fields.monthlyIncome")}
                  value={formatIncome(member.monthlyIncome)}
              />

              {/* Student */}
              <InformationRow
                  label={t("profile.household.add.fields.isStudent")}
                  value={formatBoolean(member.isStudent)}
                  showDivider={member.isStudent === true}
              />

              {member.isStudent === true && (
                  <>
                    {/* Study Mode */}
                    <InformationRow
                        label={t("profile.household.add.fields.studyMode")}
                        value={formatOption(member.studyMode, HOUSEHOLD_STUDY_MODE_KEYS)}
                    />

                    {/* Institution Type */}
                    <InformationRow
                        label={t("profile.household.add.fields.institutionType")}
                        value={formatOption(member.institutionType, HOUSEHOLD_INSTITUTION_TYPE_KEYS)}
                    />
                  </>
              )}
            </Card>
          </Section>

          {/* Disability / OKU */}
          <Section title={t("profile.household.add.sections.disability")}>
            <Card>
              {/* OKU */}
              <InformationRow
                  label={t("profile.household.add.fields.isOku")}
                  value={formatBoolean(member.isOku)}
                  showDivider={member.isOku === true}
              />

              {member.isOku === true && (
                  <InformationRow
                      label={t("profile.household.add.fields.okuRegistered")}
                      value={formatBoolean(member.okuRegistered)}
                      showDivider={false}
                  />
              )}
            </Card>
          </Section>

          <Button
            fullWidth
            onPress={() => navigation.navigate("EditHouseholdMember", { memberId: member.id })}
          >
            {t("common.edit")}
          </Button>
        </View>
      </Screen>
  );
}
