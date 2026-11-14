import { EligibilityFacts } from "../../types/eligibility";
import { RELATIONSHIP_CHILD_LABELS } from "../../constants/eligibility";

export interface BatEligibilityInput {
  isJkmTargetGroup?: boolean | null;
  hasMedicalOrJkmRecommendation?: boolean | null;
  requestedAssistiveEquipment?: boolean | null;
  estimatedEquipmentCost?: number | null;
  recommendationOrEquipmentRequiresReview?: boolean | null;
  specialConsiderationRequested?: boolean | null;
}

export interface BptPatientInput {
  citizenship?: string | null;
  residenceCountry?: string | null;
  isOku?: boolean | null;
  hasChronicIllness?: boolean | null;
  isBedridden?: boolean | null;
  requiresContinuousTreatment?: boolean | null;
  treatmentStartDate?: string | null;
  hasCaregiver?: boolean | null;
}

export interface BptEligibilityInput {
  applicantRole?: "patient" | "caregiver" | null;
  patient?: BptPatientInput | null;
  caregiverCitizenship?: string | null;
  caregiverProvidesIntensiveCare?: boolean | null;
  medicalOrCaregiverReviewRequired?: boolean | null;
}

export interface EligibilityFactsInput {
  profile: {
    date_of_birth: string | null;
    citizenship: string | null;
    marital_status: string | null;
    is_student: boolean | null;
    study_mode: string | null;
    institution_type: string | null;
  };

  address: {
    state_territory: string | null;
    country_code: string | null;
  } | null;

  financialProfile: {
    monthly_personal_income: number | null;
    monthly_household_income: number | null;
  } | null;

  householdMembers: {
    relationship: string;
    date_of_birth: string | null;
    is_dependent: boolean | null;
    identification_no: string | null;
    citizenship: string | null;
    employment_status: string | null;
    monthly_income: number | null;
    is_student: boolean | null;
    study_mode: string | null;
    institution_type: string | null;
  }[];

  householdMembersComplete?: boolean | null;

  healthProfile: {
    is_oku: boolean | null;
    oku_registered: boolean | null;
    has_chronic_illness: boolean | null;
    is_bedridden: boolean | null;
    requires_continuous_treatment: boolean | null;
    treatment_start_date: string | null;
  } | null;

  livingArrangement: {
    lives_with_family: boolean | null;
    depends_on_family: boolean | null;
    depends_on_caregiver: boolean | null;
    is_in_institution: boolean | null;
    institution_type: string | null;
  } | null;

  caregivers: {
    citizenship: string | null;
    provides_intensive_care: boolean | null;
  }[];

  welfareAssistance: {
    program_name: string;
    agency: string | null;
    assistance_type: string | null;
    is_active: boolean | null;
    start_date: string | null;
    end_date: string | null;
  }[];

  // Explicit applicant declaration; null means unanswered
  receivesJkmMonthlyAssistance?: boolean | null;

  bat?: BatEligibilityInput | null;
  bpt?: BptEligibilityInput | null;
}

// Parse and validate a date in YYYY-MM-DD format
function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

// Calculate age based on completed birthdays
function calculateAge(
    dateOfBirth: string | null,
    referenceDate: Date
): number | null {
  const birthDate = parseDate(dateOfBirth);
  const reference = new Date(referenceDate);

  const referenceDay = Date.UTC(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate()
  );

  if (!birthDate || birthDate.getTime() > referenceDay) {
    return null;
  }

  let age = reference.getFullYear() - birthDate.getUTCFullYear();

  const birthdayPassed =
      reference.getMonth() > birthDate.getUTCMonth() ||
      (reference.getMonth() === birthDate.getUTCMonth() &&
          reference.getDate() >= birthDate.getUTCDate());

  if (!birthdayPassed) {
    age--;
  }

  return age >= 0 ? age : null;
}

