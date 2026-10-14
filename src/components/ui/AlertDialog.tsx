import { CircleCheck, CircleX, Info, LucideIcon, TriangleAlert, X } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";
import Button from "../ui/Button";

type AlertDialogVariant = "info" | "success" | "warning" | "error";
type AlertDialogConfirmVariant = "default" | "destructive";

type AlertDialogStyle = {
  icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
};

const alertDialogStyles: Record<AlertDialogVariant, AlertDialogStyle> = {
  info: {
    icon: Info,
    iconColor: "#0352CE",
    iconBackground: "bg-info-background",
  },

  success: {
    icon: CircleCheck,
    iconColor: "#16A34A",
    iconBackground: "bg-success-background",
  },

  warning: {
    icon: TriangleAlert,
    iconColor: "#FD9E12",
    iconBackground: "bg-warning-background",
  },

  error: {
    icon: CircleX,
    iconColor: "#F5222D",
    iconBackground: "bg-error-background",
  },
};

export type AlertDialogProps = {
  visible: boolean;
  variant?: AlertDialogVariant;
  confirmVariant?: AlertDialogConfirmVariant;
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  loading?: boolean;
};

export default function AlertDialog({
    visible,
    variant = "info",
    confirmVariant = "default",
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    onDismiss,
    dismissible = true,
    loading = false
}: AlertDialogProps) {
  const styles = alertDialogStyles[variant];
  const Icon = styles.icon;

  const canDismiss = dismissible && !loading && onDismiss !== undefined;

  const handleDismiss = () => {
    if (!canDismiss) {
      return;
    }

    onDismiss();
  };

  return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleDismiss}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <Pressable
            className="absolute inset-0"
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            disabled={!canDismiss}
          />
            <View className="w-full max-w-md rounded-3xl bg-background p-6" accessibilityViewIsModal>
              {canDismiss && (
                  <Pressable
                    className="absolute right-4 top-4 z-10 h-10 w-10 items-center justify-center rounded-full"
                    onPress={handleDismiss}
                    accessibilityRole="button"
                    accessibilityLabel="Close dialog"
                    hitSlop={8}
                  >
                    <X size={22} color="#626775" strokeWidth={2} />
                  </Pressable>
              )}

              <View className="items-center">
                <View
                  className={`
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    ${styles.iconBackground}
                  `}
                >
                  <Icon size={30} color={styles.iconColor} strokeWidth={2} />
                </View>

                <Text className="mt-5 text-center text-xl font-semibold text-foreground">
                  {title}
                </Text>

                {message && (
                    <Text className="mt-2 text-center text-sm leading-5 text-muted-foreground">
                      {message}
                    </Text>
                )}
              </View>

              <View className="mt-6 gap-3">
                <Button
                    variant={
                      confirmVariant === "destructive"
                          ? "destructive"
                          : "primary"
                    }
                    fullWidth
                    onPress={onConfirm}
                    loading={loading}
                >
                  {confirmText}
                </Button>

                {cancelText && onCancel && (
                    <Pressable
                      className={`
                        min-h-12
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-border
                        bg-background
                        px-4
                        ${loading ? "opacity-50" : ""}
                      `}
                      onPress={onCancel}
                      disabled={loading}
                      accessibilityRole="button"
                    >
                      <Text className="text-base font-semibold text-foreground">
                        {cancelText}
                      </Text>
                    </Pressable>
                )}
              </View>
            </View>
        </View>
      </Modal>
  );
}
