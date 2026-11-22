import { Platform, RefreshControl, ScrollView, View, type ViewProps } from "react-native";
import { type ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export type ScreenProps = ViewProps & {
  children: ReactNode;
  scroll?: boolean;
  transparent?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  adjustKeyboardInsets?: boolean;
};

export default function Screen({
    children,
    scroll = true,
    transparent = false,
    refreshing = false,
    onRefresh,
    adjustKeyboardInsets = true,
    className = "",
    ...props
}: ScreenProps) {
  return (
      <SafeAreaView
          edges={["top", "left", "right"]}
          className={`flex-1 ${transparent ? "bg-transparent" : "bg-background"}`}
      >
        {scroll ? (
            <ScrollView
                className="flex-1"
                contentContainerClassName={`flex-grow px-6 py-6 ${className}`}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
                automaticallyAdjustKeyboardInsets={Platform.OS === "ios" && adjustKeyboardInsets}
                contentInsetAdjustmentBehavior="never"
                showsVerticalScrollIndicator={false}
                bounces={false}
                alwaysBounceVertical={false}
                refreshControl={
                  onRefresh ? (
                      <RefreshControl
                          refreshing={refreshing}
                          onRefresh={onRefresh}
                          colors={["#0352CE"]}
                          tintColor="#0352CE"
                      />
                  ) : undefined
                }
            >
              {children}
            </ScrollView>
        ) : (
            <View
                {...props}
                className={`flex-1 px-6 py-6 ${className}`}
            >
              {children}
            </View>
        )}
      </SafeAreaView>
  );
}
