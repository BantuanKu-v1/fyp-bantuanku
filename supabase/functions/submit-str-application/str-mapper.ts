import {
  nullableBoolean,
  nullableNumber,
  nullableText,
  requiredText,
  requiredUuid,
} from "../_shared/validators.ts";
import { HttpError } from "../_shared/response.ts";

type DatabaseRow = Record<string, unknown>;

export type StrPreliminaryEligibilityStatus =
    | "potentially_eligible"
    | "potentially_ineligible"
    | "insufficient_information"
    | "manual_verification";

export interface StrPreliminaryEligibility {
  status: StrPreliminaryEligibilityStatus;
  criteriaVersion: number;
  assessedAt: string;
}

export interface StrSupportingDocument {
  documentId: string;
  requirementType: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number | null;
  issuedAt: string | null;
  expiresAt: string | null;
}

export interface StrSupportingDocumentInput {
  requirementType: string;
  document: DatabaseRow;
}

export interface StrApplicationPayload {
  externalApplicationId: string;
  applicantName: string;
  applicationYear: number;
  applicationData: {
    schemaVersion: 1;
    applicant: {
      fullName: string;
      identificationNo: string;
      dateOfBirth: string;
      gender: string | null;
      citizenship: string;
      maritalStatus: string | null;
    };
    contact: {
      mobilePhone: string | null;
      homePhone: string | null;
      email: string | null;
    };
    address: {
      addressLine1: string;
      addressLine2: string | null;
      postcode: string;
      city: string;
      stateTerritory: string;
      countryCode: string;
    };
    financial: {
      monthlyPersonalIncome: number | null;
      monthlyHouseholdIncome: number | null;
      incomeSource: string | null;
    };
    employment: {
      occupation: string | null;
      employmentStatus: string | null;
      isStudent: boolean | null;
      studyMode: string | null;
      institutionType: string | null;
    };
    household: {
      members: Array<{
        fullName: string;
        identificationNo: string | null;
        relationship: string;
        dateOfBirth: string | null;
        gender: string | null;
        citizenship: string | null;
        isDependent: boolean | null;
        employmentStatus: string | null;
        occupation: string | null;
        monthlyIncome: number | null;
        isStudent: boolean | null;
        studyMode: string | null;
        institutionType: string | null;
        isOku: boolean | null;
        okuRegistered: boolean | null;
      }>;
      informationComplete: true;
    };
    supportingDocuments?: StrSupportingDocument[];
    preliminaryEligibility?: StrPreliminaryEligibility;
  };
}

export interface StrMapperInput {
  applicationId: string;
  applicationYear: number;
  profile: DatabaseRow;
  address: DatabaseRow;
  financialProfile: DatabaseRow | null;
  householdMembers: DatabaseRow[];
  supportingDocuments?: StrSupportingDocumentInput[];
  preliminaryEligibility?: StrPreliminaryEligibility;
}

const MAX_SUPPORTING_DOCUMENTS = 100;

const PRELIMINARY_ELIGIBILITY_STATUSES:
    readonly StrPreliminaryEligibilityStatus[] = [
  "potentially_eligible",
  "potentially_ineligible",
  "insufficient_information",
  "manual_verification",
];

// Validate required supporting document metadata
function requireDocumentText(
    value: unknown,
    fieldName: string,
    maxLength: number,
): string {
  const text = nullableText(value);

  if (!text) {
    throw new HttpError(
        422,
        `Missing required supporting document field: ${fieldName}`,
    );
  }

  if (text.length > maxLength) {
    throw new HttpError(
        422,
        `Supporting document field ${fieldName} exceeds ${maxLength} characters.`,
    );
  }

  return text;
}

// File size must be a non-negative integer or null
function normalizeDocumentFileSize(
    value: unknown,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
      typeof value !== "number" &&
      typeof value !== "string"
  ) {
    throw new HttpError(
        422,
        "Invalid supporting document file size.",
    );
  }

  if (
      typeof value === "string" &&
      !/^\d+$/.test(value.trim())
  ) {
    throw new HttpError(
        422,
        "Invalid supporting document file size.",
    );
  }

  const fileSize = nullableNumber(value);

  if (
      fileSize === null ||
      !Number.isSafeInteger(fileSize) ||
      fileSize < 0
  ) {
    throw new HttpError(
        422,
        "Supporting document file size must be a non-negative integer.",
    );
  }

  return fileSize;
}

// Document dates must use the YYYY-MM-DD format
function normalizeDocumentDate(
    value: unknown,
    fieldName: string,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const date = nullableText(value);

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(
        422,
        `Invalid supporting document date: ${fieldName}`,
    );
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
      !Number.isFinite(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new HttpError(
        422,
        `Invalid supporting document date: ${fieldName}`,
    );
  }

  return date;
}

