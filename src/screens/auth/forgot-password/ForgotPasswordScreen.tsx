import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../types/tabNavigator";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { ForgotPasswordFormData, forgotPasswordSchema } from "../../../schemas/auth";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../../lib/supabase";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";

import AuthBackground from "../../../components/auth/AuthBackground";
import Screen from "../../../components/layout/Screen";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({
    navigation
}: Props) {
  const { t, i18n } = useTranslation();

  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const schema = useMemo(
      () => forgotPasswordSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting, submitCount }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  const onSubmit = async (
      data: ForgotPasswordFormData
  )=> {
    setAuthError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(
        data.email.trim(),
        { redirectTo: "bantuanku://reset-password/" }
    );

    if (error) {
      if (__DEV__) {
        console.error(
            "[AUTH] Failed to send password reset email:", error
        );
      }

      setAuthError(t("auth.forgotPassword.errors.sendFailed"));

      return;
    }

    setResetSent(true);
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
                  {t("auth.forgotPassword.title")}
                </Text>

                <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
                  {resetSent
                    ? t("auth.forgotPassword.sentSubtitle")
                    : t("auth.forgotPassword.subtitle")
                  }
                </Text>
              </View>

              <View className="gap-5">
                {authError && (
                    <Alert
                      variant="error"
                      title={t("auth.forgotPassword.unableToSend")}
                    >
                      {authError}
                    </Alert>
                )}

                {resetSent ? (
                    <>
                      <Alert
                        variant="success"
                        title={t("auth.forgotPassword.emailSent")}
                      >
                        {t("auth.forgotPassword.emailSentDescription")}
                      </Alert>

                      <Button
                        fullWidth
                        onPress={() => navigation.navigate("Login")}
                      >
                        {t("auth.common.backToLogin")}
                      </Button>
                    </>
                ) : (
                    <>
                      <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value }} ) => (
                            <Input
                              label={t("auth.login.email")}
                              placeholder={t("auth.login.emailPlaceholder")}
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              error={errors.email?.message}
                              keyboardType="email-address"
                              autoCapitalize="none"
                              autoCorrect={false}
                              autoComplete="email"
                              textContentType="emailAddress"
                              returnKeyType="send"
                              onSubmitEditing={() => {
                                void handleSubmit(onSubmit)();
                              }}
                              required
                            />
                        )}
                      />

                      <Button
                        fullWidth
                        loading={isSubmitting}
                        onPress={() => {
                          void handleSubmit(onSubmit)();
                        }}
                      >
                        {t("auth.forgotPassword.sendResetLink")}
                      </Button>

                      <Pressable
                        accessibilityRole="link"
                        onPress={() => navigation.goBack()}
                        hitSlop={8}
                      >
                        <Text className="text-center text-sm font-semibold text-primary">
                          {t("auth.common.backToLogin")}
                        </Text>
                      </Pressable>
                    </>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Screen>
      </View>
  );
}
