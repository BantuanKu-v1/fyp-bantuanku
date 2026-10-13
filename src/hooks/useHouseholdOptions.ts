import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  HOUSEHOLD_RELATIONSHIP_KEYS,
  HOUSEHOLD_GENDER_KEYS,
  HOUSEHOLD_CITIZENSHIP_KEYS,
  HOUSEHOLD_EMPLOYMENT_KEYS,
  HOUSEHOLD_STUDY_MODE_KEYS,
  HOUSEHOLD_INSTITUTION_TYPE_KEYS,
  HOUSEHOLD_YES_NO_KEYS,
  HOUSEHOLD_OPTIONAL_YES_NO_KEYS
} from "../constants/household";
import { getHouseholdOptions } from "../utils/householdOptions";

export default function useHouseholdOptions() {
  const { t, i18n } = useTranslation();

  const relationshipOptions = useMemo(
      () => getHouseholdOptions(HOUSEHOLD_RELATIONSHIP_KEYS, t),
      [t, i18n.resolvedLanguage]
  );

  const genderOptions = useMemo(
      () => getHouseholdOptions(HOUSEHOLD_GENDER_KEYS, t),
      [t, i18n.resolvedLanguage]
  );

  const citizenshipOptions = useMemo(
      () => getHouseholdOptions(HOUSEHOLD_CITIZENSHIP_KEYS, t),
      [t, i18n.resolvedLanguage]
  );

  const employmentStatusOptions = useMemo(
      () => [
        {
          label: t("common.notProvided"),
          value: ""
        },
        ...getHouseholdOptions(HOUSEHOLD_EMPLOYMENT_KEYS, t)
      ],
      [t, i18n.resolvedLanguage]
  );

  const yesNoOptions = useMemo(
      () => getHouseholdOptions(HOUSEHOLD_OPTIONAL_YES_NO_KEYS, t),
      [t, i18n.resolvedLanguage]
  );

  const requiredYesNoOptions = useMemo(
      () => getHouseholdOptions(HOUSEHOLD_YES_NO_KEYS, t),
      [t, i18n.resolvedLanguage]
  );

  const studyModeOptions = useMemo(
      () => getHouseholdOptions(HOUSEHOLD_STUDY_MODE_KEYS, t),
      [t, i18n.resolvedLanguage]
  );

  const institutionTypeOptions = useMemo(
      () => getHouseholdOptions(HOUSEHOLD_INSTITUTION_TYPE_KEYS, t),
      [t, i18n.resolvedLanguage]
  );

  return {
    relationshipOptions,
    genderOptions,
    citizenshipOptions,
    employmentStatusOptions,
    yesNoOptions,
    requiredYesNoOptions,
    studyModeOptions,
    institutionTypeOptions
  };
}
