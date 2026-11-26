import { HttpError } from "../../_shared/response.ts";
import {
  nullableText,
  nullableBoolean,
  requiredUuid,
} from "../../_shared/validators.ts";

import type {
  JkmProgramCode,
  JkmApplicantData,
  JkmContactData,
  JkmAddressData,
  JkmEmploymentData,
  JkmFinancialData,
  JkmHouseholdData,
  JkmHouseholdMemberData,
  JkmHealthData,
  JkmLivingArrangementData,
  JkmCaregiverData,
  JkmWelfareAssistanceData,
  JkmSupportingDocument,
  JkmPreliminaryEligibility,
  JkmPreliminaryEligibilityStatus,
  JkmCommonApplicationData,
} from "../jkm-types.ts";

// Common mapper input
export type JkmSourceRecord = Record<string, unknown>;

export interface JkmCommonMapperInput {
  profile: JkmSourceRecord;
  address: JkmSourceRecord | null;
  financialProfile: JkmSourceRecord | null;

  householdMembers: JkmSourceRecord[];
  householdMembersComplete: boolean | null;

  healthProfile: JkmSourceRecord | null;
  livingArrangement: JkmSourceRecord | null;

  caregivers: JkmSourceRecord[];
  welfareAssistance: JkmSourceRecord[];

  supportingDocuments?: JkmSourceRecord[];
  preliminaryEligibility?: unknown;
}

// Select optional sections relevant to each program
export interface JkmCommonMapperOptions {
  includeEmployment?: boolean;
  includeHousehold?: boolean;
  includeHealth?: boolean;
  includeLivingArrangement?: boolean;
  includeCaregivers?: boolean;
  includeWelfareAssistance?: boolean;
}

// Preliminary eligibility statuses
const PRELIMINARY_ELIGIBILITY_STATUSES:
    readonly JkmPreliminaryEligibilityStatus[] = [
  "potentially_eligible",
  "potentially_ineligible",
  "insufficient_information",
  "manual_verification",
];

// Validation helpers
export function isRecord(
    value: unknown
): value is JkmSourceRecord {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

export function mapNullableText(
    value: unknown,
    fieldName: string,
    maxLength: number
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(422, `Invalid ${fieldName}`);
  }

  const text = nullableText(value);

  if (text !== null && text.length > maxLength) {
    throw new HttpError(
        422,
        `${fieldName} must not exceed ${maxLength} characters`
    );
  }

  return text;
}

export function mapRequiredText(
    value: unknown,
    fieldName: string,
    maxLength: number
): string {
  const text = mapNullableText(
      value,
      fieldName,
      maxLength
  );

  if (text === null) {
    throw new HttpError(
        422,
        `${fieldName} is required`
    );
  }

  return text;
}

export function mapNullableBoolean(
    value: unknown,
    fieldName: string
): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  const result = nullableBoolean(value);

  if (result === null) {
    throw new HttpError(422, `Invalid ${fieldName}`);
  }

  return result;
}

export function mapNullableNumber(
    value: unknown,
    fieldName: string
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
      typeof value === "string" &&
      value.trim() === ""
  ) {
    return null;
  }

  if (
      typeof value !== "number" &&
      typeof value !== "string"
  ) {
    throw new HttpError(422, `Invalid ${fieldName}`);
  }

  if (
      typeof value === "string" &&
      !/^\d+(?:\.\d+)?$/.test(value.trim())
  ) {
    throw new HttpError(422, `Invalid ${fieldName}`);
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new HttpError(
        422,
        `${fieldName} must be a non-negative number`
    );
  }

  return number;
}

export function mapNullableInteger(
    value: unknown,
    fieldName: string
): number | null {
  const number = mapNullableNumber(
      value,
      fieldName
  );

  if (
      number !== null &&
      !Number.isSafeInteger(number)
  ) {
    throw new HttpError(
        422,
        `${fieldName} must be a valid integer`
    );
  }

  return number;
}

export function mapNullableDate(
    value: unknown,
    fieldName: string
): string | null {
  const text = mapNullableText(
      value,
      fieldName,
      10
  );

  if (text === null) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new HttpError(
        422,
        `${fieldName} must use YYYY-MM-DD format`
    );
  }

  const date = new Date(`${text}T00:00:00.000Z`);

  if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== text
  ) {
    throw new HttpError(422, `Invalid ${fieldName}`);
  }

  return text;
}

