import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LoginFormData, loginSchema } from "../../schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabase";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/tabNavigator";
import { useTranslation } from "react-i18next";

import Screen from "../../components/layout/Screen";
import Alert from "../../components/ui/Alert";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthBackground from "../../components/auth/AuthBackground";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({
                                      navigation
                                    }: Props){
  const { t, i18n } = useTranslation();
  const [authError, setAuthError] = useState<string | null>(null);

  const schema = useMemo(
      () => loginSchema(t),
      [t, i18n.resolvedLanguage]
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (submitCount > 0) {
      void trigger();
    }
  }, [i18n.resolvedLanguage, submitCount, trigger]);

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if (error.code === "invalid_credentials") {
        setAuthError(
            t("auth.login.errors.invalidCredentials")
        );

      return;
      }

      setAuthError(t("auth.login.errors.signInFailed"));
    }
  };

  return (
      <View className="flex-1 bg-background">
        <AuthBackground />

        <Screen
            transparent
            scroll={false}
        >
          <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="flex-1 justify-center">
              <View className="mb-8">
                <Text className="text-center text-3xl font-bold text-foreground">
                  {t("auth.login.title")}
                </Text>

                <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
                  {t("auth.login.subtitle")}
                </Text>
              </View>

              <View className="gap-5">
                {authError && (
                    <Alert
                        variant="error"
                        title={t("auth.login.unableToSignIn")}
                    >
                      {authError}
                    </Alert>
                )}

                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
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
                            required
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                            label={t("auth.login.password")}
                            placeholder={t("auth.login.passwordPlaceholder")}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            error={errors.password?.message}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="current-password"
                            textContentType="password"
                            returnKeyType="done"
                            onSubmitEditing={() => {
                                void handleSubmit(onSubmit)();
                            }}
                            required
                        />
                    )}
                />

                <Pressable
                  accessibilityRole="link"
                  onPress={() => navigation.navigate("ForgotPassword")}
                  hitSlop={8}
                  className="self-end"
                >
                  <Text className="text-sm font-semibold text-primary">
                    {t("auth.login.forgotPassword")}
                  </Text>
                </Pressable>

                <Button
                    fullWidth
                    loading={isSubmitting}
                    onPress={() => {
                      void handleSubmit(onSubmit)();
                    }}
                >
                  {t("auth.login.signIn")}
                </Button>

                <View className="flex-row items-center justify-center">
                  <Text className="text-sm text-muted-foreground">
                    {t(
                        "auth.login.noAccount"
                    )}{" "}
                  </Text>

                  <Pressable
                      accessibilityRole="link"
                      onPress={() => navigation.navigate("Register")}
                      hitSlop={8}
                  >
                    <Text className="text-sm font-semibold text-primary">
                      {t(
                          "auth.login.createAccount"
                      )}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Screen>
      </View>
  );
}
