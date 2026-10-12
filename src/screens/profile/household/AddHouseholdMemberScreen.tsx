import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../types/tabNavigator";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState} from "react";
import { Controller, useForm } from "react-hook-form";
import { AddHouseholdMemberFormData, addHouseholdMemberSchema } from "../../../schemas/household";
import { zodResolver } from "@hookform/resolvers/zod";
import { createHouseholdMember } from "../../../services/profile/householdService";
import { HouseholdRelationshipValue } from "../../../constants/registration";
import { Text, View } from "react-native";
import { formatMyKad, getDobFromMyKad, getGenderFromMyKad } from "../../../lib/myKad";
import { NavigationAction, usePreventRemove } from "@react-navigation/native";

import Screen from "../../../components/layout/Screen";
import ScreenHeader from "../../../components/layout/ScreenHeader";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import DateInput from "../../../components/ui/DatePicker";
import Button from "../../../components/ui/Button";
import AlertDialog from "../../../components/ui/AlertDialog";

type AddHouseholdMemberScreenProps = NativeStackScreenProps<ProfileStackParamList, "AddHouseholdMember">;

type YesNoValue = "" | "yes" | "no";

const toYesNoValue = (value: boolean | null): YesNoValue => {
  if (value === true) {
    return "yes";
  }

  if (value === false) {
    return "no";
  }

  return "";
};

const fromYesNoValue = (value: string): boolean | null => {
  if (value === "yes") {
    return true;
  }

  if (value === "no") {
    return false;
  }

  return null;
};

