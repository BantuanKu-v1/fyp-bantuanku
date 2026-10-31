import { RegisterFormData, registerSchema } from "../../../schemas/auth";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";

import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import RegistrationProgress from "../../../components/auth/RegistrationProgress";

type RegisterAccountStepProps = {
  defaultValues?: RegisterFormData;
  onContinue: (data: RegisterFormData) => void;
};

export default function RegisterAccountStep({
    defaultValues,
    onContinue
}: RegisterAccountStepProps) {
  const { t, i18n } = useTranslation();

  const schema = useMemo(
      () => registerSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, submitCount },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  return (
      <View>
        <View className="mb-8">
          <RegistrationProgress currentStep={1} />

          <Text className="text-3xl font-bold text-foreground">
            {t("auth.register.account.title")}
          </Text>

          <Text className="mt-2 text-base leading-6 text-muted-foreground">
            {t("auth.register.account.subtitle")}
          </Text>
        </View>

        <View className="gap-5">
          <Controller
            control={control}
            name="email"
            render={({
              field: { onChange, onBlur, value },
            }) => (
                <Input
                  label={t("auth.register.account.email")}
                  placeholder={t("auth.register.account.emailPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  required
                />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({
              field: { onChange, onBlur, value },
            }) => (
                <Input
                  label={t("auth.register.account.password")}
                  placeholder={t("auth.register.account.passwordPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  helperText={t("auth.register.account.passwordPlaceholder")}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="password"
                  required
                />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({
              field: { onChange, onBlur, value },
            }) => (
                <Input
                  label={t("auth.register.account.confirmPassword")}
                  placeholder={t("auth.register.account.confirmPasswordPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    void handleSubmit(onContinue)();
                  }}
                  required
                />
            )}
          />

          <Button
            fullWidth
            onPress={() => {
              void handleSubmit(onContinue)();
            }}
          >
            {t("common.continue")}
          </Button>
        </View>
      </View>
  );
}
