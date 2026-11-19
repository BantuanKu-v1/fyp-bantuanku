import { useTranslation } from "react-i18next";
import { SupportedLanguage } from "../../i18n/types";
import { useState } from "react";
import { changeLanguage } from "../../i18n";
import { Image, Pressable, Text, View } from "react-native";

import Screen from "../../components/layout/Screen";
import { isSupportedLanguage, languageOptions } from "../../i18n/language";
import { Check } from "lucide-react-native";
import Button from "../../components/ui/Button";

type LanguageSelectionScreenProps = {
  onComplete: () => void;
};

export default function LanguageSelectionScreen({
    onComplete
}: LanguageSelectionScreenProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;

  const initialLanguage: SupportedLanguage =
      isSupportedLanguage(currentLanguage)
        ? currentLanguage
        : "en";

  const [
      selectedLanguage,
      setSelectedLanguage
  ] = useState<SupportedLanguage>(initialLanguage);

  const handleLanguageSelect = async (
      language: SupportedLanguage
  ) => {
    setSelectedLanguage(language);
    await i18n.changeLanguage(language);
  };

  const handleContinue = async () => {
    await changeLanguage(selectedLanguage);
    onComplete();
  };

  return (
      <Screen scroll={false}>
        <View className="flex-1 justify-center">
          <View className="mb-10 items-center">
            <Image
              source={require("../../../assets/bantuanku-logo.png")}
              resizeMode="contain"
              className="mb-8 ml-8 h-16 w-44"
              accessibilityLabel="BantuanKu"
            />

            <Text className="text-center text-2xl font-bold text-foreground">
              Choose your language
            </Text>

            <Text className="mt-2 text-center text-base text-muted-foreground">
              Pilih Bahasa · 选择语言
            </Text>
          </View>

          <View className="gap-3">
            {languageOptions.map((option) => {
              const selected = selectedLanguage === option.value;

              return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      void handleLanguageSelect(option.value);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    className={`
                      min-h-16
                      flex-row
                      items-center
                      justify-between
                      rounded-xl
                      border
                      px-5
                      ${
                        selected
                          ? "border-primary bg-surface"
                          : "border-border bg-background"  
                      }
                    `}
                  >
                    <Text
                      className={`
                        text-base
                        font-semibold
                        ${
                          selected
                            ? "text-primary"
                            : "text-foreground"  
                        }
                      `}
                    >
                      {option.label}
                    </Text>

                    <View
                      className={`
                        h-6
                        w-6
                        items-center
                        justify-center
                        rounded-full
                        border-2
                        ${
                          selected
                            ? "border-primary bg-primary"
                            :  "border-border"
                        }
                      `}
                    >
                      {selected && (
                          <Check size={14} strokeWidth={3} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
              );
            })}
          </View>

          <View className="mt-8">
            <Button
              fullWidth
              onPress={() => void handleContinue()}
            >
              {t("common.continue")}
            </Button>
          </View>
        </View>
      </Screen>
  );
}
