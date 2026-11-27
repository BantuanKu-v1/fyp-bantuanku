import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

export type ApplicationDeclarationProps = {
  title?: string;
  description: string;
  accepted: boolean;
  onChange: (accepted: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
};

export default function ApplicationDeclaration({
    title,
    description,
    accepted,
    onChange,
    required = true,
    disabled = false,
    error,
    className = ""
}: ApplicationDeclarationProps) {
  const handlePress = () => {
    if (disabled) {
      return;
    }

    onChange(!accepted);
  };

  const checkboxClassName = accepted
      ? "border-primary bg-primary"
      : error
          ? "border-red-500 bg-background"
          : "border-border bg-background";

  return (
      <View
        className={`
          w-full
          gap-3
          rounded-2xl
          border
          bg-card
          p-4
          ${error ? "border-red-500" : "border-border"}
          ${className}
        `}
      >
        {title && (
            <Text className="text-base font-bold text-foreground">
              {title}

              {required && (
                  <Text className="text-red-600">
                    {" *"}
                  </Text>
              )}
            </Text>
        )}

        <Pressable
          className={`
            flex-row
            items-start
            gap-3
            ${disabled ? "opacity-60" : ""}
          `}
          onPress={handlePress}
          disabled={disabled}
          accessibilityRole="checkbox"
          accessibilityLabel={description}
          accessibilityState={{ checked: accepted, disabled }}
        >
          <View
            className={`
              mt-0.5
              h-5
              w-5
              items-center
              justify-center
              rounded
              border
              ${checkboxClassName}
            `}
          >
            {accepted && (
                <Check
                  size={14}
                  color="#FFFFFF"
                  strokeWidth={3}
                />
            )}
          </View>

          <Text className="flex-1 text-sm leading-5 text-foreground">
            {description}
          </Text>
        </Pressable>

        {error && (
            <Text className="text-xs text-red-600">
              {error}
            </Text>
        )}
      </View>
  );
}
