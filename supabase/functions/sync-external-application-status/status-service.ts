import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../_shared/supabase.ts";
import { HttpError } from "../_shared/response.ts";
import { nullableText, requiredUuid } from "../_shared/validators.ts";

export type Provider = "str" | "jkm";

const PROVIDER_STATUSES = {
  str: [
      "submitted",
      "under_review",
      "approved",
      "rejected",
  ],
  jkm: [
      "submitted",
      "under_review",
      "additional_information_required",
      "approved",
      "rejected",
      "cancelled",
  ],
} as const;

export type ProviderStatus = (typeof PROVIDER_STATUSES)[Provider][number];

export interface ApplicationStatusUpdate {
  eventType: "application.status_updated";
  provider: Provider;
  externalApplicationId: string;
  providerApplicationId: string;
  referenceNo: string;
  status: ProviderStatus;
  updatedAt: string;
}

interface TrackingRecord {
  id: string;
  application_id: string;
  provider: Provider;
  external_application_id: string;
  provider_application_id: string | null;
  reference_no: string | null;
  submission_state: string;
  provider_status: string | null;
  provider_updated_at: string | null;
}

export interface StatusSyncResult {
  applicationId: string;
  provider: Provider;
  providerApplicationId: string;
  referenceNo: string;
  providerStatus: string;
  providerUpdatedAt: string | null;
  outcome: "updated" | "unchanged" | "outdated";
}

const MAX_SYNC_ATTEMPTS = 3;

// Validate the external provider
export function isSupportedProvider(
    value: unknown
): value is Provider {
  return value === "str" || value === "jkm";
}

// Validate the status against the provider's supported statuses
export function isValidProviderStatus(
    provider: Provider,
    value: unknown
): value is ProviderStatus {
  const statuses: readonly string[] = PROVIDER_STATUSES[provider];

  return (typeof value === "string" && statuses.includes(value));
}

// Validate required text fields
function requireText(
    value: unknown,
    fieldName: string,
    maxLength: number
): string {
  const text = nullableText(value);

  if (!text) {
    throw new HttpError(
        400,
        `Missing required field: ${fieldName}`
    );
  }

  if (text.length > maxLength) {
    throw new HttpError(
        400,
        `Invalid ${fieldName} length`
    );
  }

  return text;
}

// Validate and normalize provider timestamps
function normalizeProviderTimestamp(
    value: unknown
): string {
  const timestamp = nullableText(value);

  if (
      !timestamp ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(timestamp)
  ) {
    throw new HttpError(
        400,
        "Invalid provider update timestamp"
    );
  }

  const parsed = new Date(timestamp);

  if (
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 19) !== timestamp.slice(0, 19)
  ) {
    throw new HttpError(
        400,
        "Invalid provider update timestamp"
    );
  }

  return parsed.toISOString();
}

// Validate the shared status update payload
export function validateStatusUpdate(
    body: Record<string, unknown>
): ApplicationStatusUpdate {
  if (body.eventType !== "application.status_updated") {
    throw new HttpError(
        400,
        "Unsupported webhook event type"
    );
  }

  const provider = body.provider;

  if (!isSupportedProvider(provider)) {
    throw new HttpError(
        400,
        "Unsupported application provider"
    );
  }

  const status = body.status;

  if (!isValidProviderStatus(provider, status)) {
    throw new HttpError(
        400,
        "Invalid provider application status"
    );
  }

  return {
    eventType: "application.status_updated",
    provider,
    externalApplicationId: requiredUuid(
        body.externalApplicationId,
        "external application ID",
    ),
    providerApplicationId: requireText(
        body.providerApplicationId,
        "provider application ID",
        255
    ),
    referenceNo: requireText(
        body.referenceNo,
        "reference number",
        255,
    ),
    status,
    updatedAt: normalizeProviderTimestamp(body.updatedAt),
  };
}

// Log db errors without including application data
function logDatabaseError(
    operation: string,
    error: {
      code?: string;
      message: string,
    }
): void {
  console.error(`[Status Sync] ${operation}:`, {
    code: error.code,
    message: error.message,
  });
}

