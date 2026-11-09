import { EligibilityFacts } from "../../types/eligibility";
import { RELATIONSHIP_CHILD_LABELS } from "../../constants/eligibility";

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
  reference.setHours(0, 0, 0, 0);

  if (!birthDate || birthDate > reference) {
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
  reference.setHours(0, 0, 0, 0);

  if (!birthDate || birthDate > reference) {
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
  reference.setHours(0, 0, 0, 0);

  if (!start || start > reference) {
    return null;
  }

  let months =
      (reference.getFullYear() - start.getUTCFullYear()) * 12 +
      (reference.getMonth() - start.getUTCMonth());

  if (reference.getDate() < start.getUTCDate()) {
    months--;
  }

  return months >= 0 ? months : null;
}

// Convert nullable numeric values safely
function toNullableNumber(value: number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

// Determine whether active JKM monthly assistance is received
function receivesJkmMonthlyAssistance(
    assistance: EligibilityFactsInput["welfareAssistance"],
    referenceDate: Date
): boolean | null {
  if (assistance.length === 0) {
    return null;
  }

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
        !record.start_date ||
        (parseDate(record.start_date) !== null &&
            record.start_date <= referenceDateString);

    const hasNotEnded =
        !record.end_date ||
        (parseDate(record.end_date) !== null &&
            record.end_date >= referenceDateString);

    return (
        isJkm &&
        isMonthly &&
        isActive &&
        hasStarted &&
        hasNotEnded
    );
  });

  return hasQualifyingAssistance ? true : null;
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
    referenceDate: Date
): number | null {
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

    const isMalaysian =
        member.citizenship === null
            ? null
            : member.citizenship === "Malaysian";

    const hasNoEmployment =
        member.employment_status === null
            ? null
            : member.employment_status === "unemployed" ||
              member.employment_status === "not_working";

    const hasNoIncome =
        member.monthly_income === null
            ? null
            : member.monthly_income === 0;

    const hasIdentification = member.identification_no?.trim() ? true : null;

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

  return hasUnknownChild ? null : eligibleCount;
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
    healthProfile,
    livingArrangement,
    caregivers,
    welfareAssistance,
  } = input;

  // Household information
  // Assumes all householdMembers belong to the applicant's household
  const householdSize = 1 + householdMembers.length;

  const numberOfDependents = householdMembers.every(
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

  const hasChildren = hasRecordedChildren ? true : null;

  const numberOfEligibleChildren = calculateStrEligibleChildren(householdMembers, referenceDate);

  const hasEligibleChildren =
      numberOfEligibleChildren === null
          ? null
          : numberOfEligibleChildren > 0;

  // Financial information
  const monthlyPersonalIncome = toNullableNumber(
      financialProfile?.monthly_personal_income ?? null
  );

  const monthlyHouseholdIncome = toNullableNumber(
      financialProfile?.monthly_household_income ?? null
  );

  const perCapitaHouseholdIncome =
      monthlyHouseholdIncome !== null && householdSize > 0
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
  const hasCaregiver = caregivers.length > 0 ? true : null;

  const caregiverCitizenship =
      caregivers.length === 1 ? caregivers[0].citizenship : null;

  const caregiverProvidesIntensiveCare =
      caregivers.length === 1
          ? caregivers[0].provides_intensive_care
          : null;

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
        referenceDate
    ),
    isJkmTargetGroup: null,

    // Health and disability information
    isOku: healthProfile?.is_oku ?? null,
    okuRegistered: healthProfile?.oku_registered ?? null,
    hasChronicIllness: healthProfile?.has_chronic_illness ?? null,
    isBedridden: healthProfile?.is_bedridden ?? null,
    requiresContinuousTreatment:
        healthProfile?.requires_continuous_treatment ?? null,
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
    applicantIsPatient: null,
    applicantIsCaregiver: null,
    patientCitizenship: null,
    patientResidenceCountry: null,
    patientIsOku: null,
    patientHasChronicIllness: null,
    patientIsBedridden: null,
    patientRequiresContinuousTreatment: null,
    patientContinuousTreatmentMonths: null,
    hasCaregiver,
    caregiverCitizenship,
    caregiverProvidesIntensiveCare,

    // Medical and assistive equipment information
    hasMedicalOrJkmRecommendation: null,
    requestedAssistiveEquipment: null,
    estimatedEquipmentCost: null,
    hasHospitalReferral: null,

    // External verification information
    socioeconomicAssessmentRequired: null,
    medicalAssessmentRequired: null,

    // JKM-specific assessment information
    baAdditionalCircumstancesRequireReview: null,
    batRecommendationOrEquipmentRequiresReview: null,
    batSpecialConsiderationRequested: null,
    bptMedicalOrCaregiverReviewRequired: null,
  };
}
