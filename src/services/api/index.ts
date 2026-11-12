// Mock JKM API
export { getJkmEligibilityCriteria, getAllJkmEligibilityCriteria } from "./jkmApi";

export type {
  JkmProgramCode,
  JkmEligibilityResponse,
  JkmAllEligibilityResponse
} from "./jkmApi";

// Mock STR API
export { getStrEligibilityCriteria } from "./strApi";

export type { StrEligibilityApiResponse } from "./strApi";
