import { HttpError } from "./response.ts";

export function nullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function requiredText(value: unknown): string {
  return nullableText(value) ?? "";
}

export function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export function nullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function isUuid(value: unknown): value is string {
  return (
      typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

export function requiredUuid(
    value: unknown,
    fieldName: string
): string {
  if (!isUuid(value)) {
    throw new HttpError(400, `Invalid ${fieldName}`);
  }

  return value;
}

export async function parseJsonBody(
    req: Request
): Promise<Record<string, unknown>> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON request body");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be an object");
  }

  return body as Record<string, unknown>;
}
