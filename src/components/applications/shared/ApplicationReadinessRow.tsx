import { Text, View } from "react-native";
import {
  Check,
  AlertCircle,
  Minus,
} from "lucide-react-native";

export type ApplicationReadinessRowProps = {
  label: string;
  complete: boolean;
  completeLabel: string;
  incompleteLabel: string;
  notRequired?: boolean;
  notRequiredLabel?: string;
  className?: string;
};

export default function ApplicationReadinessRow({
    label,
    complete,
    completeLabel,
    incompleteLabel,
    notRequired = false,
    notRequiredLabel,
    className = ""
}: ApplicationReadinessRowProps) {
  const indicatorClassName = notRequired
      ? "bg-gray-100"
      : complete
          ? "bg-green-100"
          : "bg-amber-100";

  const statusClassName = notRequired
      ? "text-muted-foreground"
      : complete
          ? "text-green-700"
          : "text-amber-700";

  const statusLabel = notRequired
      ? notRequiredLabel ?? "Not required"
      : complete
          ? completeLabel
          : incompleteLabel;

  return (
      <View
          className={`
            flex-row
            items-center
            gap-3
            py-2
            ${className}
          `}
      >
        <View
            className={`
              h-6
              w-6
              items-center
              justify-center
              rounded-full
              ${indicatorClassName}
            `}
        >
          {notRequired ? (
              <Minus
                  size={14}
                  color="#6B7280"
              />
          ) : complete ? (
              <Check
                  size={14}
                  color="#15803D"
              />
          ) : (
              <AlertCircle
                  size={14}
                  color="#B45309"
              />
          )}
        </View>

        <Text className="flex-1 text-sm text-foreground">
          {label}
        </Text>

        <Text
            className={`
              text-right
              text-xs
              font-medium
              ${statusClassName}
            `}
        >
          {statusLabel}
        </Text>
      </View>
  );
}
