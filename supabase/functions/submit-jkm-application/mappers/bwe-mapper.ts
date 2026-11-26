import { HttpError } from "../../_shared/response.ts";

import {
  mapCommonApplicationData,
  mapHousehold,
  mapLivingArrangement,
  mapNullableBoolean,
  mapNullableText,
  mapNullableNumber,
  requireCompleteHousehold,
  type JkmCommonMapperInput,
} from "./common-mapper.ts";

import type {
  BweProgramSpecificData,
  BweApplicationData,
} from "../jkm-types.ts";

// BWE-specific mapper input
export interface BweSpecificMapperInput {
  hasChildren?: unknown;
  dependsOnFamilyOrCaregiver?: unknown;
  familyOrCaregiverMonthlyIncome?: unknown;
  incomeDeclarationDetails?: unknown;
  specialConsiderationRequested: unknown;
  specialConsiderationReason?: unknown;
}

export interface BweMapperInput
    extends JkmCommonMapperInput {
  bweSpecificData: BweSpecificMapperInput;
}

// BWE program-specific data
export function mapBweProgramSpecificData(
    input: BweSpecificMapperInput
): BweProgramSpecificData {
  const specialConsiderationRequested =
      mapNullableBoolean(
          input.specialConsiderationRequested,
          "Special consideration requested"
      );

  // Special consideration requires an explicit declaration
  if (specialConsiderationRequested === null) {
    throw new HttpError(
        422,
        "Please indicate whether special consideration is requested"
    );
  }

  const specialConsiderationReason =
      mapNullableText(
          input.specialConsiderationReason,
          "Special consideration reason",
          3000
      );

  // A reason is required when special consideration is requested
  if (
      specialConsiderationRequested &&
      specialConsiderationReason === null
  ) {
    throw new HttpError(
        422,
        "Please provide a reason for requesting special consideration"
    );
  }

  return {
    hasChildren: mapNullableBoolean(
        input.hasChildren,
        "Applicant has children"
    ),

    dependsOnFamilyOrCaregiver: mapNullableBoolean(
        input.dependsOnFamilyOrCaregiver,
        "Depends on family or caregiver"
    ),

    familyOrCaregiverMonthlyIncome: mapNullableNumber(
        input.familyOrCaregiverMonthlyIncome,
        "Family or caregiver monthly income"
    ),

    incomeDeclarationDetails: mapNullableText(
        input.incomeDeclarationDetails,
        "Income declaration details",
        3000
    ),

    specialConsiderationRequested,

    specialConsiderationReason,
  };
}

// Assemble BWE application data
export function mapBweApplicationData(
    input: BweMapperInput
): BweApplicationData {
  // BWE requires household information
  requireCompleteHousehold(input);

  // Map shared applicant information
  const commonData = mapCommonApplicationData(
      input,
      "BWE"
  );

  // Map required BWE application sections
  return {
    ...commonData,

    household: mapHousehold(
        input.householdMembers
    ),

    livingArrangement: mapLivingArrangement(
        input.livingArrangement
    ),

    programSpecificData:
        mapBweProgramSpecificData(
            input.bweSpecificData
        ),
  };
}
