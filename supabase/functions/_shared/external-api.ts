import { HttpError } from "./response.ts";

export const DEFAULT_API_TIMEOUT_MS = 15_000;

export interface ExternalApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ExternalApiConfig {
  baseUrl: string;
  apiKey: string;
}

export interface ExternalApiRequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
  notFoundReturnsNull?: boolean;
}

export function getExternalApiConfig(
    baseUrlEnv: string,
    apiKeyEnv: string
): ExternalApiConfig {
  const baseUrl = Deno.env.get(baseUrlEnv);
  const apiKey = Deno.env.get(apiKeyEnv);

  if (!baseUrl || !apiKey) {
    throw new Error("External API configuration is missing");
  }

  const url = new URL(baseUrl);

  if (url.protocol !== "https:") {
    throw new Error("External API must use HTTPS");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Invalid external API base URL");
  }

  return {
    baseUrl: url.toString().replace(/\/+$/, ""),
    apiKey,
  };
}

export function externalApiRequest<T>(
    config: ExternalApiConfig,
    path: string,
    options: ExternalApiRequestOptions & {
      notFoundReturnsNull: true;
    }
): Promise<T | null>;

export function externalApiRequest<T>(
    config: ExternalApiConfig,
    path: string,
    options: ExternalApiRequestOptions
): Promise<T>;

export async function externalApiRequest<T>(
    config: ExternalApiConfig,
    path: string,
    options: ExternalApiRequestOptions
): Promise<T | null> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Invalid external API path");
  }

  let response: Response;

  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
      signal: AbortSignal.timeout(
          options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS,
      ),
    });
  } catch (error) {
    console.error(
        "External API request failed:",
        error instanceof Error ? error.message : "Unknown error",
    );

    throw new HttpError(
        502,
        "Unable to connect to the external service."
    );
  }

  // Only an explicit HTTP 404 can represent "not found"
  // Network failures and timeouts must never return null
  if (
      response.status === 404 &&
      options.notFoundReturnsNull === true
  ) {
    return null;
  }

  let result: ExternalApiResponse<T>;

  try {
    result = await response.json() as ExternalApiResponse<T>;
  } catch {
    throw new HttpError(
        502,
        "The external service returned an invalid response.",
    );
  }

  if (!response.ok || result?.success !== true) {
    if (response.status === 409) {
      throw new HttpError(
          409,
          "The external service reported a conflicting application.",
      );
    }

    if (response.status === 400 || response.status === 422) {
      throw new HttpError(
          422,
          "The external service rejected the request data.",
      );
    }

    console.error(
        "External API error:",
        response.status,
        result?.message ?? "Unknown error",
    );

    throw new HttpError(
        502,
        "The external service couldn't process the request.",
    );
  }

  if (result.data === undefined || result.data === null) {
    throw new HttpError(
        502,
        "The external service returned an incomplete response.",
    );
  }

  return result.data;
}
