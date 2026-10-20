import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import useHouseholdMemberForm from "../../hooks/useHouseholdMemberForm";
import useHouseholdOptions from "../../hooks/useHouseholdOptions";
import { toYesNoValue, fromYesNoValue } from "../../utils/household/householdOptions";

import Input from "../ui/Input";
import Select from "../ui/Select";
import DateInput from "../ui/DatePicker";

type HouseholdMemberFormProps = {
  householdForm: ReturnType<typeof useHouseholdMemberForm>;
};

export default function HouseholdMemberForm({
    householdForm
}: HouseholdMemberFormProps) {
  const { t } = useTranslation();

  const {
    form,
    citizenship,
    showDependentQuestion,
    showOccupation,
    showEducationFields,
    showOkuRegistration,
    dobDerivedFromMyKad,
    minimumDateOfBirth,
    maximumDateOfBirth,
    handleIdentificationNumberChange,
    handleDateOfBirthChange,
    handleGenderChange
  } = householdForm;

  const {
    control,
    formState: { errors }
  } = form;

  const {
    relationshipOptions,
    genderOptions,
    citizenshipOptions,
    employmentStatusOptions,
    yesNoOptions,
    requiredYesNoOptions,
    studyModeOptions,
    institutionTypeOptions
  } = useHouseholdOptions();

  return (
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
                        handleIdentificationNumberChange(text, onChange);
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
                        handleDateOfBirthChange(date, onChange);
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
                        handleGenderChange(selected, onChange);
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
      </View>
  );
}
