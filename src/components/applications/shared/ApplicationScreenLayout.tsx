import type { ReactNode } from "react";
import { Platform, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

import Screen from "../../layout/Screen";
import ScreenHeader from "../../layout/ScreenHeader";
import LoadingState from "../../feedback/LoadingState";
import Alert from "../../ui/Alert";

import type {
  ExternalApplicationProvider
} from "../../../types/applications";

type ApplicationScreenLayoutProps = {
  provider: ExternalApplicationProvider;
  programCode?: string;
  loading: boolean;
  error?: string | null;
  children: ReactNode;
  actions?: ReactNode;
};

export default function ApplicationScreenLayout({
    provider,
    programCode,
    loading,
    error,
    children,
    actions
}: ApplicationScreenLayoutProps) {
  const { t } = useTranslation();

  return (
      <Screen scroll={false}>
        <ScreenHeader
            title={t(`applications.${provider}.title`, {
              programCode
            })}
            description={t(`applications.${provider}.description`)}
        />

        {loading ? (
            <LoadingState
                title={t(`applications.${provider}.messages.loading`)}
            />
        ) : (
            <>
              <ScrollView
                  className="flex-1"
                  contentContainerClassName="gap-3 pb-6 pt-3"
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={
                    Platform.OS === "ios"
                        ? "interactive"
                        : "on-drag"
                  }
                  automaticallyAdjustKeyboardInsets={
                      Platform.OS === "ios"
                  }
                  contentInsetAdjustmentBehavior="never"
                  bounces={false}
                  alwaysBounceVertical={false}
              >
                {error && (
                    <Alert
                        variant="error"
                        title={t(
                            `applications.${provider}.messages.attentionRequired`
                        )}
                    >
                      {t(error, { defaultValue: error })}
                    </Alert>
                )}

                {children}
              </ScrollView>

              {actions && (
                  <View className="border-t border-border bg-background pb-4 pt-3">
                    {actions}
                  </View>
              )}
            </>
        )}
      </Screen>
  );
}
