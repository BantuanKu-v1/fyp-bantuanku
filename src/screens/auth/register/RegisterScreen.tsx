import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../types/tabNavigator";
import { useState } from "react";
import { RegisterFormData } from "../../../schemas/auth";
import {
  RegisterHouseholdIncomeFormData,
  RegisterPersonalFormData,
  RegisterResidenceFormData
} from "../../../schemas/registration";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SelectedDocument } from "../../../types/documents";
import { useAuth } from "../../../contexts/AuthContext";
import { getStoredLanguage } from "../../../i18n/language";
import { completeRegistration, RegistrationError } from "../../../services/registrationService";
import { uploadRegistrationDocuments } from "../../../services/documentService";

import AuthBackground from "../../../components/auth/AuthBackground";
import Screen from "../../../components/layout/Screen";
import RegisterAccountStep from "./RegisterAccountStep";
import RegisterPersonalStep from "./RegisterPersonalStep";
import RegisterResidenceStep from "./RegisterResidenceStep";
import RegisterHouseholdIncomeStep from "./RegisterHouseholdIncomeStep";
import RegisterDocumentsStep from "./RegisterDocumentsStep";
import RegisterLoading from "../../../components/auth/RegisterLoading";
import AlertDialog from "../../../components/ui/AlertDialog";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({
    navigation
}: Props) {
  const { t } = useTranslation();
  const { refreshRegistrationStatus, setRegistrationInProgress } = useAuth();

  const [step, setStep] = useState(1);
  const [accountData, setAccountData,] = useState<RegisterFormData | undefined>();
  const [personalData, setPersonalData,] = useState<RegisterPersonalFormData | undefined>();
  const [residenceData, setResidenceData,] = useState<RegisterResidenceFormData | undefined>();
  const [householdIncomeData, setHouseholdIncomeData,] = useState<RegisterHouseholdIncomeFormData | undefined>();
  const [myKadError, setMyKadError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<SelectedDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const handleAccountContinue = (
      data: RegisterFormData
  )=> {
    setAccountData(data);
    setStep(2);
  };

  const handlePersonalContinue = (
      data: RegisterPersonalFormData
  ) => {
    setPersonalData(data);
    setMyKadError(null);
    setStep(3);
  }

  const handleResidenceContinue = (
      data: RegisterResidenceFormData
  ) => {
    setResidenceData(data);
    setStep(4);
  }

  const handleHouseholdIncomeContinue = (
      data: RegisterHouseholdIncomeFormData
  )=> {
    setHouseholdIncomeData(data);
    setStep(5);
  };

  const handleDocumentComplete = async () => {
    if (submitting) {
      return;
    }

    if (
        !accountData ||
        !personalData ||
        !residenceData ||
        !householdIncomeData
    ) {
      setRegistrationError(t("auth.register.errors.incompleteRegistration"));

      return;
    }

    setSubmitting(true);
    setRegistrationInProgress(true);
    setRegistrationError(null);

    try {
      const preferredLanguage = getStoredLanguage();

      if (!preferredLanguage) {
        setRegistrationError(t("auth.register.errors.languageUnavailable"));
        setRegistrationInProgress(false);

        return;
      }

      const {
        profileId
      } = await completeRegistration({
        account: accountData,
        personal: personalData,
        residence: residenceData,
        householdIncome: householdIncomeData,
        preferredLanguage
      });

      if (documents.length > 0) {
        const {
          failedDocuments
        } = await uploadRegistrationDocuments(
            profileId,
            documents
        );

        if (failedDocuments.length > 0 && __DEV__) {
          console.warn(
              "[REGISTRATION] Registration completed but some documents failed to upload:", failedDocuments
          );
        }
      }

      setRegistrationInProgress(false);

      await refreshRegistrationStatus();
    } catch (error) {
      setRegistrationInProgress(false);

      if (error instanceof RegistrationError) {
        if (error.code === "identificationNumberExists") {
          setMyKadError(t("auth.register.errors.identificationNumberExists"));

          setStep(error.step);

          return;
        }
      }

      if (__DEV__) {
        console.error(
            "[REGISTRATION] Registration failed:", error
        );
      }

      setRegistrationError(t("auth.register.errors.registrationFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <View className="flex-1 bg-background">
        <AuthBackground />

        <Screen transparent>
          <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {step === 1 && (
                <View className="flex-1 justify-center">
                  <RegisterAccountStep onContinue={handleAccountContinue} defaultValues={accountData} />

                  <View className="mt-6 flex-row items-center justify-center">
                    <Text className="text-sm text-muted-foreground">
                      {t("auth.register.account.alreadyHaveAccount")}{" "}
                    </Text>

                    <Pressable
                      accessibilityRole="link"
                      onPress={() => navigation.goBack()}
                      hitSlop={8}
                    >
                      <Text className="text-sm font-semibold text-primary">
                        {t("auth.register.account.signIn")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
            )}

            {step === 2 && (
                  <View className="flex-1 justify-center">
                    <RegisterPersonalStep
                      defaultValues={personalData}
                      onBack={() => setStep(1)}
                      onContinue={handlePersonalContinue}
                      myKadError={myKadError ?? undefined}
                    />
                  </View>
              )}

            {step === 3 && (
                <View className="flex-1 justify-center">
                  <RegisterResidenceStep
                    defaultValues={residenceData}
                    onBack={() => setStep(2)}
                    onContinue={handleResidenceContinue}
                  />
                </View>
            )}

            {step === 4 && (
                <View className="flex-1 justify-center">
                  <RegisterHouseholdIncomeStep
                    defaultValues={householdIncomeData}
                    onBack={() => setStep(3)}
                    onContinue={handleHouseholdIncomeContinue}
                  />
                </View>
            )}

            {step === 5 && (
                <View className="flex-1 justify-center">
                  {submitting ? (
                      <RegisterLoading />
                  ) : (
                      <RegisterDocumentsStep
                          documents={documents}
                          onChange={setDocuments}
                          onBack={() => setStep(4)}
                          onComplete={handleDocumentComplete}
                      />
                  )}
                </View>
            )}
          </KeyboardAvoidingView>
        </Screen>

        <AlertDialog
            visible={registrationError !== null}
            variant="error"
            title={t("auth.register.errors.title")}
            message={registrationError ?? undefined}
            confirmText={t("common.ok")}
            onConfirm={() => setRegistrationError(null)}
            onDismiss={() => setRegistrationError(null)}
        />
      </View>
  );
}
