import { Text, View, type ViewProps } from "react-native";
import { CircleAlert, type LucideIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

export type ErrorStateProps = ViewProps & {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
};

export default function ErrorState({
    icon: Icon = CircleAlert,
    title,
    description,
    onRetry,
    retryText,
    className = "",
    ...props
}: ErrorStateProps) {
  const { t } = useTranslation();

  const displayTitle = title ?? t("common.error", {
    defaultValue: "Something went wrong"
  });

  const displayDescription = description ?? t("common.errorDescription", {
    defaultValue: "We couldn't load this information. Please try again."
  });

  const displayRetryText = retryText ?? t("common.retry", {
    defaultValue: "Try Again"
  });

  return (
      <View
          {...props}
          className={`
            items-center
            px-6
            py-10
            ${className}
          `}
      >
        <View className="mb-4 items-center justify-center rounded-full bg-error-background p-4">
          <Icon
            size={28}
            color="#F5222D"
            strokeWidth={2}
          />
        </View>

        <Text className="text-center text-lg font-semibold text-foreground">
          {displayTitle}
        </Text>

        {displayDescription && (
            <Text className="mt-2 text-center text-sm leading-5 text-muted-foreground">
              {displayDescription}
            </Text>
        )}

        {onRetry && (
            <Button
              variant="outline"
              onPress={onRetry}
              className="mt-6"
            >
              {displayRetryText}
            </Button>
        )}
      </View>
  );
}
