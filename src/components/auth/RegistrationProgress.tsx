import { useTranslation } from "react-i18next";
import { Animated, Easing, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { useEffect, useRef } from "react";

type RegistrationProgressProps = {
  currentStep: number;
  completed?: boolean;
};

export default function RegistrationProgress({
    currentStep,
    completed = false
}: RegistrationProgressProps) {
  const { t } = useTranslation();

  const steps = [
    t("auth.register.progress.account"),
    t("auth.register.progress.personal"),
    t("auth.register.progress.residence"),
    t("auth.register.progress.household"),
    t("auth.register.progress.documents"),
  ];

  const progress = completed
      ? 1
      : Math.max(0, Math.min(1, (currentStep - 1) / (steps.length - 1)));

  const progressAnimation = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    const animation = Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    });

    animation.start();

    return () => animation.stop();
  }, [progress, progressAnimation]);

  const animatedWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return (
      <View className="mb-7">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-md font-medium text-muted-foreground">
            {t("auth.register.progress.step", {
              defaultValue: "Step {{current}} of {{total}}",
              current: completed ? steps.length : currentStep,
              total: steps.length
            })}
          </Text>

          <Text className="text-md font-semibold text-primary">
            {Math.round(
                (completed ? 1 : (currentStep - 1) / steps.length) * 100
            )}%
          </Text>
        </View>

        <View className="relative">
          <View
              pointerEvents="none"
              className="absolute left-[10%] right-[10%] top-[17px] h-0.5 bg-border"
          >
            <Animated.View
                className="h-full bg-primary"
                style={{
                  width: animatedWidth
                }}
            />
          </View>

          <View className="flex-row items-start">
            {steps.map((label, index) => {
              const step = index + 1;
              const isCompleted = completed || step < currentStep;
              const isCurrent = !completed && step === currentStep;

              return (
                  <View
                      key={step}
                      className="flex-1 items-center"
                  >
                    <View
                        className={`h-9 w-9 items-center justify-center rounded-full border-2 ${
                            isCompleted || isCurrent
                                ? "border-primary bg-primary"
                                : "border-border bg-background"
                        }`}
                    >
                      {isCompleted ? (
                          <Check
                              size={17}
                              strokeWidth={3}
                              color="#FFFFFF"
                          />
                      ) : (
                          <Text
                              className={`text-sm font-semibold ${
                                  isCurrent
                                      ? "text-white"
                                      : "text-muted-foreground"
                              }`}
                          >
                            {step}
                          </Text>
                      )}
                    </View>

                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        className={`mt-2 text-center text-xs ${
                            isCurrent
                                ? "font-semibold text-primary"
                                : isCompleted
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground"
                        }`}
                    >
                      {label}
                    </Text>
                  </View>
              );
            })}
          </View>
        </View>
      </View>
  );
}
