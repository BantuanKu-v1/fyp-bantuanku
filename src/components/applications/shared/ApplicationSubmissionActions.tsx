import { View } from "react-native";

import Button from "../../ui/Button.tsx";

export type ApplicationSubmissionActionMode =
    | "submit"
    | "recover"
    | "submitted";

export type ApplicationSubmissionActionLabels = {
  submit: string;
  recover: string;
  alreadySubmitted: string;
  refresh: string;
};

export type ApplicationSubmissionActionsProps = {
  mode: ApplicationSubmissionActionMode;
  labels: ApplicationSubmissionActionLabels;
  canSubmit: boolean;
  submitting?: boolean;
  refreshing?: boolean;
  onSubmit: () => void;
  onRefresh: () => void;
  className?: string;
};

export default function ApplicationSubmissionActions({
    mode,
    labels,
    canSubmit,
    submitting = false,
    refreshing = false,
    onSubmit,
    onRefresh,
    className = ""
}: ApplicationSubmissionActionsProps) {
  const isSubmitted = mode === "submitted";

  const isBusy = submitting || refreshing;

  const submissionDisabled =
      isSubmitted ||
      !canSubmit ||
      isBusy;

  const submissionLabel =
      mode === "submitted"
          ? labels.alreadySubmitted
          : mode === "recover"
              ? labels.recover
              : labels.submit;

  const handleSubmit = () => {
    if (submissionDisabled) {
      return;
    }

    onSubmit();
  };

  const handleRefresh = () => {
    if (isBusy) {
      return;
    }

    onRefresh();
  };

  return (
      <View className={`w-full gap-3 ${className}`}>
        <Button
            variant={isSubmitted ? "secondary" : "primary"}
            size="lg"
            fullWidth
            loading={submitting}
            disabled={submissionDisabled}
            onPress={handleSubmit}
        >
          {submissionLabel}
        </Button>

        <Button
            variant="outline"
            size="lg"
            fullWidth
            loading={refreshing}
            disabled={isBusy}
            onPress={handleRefresh}
        >
          {labels.refresh}
        </Button>
      </View>
  );
}
