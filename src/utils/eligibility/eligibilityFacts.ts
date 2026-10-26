import { EligibilityFacts } from "../../types/eligibility";

// Database records required to build eligibility facts
export interface EligibilityFactsInput {
  profile: {
    date_of_birth: string | null;
    citizenship: string | null;
    marital_status: string | null;
    is_student: boolean | null;
    study_mode: string | null;
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

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const parsedDate = new Date(0);
  parsedDate.setFullYear(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);

  if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
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

  if (!birthDate || birthDate > referenceDate) {
    return null;
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();

  const birthdayPassed =
      referenceDate.getMonth() > birthDate.getMonth() ||
      (referenceDate.getMonth() === birthDate.getMonth() &&
          referenceDate.getDate() >= birthDate.getDate());

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

  if (!birthDate || birthDate > referenceDate) {
    return null;
  }

  return referenceDate.getFullYear() - birthDate.getFullYear();
}

// Calculate completed months since a date
function calculateCompletedMonths(
    startDate: string | null,
    referenceDate: Date
): number | null {
  const start = parseDate(startDate);

  if (!start || start > referenceDate) {
    return null;
  }

  let months =
      (referenceDate.getFullYear() - start.getFullYear()) * 12 +
      (referenceDate.getMonth() - start.getMonth());

  if (referenceDate.getDate() < start.getDate()) {
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

  return assistance.some((record) => {
    const isJkm = record.agency?.trim().toLowerCase() === "jkm";

    const isMonthly =
        record.assistance_type?.trim().toLowerCase() === "monthly";

    const isActive = record.is_active === true;

    const hasStarted =
        !record.start_date || record.start_date <= referenceDateString;

    const hasNotEnded =
        !record.end_date || record.end_date >= referenceDateString;

    return (
        isJkm &&
        isMonthly &&
        isActive &&
        hasStarted &&
        hasNotEnded
    );
  });
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

  const childRelationships = ["child", "son", "daughter"];

  const hasRecordedChildren = householdMembers.some((member) =>
    childRelationships.includes(
        member.relationship.trim().toLowerCase()
    )
  );

  const hasChildren = hasRecordedChildren ? true : null;

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
  const isFullTimeStudent =
      profile.is_student === null
          ? null
          : !profile.is_student
              ? false
              : profile.study_mode
                  ? profile.study_mode.trim().toLowerCase() === "full_time"
                  : null;

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

  return {
    // Personal information
    age: calculateAge(profile.date_of_birth, referenceDate),
    ageByBirthYear: calculateAgeByBirthYear(
        profile.date_of_birth,
        referenceDate
    ),
    citizenship: profile.citizenship,
    residenceCountry: address?.country_code ?? null,
    state: address?.state_territory ?? null,
    maritalStatus: profile.marital_status,

    // Financial information
    monthlyPersonalIncome,
    monthlyHouseholdIncome,
    householdSize,
    perCapitaHouseholdIncome,

    // Household information
    numberOfDependents,
    numberOfEligibleChildren: null,
    hasChildren,
    hasEligibleChildren: null,
    isFullTimeStudent,

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
    residesInExcludedCareCentre: null,
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