// Retrieve the external submission tracking record
async function getTrackingRecord(
    supabase: SupabaseClient,
    update: ApplicationStatusUpdate,
): Promise<TrackingRecord> {
  const { data, error } = await supabase
      .from("external_application_submissions")
      .select(`
        id,
        application_id,
        provider,
        external_application_id,
        provider_application_id,
        reference_no,
        submission_state,
        provider_status,
        provider_updated_at
      `)
      .eq("provider", update.provider)
      .eq(
          "external_application_id",
          update.externalApplicationId,
      )
      .maybeSingle();

  if (error) {
    logDatabaseError(
        "Load external submission failed",
        error,
    );

    throw new HttpError(
        500,
        "Unable to load external submission tracking",
    );
  }

  if (!data) {
    throw new HttpError(
        404,
        "External submission tracking not found",
    );
  }

  return data as TrackingRecord;
}

// Verify that the update belongs to the confirmed application
function validateTrackingIdentity(
    tracking: TrackingRecord,
    update: ApplicationStatusUpdate
): void {
  if (
      tracking.provider !== update.provider ||
      tracking.application_id !== update.externalApplicationId ||
      tracking.external_application_id !== update.externalApplicationId
  ) {
    throw new HttpError(
        409,
        "External application identity mismatch"
    );
  }

  if (tracking.submission_state !== "submitted") {
    throw new HttpError(
        409,
        "External application submission has not confirmed"
    );
  }

  if (
      tracking.provider_application_id !== update.providerApplicationId ||
      tracking.reference_no !== update.referenceNo
  ) {
    throw new HttpError(
        409,
        "Provider application identity mismatch"
    );
  }
}

// Determine whether a status is terminal
function isTerminalStatus(
    status: string
): boolean {
  return (
      status === "approved" ||
      status === "rejected"  ||
      status === "cancelled"
  );
}

// Handle STR status updates sharing the same timestamp
function canAdvanceStrStatus(
    currentStatus: string,
    incomingStatus: ProviderStatus
): boolean {
  if (currentStatus === "submitted") {
    return (
        incomingStatus === "under_review" ||
        incomingStatus === "approved" ||
        incomingStatus === "rejected"
    );
  }

  if (currentStatus === "under_review") {
    return (
        incomingStatus === "approved" ||
        incomingStatus === "rejected"
    );
  }

  return false;
}

// Determine whether the incoming status should be applied
function determineSyncOutcome(
    tracking: TrackingRecord,
    update: ApplicationStatusUpdate
): StatusSyncResult["outcome"] {
  const currentStatus = tracking.provider_status;

  if (tracking.provider_updated_at) {
    const currentTimestamp = Date.parse(tracking.provider_updated_at);

    const incomingTimestamp = Date.parse(update.updatedAt);

    if (!Number.isFinite(currentTimestamp)) {
      throw new HttpError(
          500,
          "Invalid stored provider update timestamp"
      );
    }

    if (incomingTimestamp < currentTimestamp) {
      return "outdated";
    }

    if (incomingTimestamp === currentTimestamp) {
      if (currentStatus === update.status) {
        return "unchanged";
      }

      if (
          update.provider === "str" &&
          currentStatus &&
          canAdvanceStrStatus(currentStatus, update.status)
      ) {
        return "updated";
      }

      // JKM permits repeated review cycles so equal timestamps can't reliably
      // establish the order of different statuses
      if (
          update.provider === "jkm" &&
          currentStatus &&
          !isTerminalStatus(currentStatus)
      ) {
        throw new HttpError(
            409,
            "Ambiguous provider status update timestamp"
        );
      }

      return "outdated";
    }
  }

  // Terminal decisions cannot be overwritten
  if (
      currentStatus &&
      isTerminalStatus(currentStatus) &&
      currentStatus !== update.status
  ) {
    return "outdated";
  }

  // Prevent STR status regression
  if (
      update.provider === "str" &&
      currentStatus &&
      currentStatus !== update.status &&
      !canAdvanceStrStatus(currentStatus, update.status)
  ) {
    return "outdated";
  }

  // A confirmed application cannot return to submitted
  if (
      currentStatus &&
      currentStatus !== "submitted" &&
      update.status === "submitted"
  ) {
    return "outdated";
  }

  return "updated";
}

