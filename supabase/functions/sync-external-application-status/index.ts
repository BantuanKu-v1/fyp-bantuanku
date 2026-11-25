import {
  HttpError,
  successResponse,
  errorResponse,
  handleError
} from "../_shared/response.ts";

import { parseJsonBody } from "../_shared/validators.ts";

import {
  isSupportedProvider,
  validateStatusUpdate,
  syncExternalApplicationStatus,
  type Provider
} from "./status-service.ts";

const WEBHOOK_SECRET_HEADER = "X-Webhook-Secret";

const WEBHOOK_SECRET_ENV: Record<Provider, string> = {
  str: "STR_WEBHOOK_SECRET",
  jkm: "JKM_WEBHOOK_SECRET",
};

// Retrieve the configured secret for the selected provider
function getWebhookSecret(
    provider: Provider
): string {
  const envName = WEBHOOK_SECRET_ENV[provider];
  const secret = Deno.env.get(envName);

  if (!secret) {
    console.error(
        `[Status Sync] Missing webhook configuration for ${provider}`
    );

    throw new HttpError(
        503,
        "Provider webhook is not configured"
    );
  }

  return secret;
}

// Compare secrets using fixed-length SHA-256 digests
async function compareSecrets(
    receivedSecret: string,
    expectedSecret: string
): Promise<boolean> {
  const encoder = new TextEncoder();

  const [receivedHash, expectedHash] = await Promise.all([
      crypto.subtle.digest(
          "SHA-256",
          encoder.encode(receivedSecret)
      ),
      crypto.subtle.digest(
          "SHA-256",
          encoder.encode(expectedSecret)
      ),
  ]);

  const received = new Uint8Array(receivedHash);
  const expected = new Uint8Array(expectedHash);

  let difference = 0;

  for (let i = 0; i < expected.length; i++) {
    difference |= received[i] ^ expected[i];
  }

  return difference === 0;
}

// Authenticate the incoming provider webhook
async function authenticateWebhook(
    req: Request,
    provider: Provider
): Promise<void> {
  const receivedSecret = req.headers.get(
      WEBHOOK_SECRET_HEADER
  );

  if (!receivedSecret) {
    throw new HttpError(
        401,
        "Missing webhook authentication"
    );
  }

  const expectedSecret = getWebhookSecret(provider);

  const authenticated = await compareSecrets(
      receivedSecret,
      expectedSecret,
  );

  if (!authenticated) {
    throw new HttpError(
        401,
        "Invalid webhook authentication"
    );
  }
}

// Handle income application status webhooks
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return errorResponse(
        "Method not allowed",
        405
    );
  }

  try {
    const body = await parseJsonBody(req);
    const provider = body.provider;

    if (!isSupportedProvider(provider)) {
      throw new HttpError(
          400,
          "Unsupported application provider"
      );
    }

    await authenticateWebhook(
        req,
        provider
    );

    const update = validateStatusUpdate(body);

    const result = await syncExternalApplicationStatus(update);

    return successResponse(
        "Application status synchronized completed",
        result
    );
  } catch (error) {
    return handleError(error);
  }
});
