export const formatDateOfBirth = (
    dateOfBirth: string
): string => {
  const [year, month, day] = dateOfBirth.split("-");

  if (!year || !month || !day) {
    return dateOfBirth;
  }

  return `${day}/${month}/${year}`;
};

export const formatIdentificationNumber = (
    identificationNumber: string
): string => {
  const digits = identificationNumber.replace(/\D/g, "");

  if (digits.length !== 12) {
    return identificationNumber;
  }

  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};

export const formatMobileNumber = (
    mobileNumber: string | null
): string | null => {
  if (!mobileNumber) {
    return null;
  }

  const digits = mobileNumber.replace(/\D/g, "");

  if (digits.length <= 3) {
    return digits;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
};

export const formatHomePhone = (
    homePhone: string | null
): string | null => {
  if (!homePhone) {
    return null;
  }

  const digits = homePhone.replace(/\D/g, "");

  if (digits.startsWith("03") && digits.length === 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  if (digits.length >= 9 && digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return homePhone;
};

export const formatIncome = (
    income: number | null
): string | null => {
  if (income === null || !Number.isFinite(income)) {
    return null;
  }

  return `RM ${income.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const parseIncome = (
    value: string
): number | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return Number(trimmed);
};
