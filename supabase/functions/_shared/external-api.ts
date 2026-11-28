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

  // Optional provider-specific validation of HTTP 404 responses
  validateNotFoundResponse?: (response: unknown) => boolean;

  // Optional protection against unexpected redirects
  rejectRedirects?: boolean;
}

// Preserve upstream error information for provider-specific handling
export class ExternalApiError extends HttpError {
  readonly upstreamStatus: number;
  readonly upstreamMessage: string | null;
  readonly upstreamSuccess: boolean | null;
  readonly redirected: boolean;

  constructor(
      status: number,
      message: string,
      upstreamStatus: number,
      upstreamMessage: string | null = null,
      upstreamSuccess: boolean | null = null,
      redirected = false,
  ) {
    super(status, message);

    this.name = "ExternalApiError";
    this.upstreamStatus = upstreamStatus;
    this.upstreamMessage = upstreamMessage;
    this.upstreamSuccess = upstreamSuccess;
    this.redirected = redirected;
  }
}

// Validate external response objects
function isRecord(
    value: unknown,
): value is Record<string, unknown> {
  return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
  );
}

export function getExternalApiConfig(
    baseUrlEnv: string,
    apiKeyEnv: string,
): ExternalApiConfig {
  const baseUrl = Deno.env.get(baseUrlEnv);
  const apiKey = Deno.env.get(apiKeyEnv);

  if (!baseUrl || !apiKey) {
    console.error(
        "[External API] Missing configuration",
        {
          baseUrlEnv,
          apiKeyEnv,
          hasBaseUrl: Boolean(baseUrl),
          hasApiKey: Boolean(apiKey),
        },
    );

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
    },
): Promise<T | null>;

export function externalApiRequest<T>(
    config: ExternalApiConfig,
    path: string,
    options: ExternalApiRequestOptions,
): Promise<T>;

export async function externalApiRequest<T>(
    config: ExternalApiConfig,
    path: string,
    options: ExternalApiRequestOptions,
): Promise<T | null> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Invalid external API path");
  }

  const endpoint = `${config.baseUrl}${path}`;
  const endpointUrl = new URL(endpoint);
  const safeEndpoint =
      `${endpointUrl.origin}${endpointUrl.pathname}`;

  const timeoutMs =
      options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;

  const startedAt = Date.now();

  let response: Response;

  // Log the outgoing request without exposing credentials or request data
  console.info(
      "[External API] Sending request",
      {
        endpoint: safeEndpoint,
        method: options.method,
        timeoutMs,
      },
  );

  try {
    response = await fetch(endpoint, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },

      ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),

      redirect: options.rejectRedirects
          ? "error"
          : "follow",

      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    console.error(
        "[External API] Request failed",
        {
          endpoint: safeEndpoint,
          method: options.method,
          durationMs: Date.now() - startedAt,
          reason: error instanceof Error
              ? error.name
              : "Unknown error",
        },
    );

    // Network failures remain uncertain
    throw new HttpError(
        502,
        "Unable to connect to the external service.",
    );
  }

  // Log HTTP response metadata before parsing the response body
  console.info(
      "[External API] Response received",
      {
        endpoint: safeEndpoint,
        method: options.method,
        httpStatus: response.status,
        httpStatusText: response.statusText,
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
        redirected: response.redirected,
        durationMs: Date.now() - startedAt,
      },
  );

  // Preserve existing not-found behavior for providers
  // that do not require strict response validation
  if (
      response.status === 404 &&
      options.notFoundReturnsNull === true &&
      !options.validateNotFoundResponse
  ) {
    console.info(
        "[External API] Resource not found",
        {
          endpoint: safeEndpoint,
          method: options.method,
          httpStatus: response.status,
        },
    );

    return null;
  }

  let rawResult: unknown;

  // Parse the external API response
  try {
    rawResult = await response.json();
  } catch (error) {
    console.error(
        "[External API] Invalid JSON response",
        {
          endpoint: safeEndpoint,
          method: options.method,
          httpStatus: response.status,
          httpStatusText: response.statusText,
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
          redirected: response.redirected,
          durationMs: Date.now() - startedAt,
          reason: error instanceof Error
              ? error.name
              : "Unknown parsing error",
        },
    );

    // An invalid response cannot confirm rejection or acceptance
    throw new HttpError(
        502,
        "The external service returned an invalid response.",
    );
  }

  // Ensure the response has the expected object structure
  if (!isRecord(rawResult)) {
    console.error(
        "[External API] Invalid response structure",
        {
          endpoint: safeEndpoint,
          method: options.method,
          httpStatus: response.status,
        },
    );

    throw new HttpError(
        502,
        "The external service returned an invalid response.",
    );
  }

  const upstreamMessage =
      typeof rawResult.message === "string"
          ? rawResult.message
          : null;

  const upstreamSuccess =
      typeof rawResult.success === "boolean"
          ? rawResult.success
          : null;

  // Strict not-found handling for providers such as STR
  if (
      response.status === 404 &&
      options.notFoundReturnsNull === true &&
      options.validateNotFoundResponse
  ) {
    if (
        !response.redirected &&
        options.validateNotFoundResponse(rawResult)
    ) {
      console.info(
          "[External API] Resource not found confirmed",
          {
            endpoint: safeEndpoint,
            method: options.method,
            httpStatus: response.status,
          },
      );

      return null;
    }

    console.error(
        "[External API] Unverified not-found response",
        {
          endpoint: safeEndpoint,
          method: options.method,
          httpStatus: response.status,
        },
    );

    throw new HttpError(
        502,
        "The external service returned an unverified not-found response.",
    );
  }

  // Handle unsuccessful external API responses
  if (!response.ok || upstreamSuccess !== true) {
    console.error(
        "[External API] Unsuccessful response",
        {
          endpoint: safeEndpoint,
          method: options.method,
          httpStatus: response.status,
          httpStatusText: response.statusText,
          upstreamSuccess,
          redirected: response.redirected,
          durationMs: Date.now() - startedAt,
        },
    );

    if (response.status === 409) {
      throw new ExternalApiError(
          409,
          "The external service reported a conflicting application.",
          response.status,
          upstreamMessage,
          upstreamSuccess,
          response.redirected,
      );
    }

    if (
        response.status === 400 ||
        response.status === 422
    ) {
      throw new ExternalApiError(
          422,
          "The external service rejected the request data.",
          response.status,
          upstreamMessage,
          upstreamSuccess,
          response.redirected,
      );
    }

    throw new ExternalApiError(
        502,
        "The external service couldn't process the request.",
        response.status,
        upstreamMessage,
        upstreamSuccess,
        response.redirected,
    );
  }

  const result =
      rawResult as unknown as ExternalApiResponse<T>;

  // Ensure the external service returned the expected data
  if (result.data === undefined || result.data === null) {
    console.error(
        "[External API] Incomplete response",
        {
          endpoint: safeEndpoint,
          method: options.method,
          httpStatus: response.status,
          durationMs: Date.now() - startedAt,
          hasData: false,
        },
    );

    throw new HttpError(
        502,
        "The external service returned an incomplete response.",
    );
  }

  console.info(
      "[External API] Request completed successfully",
      {
        endpoint: safeEndpoint,
        method: options.method,
        httpStatus: response.status,
        durationMs: Date.now() - startedAt,
      },
  );

  return result.data;
}
