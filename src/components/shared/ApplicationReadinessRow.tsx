import { Text, View } from "react-native";
import { CircleCheck, CircleAlert } from "lucide-react-native";

import Badge from "../../components/ui/Badge";

export type ApplicationReadinessRowProps = {
  label: string;
  complete: boolean;
  completeLabel: string;
  incompleteLabel: string;
  className?: string;
};

export default function ApplicationReadinessRow({
  label,
  complete,
  completeLabel,
  incompleteLabel,
  className = ""
}: ApplicationReadinessRowProps) {
  return (
      <View
          className={`
          flex-row
          items-center
          justify-between
          gap-3
          ${className}
        `}
      >
        <View className="flex-1 flex-row items-center gap-2">
          {complete ? (
              <CircleCheck
                  size={18}
                  color="#16A34A"
              />
          ) : (
              <CircleAlert
                  size={18}
                  color="#D97706"
              />
          )}

          <Text className="flex-1 text-sm text-foreground">
            {label}
          </Text>
        </View>

        <Badge variant={complete ? "success" : "warning"}>
          {complete ? completeLabel : incompleteLabel}
        </Badge>
      </View>
  );
}