export function mapRequiredDate(
    value: unknown,
    fieldName: string
): string {
  const date = mapNullableDate(
      value,
      fieldName
  );

  if (date === null) {
    throw new HttpError(
        422,
        `${fieldName} is required`
    );
  }

  return date;
}

export function mapRequiredDateTime(
    value: unknown,
    fieldName: string
): string {
  const text = mapRequiredText(
      value,
      fieldName,
      50
  );

  const match =
      /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/
          .exec(text);

  if (!match) {
    throw new HttpError(422, `Invalid ${fieldName}`);
  }

  mapRequiredDate(match[1], fieldName);

  const date = new Date(text);

  if (!Number.isFinite(date.getTime())) {
    throw new HttpError(422, `Invalid ${fieldName}`);
  }

  return date.toISOString();
}

export function mapNullableIdentificationNo(
    value: unknown,
    fieldName: string
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(422, `Invalid ${fieldName}`);
  }

  const text = nullableText(value);

  if (text === null) {
    return null;
  }

  // Normalize formatted Malaysian identification numbers
  // Preserve other identification formats
  const normalized =
      /^\d{6}-\d{2}-\d{4}$/.test(text)
          ? text.replace(/-/g, "")
          : text;

  if (normalized.length > 12) {
    throw new HttpError(
        422,
        `${fieldName} must not exceed 12 characters`
    );
  }

  return normalized;
}

export function mapRequiredIdentificationNo(
    value: unknown,
    fieldName: string
): string {
  const identificationNo =
      mapNullableIdentificationNo(
          value,
          fieldName
      );

  if (identificationNo === null) {
    throw new HttpError(
        422,
        `${fieldName} is required`
    );
  }

  return identificationNo;
}

export function mapNullableCitizenship(
    value: unknown,
    fieldName: string
): string | null {
  const citizenship = mapNullableText(
      value,
      fieldName,
      50
  );

  if (citizenship === null) {
    return null;
  }

  switch (citizenship.toLowerCase()) {
    case "malaysian":
      return "Malaysian";

    case "non_malaysian":
    case "non-malaysian":
    case "non malaysian":
      return "Non-Malaysian";

    default:
      throw new HttpError(
          422,
          `Invalid ${fieldName}`
      );
  }
}

export function mapRequiredCitizenship(
    value: unknown,
    fieldName: string
): string {
  const citizenship = mapNullableCitizenship(
      value,
      fieldName
  );

  if (citizenship === null) {
    throw new HttpError(
        422,
        `${fieldName} is required`
    );
  }

  return citizenship;
}

export function validateArrayLength(
    records: readonly unknown[],
    fieldName: string,
    maxLength = 100
): void {
  if (records.length > maxLength) {
    throw new HttpError(
        422,
        `${fieldName} must not exceed ${maxLength} records`
    );
  }
}

// Applicant information
export function mapApplicant(
    profile: JkmSourceRecord
): JkmApplicantData {
  return {
    fullName: mapRequiredText(
        profile.full_name,
        "Applicant full name",
        150
    ),

    identificationNo: mapRequiredIdentificationNo(
        profile.identification_no,
        "Applicant identification number"
    ),

    dateOfBirth: mapRequiredDate(
        profile.date_of_birth,
        "Applicant date of birth"
    ),

    gender: mapNullableText(
        profile.gender,
        "Applicant gender",
        30
    ),

    citizenship: mapRequiredCitizenship(
        profile.citizenship,
        "Applicant citizenship"
    ),

    maritalStatus: mapNullableText(
        profile.marital_status,
        "Applicant marital status",
        50
    ),
  };
}

// Contact information
export function mapContact(
    profile: JkmSourceRecord
): JkmContactData {
  const email = mapNullableText(
      profile.email,
      "Applicant email",
      254
  );

  if (
      email !== null &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new HttpError(
        422,
        "Invalid applicant email"
    );
  }

  return {
    mobilePhone: mapNullableText(
        profile.mobile_phone,
        "Applicant mobile phone",
        30
    ),

    homePhone: mapNullableText(
        profile.home_phone,
        "Applicant home phone",
        30
    ),

    email,
  };
}

