import { ReactNode } from "react";
import {Modal as RNModal, Pressable, Text, View} from "react-native";
import {X} from "lucide-react-native";

type ModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
};

export default function Modal({
    visible,
    title,
    description,
    children,
    onClose,
    showCloseButton = true
}: ModalProps) {
  return (
      <RNModal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={onClose}
        >
          <Pressable
              className="w-full rounded-2xl bg-background p-5"
              onPress={(event) => event.stopPropagation()}
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">
                  {title}
                </Text>

                {description && (
                    <Text className="mt-1 text-sm leading-5 text-muted-foreground">
                      {description}
                    </Text>
                )}
              </View>

              {showCloseButton && (
                  <Pressable
                      onPress={onClose}
                      accessibilityRole="button"
                      className="ml-3 h-8 w-8 items-center justify-center rounded-full"
                  >
                    <X size={20} color="#6B7280" />
                  </Pressable>
              )}
            </View>

            <View className="mt-5">
              {children}
            </View>
          </Pressable>
        </Pressable>
      </RNModal>
  );
}
