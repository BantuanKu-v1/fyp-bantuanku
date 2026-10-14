import { useTranslation } from "react-i18next";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { ResetPasswordFormData, resetPasswordSchema } from "../../../schemas/auth";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../../lib/supabase";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";

import AuthBackground from "../../../components/auth/AuthBackground";
import Screen from "../../../components/layout/Screen";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function ResetPasswordScreen() {
  const { t, i18n } = useTranslation();
  const { setPasswordRecoveryInProgress } = useAuth();

  const [resetComplete, setResetComplete] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const schema = useMemo(
      () => resetPasswordSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting, submitCount }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  const onSubmit = async (
      data: ResetPasswordFormData
  ) => {
    setAuthError(null);

    const { error } = await supabase.auth.updateUser({
      password: data.password
    });

    if (error) {
      if (__DEV__) {
        console.error("[AUTH] Failed to reset password:", error);
      }

      setAuthError(t("auth.resetPassword.errors.resetFailed"));

      return;
    }

    setResetComplete(true);
  }

  const handleBackToLogin = async () => {
    const { error } = await supabase.auth.signOut({
      scope: "local"
    });

    if (error && __DEV__) {
      console.error("[AUTH] Failed to clear recovery session:", error);
    }

    setPasswordRecoveryInProgress(false);
  };

  return (
      <View className="flex-1 bg-background">
        <AuthBackground />

        <Screen transparent scroll={false}>
          <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="flex-1 justify-center">
              <View className="mb-8">
                <Text className="text-center text-3xl font-bold text-foreground">
                  {t("auth.resetPassword.title")}
                </Text>

                <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
                  {resetComplete
                      ? t("auth.resetPassword.successSubtitle")
                      : t("auth.resetPassword.subtitle")
                  }
                </Text>
              </View>

              <View className="gap-5">
                {authError && (
                    <Alert
                        variant="error"
                        title={t("auth.resetPassword.unableToReset")}
                    >
                      {authError}
                    </Alert>
                )}

                {resetComplete ? (
                    <>
                      <Alert
                          variant="success"
                          title={t("auth.resetPassword.success")}
                      >
                        {t("auth.resetPassword.successDescription")}
                      </Alert>

                      <Button
                          fullWidth
                          onPress={handleBackToLogin}
                      >
                        {t("auth.common.backToLogin")}
                      </Button>
                    </>
                ) : (
                    <>
                      <Controller
                          control={control}
                          name="password"
                          render={({ field: { onChange, onBlur, value } }) => (
                              <Input
                                  label={t("auth.resetPassword.newPassword")}
                                  placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                                  value={value}
                                  onChangeText={onChange}
                                  onBlur={onBlur}
                                  error={errors.password?.message}
                                  secureTextEntry
                                  autoCapitalize="none"
                                  autoCorrect={false}
                                  autoComplete="new-password"
                                  textContentType="newPassword"
                                  required
                              />
                          )}
                      />

                      <Controller
                          control={control}
                          name="confirmPassword"
                          render={({ field: { onChange, onBlur, value } }) => (
                              <Input
                                  label={t("auth.resetPassword.confirmPassword")}
                                  placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
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
                                  onSubmitEditing={handleSubmit(onSubmit)}
                                  required
                              />
                          )}
                      />

                      <Button
                          fullWidth
                          loading={isSubmitting}
                          onPress={handleSubmit(onSubmit)}
                      >
                        {t("auth.resetPassword.resetPassword")}
                      </Button>
                    </>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Screen>
      </View>
  );
}
