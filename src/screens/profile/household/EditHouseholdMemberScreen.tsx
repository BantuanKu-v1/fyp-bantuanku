import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../types/tabNavigator";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AddHouseholdMemberFormData } from "../../../schemas/household";
import { getHouseholdMember, updateHouseholdMember } from "../../../services/profile/householdService";
import { mapHouseholdMemberToForm } from "../../../utils/householdForm";
import useHouseholdMemberForm from "../../../hooks/useHouseholdMemberForm";
import useUnsavedChanges from "../../../hooks/useUnsavedChanges";

import Screen from "../../../components/layout/Screen";
import ScreenHeader from "../../../components/layout/ScreenHeader";
import HouseholdMemberForm from "../../../components/household/HouseholdMemberForm";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import AlertDialog from "../../../components/ui/AlertDialog";

type EditHouseholdMemberScreenProps = NativeStackScreenProps<ProfileStackParamList, "EditHouseholdMember">;

export default function EditHouseholdMemberScreen({
    navigation,
    route
}: EditHouseholdMemberScreenProps) {
  const { t } = useTranslation();
  const { memberId } = route.params;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const householdForm = useHouseholdMemberForm({
    initialized: !loading && !loadError
  });

  const {
    form,
    resetHouseholdForm
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

  const loadHouseholdMember = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);

      const member = await getHouseholdMember(memberId);

      // Prefill the form and establish the saved values as the clean baseline
      resetHouseholdForm(mapHouseholdMemberToForm(member));
    } catch (loadError) {
      if (__DEV__) {
        console.error("[PROFILE] Failed to load household member for editing", loadError);
      }

      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [memberId, resetHouseholdForm]);

  useEffect(() => {
    void loadHouseholdMember();
  }, [loadHouseholdMember]);

  const onSubmit = async (
      data: AddHouseholdMemberFormData
  ) => {
    if (submitting || !data.dateOfBirth) {
      return;
    }

    try {
      setSubmitting(true);
      setError(false);

      await updateHouseholdMember(memberId, {
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
        navigation.goBack();
      });
    } catch (submitError) {
      if (__DEV__) {
        console.error("[PROFILE] Failed to update household member", submitError);
      }

      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
        <Screen>
          <ScreenHeader
              title={t("profile.household.editMember", {
                defaultValue: "Edit Household Member"
              })}
              onBack={() => navigation.goBack()}
              className="mb-8"
          />

          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" />
          </View>
        </Screen>
    );
  }

  if (loadError) {
    return (
        <Screen>
          <ScreenHeader
              title={t("profile.household.editMember", {
                defaultValue: "Edit Household Member"
              })}
              onBack={() => navigation.goBack()}
              className="mb-8"
          />

          <ErrorState
              title={t("profile.household.loadError.title")}
              description={t("profile.household.loadError.errorDescription")}
              retryText={t("common.retry")}
              onRetry={() => void loadHouseholdMember()}
          />
        </Screen>
    );
  }

  return (
      <Screen>
        <ScreenHeader
            title={t("profile.household.editMember", {
              defaultValue: "Edit Household Member"
            })}
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
              onPress={handleSubmit(onSubmit)}
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
