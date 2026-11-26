import {
  ActivityIndicator,
  Text,
  View,
  ViewProps,
} from "react-native";

export type LoadingStateProps = ViewProps & {
  title?: string;
  description?: string;
  size?: "small" | "large";
  fullScreen?: boolean;
};

export default function LoadingState({
    title,
    description,
    size = "large",
    fullScreen = true,
    className = "",
    ...props
}: LoadingStateProps) {
  return (
      <View
          {...props}
          accessible
          accessibilityRole="progressbar"
          accessibilityState={{ busy: true }}
          accessibilityLabel={title ?? description}
          className={`
          w-full
          items-center
          justify-center
          px-6
          py-8
          ${fullScreen ? "flex-1" : ""}
          ${className}
        `}
      >
        <ActivityIndicator
            size={size}
            className="text-primary"
        />

        {title && (
            <Text className="mt-4 text-base font-semibold text-foreground text-center">
              {title}
            </Text>
        )}

        {description && (
            <Text
                className={`
                ${title ? "mt-2" : "mt-4"}
                text-center
                text-sm
                leading-5
                text-muted-foreground
              `}
            >
              {description}
            </Text>
        )}
      </View>
  );
}
