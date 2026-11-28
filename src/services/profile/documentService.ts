import { SelectedDocument } from "../../types/documents.ts";
import { supabase } from "../../lib/supabase.ts";
import { DOCUMENT_BUCKET } from "../../constants/profile/documents.ts";
import * as Crypto from "expo-crypto";

const getFileExtension = (
    filename: string
) => {
  const extension =
      filename
          .split(".")
          .pop()
          ?.toLowerCase();

  if (!extension || extension === filename.toLowerCase()) {
    return null;
  }

  return extension;
};

const createStoragePath = (
    userId: string,
    document: SelectedDocument
)=> {
  const extension = getFileExtension(document.name);

  if (!extension) {
    throw new Error(
        `Unable to determine file extension for ${document.name}.`
    );
  }

  const fileId = Crypto.randomUUID();

  return `${userId}/${document.documentType}/${fileId}.${extension}`;
};

const getFileBody = async (
    uri: string
) => {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(
        "Unable to read the selected document."
    );
  }

  return await response.arrayBuffer();
};

export const uploadRegistrationDocument = async (
    profileId: string,
    document: SelectedDocument
) => {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    if (__DEV__) {
      console.error(
          "[DOCUMENT] Failed to get authenticated user:", userError
      );
    }

    throw userError;
  }

  if (!user) {
    throw new Error(
        "An authenticated user is required to upload documents."
    );
  }

  const storagePath = createStoragePath(user.id, document);
  const fileBody = await getFileBody(document.uri);

  const {
    error: uploadError
  } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(
          storagePath,
          fileBody, {
            contentType: document.mimeType,
            upsert: false
          }
      );

  if (uploadError) {
    if (__DEV__) {
      console.error(
          "[DOCUMENT] Storage upload failed:", uploadError
      );
    }

    throw uploadError;
  }

  const {
    data: documentRecord,
    error: documentError
  } = await supabase
      .from("documents")
      .insert({
        profile_id: profileId,
        document_type: document.documentType,
        original_filename: document.name,
        storage_path: storagePath,
        mime_type: document.mimeType,
        file_size_bytes: document.size,
      })
      .select()
      .single();

  if (documentError) {
    if (__DEV__) {
      console.error(
          "[DOCUMENT] Document record creation failed:", documentError
      );
    }

    // The Storage upload succeeded but the database insert failed, so remove the uploaded object to avoid leaving
    // an orphan file
    const {
      error: cleanUpError
    } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .remove([storagePath]);

    if (cleanUpError && __DEV__) {
      console.error(
          "[DOCUMENT] Failed to clean up uploaded document:", cleanUpError
      );
    }

    throw documentError;
  }

  return documentRecord;
};

export const uploadRegistrationDocuments = async (
    profileId: string,
    documents: SelectedDocument[]
) => {
  const uploadedDocuments = [];
  const failedDocuments: SelectedDocument[] = [];

  for (const document of documents) {
    try {
      const uploadedDocument = await uploadRegistrationDocument(profileId, document);

      uploadedDocuments.push(uploadedDocument);
    } catch (error) {
      if (__DEV__) {
        console.error(
            `[DOCUMENT] Failed to upload ${document.name}`, error
        );
      }

      failedDocuments.push(document);
    }
  }

  return { uploadedDocuments, failedDocuments };
};
