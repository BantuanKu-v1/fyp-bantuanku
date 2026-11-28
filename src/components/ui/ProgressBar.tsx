import { View } from "react-native";

export type ProgressBarProps = {
  value: number;
  total: number;
  variant?: "primary" | "success";
  size?: "sm" | "md" | "lg";
  accessibilityLabel?: string;
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
} as const;

const VARIANT_CLASSES = {
  primary: "bg-primary",
  success: "bg-success",
} as const;

export default function ProgressBar({
    value,
    total,
    variant = "primary",
    size = "md",
    accessibilityLabel,
    className = ""
}: ProgressBarProps) {
  const safeTotal = Number.isFinite(total)
      ? Math.max(0, total)
      : 0;

  const safeValue = Number.isFinite(value)
      ? Math.min(Math.max(0, value), safeTotal)
      : 0;

  const percentage = safeTotal > 0
      ? (safeValue / safeTotal) * 100
      : 0;

  return (
      <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(percentage),
          }}
          className={`
          w-full
          overflow-hidden
          rounded-full
          bg-border
          ${SIZE_CLASSES[size]}
          ${className}
        `}
      >
        <View
            className={`
            h-full
            rounded-full
            ${VARIANT_CLASSES[variant]}
          `}
            style={{
              width: `${percentage}%`,
            }}
        />
      </View>
  );
}
