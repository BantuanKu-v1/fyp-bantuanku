export type MyKadGender = "male" | "female";

const normalizeMyKad = (
    value: string
) => {
  return value.replace(/\D/g, "");
};

export const getDobFromMyKad = (
    myKadNumber: string
): Date | null => {
  const digits = normalizeMyKad(myKadNumber);

  if (digits.length !== 12) {
    return null;
  }

  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;

  let year = currentCentury + yy;
  let date = new Date(year, mm - 1, dd);

  if (date > today) {
    year -= 100;

    date = new Date(year, mm - 1, dd);
  }

  const isValidDate =
      date.getFullYear() === year &&
      date.getMonth() === mm - 1 &&
      date.getDate() === dd;

  if (!isValidDate) {
    return null;
  }

  return date;
};

// Link: https://shorturl.at/Ywdwf
export const getGenderFromMyKad = (
    myKadNumber: string
): MyKadGender | null => {
  const digits = normalizeMyKad(myKadNumber);

  if (digits.length !== 12) {
    return null;
  }

  const lastDigit = Number(digits.charAt(11));

  if (Number.isNaN(lastDigit)) {
    return null;
  }

  return lastDigit % 2 === 0
      ? "female"
      : "male";
};

export const formatMyKad = (value: string): string => {
  const digits = normalizeMyKad(value).slice(0, 12);

  if (digits.length <= 6) {
    return digits;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  }

  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};
