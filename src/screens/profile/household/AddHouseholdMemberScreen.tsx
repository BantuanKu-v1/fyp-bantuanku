import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../types/tabNavigator";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { View } from "react-native";
import { AddHouseholdMemberFormData } from "../../../schemas/household";
import { createHouseholdMember } from "../../../services/profile/householdService";
import useHouseholdMemberForm from "../../../hooks/useHouseholdMemberForm";
import useUnsavedChanges from "../../../hooks/useUnsavedChanges";

import Screen from "../../../components/layout/Screen";
import ScreenHeader from "../../../components/layout/ScreenHeader";
import HouseholdMemberForm from "../../../components/household/HouseholdMemberForm";
import Button from "../../../components/ui/Button";
import AlertDialog from "../../../components/ui/AlertDialog";

type AddHouseholdMemberScreenProps = NativeStackScreenProps<ProfileStackParamList, "AddHouseholdMember">;

export default function AddHouseholdMemberScreen({
    navigation
}: AddHouseholdMemberScreenProps) {
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const householdForm = useHouseholdMemberForm();

  const {
    form
  } = householdForm;

  const {
    handleSubmit,
    formState: { isDirty }
  } = form;

  const {
    showDiscardDialog,
    navigateAfterSave,
    handleDiscard,
    handleKeepEditing
  } = useUnsavedChanges({
    navigation,
    isDirty
  });

  const onSubmit = async (
      data: AddHouseholdMemberFormData
  ) => {
    if (submitting || !data.dateOfBirth) {
      return;
    }

    try {
      setSubmitting(true);
      setError(false);

      await createHouseholdMember({
        fullName: data.fullName,
        relationship: data.relationship,
        dateOfBirth: data.dateOfBirth,
        identificationNumber: data.identificationNumber,
        gender: data.gender,
        citizenship: data.citizenship,
        isDependent: data.isDependent,
        employmentStatus: data.employmentStatus,
        occupation: data.occupation,
        monthlyIncome: data.monthlyIncome,
        isStudent: data.isStudent,
        studyMode: data.studyMode,
        institutionType: data.institutionType,
        isOku: data.isOku,
        okuRegistered: data.okuRegistered
      });

      navigateAfterSave(() => {
        navigation.popTo("Household");
      });
    } catch (submitError) {
      if (__DEV__) {
        console.error("[PROFILE] Failed to create household member", submitError);
      }

      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <Screen>
        <ScreenHeader
            title={t("profile.household.addMember")}
            onBack={() => navigation.goBack()}
            className="mb-8"
        />

        <View className="gap-8">
          {/* Household Member Form */}
          <HouseholdMemberForm
              householdForm={householdForm}
          />

          <Button
              fullWidth
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
              loading={submitting}
          >
            {t("common.save")}
          </Button>
        </View>

        {/* Error Alert */}
        <AlertDialog
            visible={error}
            variant="error"
            title={t("profile.household.add.errorTitle")}
            message={t("profile.household.add.errorDescription")}
            confirmText={t("common.ok")}
            onConfirm={() => setError(false)}
            onDismiss={() => setError(false)}
        />

        {/* Discard Alert */}
        <AlertDialog
            visible={showDiscardDialog}
            variant="warning"
            confirmVariant="destructive"
            title={t("common.discardChanges.title")}
            message={t("common.discardChanges.message")}
            confirmText={t("common.discard")}
            cancelText={t("common.keepEditing")}
            onConfirm={handleDiscard}
            onCancel={handleKeepEditing}
            onDismiss={handleKeepEditing}
        />
      </Screen>
  );
}
