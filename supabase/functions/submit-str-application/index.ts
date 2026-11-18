import { handleCors } from "../_shared/cors";
import { errorResponse, handleError, successResponse } from "../_shared/response";
import { requireUser } from "../_shared/auth";
import { parseJsonBody, requiredUuid } from "../_shared/validators";

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

    // STR submission
    // Verify ownership, map application data, submit to the STR API and save the response

    // const result = await submitStrApplication({
    //   applicationId,
    //   userId: user.id
    // });
    //
    // return successResponse(result);

    return successResponse(
        "STR submission endpoint is ready",
        {
          applicationId,
          userId: user.id,
          submissionEnabled: false
        }
    );
  } catch (error) {
    return handleError(error);
  }
})
