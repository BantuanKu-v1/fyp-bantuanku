import { useEffect, useRef, useState } from "react";
import { NavigationAction,  usePreventRemove } from "@react-navigation/native";

type UseUnsavedChangesOptions = {
  navigation: {
    dispatch: (action: NavigationAction) => void;
    setOptions: (options: { gestureEnabled: boolean }) => void;
  };
  isDirty: boolean;
};

export default function useUnsavedChanges({
    navigation,
    isDirty
}: UseUnsavedChangesOptions) {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(false);

  const pendingNavigationAction = useRef<NavigationAction | null>(null);
  const pendingSaveNavigation = useRef<(() => void) | null>(null);

  usePreventRemove(
      isDirty && !allowNavigation,
      ({ data }) => {
        pendingNavigationAction.current = data.action;
        setShowDiscardDialog(true);
      }
  );

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    setAllowNavigation(true);
  };

  const handleKeepEditing = () => {
    pendingNavigationAction.current = null;
    setShowDiscardDialog(false);
  };

  // Allow navigation after successfully saving the form
  const navigateAfterSave = (action: () => void) => {
    pendingNavigationAction.current = null;
    pendingSaveNavigation.current = action;
    setAllowNavigation(true);
  };

  // Continue the original navigation after confirming discard
  useEffect(() => {
    if (allowNavigation && pendingNavigationAction.current) {
      const action = pendingNavigationAction.current;
      pendingNavigationAction.current = null;

      navigation.dispatch(action);
    }
  }, [allowNavigation, navigation]);

  // Navigate after saving once navigation is allowed
  useEffect(() => {
    if (allowNavigation && pendingSaveNavigation.current) {
      const action = pendingSaveNavigation.current;
      pendingSaveNavigation.current = null;

      action();
    }
  }, [allowNavigation]);

  // Disable swipe-back gestures when there are unsaved changes
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isDirty || allowNavigation
    });
  }, [navigation, isDirty, allowNavigation]);

  return {
    showDiscardDialog,
    allowNavigation,
    setAllowNavigation,
    navigateAfterSave,
    handleDiscard,
    handleKeepEditing
  };
}