// Build the synchronization result
function buildSyncResult(
    tracking: TrackingRecord,
    outcome: StatusSyncResult["outcome"]
) {
  if (
      !tracking.provider_application_id ||
      !tracking.reference_no ||
      !tracking.provider_status
  ) {
    throw new HttpError(
        500,
        "Incomplete external application confirmation"
    );
  }

  return {
    applicationId: tracking.application_id,
    provider: tracking.provider,
    providerApplicationId: tracking.provider_application_id,
    referenceNo: tracking.reference_no,
    providerStatus: tracking.provider_status,
    providerUpdatedAt: tracking.provider_updated_at,
    outcome,
  };
}

// Apply the status update only if the tracking record hasn't changed since
// it was retrieved
async function applyStatusUpdate(
    supabase: SupabaseClient,
    tracking: TrackingRecord,
    update: ApplicationStatusUpdate,
    outcome: "updated" | "unchanged"
): Promise<TrackingRecord | null> {
  const values =
      outcome === "updated"
          ? {
            provider_status: update.status,
            provider_updated_at: update.updatedAt,
            last_synced_at: new Date().toISOString(),
          }
          : {
            last_synced_at: new Date().toISOString(),
          };

  let query = supabase
      .from("external_application_submissions")
      .update(values)
      .eq("id", tracking.id)
      .eq("application_id", tracking.application_id)
      .eq("provider", tracking.provider)
      .eq("external_application_id", tracking.external_application_id)
      .eq("provider_application_id", tracking.provider_application_id)
      .eq("reference_no", tracking.reference_no)
      .eq("submission_state", tracking.submission_state)
      // .eq("provider_status", tracking.provider_status)
      // .eq("provider_updated_at", tracking.provider_updated_at);

  // Compare the previously retrieved provider timestamp
  query = tracking.provider_updated_at === null
      ? query.is("provider_updated_at", null)
      : query.eq(
          "provider_updated_at",
          tracking.provider_updated_at
      );

  // Compare the previously retrieved provider status
  query = tracking.provider_status === null
      ? query.is("provider_status", null)
      : query.eq(
          "provider_status",
          tracking.provider_status
      );

  const { data, error } = await query
      .select(`
        id,
        application_id,
        provider,
        external_application_id,
        provider_application_id,
        reference_no,
        submission_state,
        provider_status,
        provider_updated_at
      `)
      .maybeSingle();

  if (error) {
    logDatabaseError(
        "Update provider status failed",
        error
    );

    throw new HttpError(
        500,
        "Unable to synchronize provider application status"
    );
  }

  return data as TrackingRecord | null;
}

// Synchronize an external application status
export async function syncExternalApplicationStatus(
    input: ApplicationStatusUpdate
): Promise<StatusSyncResult> {
  const update = validateStatusUpdate({ ...input });
  const supabase = createAdminClient();

  for (
      let attempt = 0;
      attempt < MAX_SYNC_ATTEMPTS;
      attempt++
  ) {
    const tracking = await getTrackingRecord(
        supabase,
        update
    );

    validateTrackingIdentity(
        tracking,
        update
    );

    const outcome = determineSyncOutcome(
        tracking,
        update
    );

    if (outcome === "outdated") {
      return buildSyncResult(
          tracking,
          "outdated"
      );
    }

    const updatedTracking = await applyStatusUpdate(
        supabase,
        tracking,
        update,
        outcome,
    );

    if (updatedTracking) {
      return buildSyncResult(
          updatedTracking,
          outcome,
      );
    }
  }

  throw new HttpError(
      409,
      "Application status changed during synchronization, please retry."
  );
}
