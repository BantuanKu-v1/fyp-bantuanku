import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import BooleanField from "../../../ui/BooleanField.tsx";
import Input from "../../../ui/Input.tsx";
import Divider from "../../../ui/Divider.tsx";

import type {
  BaApplicationSpecificData,
  BaAdditionalCircumstances
} from "../../../../types/applications";

const CIRCUMSTANCE_FIELDS = [
  "economicHardship",
  "healthRelatedNeeds",
  "dependentRelatedNeeds",
  "otherCircumstances"
] as const;

type CircumstanceField = typeof CIRCUMSTANCE_FIELDS[number];

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

  const updateAssistance = (value: boolean) => {
    if (disabled) {
      return;
    }

    onChange({
      ...data,
      receivesOtherJkmMonthlyAssistance: value,
      currentJkmAssistanceProgram: value
          ? data.currentJkmAssistanceProgram ?? null
          : null
    });
  };

  const updateCurrentProgram = (value: string) => {
    if (disabled) {
      return;
    }

    onChange({
      ...data,
      currentJkmAssistanceProgram: value
    });
  };

  const updateCircumstance = (
      field: CircumstanceField,
      value: boolean
  ) => {
    if (disabled) {
      return;
    }

    const additionalCircumstances: BaAdditionalCircumstances = {
      ...data.additionalCircumstances,
      [field]: value
    };

    onChange({
      ...data,
      additionalCircumstances
    });
  };

  const updateCircumstancesDescription = (value: string) => {
    if (disabled) {
      return;
    }

    onChange({
      ...data,
      additionalCircumstances: {
        ...data.additionalCircumstances,
        description: value
      }
    });
  };

  return (
      <View className="gap-4">
        <Text className="text-sm leading-5 text-muted-foreground">
          {t("applications.jkm.programs.ba.description")}
        </Text>

        <Text className="text-sm font-semibold text-foreground">
          {t("applications.jkm.programs.ba.sections.welfareAssistance")}
        </Text>

        <BooleanField
            label={t("applications.jkm.programs.ba.fields.receivesOtherJkmMonthlyAssistance")}
            value={data.receivesOtherJkmMonthlyAssistance}
            yesLabel={t("common.yes")}
            noLabel={t("common.no")}
            disabled={disabled}
            required
            onChange={updateAssistance}
        />

        {data.receivesOtherJkmMonthlyAssistance === true && (
            <Input
                label={t("applications.jkm.programs.ba.fields.currentJkmAssistanceProgram")}
                value={data.currentJkmAssistanceProgram ?? ""}
                placeholder={t("applications.jkm.form.textPlaceholder")}
                onChangeText={updateCurrentProgram}
                editable={!disabled}
                maxLength={200}
                required
            />
        )}

        <Divider />

        <Text className="text-sm font-semibold text-foreground">
          {t("applications.jkm.programs.ba.sections.additionalCircumstances")}
        </Text>

        {CIRCUMSTANCE_FIELDS.map(field => (
            <BooleanField
                key={field}
                label={t(`applications.jkm.programs.ba.fields.${field}`)}
                value={data.additionalCircumstances?.[field]}
                yesLabel={t("common.yes")}
                noLabel={t("common.no")}
                disabled={disabled}
                onChange={value => updateCircumstance(field, value)}
            />
        ))}

        <Input
            label={t("applications.jkm.programs.ba.fields.description")}
            value={data.additionalCircumstances?.description ?? ""}
            placeholder={t("applications.jkm.form.textPlaceholder")}
            onChangeText={updateCircumstancesDescription}
            editable={!disabled}
            required={data.additionalCircumstances?.otherCircumstances === true}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={3000}
            className="min-h-24"
        />
      </View>
  );
}