// Residential address
export function mapAddress(
    address: JkmSourceRecord | null
): JkmAddressData {
  if (address === null) {
    throw new HttpError(
        422,
        "Primary residential address is required"
    );
  }

  const rawCountryCode = mapRequiredText(
      address.country_code,
      "Residential country code",
      20
  );

  const countryCode =
      rawCountryCode.toUpperCase() === "MALAYSIA"
          ? "MY"
          : rawCountryCode.toUpperCase();

  if (
      !/^[A-Z]{2}$/.test(countryCode) ||
      ["XX", "ZZ"].includes(countryCode)
  ) {
    throw new HttpError(
        422,
        "Invalid residential country code"
    );
  }

  return {
    addressLine1: mapRequiredText(
        address.address_line_1,
        "Residential address line 1",
        255
    ),

    addressLine2: mapNullableText(
        address.address_line_2,
        "Residential address line 2",
        255
    ),

    postcode: mapRequiredText(
        address.postcode,
        "Residential postcode",
        20
    ),

    city: mapRequiredText(
        address.city,
        "Residential city",
        100
    ),

    stateTerritory: mapRequiredText(
        address.state_territory,
        "Residential state or territory",
        100
    ),

    countryCode,
  };
}

// Employment information
export function mapEmployment(
    profile: JkmSourceRecord
): JkmEmploymentData {
  return {
    occupation: mapNullableText(
        profile.occupation,
        "Applicant occupation",
        150
    ),

    employmentStatus: mapNullableText(
        profile.employment_status,
        "Applicant employment status",
        50
    ),

    isStudent: mapNullableBoolean(
        profile.is_student,
        "Applicant student status"
    ),

    studyMode: mapNullableText(
        profile.study_mode,
        "Applicant study mode",
        50
    ),

    institutionType: mapNullableText(
        profile.institution_type,
        "Applicant institution type",
        100
    ),
  };
}

// Financial information
export function mapFinancial(
    financialProfile: JkmSourceRecord | null
): JkmFinancialData {
  return {
    monthlyPersonalIncome: mapNullableNumber(
        financialProfile?.monthly_personal_income,
        "Monthly personal income"
    ),

    monthlyHouseholdIncome: mapNullableNumber(
        financialProfile?.monthly_household_income,
        "Monthly household income"
    ),

    incomeSource: mapNullableText(
        financialProfile?.income_source,
        "Income source",
        100
    ),
  };
}

// Household information
export function mapHouseholdMember(
    member: JkmSourceRecord
): JkmHouseholdMemberData {
  return {
    fullName: mapRequiredText(
        member.full_name,
        "Household member full name",
        150
    ),

    identificationNo: mapNullableIdentificationNo(
        member.identification_no,
        "Household member identification number"
    ),

    relationship: mapRequiredText(
        member.relationship,
        "Household member relationship",
        50
    ),

    dateOfBirth: mapNullableDate(
        member.date_of_birth,
        "Household member date of birth"
    ),

    gender: mapNullableText(
        member.gender,
        "Household member gender",
        30
    ),

    citizenship: mapNullableCitizenship(
        member.citizenship,
        "Household member citizenship"
    ),

    isDependent: mapNullableBoolean(
        member.is_dependent,
        "Household member dependent status"
    ),

    employmentStatus: mapNullableText(
        member.employment_status,
        "Household member employment status",
        50
    ),

    occupation: mapNullableText(
        member.occupation,
        "Household member occupation",
        150
    ),

    monthlyIncome: mapNullableNumber(
        member.monthly_income,
        "Household member monthly income"
    ),

    isStudent: mapNullableBoolean(
        member.is_student,
        "Household member student status"
    ),

    studyMode: mapNullableText(
        member.study_mode,
        "Household member study mode",
        50
    ),

    institutionType: mapNullableText(
        member.institution_type,
        "Household member institution type",
        100
    ),

    isOku: mapNullableBoolean(
        member.is_oku,
        "Household member OKU status"
    ),

    okuRegistered: mapNullableBoolean(
        member.oku_registered,
        "Household member OKU registration"
    ),
  };
}

export function mapHousehold(
    members: JkmSourceRecord[]
): JkmHouseholdData {
  validateArrayLength(
      members,
      "Household members"
  );

  return {
    members: members.map(mapHouseholdMember),
  };
}

export function requireCompleteHousehold(
    input: JkmCommonMapperInput
): void {
  if (input.householdMembersComplete !== true) {
    throw new HttpError(
        422,
        "Please complete your household information before submitting the application"
    );
  }
}

