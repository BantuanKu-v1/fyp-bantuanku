import { Text, View } from "react-native";

export type ApplicationDetailRowProps = {
  label: string;
  value?: string | number | boolean | null;
  fallback: string;
  selectable?: boolean;
  className?: string;
};

export default function ApplicationDetailRow({
    label,
    value,
    fallback,
    selectable = true,
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
            py-2
            ${className}
          `}
      >
        <Text className="max-w-[42%] text-xs text-muted-foreground">
          {label}
        </Text>

        <Text
            className="flex-1 text-right text-sm font-medium text-foreground"
            selectable={selectable}
        >
          {displayValue}
        </Text>
      </View>
  );
}