// Calculate age using birth year only
function calculateAgeByBirthYear(
    dateOfBirth: string | null,
    referenceDate: Date
): number | null {
  const birthDate = parseDate(dateOfBirth);
  const reference = new Date(referenceDate);

  const referenceDay = Date.UTC(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate()
  );

  if (!birthDate || birthDate.getTime() > referenceDay) {
    return null;
  }

  return reference.getFullYear() - birthDate.getUTCFullYear();
}

// Calculate completed months since a date
function calculateCompletedMonths(
    startDate: string | null,
    referenceDate: Date
): number | null {
  const start = parseDate(startDate);
  const reference = new Date(referenceDate);

  const referenceDay = Date.UTC(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate()
  );

  if (!start || start.getTime() > referenceDay) {
    return null;
  }

  let months =
      (reference.getFullYear() - start.getUTCFullYear()) * 12 +
      (reference.getMonth() - start.getUTCMonth());

  const referenceMonthLastDay = new Date(
      reference.getFullYear(),
      reference.getMonth() + 1,
      0
  ).getDate();

  const anniversaryDay = Math.min(
      start.getUTCDate(),
      referenceMonthLastDay
  );

  if (reference.getDate() < anniversaryDay) {
    months--;
  }

  return months >= 0 ? months : null;
}

// Convert nullable non-negative numeric values safely
function toNullableNumber(value: number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
      ? number
      : null;
}

// Determine whether active JKM monthly assistance is received
function receivesJkmMonthlyAssistance(
    assistance: EligibilityFactsInput["welfareAssistance"],
    referenceDate: Date,
    declaration: boolean | null = null
): boolean | null {
  const referenceDateString = [
    referenceDate.getFullYear(),
    String(referenceDate.getMonth() + 1).padStart(2, "0"),
    String(referenceDate.getDate()).padStart(2, "0"),
  ].join("-");

  const hasQualifyingAssistance = assistance.some((record) => {
    const isJkm = record.agency?.trim().toLowerCase() === "jkm";

    const isMonthly =
        record.assistance_type?.trim().toLowerCase() === "monthly";

    const isActive = record.is_active === true;

    const hasStarted =
        record.start_date === null ||
        (parseDate(record.start_date) !== null &&
            record.start_date <= referenceDateString);

    const hasNotEnded =
        record.end_date === null ||
        (parseDate(record.end_date) !== null &&
            record.end_date >= referenceDateString);

    return isJkm && isMonthly && isActive && hasStarted && hasNotEnded;
  });

  if (hasQualifyingAssistance) {
    return true;
  }

  // An explicit positive declaration remains meaningful even without records
  if (declaration === true) {
    return true;
  }

  // Do not accept a negative declaration when relevant records are unresolved
  const hasUncertainAssistance = assistance.some((record) => {
    const isJkm = record.agency?.trim().toLowerCase() === "jkm";

    if (!isJkm) return false;

    const monthly = record.assistance_type?.trim().toLowerCase();

    if (monthly && monthly !== "monthly") {
      return false;
    }

    if (record.is_active === false) return false;

    const start = record.start_date;
    const end = record.end_date;

    if (start !== null && parseDate(start) !== null &&
        start > referenceDateString) return false;

    if (end !== null && parseDate(end) !== null &&
        end < referenceDateString) return false;

    return (
        monthly !== "monthly" ||
        record.is_active === null ||
        (start !== null && parseDate(start) === null) ||
        (end !== null && parseDate(end) === null)
    );
  });

  if (hasUncertainAssistance) {
    return null;
  }

  return declaration === false ? false : null;
}

function normalizeState(value: string | null): string | null {
  if (!value?.trim()) return null;

  const normalized = value.trim().toLowerCase().replace(/_/g, " ")
      .replace(/^(?:w\.p\.|wilayah persekutuan)\s+/, "");

  switch (normalized) {
    case "kuala lumpur":
      return "Kuala Lumpur";
    case "putrajaya":
      return "Putrajaya";
    case "labuan":
      return "Labuan";
    default:
      return value.trim();
  }
}

