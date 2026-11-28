export const DOCUMENT_TYPES = [
  "identity_document",
  "birth_certificate",
  "marriage_certificate",
  "divorce_certificate",
  "spouse_death_certificate",
  "adoption_certificate",
  "income_proof",
  "income_declaration",
  "bank_account_proof",
  "utility_bill",
  "oku_registration",
  "medical_confirmation",
  "medical_recommendation",
  "medical_referral",
  "equipment_quotation",
  "medical_cost_document",
  "other",
] as const;

export const DOCUMENT_BUCKET = "user-documents";
export const MAXIMUM_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_DOCUMENT_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
] as const;
