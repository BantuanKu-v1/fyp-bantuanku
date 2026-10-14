import { ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  description?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  hasError?: boolean;
  disabled?: boolean;
};

export default function CollapsibleSection({
    title,
    children,
    description,
    defaultExpanded = false,
    expanded: controlledExpanded,
    onExpandedChange,
    hasError,
    disabled
}: CollapsibleSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const expanded = controlledExpanded ?? internalExpanded;

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    const nextExpanded = !expanded;

    if (controlledExpanded === undefined) {
      setInternalExpanded(nextExpanded);
    }

    onExpandedChange?.(nextExpanded);
  };

  return (
      <View
        className={
          hasError
            ? "overflow-hidden rounded-xl border border-destructive bg-card"
            : "overflow-hidden rounded-xl border border-border bg-card"
        }
      >
        <Pressable
          onPress={handleToggle}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ expanded, disabled }}
          accessibilityLabel={title}
          className={
            disabled
              ? "flex-row items-center justify-between px-4 py-4 opacity-50"
              : "flex-row items-center justify-between px-4 py-4"
          }
        >
          <View className="mr-3 flex-1">
            <Text
              className={
                hasError
                  ? "text-base font-semibold text-destructive"
                  : "text-base font-semibold text-foreground"
              }
            >
              {title}
            </Text>

            {description && (
                <Text className="mt-1 text-sm leading-5 text-muted-foreground">
                  {description}
                </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            {hasError && !expanded && (
                <View className="h-2 w-2 rounded-full bg-destructive" />
            )}

            {expanded ? (
                <ChevronUp size={20} color="#6B7280" />
            ) : (
                <ChevronDown size={20} color="#6B7280" />
            )}
          </View>
        </Pressable>

        {expanded && (
            <View className="border-t border-border px-4 py-5">
              {children}
            </View>
        )}
      </View>
  );
}