// Map application-specific supporting document metadata
// Private storage paths and original files are not transferred
function mapSupportingDocuments(
    documents: StrSupportingDocumentInput[],
): StrSupportingDocument[] {
  if (documents.length > MAX_SUPPORTING_DOCUMENTS) {
    throw new HttpError(
        422,
        `A maximum of ${MAX_SUPPORTING_DOCUMENTS} supporting documents is allowed.`,
    );
  }

  return documents.map(({ requirementType, document }) => ({
    documentId: requiredUuid(
        document.id,
        "supporting document ID",
    ),

    requirementType: requireDocumentText(
        requirementType,
        "requirement_type",
        100,
    ),

    documentType: requireDocumentText(
        document.document_type,
        "document_type",
        100,
    ),

    originalFilename: requireDocumentText(
        document.original_filename,
        "original_filename",
        255,
    ),

    mimeType: requireDocumentText(
        document.mime_type,
        "mime_type",
        100,
    ),

    fileSizeBytes: normalizeDocumentFileSize(
        document.file_size_bytes,
    ),

    issuedAt: normalizeDocumentDate(
        document.issued_at,
        "issued_at",
    ),

    expiresAt: normalizeDocumentDate(
        document.expires_at,
        "expires_at",
    ),
  }));
}

// Validate the preliminary assessment snapshot
// BantuanKu screening
function mapPreliminaryEligibility(
    assessment: StrPreliminaryEligibility,
): StrPreliminaryEligibility {
  if (
      !PRELIMINARY_ELIGIBILITY_STATUSES.includes(
          assessment.status,
      )
  ) {
    throw new HttpError(
        422,
        "Invalid STR preliminary eligibility status.",
    );
  }

  if (
      !Number.isSafeInteger(assessment.criteriaVersion) ||
      assessment.criteriaVersion <= 0
  ) {
    throw new HttpError(
        422,
        "STR eligibility criteria version must be a positive integer.",
    );
  }

  const assessedAt = nullableText(assessment.assessedAt);

  if (
      !assessedAt ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          assessedAt,
      )
  ) {
    throw new HttpError(
        422,
        "Invalid STR preliminary eligibility assessment date.",
    );
  }

  // Validate the calendar date before normalizing the timestamp
  normalizeDocumentDate(
      assessedAt.slice(0, 10),
      "assessedAt",
  );

  const parsedDate = new Date(assessedAt);

  if (!Number.isFinite(parsedDate.getTime())) {
    throw new HttpError(
        422,
        "Invalid STR preliminary eligibility assessment date.",
    );
  }

  // Normalize the assessment timestamp to UTC
  return {
    status: assessment.status,
    criteriaVersion: assessment.criteriaVersion,
    assessedAt: parsedDate.toISOString(),
  };
}

export function mapToStrApplication(
    input: StrMapperInput,
): StrApplicationPayload {
  const {
    applicationId,
    applicationYear,
    profile,
    address,
    financialProfile,
    householdMembers,
    supportingDocuments,
    preliminaryEligibility,
  } = input;

  const applicantName = requiredText(profile.full_name);

  const mappedSupportingDocuments = mapSupportingDocuments(
      supportingDocuments ?? [],
  );

  const mappedPreliminaryEligibility = preliminaryEligibility
      ? mapPreliminaryEligibility(preliminaryEligibility)
      : undefined;

  return {
    externalApplicationId: applicationId,
    applicantName,
    applicationYear,
    applicationData: {
      schemaVersion: 1,

      applicant: {
        fullName: applicantName,
        identificationNo: requiredText(profile.identification_no),
        dateOfBirth: requiredText(profile.date_of_birth),
        gender: nullableText(profile.gender),
        citizenship: requiredText(profile.citizenship),
        maritalStatus: nullableText(profile.marital_status),
      },

      contact: {
        mobilePhone: nullableText(profile.mobile_phone),
        homePhone: nullableText(profile.home_phone),
        email: nullableText(profile.email),
      },

      address: {
        addressLine1: requiredText(address.address_line_1),
        addressLine2: nullableText(address.address_line_2),
        postcode: requiredText(address.postcode),
        city: requiredText(address.city),
        stateTerritory: requiredText(address.state_territory),
        countryCode: requiredText(address.country_code),
      },

      financial: {
        monthlyPersonalIncome: nullableNumber(
            financialProfile?.monthly_personal_income,
        ),
        monthlyHouseholdIncome: nullableNumber(
            financialProfile?.monthly_household_income,
        ),
        incomeSource: nullableText(
            financialProfile?.income_source,
        ),
      },

      employment: {
        occupation: nullableText(profile.occupation),
        employmentStatus: nullableText(profile.employment_status),
        isStudent: nullableBoolean(profile.is_student),
        studyMode: nullableText(profile.study_mode),
        institutionType: nullableText(profile.institution_type),
      },

      household: {
        members: householdMembers.map((member) => ({
          fullName: requiredText(member.full_name),
          identificationNo: nullableText(member.identification_no),
          relationship: requiredText(member.relationship),
          dateOfBirth: nullableText(member.date_of_birth),
          gender: nullableText(member.gender),
          citizenship: nullableText(member.citizenship),
          isDependent: nullableBoolean(member.is_dependent),
          employmentStatus: nullableText(member.employment_status),
          occupation: nullableText(member.occupation),
          monthlyIncome: nullableNumber(member.monthly_income),
          isStudent: nullableBoolean(member.is_student),
          studyMode: nullableText(member.study_mode),
          institutionType: nullableText(member.institution_type),
          isOku: nullableBoolean(member.is_oku),
          okuRegistered: nullableBoolean(member.oku_registered),
        })),
        informationComplete: true,
      },

      supportingDocuments: mappedSupportingDocuments,

      ...(mappedPreliminaryEligibility
          ? {
            preliminaryEligibility: mappedPreliminaryEligibility,
          }
          : {}),
    },
  };
}
