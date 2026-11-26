const DATE_LOCALES: Readonly<Record<string, string>> = {
  en: "en-MY",
  ms: "ms-MY",
  zh: "zh-CN",
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getDateLocale(
    language?: string | null
): string {
  const normalizedLanguage = language
      ?.trim()
      .toLowerCase()
      .split(/[-_]/)[0];

  return DATE_LOCALES[normalizedLanguage ?? "en"] ?? "en-MY";
}

export function isValidDate(
    value: Date
): boolean {
  return Number.isFinite(value.getTime());
}

export function parseDateOnly(
    value: string | null | undefined
): Date | null {
  if (!value || !DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(0);

  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (
      !isValidDate(date) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function toDateOnlyString(
    value: Date | null | undefined
): string | null {
  if (!value || !isValidDate(value)) {
    return null;
  }

  const year = value.getFullYear();

  if (year < 1 || year > 9999) {
    return null;
  }

  const formattedYear = String(year).padStart(4, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${formattedYear}-${month}-${day}`;
}

export function isValidDateOnly(
    value: string | null | undefined
): boolean {
  const date = parseDateOnly(value);

  return (
      date !== null &&
      toDateOnlyString(date) === value
  );
}

export function parseDate(
    value: string | Date | null | undefined
): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    return isValidDateOnly(value)
        ? parseDateOnly(value)
        : null;
  }

  const date = new Date(value);

  return isValidDate(date) ? date : null;
}

export function formatDate(
    value: string | Date | null | undefined,
    language?: string | null,
    fallback = ""
): string {
  const date = parseDate(value);

  if (!date) {
    return fallback;
  }

  return date.toLocaleDateString(
      getDateLocale(language),
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
  );
}

export function formatDateTime(
    value: string | Date | null | undefined,
    language?: string | null,
    fallback = ""
): string {
  const date = parseDate(value);

  if (!date) {
    return fallback;
  }

  return date.toLocaleString(
      getDateLocale(language),
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
  );
}
