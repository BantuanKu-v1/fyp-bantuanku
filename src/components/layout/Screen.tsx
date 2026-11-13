import { ScrollView, View, type ViewProps } from "react-native";
import { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export type ScreenProps = ViewProps & {
  children: ReactNode;
  scroll?: boolean;
  transparent?: boolean;
};

export default function Screen({
    children,
    scroll = true,
    transparent = false,
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
              contentContainerClassName={`
                flex-grow
                px-6
                py-6
                ${className}
              `}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
        ) : (
            <View
                {...props}
                className={`
                  flex-1
                  px-6
                  py-6
                  ${className}
                `}
            >
              {children}
            </View>
        )}
      </SafeAreaView>
  );
}
