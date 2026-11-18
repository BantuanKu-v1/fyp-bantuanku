import { corsHeaders } from "./cors";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export function jsonResponse<T>(
    status: number,
    body: ApiResponse<T>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function successResponse<T>(
    message: string,
    data: T,
    status = 200
): Response {
  return jsonResponse(status, {
    success: true,
    message,
    data
  });
}

export function errorResponse(
    message: string,
    status = 500,
    errors?: unknown
): Response {
  return jsonResponse(status, {
    success: false,
    message,
    ...(errors === undefined ? {} : { errors }),
  });
}

export class HttpError extends Error {
  constructor(
      public readonly status: number,
      message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function handleError(error: unknown): Response {
  if (error instanceof HttpError) {
    return errorResponse(error.message, error.status);
  }

  console.error(
      "Edge Function error:",
      error instanceof Error ? error.message : "Unknown error",
  );

  return errorResponse("Internal server error", 500);
}
