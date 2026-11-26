import { Text, View } from "react-native";

export type ApplicationDetailRowProps = {
  label: string;
  value?: string | number | boolean | null;
  fallback: string;
  className?: string;
};

export default function ApplicationDetailRow({
    label,
    value,
    fallback,
    className = ""
}: ApplicationDetailRowProps) {
  const hasValue =
      value !== null &&
      value !== undefined &&
      (typeof value !== "string" || value.trim().length > 0) &&
      (typeof value !== "number" || Number.isFinite(value));

  const displayValue = hasValue
      ? String(value)
      : fallback;

  return (
      <View
          className={`
          flex-row
          items-start
          justify-between
          gap-4
          ${className}
        `}
      >
        <Text className="flex-1 text-sm text-muted-foreground">
          {label}
        </Text>

        <Text className="flex-1 text-right text-sm font-medium text-foreground">
          {displayValue}
        </Text>
      </View>
  );
}