function isFullTimeIptaIpts(
    isStudent: boolean | null,
    studyMode: string | null,
    institutionType: string | null
): boolean | null {
  if (isStudent === false) return false;
  if (isStudent === null) return null;

  const mode = studyMode?.trim().toLowerCase() ?? null;
  const institution = institutionType?.trim().toLowerCase() ?? null;

  if (mode === "part_time") return false;
  if (mode !== "full_time") return null;

  if (institution === "ipta" || institution === "ipts") {
    return true;
  }

  if (institution === "school") {
    return false;
  }

  return null;
}

function calculateStrEligibleChildren(
    members: EligibilityFactsInput["householdMembers"],
    referenceDate: Date,
    householdMembersComplete?: boolean | null
): {
  numberOfEligibleChildren: number | null;
  hasEligibleChildren: boolean | null;
} {
  let eligibleCount = 0;
  let hasUnknownChild = false;

  for (const member of members) {
    if (
        !RELATIONSHIP_CHILD_LABELS.includes(
            member.relationship.trim().toLowerCase()
        )
    ) {
      continue;
    }

    const age = calculateAge(member.date_of_birth, referenceDate);

    const citizenship = member.citizenship?.trim().toLowerCase();

    const isMalaysian =
        !citizenship
            ? null
            : citizenship === "malaysian";

    const employment = member.employment_status?.trim().toLowerCase();

    const hasNoEmployment =
        !employment
            ? null
            : employment === "unemployed" ||
            employment === "not_working";

    const income = toNullableNumber(member.monthly_income);

    const hasNoIncome =
        income === null
            ? null
            : income === 0;

    const hasIdentification =
        member.identification_no?.trim()
            ? true
            : null;

    const meetsAgeAndStudyRequirement =
        age === null
            ? null
            : age <= 18
                ? true
                : isFullTimeIptaIpts(
                    member.is_student,
                    member.study_mode,
                    member.institution_type
                );

    const conditions: (boolean | null)[] = [
      isMalaysian,
      hasNoEmployment,
      hasNoIncome,
      hasIdentification,
      meetsAgeAndStudyRequirement
    ];

    if (conditions.includes(false)) {
      continue;
    }

    if (conditions.includes(null)) {
      hasUnknownChild = true;
      continue;
    }

    eligibleCount++;
  }

  const numberOfEligibleChildren =
      householdMembersComplete === true && !hasUnknownChild
          ? eligibleCount
          : null;

  const hasEligibleChildren =
      eligibleCount > 0
          ? true
          : hasUnknownChild || householdMembersComplete !== true
              ? null
              : false;

  return {
    numberOfEligibleChildren,
    hasEligibleChildren
  };
}

