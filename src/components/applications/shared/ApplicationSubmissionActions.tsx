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
  saveDraft?: string;
};

export type ApplicationSubmissionActionsProps = {
  mode: ApplicationSubmissionActionMode;
  labels: ApplicationSubmissionActionLabels;

  canSubmit: boolean;
  canSave?: boolean;

  submitting?: boolean;
  refreshing?: boolean;
  saving?: boolean;

  onSubmit: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onSaveDraft?: () => void | Promise<void>;

  className?: string;
};

export default function ApplicationSubmissionActions({
    mode,
    labels,
    canSubmit,
    canSave = false,
    submitting = false,
    refreshing = false,
    saving = false,
    onSubmit,
    onRefresh,
    onSaveDraft,
    className = ""
}: ApplicationSubmissionActionsProps) {
  const isSubmitted = mode === "submitted";

  const isBusy = submitting || refreshing || saving;
  const showSaveDraft = mode === "submit" && !!onSaveDraft && !!labels.saveDraft;
  const submissionDisabled = isSubmitted || !canSubmit || isBusy;
  const saveDisabled = !showSaveDraft || !canSave || isBusy;

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

    void onSubmit();
  };

  const handleRefresh = () => {
    if (isBusy) {
      return;
    }

    void onRefresh();
  };

  const handleSaveDraft = () => {
    if (saveDisabled || !onSaveDraft) {
      return;
    }

    void onSaveDraft();
  };

  return (
      <View className={`w-full gap-3 ${className}`}>
        {showSaveDraft && (
            <Button
                variant="outline"
                size="lg"
                fullWidth
                loading={saving}
                disabled={saveDisabled}
                onPress={handleSaveDraft}
            >
              {labels.saveDraft ?? ""}
            </Button>
        )}

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
