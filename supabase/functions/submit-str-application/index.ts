import { handleCors } from "../_shared/cors.ts";
import { errorResponse, handleError, successResponse } from "../_shared/response.ts";
import { requireUser } from "../_shared/auth.ts";
import { parseJsonBody, requiredUuid } from "../_shared/validators.ts";
import { submitStrApplication } from "./str-service.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);

  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return errorResponse(
          "Method not allowed. Use POST",
          405
      );
    }

    const user = await requireUser(req);
    const body = await parseJsonBody(req);

    const applicationId = requiredUuid(
        body.applicationId,
        "applicationId"
    );

    // Verify ownership, validate applicant information, map the payload, submit to STR and save confirmation
    const result = await submitStrApplication({
      applicationId,
      userId: user.id,
    });

    return successResponse(
        result.alreadySubmitted
            ? "STR application has already been submitted."
            : "STR application submitted successfully.",
        result,
    );
  } catch (error) {
    return handleError(error);
  }
});
