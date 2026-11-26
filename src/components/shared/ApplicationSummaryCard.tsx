import { Text, View } from "react-native";
import { FileText } from "lucide-react-native";

import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

export type ApplicationSummaryCardProps = {
  programCode: string;
  programName: string;
  agency: string;
  statusLabel: string;
  statusVariant?: "default" | "info" | "success" | "warning" | "error";
  description?: string;
  className?: string;
};

export default function ApplicationSummaryCard({
    programCode,
    programName,
    agency,
    statusLabel,
    statusVariant = "default",
    description,
    className = ""
}: ApplicationSummaryCardProps) {
  return (
      <Card
          padding="lg"
          className={`
          border-primary
          bg-info-background
          ${className}
        `}
      >
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <FileText
                size={24}
                color="#FFFFFF"
            />
          </View>

          <View className="flex-1">
            <Text className="text-sm font-semibold text-primary">
              {programCode}
            </Text>

            <Text className="mt-1 text-lg font-semibold text-foreground">
              {programName}
            </Text>

            <Text className="mt-1 text-sm text-muted-foreground">
              {agency}
            </Text>
          </View>
        </View>

        {description && (
            <Text className="mt-4 text-sm leading-5 text-muted-foreground">
              {description}
            </Text>
        )}

        <View className="mt-4 flex-row items-center">
          <Badge variant={statusVariant}>
            {statusLabel}
          </Badge>
        </View>
      </Card>
  );
}
