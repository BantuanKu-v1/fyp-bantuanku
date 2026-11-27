import { Text, View } from "react-native";

export type ApplicationSummaryCardProps = {
  programCode: string;
  programName: string;
  agency: string;
  statusLabel: string;
  applicationId?: string;
  applicationIdLabel?: string;
  description?: string;
  className?: string;
};

export default function ApplicationSummaryCard({
    programCode,
    programName,
    agency,
    statusLabel,
    applicationId,
    applicationIdLabel,
    description,
    className = ""
}: ApplicationSummaryCardProps) {
  return (
      <View
          className={`
            gap-3
            rounded-2xl
            bg-primary
            p-4
            ${className}
          `}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-xs font-medium text-blue-100">
              {agency}
            </Text>

            <Text className="text-xl font-bold text-white">
              {programName}
            </Text>

            <Text className="text-xs font-medium text-blue-100">
              {programCode}
            </Text>
          </View>

          <View className="max-w-[45%] rounded-full bg-white/20 px-3 py-1.5">
            <Text className="text-center text-xs font-semibold text-white">
              {statusLabel}
            </Text>
          </View>
        </View>

        {description && (
            <Text className="text-sm leading-5 text-blue-100">
              {description}
            </Text>
        )}

        {applicationId && (
            <>
              <View className="h-px bg-white/20" />

              <View className="flex-row items-center justify-between gap-3">
                {applicationIdLabel && (
                    <Text className="text-xs text-blue-100">
                      {applicationIdLabel}
                    </Text>
                )}

                <Text
                    className="flex-1 text-right text-xs font-medium text-white"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    selectable
                >
                  {applicationId}
                </Text>
              </View>
            </>
        )}
      </View>
  );
}