export default function AddHouseholdMemberScreen({
                                                   navigation
                                                 }: AddHouseholdMemberScreenProps) {
  const { t, i18n } = useTranslation();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(false);
  const pendingNavigationAction = useRef<NavigationAction | null>(null);

  const schema = useMemo(
      () => addHouseholdMemberSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const relationshipOptions = useMemo<
      {
        label: string;
        value: HouseholdRelationshipValue;
      }[]
  >(
      () => [
        {
          label: t("profile.household.relationship.spouse"),
          value: "spouse",
        },
        {
          label: t("profile.household.relationship.child"),
          value: "child",
        },
        {
          label: t("profile.household.relationship.parent"),
          value: "parent",
        },
        {
          label: t("profile.household.relationship.sibling"),
          value: "sibling",
        },
        {
          label: t("profile.household.relationship.grandchild"),
          value: "grandchild",
        },
        {
          label: t("profile.household.relationship.other"),
          value: "other",
        },
      ], [t, i18n.resolvedLanguage]
  );

  const genderOptions = useMemo(
      () => [
        {
          label: t("profile.household.add.options.male"),
          value: "male"
        },
        {
          label: t("profile.household.add.options.female"),
          value: "female"
        },
      ], [t, i18n.resolvedLanguage]
  );

  const citizenshipOptions = useMemo(
      () => [
        {
          label: t("profile.household.add.options.malaysian"),
          value: "malaysian"
        },
        {
          label: t("profile.household.add.options.nonMalaysian"),
          value: "non_malaysian"
        },
      ], [t, i18n.resolvedLanguage]
  );

  const employmentStatusOptions = useMemo(
      () => [
        {
          label: t("common.notProvided"),
          value: ""
        },
        {
          label: t("profile.household.add.options.employed"),
          value: "employed"
        },
        {
          label: t("profile.household.add.options.selfEmployed"),
          value: "self_employed"
        },
        {
          label: t("profile.household.add.options.unemployed"),
          value: "unemployed"
        },
        // {
        //   label: t("profile.household.add.options.student"),
        //   value: "student"
        // },
        {
          label: t("profile.household.add.options.retired"),
          value: "retired"
        },
        {
          label: t("profile.household.add.options.homemaker"),
          value: "homemaker"
        },
      ], [t, i18n.resolvedLanguage]
  );

  const yesNoOptions = useMemo(
      () => [
        {
          label: t("common.notProvided"),
          value: ""
        },
        {
          label: t("common.yes"),
          value: "yes"
        },
        {
          label: t("common.no"),
          value: "no"
        },
      ], [t, i18n.resolvedLanguage]
  );

  const requiredYesNoOptions = useMemo(
      () => [
        {
          label: t("common.yes"),
          value: "yes"
        },
        {
          label: t("common.no"),
          value: "no"
        },
      ], [t, i18n.resolvedLanguage]
  );

  const studyModeOptions = useMemo(
      () => [
        {
          label: t("profile.household.add.options.fullTime"),
          value: "full_time"
        },
        {
          label: t("profile.household.add.options.partTime"),
          value: "part_time"
        },
      ], [t, i18n.resolvedLanguage]
  );

  const institutionTypeOptions = useMemo(
      () => [
        {
          label: t("profile.household.add.options.school"),
          value: "school"
        },
        {
          label: t("profile.household.add.options.college"),
          value: "college"
        },
        {
          label: t("profile.household.add.options.university"),
          value: "university"
        },
        {
          label: t("profile.household.add.options.other"),
          value: "other"
        },
      ], [t, i18n.resolvedLanguage]
  );

  const minimumDateOfBirth = useMemo(
      () => new Date(1900, 0, 1), []
  );

  const maximumDateOfBirth = useMemo(
      () => new Date(), []
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, submitCount, isDirty }
  } = useForm<AddHouseholdMemberFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      relationship: "",
      dateOfBirth: null,
      identificationNumber: "",
      gender: "",
      citizenship: "",
      isDependent: null,
      employmentStatus: "",
      occupation: "",
      monthlyIncome: "",
      isStudent: null,
      studyMode: "",
      institutionType: "",
      isOku: null,
      okuRegistered: null
    }
  });

  usePreventRemove(
      isDirty && !allowNavigation,
      ({ data }) => {
        pendingNavigationAction.current = data.action;
        setShowDiscardDialog(true);
      }
  );

  const relationship = watch("relationship");
  const employmentStatus = watch("employmentStatus");
  const citizenship = watch("citizenship");
  const isStudent = watch("isStudent");
  const isOku = watch("isOku");

  const showDependentQuestion = relationship !== "";
  const showOccupation = employmentStatus === "employed" || employmentStatus === "self_employed";
  const showEducationFields = isStudent === true;
  const showOkuRegistration = isOku === true;

  const [dobDerivedFromMyKad, setDobDerivedFromMyKad] = useState(false);
  const [genderDerivedFromMyKad, setGenderDerivedFromMyKad] = useState(false);

  const dobManuallyEdited = useRef(false);
  const genderManuallyEdited = useRef(false);

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  useEffect(() => {
    if (!showDependentQuestion) {
      setValue("isDependent", null);
    }
  }, [showDependentQuestion, setValue]);

  useEffect(() => {
    if (!showOccupation) {
      setValue("occupation", "");
    }
  }, [showOccupation, setValue]);

  // useEffect(() => {
  //   if (employmentStatus === "student" && isStudent !== true) {
  //     setValue("isStudent", true, {
  //       shouldDirty: true,
  //       shouldValidate: true
  //     });
  //   }
  // }, [employmentStatus, isStudent, setValue]);

  useEffect(() => {
    if (!showEducationFields) {
      setValue("studyMode", "");
      setValue("institutionType", "");
    }
  }, [showEducationFields, setValue]);

  useEffect(() => {
    if (!showOkuRegistration) {
      setValue("okuRegistered", null);
    }
  }, [showOkuRegistration, setValue]);

  const onSubmit = async (
      data: AddHouseholdMemberFormData
  )=> {
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

      setAllowNavigation(true);
      navigation.popTo("Household");
    } catch (submitError) {
      if (__DEV__) {
        console.error("[PROFILE] Failed to create household member", submitError);
      }

      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    setAllowNavigation(true);
  };

  useEffect(() => {
    if (allowNavigation && pendingNavigationAction.current) {
      const action = pendingNavigationAction.current;
      pendingNavigationAction.current = null;

      navigation.dispatch(action);
    }
  }, [allowNavigation, navigation]);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isDirty || allowNavigation
    });
  }, [navigation, isDirty, allowNavigation]);

  const handleKeepEditing = () => {
    pendingNavigationAction.current = null;
    setShowDiscardDialog(false);
  };

  return (
      <Screen>
        <ScreenHeader
            title={t("profile.household.addMember")}
            onBack={() => navigation.goBack()}
            className="mb-8"
        />

        <View className="gap-8">
          {/* Basic Information */}
          <View className="gap-6">
            <Text className="text-lg font-semibold text-foreground">
              {t("profile.household.add.sections.basicInformation")}
            </Text>

            {/* Full Name */}
            <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                        label={t("profile.household.member.fullName")}
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

            {/* Relationship */}
            <Controller
                control={control}
                name="relationship"
                render={({ field: { onChange, value } }) => (
                    <Select
                        label={t("profile.household.member.relationship")}
                        title={t("profile.household.add.selectRelationship")}
                        value={value}
                        onChange={onChange}
                        options={relationshipOptions}
                        error={errors.relationship?.message}
                        required
                    />
                )}
            />

            {/* Citizenship */}
            <Controller
                control={control}
                name="citizenship"
                render={({ field: { onChange, value } }) => (
                    <Select
                        label={t("profile.household.add.fields.citizenship")}
                        title={t("profile.household.add.fields.citizenship")}
                        value={value}
                        options={citizenshipOptions}
                        onChange={onChange}
                        error={errors.citizenship?.message}
                        required
                    />
                )}
            />

            {/* IC Number */}
            <Controller
                control={control}
                name="identificationNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                        label={t("profile.household.add.fields.identificationNumber")}
                        value={value}
                        onChangeText={(text) => {
                          if (citizenship !== "malaysian") {
                            onChange(text);
                            return;
                          }

                          const formatted = formatMyKad(text);
                          onChange(formatted);

                          const dateOfBirth = getDobFromMyKad(formatted);
                          const gender = dateOfBirth ? getGenderFromMyKad(formatted) : null;

                          if (dateOfBirth && !dobManuallyEdited.current) {
                            setValue("dateOfBirth", dateOfBirth, {
                              shouldValidate: true,
                              shouldDirty: true
                            });

                            setDobDerivedFromMyKad(true);
                          } else if (dobDerivedFromMyKad) {
                            setValue("dateOfBirth", null, {
                              shouldDirty: true
                            });

                            setDobDerivedFromMyKad(false);
                          }

                          if (gender && !genderManuallyEdited.current) {
                            setValue("gender", gender, {
                              shouldValidate: true,
                              shouldDirty: true
                            });

                            setGenderDerivedFromMyKad(true);
                          } else if (genderDerivedFromMyKad && !genderManuallyEdited.current) {
                            setValue("gender", "", {
                              shouldDirty: true
                            });

                            setGenderDerivedFromMyKad(false);
                          }

                          if (formatted.length === 14) {
                            void trigger("identificationNumber");
                          }
                        }}
                        onBlur={onBlur}
                        error={errors.identificationNumber?.message}
                        keyboardType={
                          citizenship === "malaysian"
                              ? "number-pad"
                              : "default"
                        }
                        maxLength={
                          citizenship === "malaysian"
                              ? 14
                              : undefined
                        }
                        autoCapitalize="characters"
                        autoCorrect={false}
                        required
                    />
                )}
            />

            {/* DOB */}
            <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                    <DateInput
                        label={t("profile.household.member.dateOfBirth")}
                        value={value ?? undefined}
                        onChange={(date) => {
                          onChange(date);
                          setDobDerivedFromMyKad(false);
                          dobManuallyEdited.current = true;
                        }}
                        minimumDate={minimumDateOfBirth}
                        maximumDate={maximumDateOfBirth}
                        error={errors.dateOfBirth?.message}
                        helperText={
                          dobDerivedFromMyKad
                              ? t("auth.register.personal.dobFromIc")
                              : undefined
                        }
                        required
                    />
                )}
            />

            {/* Gender */}
            <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                    <Select
                        label={t("profile.household.add.fields.gender")}
                        title={t("profile.household.add.fields.gender")}
                        value={value}
                        options={genderOptions}
                        onChange={(selected) => {
                          onChange(selected);
                          setGenderDerivedFromMyKad(false);
                          genderManuallyEdited.current = true;
                        }}
                        error={errors.gender?.message}
                        required
                    />
                )}
            />

            {/* Dependent */}
            {showDependentQuestion && (
                <Controller
                    control={control}
                    name="isDependent"
                    render={({ field: { onChange, value } }) => (
                        <Select
                            label={t("profile.household.add.fields.isDependent")}
                            title={t("profile.household.add.fields.isDependent")}
                            value={toYesNoValue(value)}
                            options={yesNoOptions}
                            onChange={(selected) => onChange(fromYesNoValue(selected))}
                            error={errors.isDependent?.message}
                        />
                    )}
                />
            )}
          </View>

          {/* Employment & Education */}
          <View className="gap-6">
            <Text className="text-lg font-semibold text-foreground">
              {t("profile.household.add.sections.employmentIncome")}
            </Text>

            {/* Employment Status */}
            <Controller
                control={control}
                name="employmentStatus"
                render={({ field: { onChange, value } }) => (
                    <Select
                        label={t("profile.household.add.fields.employmentStatus")}
                        title={t("profile.household.add.fields.employmentStatus")}
                        value={value}
                        options={employmentStatusOptions}
                        onChange={onChange}
                        error={errors.employmentStatus?.message}
                    />
                )}
            />

            {/* Occupation */}
            {showOccupation && (
                <Controller
                    control={control}
                    name="occupation"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                            label={t("profile.household.add.fields.occupation")}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            error={errors.occupation?.message}
                        />
                    )}
                />
            )}

            {/* Monthly Income */}
            <Controller
                control={control}
                name="monthlyIncome"
                render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                        label={t("profile.household.add.fields.monthlyIncome")}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.monthlyIncome?.message}
                        keyboardType="decimal-pad"
                    />
                )}
            />

            {/* Student Status */}
            <Controller
                control={control}
                name="isStudent"
                render={({ field: { onChange, value } }) => (
                    <Select
                        label={t("profile.household.add.fields.isStudent")}
                        title={t("profile.household.add.fields.isStudent")}
                        value={toYesNoValue(value)}
                        options={yesNoOptions}
                        onChange={(selected) => onChange(fromYesNoValue(selected))}
                        error={errors.isStudent?.message}
                    />
                )}
            />

            {/* Student Mode */}
            {showEducationFields && (
                <>
                  <Controller
                      control={control}
                      name="studyMode"
                      render={({ field: { onChange, value } }) => (
                          <Select
                              label={t("profile.household.add.fields.studyMode")}
                              title={t("profile.household.add.fields.studyMode")}
                              value={value}
                              options={studyModeOptions}
                              onChange={onChange}
                              error={errors.studyMode?.message}
                              required
                          />
                      )}
                  />

                  {/* Institution Type */}
                  <Controller
                      control={control}
                      name="institutionType"
                      render={({ field: { onChange, value } }) => (
                          <Select
                              label={t("profile.household.add.fields.institutionType")}
                              title={t("profile.household.add.fields.institutionType")}
                              value={value}
                              options={institutionTypeOptions}
                              onChange={onChange}
                              error={errors.institutionType?.message}
                              required
                          />
                      )}
                  />
                </>
            )}
          </View>

          {/* Disability / OKU */}
          <View className="gap-6">
            <Text className="text-lg font-semibold text-foreground">
              {t("profile.household.add.sections.disability")}
            </Text>

            {/* OKU Status */}
            <Controller
                control={control}
                name="isOku"
                render={({ field: { onChange, value } }) => (
                    <Select
                        label={t("profile.household.add.fields.isOku")}
                        title={t("profile.household.add.fields.isOku")}
                        value={toYesNoValue(value)}
                        options={requiredYesNoOptions}
                        onChange={(selected) => onChange(fromYesNoValue(selected))}
                        error={errors.isOku?.message}
                        required
                    />
                )}
            />

            {/* OKU Registration */}
            {showOkuRegistration && (
                <Controller
                    control={control}
                    name="okuRegistered"
                    render={({ field: { onChange, value } }) => (
                        <Select
                            label={t("profile.household.add.fields.okuRegistered")}
                            title={t("profile.household.add.fields.okuRegistered")}
                            value={toYesNoValue(value)}
                            options={requiredYesNoOptions}
                            onChange={(selected) => onChange(fromYesNoValue(selected))}
                            error={errors.okuRegistered?.message}
                            required
                        />
                    )}
                />
            )}
          </View>

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
