import { View } from "react-native";
import { useTranslation } from "react-i18next";

import Button from "../../ui/Button";

import { confirmApplicationSubmission } from "../../../utils/confirmApplicationSubmission";

import type { ApplicationSubmissionActionMode } from "../../../utils/applicationUtils";
import type { ExternalApplicationProvider } from "../../../types/applications";

export type { ApplicationSubmissionActionMode } from "../../../utils/applicationUtils";

export type ApplicationSubmissionActionsProps = {
  provider: ExternalApplicationProvider;
  mode: ApplicationSubmissionActionMode;

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
    provider,
    mode,
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
  const { t } = useTranslation();

  const isSubmitted = mode === "submitted";
  const requiresRecovery = mode === "recover";

  const isBusy = submitting || refreshing || saving;

  const showSaveDraft =
      provider === "jkm" &&
      mode === "submit" &&
      !!onSaveDraft;

  const submissionDisabled =
      isSubmitted || !canSubmit || isBusy;

  const saveDisabled =
      !showSaveDraft || !canSave || isBusy;

  const recoveryLabel =
      provider === "jkm"
          ? t("applications.jkm.buttons.checkSubmission")
          : t("applications.buttons.retrieveConfirmation", {
            defaultValue: "Retrieve Submission Confirmation"
          });

  const submissionLabel =
      isSubmitted
          ? t(`applications.${provider}.buttons.alreadySubmitted`)
          : requiresRecovery
              ? recoveryLabel
              : t(`applications.${provider}.buttons.submit`);

  const handleSubmit = () => {
    if (submissionDisabled) {
      return;
    }

    confirmApplicationSubmission({
      canSubmit: !submissionDisabled,
      requiresRecovery,
      title: t(`applications.${provider}.messages.confirmTitle`),
      description: t(`applications.${provider}.messages.confirmDescription`),
      cancelLabel:
          provider === "jkm"
              ? t("common.cancel")
              : t("applications.str.buttons.cancel"),
      confirmLabel: t(`applications.${provider}.buttons.confirm`),
      onSubmit,
    });
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
              {t("applications.jkm.buttons.saveDraft")}
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
          {t(`applications.${provider}.buttons.refresh`)}
        </Button>
      </View>
  );
}
