import { HttpError } from "../_shared/response.ts";
import { requiredUuid } from "../_shared/validators.ts";

import {
  mapBaApplicationData,
  type BaMapperInput
} from "./mappers/ba-mapper.ts";

import {
  mapBatApplicationData,
  type BatMapperInput,
} from "./mappers/bat-mapper.ts";

import {
  mapBptApplicationData,
  type BptMapperInput,
} from "./mappers/bpt-mapper.ts";

import {
  mapBweApplicationData,
  type BweMapperInput,
} from "./mappers/bwe-mapper.ts";

import type {
  JkmProgramCode,
  JkmApplicationPayload,
} from "./jkm-types.ts";

export const JKM_SUPPORTED_PROGRAM_CODES: readonly JkmProgramCode[] = ["BA", "BAT", "BPT", "BWE"];

export interface JkmBaMapperInput extends BaMapperInput {
  applicationId: string;
  programCode: "BA";
}

export interface JkmBatMapperInput
    extends BatMapperInput {
  applicationId: string;
  programCode: "BAT";
}

export interface JkmBptMapperInput
    extends BptMapperInput {
  applicationId: string;
  programCode: "BPT";
}

export interface JkmBweMapperInput
    extends BweMapperInput {
  applicationId: string;
  programCode: "BWE";
}

export type JkmMapperInput =
    | JkmBaMapperInput
    | JkmBatMapperInput
    | JkmBptMapperInput
    | JkmBweMapperInput;

// Validate supported JKM program
export function isJkmProgramCode(
    value: unknown
): value is JkmProgramCode {
  return (
      typeof value === "string" &&
      JKM_SUPPORTED_PROGRAM_CODES.some(
          (programCode) => programCode === value
      )
  );
}

// Normalize and validate program code
export function normalizeJkmProgramCode(
    value: unknown
): JkmProgramCode {
  if (typeof value !== "string") {
    throw new HttpError(
        422,
        "Invalid JKM program code"
    );
  }

  const programCode = value.trim().toUpperCase();

  if (!isJkmProgramCode(programCode)) {
    throw new HttpError(
        422,
        "Unsupported JKM program"
    );
  }

  return programCode;
}

// Construct JKM application payload
export function mapToJkmApplication(
    input: JkmMapperInput
): JkmApplicationPayload {
  const externalApplicationId = requiredUuid(
      input.applicationId,
      "application ID"
  );

  switch (input.programCode) {
    // BAP
    case "BA": {
      const applicationData = mapBaApplicationData(input);

      return {
        externalApplicationId,
        programCode: "BA",
        applicantName: applicationData.applicant.fullName,
        applicantIdentificationNo: applicationData.applicant.identificationNo,
        applicationData,
      };
    }

    // BAT
    case "BAT": {
      const applicationData = mapBatApplicationData(input);

      return {
        externalApplicationId,
        programCode: "BAT",
        applicantName: applicationData.applicant.fullName,
        applicantIdentificationNo: applicationData.applicant.identificationNo,
        applicationData,
      };
    }

    // BPT
    case "BPT": {
      const applicationData = mapBptApplicationData(input);

      return {
        externalApplicationId,
        programCode: "BPT",
        applicantName: applicationData.applicant.fullName,
        applicantIdentificationNo: applicationData.applicant.identificationNo,
        applicationData,
      };
    }

    // BWE
    case "BWE": {
      const applicationData = mapBweApplicationData(input);

      return {
        externalApplicationId,
        programCode: "BWE",
        applicantName: applicationData.applicant.fullName,
        applicantIdentificationNo: applicationData.applicant.identificationNo,
        applicationData,
      };
    }

    default:
      throw new HttpError(
          422,
          "Unsupported JKM program"
      );
  }
}
