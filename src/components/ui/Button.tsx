import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, type PressableProps, Text } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "destructive";
type ButtonSize = "sm" | "md" | "lg";
type ButtonHaptic = "light" | "medium" | "heavy" | "none";

export type ButtonProps = PressableProps & {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: ButtonHaptic;
}

const containerVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  outline: "border border-primary bg-transparent",
  destructive: "bg-red-600",
}

const textVariants: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-primary",
  outline: "text-primary",
  destructive: "text-white",
}

const sizeVariants: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 py-2",
  md: "min-h-12 px-5 py-3",
  lg: "min-h-14 px-6 py-4",
}

const textSizeVariants: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
}

const hapticStyles: Record<
  Exclude<ButtonHaptic, "none">,
  Haptics.ImpactFeedbackStyle
> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
}

export default function Button({
    children,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    haptic = "none",
    disabled = false,
    className = "",
    onPressIn,
    ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePressIn: PressableProps["onPressIn"] = (
      pressEvent
  ) => {
    if (haptic !== "none") {
      void Haptics.impactAsync(hapticStyles[haptic]);
    }

    onPressIn?.(pressEvent);
  }

  return (
      <Pressable
          {...props}
          accessibilityRole="button"
          accessibilityState={{
            disabled: isDisabled,
            busy: loading,
          }}
          disabled={isDisabled}
          onPressIn={handlePressIn}
          className={`
            flex-row
            items-center
            justify-center
            rounded-xl
            ${containerVariants[variant]}
            ${sizeVariants[size]}
            ${fullWidth ? "w-full" : ""}
            ${isDisabled ? "opacity-50" : ""}
            ${className}
          `}
      >
        {loading ? (
            <ActivityIndicator
              color={
                variant === "primary" || variant === "destructive"
                  ? "#FFFFFF"
                  : "#0352CE"
              }
            />
        ) : (
            <Text
              className={`
                font-semibold
                ${textVariants[variant]}
                ${textSizeVariants[size]}
              `}
            >
              {children}
            </Text>
        )}
      </Pressable>
  );
}