// Applicant health information
export function mapHealth(
    healthProfile: JkmSourceRecord | null
): JkmHealthData {
  return {
    isOku: mapNullableBoolean(
        healthProfile?.is_oku,
        "OKU status"
    ),

    okuRegistered: mapNullableBoolean(
        healthProfile?.oku_registered,
        "OKU registration status"
    ),

    disabilityDescription: mapNullableText(
        healthProfile?.disability_description,
        "Disability description",
        2000
    ),

    hasChronicIllness: mapNullableBoolean(
        healthProfile?.has_chronic_illness,
        "Chronic illness status"
    ),

    chronicIllnessDetails: mapNullableText(
        healthProfile?.chronic_illness_details,
        "Chronic illness details",
        2000
    ),

    isBedridden: mapNullableBoolean(
        healthProfile?.is_bedridden,
        "Bedridden status"
    ),

    requiresContinuousTreatment: mapNullableBoolean(
        healthProfile?.requires_continuous_treatment,
        "Continuous treatment requirement"
    ),

    treatmentStartDate: mapNullableDate(
        healthProfile?.treatment_start_date,
        "Treatment start date"
    ),
  };
}

// Living arrangement information
export function mapLivingArrangement(
    livingArrangement: JkmSourceRecord | null
): JkmLivingArrangementData {
  return {
    arrangementType: mapNullableText(
        livingArrangement?.arrangement_type,
        "Living arrangement type",
        100
    ),

    livesWithFamily: mapNullableBoolean(
        livingArrangement?.lives_with_family,
        "Lives with family"
    ),

    dependsOnFamily: mapNullableBoolean(
        livingArrangement?.depends_on_family,
        "Depends on family"
    ),

    dependsOnCaregiver: mapNullableBoolean(
        livingArrangement?.depends_on_caregiver,
        "Depends on caregiver"
    ),

    isInInstitution: mapNullableBoolean(
        livingArrangement?.is_in_institution,
        "Institution residence status"
    ),

    institutionName: mapNullableText(
        livingArrangement?.institution_name,
        "Institution name",
        200
    ),

    institutionType: mapNullableText(
        livingArrangement?.institution_type,
        "Institution type",
        100
    ),

    receivesFreeServices: mapNullableBoolean(
        livingArrangement?.receives_free_services,
        "Receives free services"
    ),

    receivesRationGrant: mapNullableBoolean(
        livingArrangement?.receives_ration_grant,
        "Receives ration grant"
    ),
  };
}

// Caregiver information
export function mapCaregiver(
    caregiver: JkmSourceRecord
): JkmCaregiverData {
  return {
    fullName: mapRequiredText(
        caregiver.full_name,
        "Caregiver full name",
        150
    ),

    identificationNo: mapNullableIdentificationNo(
        caregiver.identification_no,
        "Caregiver identification number"
    ),

    citizenship: mapNullableCitizenship(
        caregiver.citizenship,
        "Caregiver citizenship"
    ),

    relationship: mapNullableText(
        caregiver.relationship,
        "Caregiver relationship",
        50
    ),

    providesIntensiveCare: mapNullableBoolean(
        caregiver.provides_intensive_care,
        "Caregiver intensive care status"
    ),

    eligiblePersonsCaredFor: mapNullableInteger(
        caregiver.eligible_persons_cared_for,
        "Eligible persons cared for"
    ),
  };
}

export function mapCaregivers(
    caregivers: JkmSourceRecord[]
): JkmCaregiverData[] {
  validateArrayLength(
      caregivers,
      "Caregivers"
  );

  return caregivers.map(mapCaregiver);
}

// Existing welfare assistance
export function mapWelfareAssistanceRecord(
    assistance: JkmSourceRecord
): JkmWelfareAssistanceData {
  return {
    programName: mapRequiredText(
        assistance.program_name,
        "Welfare assistance programme name",
        200
    ),

    agency: mapNullableText(
        assistance.agency,
        "Welfare assistance agency",
        150
    ),

    assistanceType: mapNullableText(
        assistance.assistance_type,
        "Welfare assistance type",
        100
    ),

    monthlyAmount: mapNullableNumber(
        assistance.monthly_amount,
        "Welfare assistance monthly amount"
    ),

    isActive: mapNullableBoolean(
        assistance.is_active,
        "Welfare assistance active status"
    ),

    startDate: mapNullableDate(
        assistance.start_date,
        "Welfare assistance start date"
    ),

    endDate: mapNullableDate(
        assistance.end_date,
        "Welfare assistance end date"
    ),
  };
}

