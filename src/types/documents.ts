import { DOCUMENT_TYPES } from "../constants/profile/documents.ts";

export type DocumentType = typeof DOCUMENT_TYPES[number];

export type SelectedDocument = {
  localId: string;
  documentType: DocumentType;
  name: string;
  uri: string;
  mimeType: string;
  size: number | null;
};

export type RegistrationDocumentSection = {
  type: DocumentType;
  titleKey: string;
  descriptionKey: string;
  multiple: boolean;
  maxFiles?: number;
};
