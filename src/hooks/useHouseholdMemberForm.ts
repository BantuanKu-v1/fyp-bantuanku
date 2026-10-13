import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddHouseholdMemberFormData, addHouseholdMemberSchema } from "../schemas/household";
import { formatMyKad, getDobFromMyKad, getGenderFromMyKad } from "../utils/myKad";

type UseHouseholdMemberFormOptions = {
  initialized?: boolean;
};

const HOUSEHOLD_FORM_DEFAULT_VALUES: AddHouseholdMemberFormData = {
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
};

export default function useHouseholdMemberForm({
    initialized = true
}: UseHouseholdMemberFormOptions = {}) {
  const { t, i18n } = useTranslation();

  const schema = useMemo(
      () => addHouseholdMemberSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const form = useForm<AddHouseholdMemberFormData>({
    resolver: zodResolver(schema),
    defaultValues: HOUSEHOLD_FORM_DEFAULT_VALUES
  });

  const {
    control,
    setValue,
    trigger,
    reset,
    formState: { submitCount }
  } = form;

  const relationship = useWatch({
    control,
    name: "relationship"
  });

  const employmentStatus = useWatch({
    control,
    name: "employmentStatus"
  });

  const citizenship = useWatch({
    control,
    name: "citizenship"
  });

  const isStudent = useWatch({
    control,
    name: "isStudent"
  });

  const isOku = useWatch({
    control,
    name: "isOku"
  });

  const showDependentQuestion = relationship !== "";
  const showOccupation = employmentStatus === "employed" || employmentStatus === "self_employed";
  const showEducationFields = isStudent === true;
  const showOkuRegistration = isOku === true;

  const [dobDerivedFromMyKad, setDobDerivedFromMyKad] = useState(false);
  const [genderDerivedFromMyKad, setGenderDerivedFromMyKad] = useState(false);

  const dobManuallyEdited = useRef(false);
  const genderManuallyEdited = useRef(false);

  const minimumDateOfBirth = useMemo(
      () => new Date(1900, 0, 1), []
  );

  const maximumDateOfBirth = useMemo(
      () => new Date(), []
  );

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  // Clear conditional fields only when their controlling values change
  const previousRelationship = useRef(relationship);
  const previousEmploymentStatus = useRef(employmentStatus);
  const previousIsStudent = useRef(isStudent);
  const previousIsOku = useRef(isOku);

  useEffect(() => {
    if (!initialized) {
      previousRelationship.current = relationship;
      return;
    }

    if (previousRelationship.current !== relationship && !showDependentQuestion) {
      setValue("isDependent", null, {
        shouldDirty: true
      });
    }

    previousRelationship.current = relationship;
  }, [initialized, relationship, showDependentQuestion, setValue]);

  useEffect(() => {
    if (!initialized) {
      previousEmploymentStatus.current = employmentStatus;
      return;
    }

    if (previousEmploymentStatus.current !== employmentStatus && !showOccupation) {
      setValue("occupation", "", {
        shouldDirty: true
      });
    }

    previousEmploymentStatus.current = employmentStatus;
  }, [initialized, employmentStatus, showOccupation, setValue]);

  useEffect(() => {
    if (!initialized) {
      previousIsStudent.current = isStudent;
      return;
    }

    if (previousIsStudent.current !== isStudent && !showEducationFields) {
      setValue("studyMode", "", {
        shouldDirty: true
      });

      setValue("institutionType", "", {
        shouldDirty: true
      });
    }

    previousIsStudent.current = isStudent;
  }, [initialized, isStudent, showEducationFields, setValue]);

  useEffect(() => {
    if (!initialized) {
      previousIsOku.current = isOku;
      return;
    }

    if (previousIsOku.current !== isOku && !showOkuRegistration) {
      setValue("okuRegistered", null, {
        shouldDirty: true
      });
    }

    previousIsOku.current = isOku;
  }, [initialized, isOku, showOkuRegistration, setValue]);

  const handleIdentificationNumberChange = (
      text: string,
      onChange: (value: string) => void
  ) => {
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
    } else if (dobDerivedFromMyKad && !dobManuallyEdited.current) {
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
  };

  const handleDateOfBirthChange = (
      date: Date,
      onChange: (value: Date) => void
  ) => {
    onChange(date);
    setDobDerivedFromMyKad(false);
    dobManuallyEdited.current = true;
  };

  const handleGenderChange = (
      value: string,
      onChange: (value: string) => void
  ) => {
    onChange(value);
    setGenderDerivedFromMyKad(false);
    genderManuallyEdited.current = true;
  };

  // Reset form values and establish the saved data as the clean baseline.
  // useCallback keeps this function stable to prevent repeated fetching
  // in EditHouseholdMemberScreen
  const resetHouseholdForm = useCallback(
      (values: AddHouseholdMemberFormData) => {
        dobManuallyEdited.current = false;
        genderManuallyEdited.current = false;

        setDobDerivedFromMyKad(false);
        setGenderDerivedFromMyKad(false);

        previousRelationship.current = values.relationship;
        previousEmploymentStatus.current = values.employmentStatus;
        previousIsStudent.current = values.isStudent;
        previousIsOku.current = values.isOku;

        reset(values);
      },
      [reset]
  );

  return {
    form,
    citizenship,
    showDependentQuestion,
    showOccupation,
    showEducationFields,
    showOkuRegistration,
    dobDerivedFromMyKad,
    genderDerivedFromMyKad,
    minimumDateOfBirth,
    maximumDateOfBirth,
    handleIdentificationNumberChange,
    handleDateOfBirthChange,
    handleGenderChange,
    resetHouseholdForm
  };
}