export function mapWelfareAssistance(
    records: JkmSourceRecord[]
): JkmWelfareAssistanceData[] {
  validateArrayLength(
      records,
      "Welfare assistance"
  );

  return records.map(mapWelfareAssistanceRecord);
}

// Supporting document metadata
// Input records is normalized by jkm-service.ts after retrieving application_documents and documents
export function mapSupportingDocument(
    document: JkmSourceRecord
): JkmSupportingDocument {
  return {
    documentId: requiredUuid(
        document.document_id,
        "supporting document ID"
    ),

    requirementType: mapRequiredText(
        document.requirement_type,
        "Document requirement type",
        100
    ),

    documentType: mapRequiredText(
        document.document_type,
        "Document type",
        100
    ),

    originalFilename: mapRequiredText(
        document.original_filename,
        "Document original filename",
        255
    ),

    mimeType: mapRequiredText(
        document.mime_type,
        "Document MIME type",
        100
    ),

    fileSizeBytes: mapNullableInteger(
        document.file_size_bytes,
        "Document file size"
    ),

    issuedAt: mapNullableDate(
        document.issued_at,
        "Document issue date"
    ),

    expiresAt: mapNullableDate(
        document.expires_at,
        "Document expiry date"
    ),
  };
}

export function mapSupportingDocuments(
    documents: JkmSourceRecord[]
): JkmSupportingDocument[] {
  validateArrayLength(
      documents,
      "Supporting documents"
  );

  return documents.map(mapSupportingDocument);
}

// Preliminary eligibility assessment
export function mapPreliminaryEligibility(
    value: unknown,
    expectedProgramCode: JkmProgramCode
): JkmPreliminaryEligibility {
  if (!isRecord(value)) {
    throw new HttpError(
        422,
        "Preliminary eligibility assessment is required"
    );
  }

  if (value.programCode !== expectedProgramCode) {
    throw new HttpError(
        422,
        "Preliminary eligibility assessment does not match the application programme"
    );
  }

  const status = value.status;

  if (
      typeof status !== "string" ||
      !PRELIMINARY_ELIGIBILITY_STATUSES.some(
          (item) => item === status
      )
  ) {
    throw new HttpError(
        422,
        "Invalid preliminary eligibility status"
    );
  }

  const criteriaVersion = value.criteriaVersion;

  if (
      typeof criteriaVersion !== "number" ||
      !Number.isSafeInteger(criteriaVersion) ||
      criteriaVersion <= 0
  ) {
    throw new HttpError(
        422,
        "Invalid preliminary eligibility criteria version"
    );
  }

  return {
    status: status as JkmPreliminaryEligibilityStatus,

    criteriaVersion,

    assessedAt: mapRequiredDateTime(
        value.assessedAt,
        "Preliminary eligibility assessment date"
    ),
  };
}

// Assemble common application data
export function mapCommonApplicationData(
    input: JkmCommonMapperInput,
    programCode: JkmProgramCode,
    options: JkmCommonMapperOptions = {}
): JkmCommonApplicationData {
  const applicationData: JkmCommonApplicationData = {
    schemaVersion: 1,

    applicant: mapApplicant(input.profile),

    contact: mapContact(input.profile),

    address: mapAddress(input.address),

    financial: mapFinancial(
        input.financialProfile
    ),
  };

  if (options.includeEmployment) {
    applicationData.employment =
        mapEmployment(input.profile);
  }

  if (options.includeHousehold) {
    requireCompleteHousehold(input);

    applicationData.household =
        mapHousehold(input.householdMembers);
  }

  if (options.includeHealth) {
    applicationData.health =
        mapHealth(input.healthProfile);
  }

  if (options.includeLivingArrangement) {
    applicationData.livingArrangement =
        mapLivingArrangement(
            input.livingArrangement
        );
  }

  if (options.includeCaregivers) {
    applicationData.caregivers =
        mapCaregivers(input.caregivers);
  }

  if (options.includeWelfareAssistance) {
    applicationData.welfareAssistance =
        mapWelfareAssistance(
            input.welfareAssistance
        );
  }

  if (input.supportingDocuments !== undefined) {
    applicationData.supportingDocuments =
        mapSupportingDocuments(
            input.supportingDocuments
        );
  }

  if (input.preliminaryEligibility !== undefined) {
    applicationData.preliminaryEligibility =
        mapPreliminaryEligibility(
            input.preliminaryEligibility,
            programCode
        );
  }

  return applicationData;
}
