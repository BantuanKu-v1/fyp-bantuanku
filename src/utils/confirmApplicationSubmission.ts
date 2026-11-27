import { Alert } from "react-native";

interface ConfirmApplicationSubmissionOptions {
  canSubmit: boolean;
  requiresRecovery: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onSubmit: () => void | Promise<void>;
}

export function confirmApplicationSubmission({
    canSubmit,
    requiresRecovery,
    title,
    description,
    cancelLabel,
    confirmLabel,
    onSubmit
}: ConfirmApplicationSubmissionOptions): void {
  if (!canSubmit) {
    return;
  }

  if (requiresRecovery) {
    void onSubmit();
    return;
  }

  Alert.alert(
      title,
      description,
      [
        {
          text: cancelLabel,
          style: "cancel",
        },
        {
          text: confirmLabel,
          onPress: () => {
            void onSubmit();
          },
        },
      ],
  );
}
