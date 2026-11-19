import { RegistrationDocumentSection, SelectedDocument } from "../../../types/documents";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { ALLOWED_DOCUMENT_MIME_TYPES, MAXIMUM_DOCUMENT_FILE_SIZE } from "../../../constants/documents";
import { Pressable, Text, View } from "react-native";
import { REGISTRATION_DOCUMENT_SECTIONS } from "../../../constants/registration";
import { FileText, Plus, RefreshCw, Trash2, Upload } from "lucide-react-native";

import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import AlertDialog from "../../../components/ui/AlertDialog";

type RegisterDocumentsStepProps = {
  documents: SelectedDocument[];
  onChange: (documents: SelectedDocument[]) => void;
  onBack: () => void;
  onComplete: () => void;
};

const createLocalId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const formatFileSize = (
    bytes: number | null
)=> {
  if (bytes === null) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(
      bytes /
      (1024 * 1024)
  ).toFixed(1)} MB`;
};

export default function RegisterDocumentsStep({
  documents,
  onChange,
  onBack,
  onComplete
}: RegisterDocumentsStepProps) {
  const { t } = useTranslation();

  const [documentError, setDocumentError] = useState<string | null>(null);

  const pickDocument = async (
      section: RegistrationDocumentSection,
      replaceLocalId?: string
  )=> {
    if (
        !replaceLocalId &&
        section.maxFiles !== undefined &&
        documents.filter(
            (document) =>
                document.documentType === section.type
        ).length >= section.maxFiles
    ) {
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/jpeg",
          "image/png"
        ],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        return;
      }

      // Validate MIME type again even though the native document picker has already been restricted
      if (
          !asset.mimeType ||
          !ALLOWED_DOCUMENT_MIME_TYPES.includes(
              asset.mimeType as typeof ALLOWED_DOCUMENT_MIME_TYPES[number]
          )
      ) {
        setDocumentError(t("auth.register.documents.error.invalidFileType"));

        return;
      }

      // Expo may not always provide the file size, so size validation is performed only when the value is available
      if (
          asset.size !== undefined &&
          asset.size > MAXIMUM_DOCUMENT_FILE_SIZE
      ) {
        setDocumentError(t("auth.register.documents.error.fileTooLarge"));

        return;
      }

      const selectedDocument: SelectedDocument = {
        localId: replaceLocalId ?? createLocalId(),
        documentType: section.type,
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.size ?? null,
      };

      // Replace a specific selected document
      // E.g., D1 -> September.pdf, D2 -> October.pdf
      // Replacing D1 only changes D1
      if (replaceLocalId) {
        onChange(
            documents.map((document) =>
                document.localId === replaceLocalId
                    ? selectedDocument
                    : document
            )
        );

        return;
      }

      // A single-document section behaves as one slot during registration
      // If a document already exists for the section, selecting another file replaces that local selection instead
      // of adding a duplicate
      if (!section.multiple) {
        const existingDocument =
            documents.find(
                (document) =>
                    document.documentType === section.type
            );

        if (existingDocument) {
          onChange(
              documents.map((document) =>
                  document.localId === existingDocument.localId
                      ? {
                        ...selectedDocument,
                        localId: existingDocument.localId
                      }
                      : document
              )
          );

          return;
        }
      }

      // Add a new local document - Nothing is uploaded to db at this stage
      onChange([
        ...documents,
        selectedDocument
      ]);
    } catch (error) {
      if (__DEV__) {
        console.error(
            "[REGISTRATION] Failed to select document:", error
        );
      }

      setDocumentError(t("auth.register.documents.error.selectionFailed"));
    }
  };

  const removeDocument = (
      localId: string
  ) => {
    onChange(
        documents.filter(
            (document) => document.localId !== localId
        )
    );
  };

  return (
      <View>
        <View className="mb-8">

          <Text className="text-3xl font-bold text-foreground">
            {t("auth.register.documents.title")}
          </Text>

          <Text className="mt-2 text-base leading-6 text-muted-foreground">
            {t("auth.register.documents.subTitle")}
          </Text>

          <Text className="mt-2 text-sm leading-5 text-muted-foreground">
            {t("auth.register.documents.optional")}
          </Text>
        </View>

        <Card>
          {REGISTRATION_DOCUMENT_SECTIONS.map(
              (section, index) => {
                const sectionDocuments =
                    documents.filter(
                        (document) =>
                            document.documentType === section.type
                    );

                const hasDocuments = sectionDocuments.length > 0;

                const canAddAnotherFile =
                    section.multiple &&
                    (
                        section.maxFiles === undefined ||
                        sectionDocuments.length < section.maxFiles
                    );

                return (
                    <View
                        key={section.type}
                        className={
                          index !== REGISTRATION_DOCUMENT_SECTIONS.length - 1
                              ? "border-b border-border pb-4 mb-4"
                              : ""
                        }
                    >
                      <View className="flex-row items-center">
                        <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <FileText
                              size={20}
                              color="#626775"
                          />
                        </View>

                        <View className="flex-1 pr-3">
                          <Text className="text-sm font-semibold text-foreground">
                            {t(section.titleKey)}
                          </Text>

                          <Text
                              className="mt-1 text-xs leading-4 text-muted-foreground"
                              numberOfLines={2}
                          >
                            {t(section.descriptionKey)}
                          </Text>
                        </View>

                        {!hasDocuments && (
                            <Pressable
                                onPress={() =>
                                    void pickDocument(section)
                                }
                                accessibilityRole="button"
                                hitSlop={8}
                                className="min-h-9 flex-row items-center justify-center rounded-lg bg-primary/10 px-3"
                            >
                              <Upload
                                  size={16}
                                  color="#0352CE"
                              />

                              <Text className="ml-1.5 text-xs font-semibold text-primary">
                                {t("auth.register.documents.upload")}
                              </Text>
                            </Pressable>
                        )}
                      </View>

                      {sectionDocuments.length > 0 && (
                          <View className="mt-3 gap-2">
                            {sectionDocuments.map(
                                (document) => {
                                  const fileSize = formatFileSize(document.size);

                                  return (
                                      <View
                                          key={document.localId}
                                          className="flex-row items-center rounded-lg bg-muted px-3 py-2"
                                      >
                                        <View className="flex-1">
                                          <Text
                                              className="text-sm font-medium text-foreground"
                                              numberOfLines={1}
                                          >
                                            {document.name}
                                          </Text>

                                          {fileSize && (
                                              <Text className="mt-0.5 text-xs text-muted-foreground">
                                                {fileSize}
                                              </Text>
                                          )}
                                        </View>

                                        <Pressable
                                            onPress={() =>
                                                void pickDocument(
                                                    section,
                                                    document.localId
                                                )
                                            }
                                            accessibilityRole="button"
                                            hitSlop={8}
                                            className="ml-3 min-h-8 flex-row items-center justify-center rounded-lg
                                            border border-primary/20 bg-background px-2.5"
                                        >
                                          <RefreshCw size={14} color="#0352CE" />

                                          <Text className="ml-1.5 text-xs font-semibold text-primary">
                                            {t("auth.register.documents.replace")}
                                          </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() =>
                                                removeDocument(document.localId)
                                            }
                                            accessibilityRole="button"
                                            accessibilityLabel={t("common.remove")}
                                            hitSlop={8}
                                            className="ml-3 h-8 w-8 items-center justify-center rounded-lg bg-accent-red/10"
                                        >
                                          <Trash2
                                              size={15}
                                              color="#F5222D"
                                          />
                                        </Pressable>
                                      </View>
                                  );
                                }
                            )}

                            {canAddAnotherFile && (
                                <Pressable
                                    onPress={() =>
                                        void pickDocument(section)
                                    }
                                    accessibilityRole="button"
                                    className="flex-row items-center self-start py-1"
                                >
                                  <Plus
                                      size={16}
                                      color="#0352CE"
                                  />

                                  <Text className="ml-1 text-xs font-semibold text-primary">
                                    {t("auth.register.documents.addAnother")}
                                  </Text>
                                </Pressable>
                            )}

                            {section.multiple && section.maxFiles !== undefined && (
                                <Text className="text-xs text-muted-foreground">
                                  {sectionDocuments.length} / {section.maxFiles}
                                </Text>
                            )}
                          </View>
                      )}
                    </View>
                );
              }
          )}
        </Card>

        <Text className="mt-3 text-center text-xs leading-5 text-muted-foreground">
          {t("auth.register.documents.fileRequirements")}
        </Text>

        <View className="mt-6 flex-row gap-3">
          <Pressable
              onPress={onBack}
              accessibilityRole="button"
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-border bg-background"
          >
            <Text className="font-semibold text-foreground">
              {t("common.back")}
            </Text>
          </Pressable>

          <View className="flex-1">
            <Button
                fullWidth
                onPress={onComplete}
            >
              {t("common.complete")}
            </Button>
          </View>
        </View>

        <AlertDialog
            visible={documentError !== null}
            variant="error"
            title={t("auth.register.documents.error.title")}
            message={documentError ?? undefined}
            confirmText={t("common.ok")}
            onConfirm={() => setDocumentError(null)}
            onDismiss={() => setDocumentError(null)}
        />
      </View>
  );
}
