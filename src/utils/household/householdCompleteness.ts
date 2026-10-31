export type HouseholdCompletenessData = {
  fullName: string;
  relationship: string;
  identificationNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  citizenship: string | null;
  isStudent: boolean | null;
  studyMode: string | null;
  institutionType: string | null;
  isOku: boolean | null;
  okuRegistered: boolean | null;
};

export const getMissingHouseholdFields = (
    member: HouseholdCompletenessData
): string[] => {
  const missingFields: string[] = [];

  // Basic Information
  if (!member.fullName?.trim()) {
    missingFields.push("fullName");
  }

  if (!member.relationship?.trim()) {
    missingFields.push("relationship");
  }

  if (!member.identificationNumber?.trim()) {
    missingFields.push("identificationNumber");
  }

  if (!member.dateOfBirth) {
    missingFields.push("dateOfBirth");
  }

  if (!member.gender?.trim()) {
    missingFields.push("gender");
  }

  if (!member.citizenship?.trim()) {
    missingFields.push("citizenship");
  }

  // Student Information
  if (member.isStudent === true) {
    if (!member.studyMode?.trim()) {
      missingFields.push("studyMode");
    }

    if (!member.institutionType?.trim()) {
      missingFields.push("institutionType");
    }
  }

  // OKU Information
  if (member.isOku === null) {
    missingFields.push("isOku");
  }

  if (member.isOku === true && member.okuRegistered === null) {
    missingFields.push("okuRegistered");
  }

  return missingFields;
};