// Build eligibility facts from applicant records
export function buildEligibilityFacts(
    input: EligibilityFactsInput,
    referenceDate: Date = new Date()
): EligibilityFacts {
  const {
    profile,
    address,
    financialProfile,
    householdMembers,
    householdMembersComplete = null,
    healthProfile,
    livingArrangement,
    caregivers,
    welfareAssistance,
    receivesJkmMonthlyAssistance: receivesJkmMonthlyAssistanceDeclaration = null,
    bat = null,
    bpt = null,
  } = input;

  // Household information
  // Assumes all householdMembers belong to the applicant's household
  const householdSize =
      householdMembersComplete === true
          ? 1 + householdMembers.length
          : null;

  const numberOfDependents =
      householdMembersComplete === true &&
      householdMembers.every(
          (member) => member.is_dependent !== null
      )
          ? householdMembers.filter(
              (member) => member.is_dependent === true
          ).length
          : null;

  const hasRecordedChildren = householdMembers.some((member) =>
      RELATIONSHIP_CHILD_LABELS.includes(
          member.relationship.trim().toLowerCase()
      )
  );

  const hasChildren =
      hasRecordedChildren
          ? true
          : householdMembersComplete === true
              ? false
              : null;

  const {
    numberOfEligibleChildren,
    hasEligibleChildren
  } = calculateStrEligibleChildren(
      householdMembers,
      referenceDate,
      householdMembersComplete
  );

  // Financial information
  const monthlyPersonalIncome = toNullableNumber(
      financialProfile?.monthly_personal_income ?? null
  );

  const monthlyHouseholdIncome = toNullableNumber(
      financialProfile?.monthly_household_income ?? null
  );

  const perCapitaHouseholdIncome =
      monthlyHouseholdIncome !== null &&
      householdSize !== null &&
      householdSize > 0
          ? monthlyHouseholdIncome / householdSize
          : null;

  // Student information
  const studyMode = profile.study_mode?.trim().toLowerCase() ?? null;

  const isFullTimeStudent =
      profile.is_student === false
          ? false
          : profile.is_student === null
              ? null
              : studyMode === "full_time"
                  ? true
                  : studyMode === "part_time"
                      ? false
                      : null;

  // STR - Full-time IPTA/IPTS student classification
  const isFullTimeIptaIptsStudent = isFullTimeIptaIpts(
      profile.is_student,
      profile.study_mode,
      profile.institution_type
  );

  // Living arrangements
  // A caregiver record does not prove co-residence
  const livesWithFamilyOrCaregiver =
      livingArrangement?.lives_with_family ?? null;

  const dependsOnFamilyOrCaregiver =
      livingArrangement?.depends_on_family === true ||
      livingArrangement?.depends_on_caregiver === true
          ? true
          : livingArrangement?.depends_on_family === false &&
          livingArrangement?.depends_on_caregiver === false
              ? false
              : null;

  // Institution type must be verified before identifying a JKM institution
  const residesInJkmInstitution =
      livingArrangement?.is_in_institution === false
          ? false
          : null;

  // An applicant who's not in an institution cannot be in an excluded institution
  const residesInExcludedInstitution =
      livingArrangement?.is_in_institution === false
          ? false
          : null;

  // Caregiver information
  // An empty list doesn't establish that no caregiver exists
  const recordedHasCaregiver = caregivers.length > 0 ? true : null;

  const recordedCaregiverCitizenship = caregivers.length === 1
      ? caregivers[0].citizenship
      : null;

  const recordedCaregiverProvidesIntensiveCare =
      caregivers.length === 1
          ? caregivers[0].provides_intensive_care
          : null;

  // BPT applicant role
  const applicantIsPatient =
      bpt?.applicantRole === "patient"
          ? true
          : bpt?.applicantRole === "caregiver"
              ? false
              : null;

  const applicantIsCaregiver =
      bpt?.applicantRole === "caregiver"
          ? true
          : bpt?.applicantRole === "patient"
              ? false
              : null;

  // The applicant's health profile can represent the patient only when the applicant is explicitly identified as the patient
  const patientIsApplicant = applicantIsPatient === true;
  const patient = bpt?.patient;

  const patientCitizenship = patientIsApplicant
      ? profile.citizenship ?? patient?.citizenship ?? null
      : patient?.citizenship ?? null;

  const patientResidenceCountry = patientIsApplicant
      ? address?.country_code ?? patient?.residenceCountry ?? null
      : patient?.residenceCountry ?? null;

  const patientIsOku = patientIsApplicant
      ? healthProfile?.is_oku ?? patient?.isOku ?? null
      : patient?.isOku ?? null;

  const patientHasChronicIllness = patientIsApplicant
      ? healthProfile?.has_chronic_illness ?? patient?.hasChronicIllness ?? null
      : patient?.hasChronicIllness ?? null;

  const patientIsBedridden = patientIsApplicant
      ? healthProfile?.is_bedridden ?? patient?.isBedridden ?? null
      : patient?.isBedridden ?? null;

  const patientRequiresContinuousTreatment = patientIsApplicant
      ? healthProfile?.requires_continuous_treatment ?? patient?.requiresContinuousTreatment ?? null
      : patient?.requiresContinuousTreatment ?? null;

  const patientContinuousTreatmentMonths =
      calculateCompletedMonths(
          patientIsApplicant
              ? healthProfile?.treatment_start_date ?? patient?.treatmentStartDate ?? null
              : patient?.treatmentStartDate ?? null,
          referenceDate
      );

  // Caregiver records belong to the applicant
  // They can describe the patient's caregiver only when the applicant is the patient
  const hasCaregiver = patient?.hasCaregiver ??
      (patientIsApplicant ? recordedHasCaregiver : null);

  const caregiverCitizenship = bpt?.caregiverCitizenship ??
      (patientIsApplicant ? recordedCaregiverCitizenship : null);

  const caregiverProvidesIntensiveCare =
      bpt?.caregiverProvidesIntensiveCare ??
      (patientIsApplicant ? recordedCaregiverProvidesIntensiveCare : null);

  const residesInExcludedCareCentre = null;

  return {
    // Personal information
    age: calculateAge(profile.date_of_birth, referenceDate),
    ageByBirthYear: calculateAgeByBirthYear(
        profile.date_of_birth,
        referenceDate
    ),
    citizenship: profile.citizenship,
    residenceCountry: address?.country_code ?? null,
    state: normalizeState(address?.state_territory ?? null),
    maritalStatus: profile.marital_status,

    // Financial information
    monthlyPersonalIncome,
    monthlyHouseholdIncome,
    householdSize,
    perCapitaHouseholdIncome,

    // Household information
    numberOfDependents,
    numberOfEligibleChildren,
    hasChildren,
    hasEligibleChildren,
    isFullTimeStudent,
    isFullTimeIptaIptsStudent,

    // Welfare assistance information
    receivesJkmMonthlyAssistance: receivesJkmMonthlyAssistance(
        welfareAssistance,
        referenceDate,
        receivesJkmMonthlyAssistanceDeclaration
    ),
    isJkmTargetGroup: bat?.isJkmTargetGroup ?? null,

    // Health and disability information
    isOku: healthProfile?.is_oku ?? null,
    okuRegistered: healthProfile?.oku_registered ?? null,
    hasChronicIllness: healthProfile?.has_chronic_illness ?? null,
    isBedridden: healthProfile?.is_bedridden ?? null,
    requiresContinuousTreatment: healthProfile?.requires_continuous_treatment ?? null,
    continuousTreatmentMonths: calculateCompletedMonths(
        healthProfile?.treatment_start_date ?? null,
        referenceDate
    ),

    // Living arrangement information
    residesInJkmInstitution,
    residesInExcludedCareCentre,
    residesInExcludedInstitution,
    livesWithFamilyOrCaregiver,
    dependsOnFamilyOrCaregiver,
    familyOrCaregiverIncomeExceedsPgk: null,

    // Caregiver and patient information
    applicantIsPatient,
    applicantIsCaregiver,
    patientCitizenship,
    patientResidenceCountry,
    patientIsOku,
    patientHasChronicIllness,
    patientIsBedridden,
    patientRequiresContinuousTreatment,
    patientContinuousTreatmentMonths,
    hasCaregiver,
    caregiverCitizenship,
    caregiverProvidesIntensiveCare,

    // Medical and assistive equipment information
    hasMedicalOrJkmRecommendation: bat?.hasMedicalOrJkmRecommendation ?? null,
    requestedAssistiveEquipment: bat?.requestedAssistiveEquipment ?? null,
    estimatedEquipmentCost: toNullableNumber(bat?.estimatedEquipmentCost ?? null),
    hasHospitalReferral: null,

    // External verification information
    socioeconomicAssessmentRequired: null,
    medicalAssessmentRequired: null,

    // JKM-specific assessment information
    baAdditionalCircumstancesRequireReview: null,
    batRecommendationOrEquipmentRequiresReview: bat?.recommendationOrEquipmentRequiresReview ?? null,
    batSpecialConsiderationRequested: bat?.specialConsiderationRequested ?? null,
    bptMedicalOrCaregiverReviewRequired: bpt?.medicalOrCaregiverReviewRequired ?? null,
  };
}
