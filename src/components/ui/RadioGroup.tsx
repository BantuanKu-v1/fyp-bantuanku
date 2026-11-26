import { Pressable, Text, View } from "react-native";

export type RadioValue = string | number | boolean;

export type RadioOption<T extends RadioValue> = {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupProps<T extends RadioValue> = {
  label?: string;
  value?: T | null;
  options: readonly RadioOption<T>[];
  onChange: (value: T) => void;
  direction?: "horizontal" | "vertical";
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function RadioGroup<T extends RadioValue>({
    label,
    value,
    options,
    onChange,
    direction = "vertical",
    helperText,
    error,
    required = false,
    disabled = false,
    className = ""
}: RadioGroupProps<T>) {
  const isHorizontal = direction === "horizontal";

  return (
      <View className={`w-full ${className}`}>
        {label && (
            <Text className="mb-2 text-sm font-medium text-foreground">
              {label}

              {required && (
                  <Text className="text-red-600">
                    {" *"}
                  </Text>
              )}
            </Text>
        )}

        <View
            accessibilityRole="radiogroup"
            accessibilityLabel={label}
            className={
              isHorizontal
                  ? "flex-row gap-3"
                  : "gap-3"
            }
        >
          {options.map((option) => {
            const selected = value === option.value;
            const isDisabled = disabled || option.disabled === true;

            return (
                <Pressable
                    key={`${typeof option.value}-${String(option.value)}`}
                    onPress={() => onChange(option.value)}
                    disabled={isDisabled}
                    accessibilityRole="radio"
                    accessibilityLabel={option.label}
                    accessibilityHint={option.description}
                    accessibilityState={{
                      checked: selected,
                      disabled: isDisabled,
                    }}
                    className={`
                    min-h-12
                    flex-row
                    items-center
                    rounded-xl
                    border
                    px-4
                    py-3
                    ${isHorizontal ? "flex-1" : "w-full"}
                    ${
                        selected
                            ? "border-primary bg-secondary"
                            : error
                                ? "border-red-600 bg-background"
                                : "border-border bg-background"
                    }
                    ${isDisabled ? "opacity-50" : ""}
                  `}
                >
                  <View
                      className={`
                      mr-3
                      h-5
                      w-5
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      ${
                          selected
                              ? "border-primary"
                              : "border-muted-foreground"
                      }
                    `}
                  >
                    {selected && (
                        <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text
                        className={`
                        text-base
                        ${
                            selected
                                ? "font-semibold text-primary"
                                : "text-foreground"
                        }
                      `}
                    >
                      {option.label}
                    </Text>

                    {option.description && (
                        <Text className="mt-1 text-sm leading-5 text-muted-foreground">
                          {option.description}
                        </Text>
                    )}
                  </View>
                </Pressable>
            );
          })}
        </View>

        {error ? (
            <Text
                accessibilityRole="alert"
                className="mt-1.5 text-sm text-red-600"
            >
              {error}
            </Text>
        ) : helperText ? (
            <Text className="mt-1.5 text-sm text-muted-foreground">
              {helperText}
            </Text>
        ) : null}
      </View>
  );
}
