import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import BooleanField from "../../../ui/BooleanField.tsx";
import Input from "../../../ui/Input.tsx";
import Divider from "../../../ui/Divider.tsx";

import {
  JKM_APPLICATION_LABELS,
} from "../../../../constants/applications/jkmApplication.ts";

import type {
  BaApplicationSpecificData,
  BaAdditionalCircumstances,
} from "../../../../types/applications.ts";

const CIRCUMSTANCE_FIELDS = [
  "economicHardship",
  "healthRelatedNeeds",
  "dependentRelatedNeeds",
  "otherCircumstances",
] as const satisfies readonly (keyof BaAdditionalCircumstances)[];

type BaCircumstanceField = typeof CIRCUMSTANCE_FIELDS[number];

export type BaApplicationFormProps = {
  data: BaApplicationSpecificData;
  onChange: (data: BaApplicationSpecificData) => void;
  disabled?: boolean;
};

export default function BaApplicationForm({
    data,
    onChange,
    disabled = false
}: BaApplicationFormProps) {
  const { t } = useTranslation();

  const labels = JKM_APPLICATION_LABELS;
  const baLabels = labels.programs.ba;

  const updateAssistance = (value: boolean) => {
    if (disabled) {
      return;
    }

    onChange({
      ...data,
      receivesOtherJkmMonthlyAssistance: value,
      currentJkmAssistanceProgram: value
          ? data.currentJkmAssistanceProgram
          : null,
    });
  };

  const updateCurrentProgram = (value: string) => {
    if (disabled) {
      return;
    }

    onChange({
      ...data,
      currentJkmAssistanceProgram: value,
    });
  };

  const updateCircumstance = (
      field: BaCircumstanceField,
      value: boolean,
  ) => {
    if (disabled) {
      return;
    }

    onChange({
      ...data,
      additionalCircumstances: {
        ...data.additionalCircumstances,
        [field]: value,
      },
    });
  };

  const updateCircumstancesDescription = (
      value: string,
  ) => {
    if (disabled) {
      return;
    }

    onChange({
      ...data,
      additionalCircumstances: {
        ...data.additionalCircumstances,
        description: value,
      },
    });
  };

  return (
      <View className="gap-5">
        <Text className="text-sm leading-5 text-muted-foreground">
          {t(`${baLabels}.description`)}
        </Text>

        <View className="gap-4">
          <Text className="text-base font-semibold text-foreground">
            {t(`${baLabels}.sections.welfareAssistance`)}
          </Text>

          <BooleanField
              label={t(
                  `${baLabels}.fields.receivesOtherJkmMonthlyAssistance`
              )}
              value={data.receivesOtherJkmMonthlyAssistance}
              yesLabel={t(labels.options.yes)}
              noLabel={t(labels.options.no)}
              onChange={updateAssistance}
              disabled={disabled}
              required
          />

          {data.receivesOtherJkmMonthlyAssistance === true && (
              <Input
                  label={t(
                      `${baLabels}.fields.currentJkmAssistanceProgram`
                  )}
                  value={data.currentJkmAssistanceProgram ?? ""}
                  onChangeText={updateCurrentProgram}
                  placeholder={t(labels.form.textPlaceholder)}
                  editable={!disabled}
                  maxLength={200}
                  required
              />
          )}
        </View>

        <Divider />

        <View className="gap-4">
          <Text className="text-base font-semibold text-foreground">
            {t(`${baLabels}.sections.additionalCircumstances`)}
          </Text>

          {CIRCUMSTANCE_FIELDS.map((field) => (
              <BooleanField
                  key={field}
                  label={t(`${baLabels}.fields.${field}`)}
                  value={data.additionalCircumstances?.[field]}
                  yesLabel={t(labels.options.yes)}
                  noLabel={t(labels.options.no)}
                  onChange={(value) => {
                    updateCircumstance(field, value);
                  }}
                  disabled={disabled}
              />
          ))}

          <Input
              label={t(`${baLabels}.fields.description`)}
              value={data.additionalCircumstances?.description ?? ""}
              onChangeText={updateCircumstancesDescription}
              placeholder={t(labels.form.textPlaceholder)}
              editable={!disabled}
              required={
                  data.additionalCircumstances?.otherCircumstances === true
              }
              multiline
              textAlignVertical="top"
              maxLength={3000}
              className="min-h-24"
          />
        </View>
      </View>
  );
}
