import {HttpError} from "../../_shared/response.ts";

import {
  type JkmCommonMapperInput,
  mapCommonApplicationData,
  mapHousehold,
  mapNullableBoolean,
  mapNullableText,
  mapWelfareAssistance,
  requireCompleteHousehold,
} from "./common-mapper.ts";

import type {BaAdditionalCircumstances, BaApplicationData, BaProgramSpecificData,} from "../jkm-types.ts";

// BA-specific mapper input
export interface BaSpecificMapperInput {
  receivesOtherJkmMonthlyAssistance?: unknown;
  currentJkmAssistanceProgram?: unknown;

  additionalCircumstances?: {
    economicHardship?: unknown;
    healthRelatedNeeds?: unknown;
    dependentRelatedNeeds?: unknown;
    otherCircumstances?: unknown;
    description?: unknown;
  } | null;
}

export interface BaMapperInput
    extends JkmCommonMapperInput {
  baSpecificData: BaSpecificMapperInput;
}

// Additional circumstances
export function mapBaAdditionalCircumstances(
    input: BaSpecificMapperInput["additionalCircumstances"]
): BaAdditionalCircumstances {
  const circumstances: BaAdditionalCircumstances = {
    economicHardship: mapNullableBoolean(
        input?.economicHardship,
        "Economic hardship"
    ),

    healthRelatedNeeds: mapNullableBoolean(
        input?.healthRelatedNeeds,
        "Health-related needs"
    ),

    dependentRelatedNeeds: mapNullableBoolean(
        input?.dependentRelatedNeeds,
        "Dependent-related needs"
    ),

    otherCircumstances: mapNullableBoolean(
        input?.otherCircumstances,
        "Other circumstances"
    ),

    description: mapNullableText(
        input?.description,
        "Additional circumstances description",
        3000
    ),
  };

  // Other circumstances require an explanation
  if (
      circumstances.otherCircumstances === true &&
      circumstances.description === null
  ) {
    throw new HttpError(
        422,
        "Please provide a description of the other circumstances"
    );
  }

  return circumstances;
}

// BA program-specific data
export function mapBaProgramSpecificData(
    input: BaSpecificMapperInput
): BaProgramSpecificData {
  const receivesOtherJkmMonthlyAssistance =
      mapNullableBoolean(
          input.receivesOtherJkmMonthlyAssistance,
          "Receives other JKM monthly assistance"
      );

  const currentJkmAssistanceProgram =
      mapNullableText(
          input.currentJkmAssistanceProgram,
          "Current JKM assistance programme",
          200
      );

  // Existing monthly assistance requires a program name
  if (
      receivesOtherJkmMonthlyAssistance === true &&
      currentJkmAssistanceProgram === null
  ) {
    throw new HttpError(
        422,
        "Please provide the name of the current JKM assistance programme"
    );
  }

  // Reject contradictory declarations
  if (
      receivesOtherJkmMonthlyAssistance === false &&
      currentJkmAssistanceProgram !== null
  ) {
    throw new HttpError(
        422,
        "The existing JKM assistance declaration is inconsistent"
    );
  }

  return {
    receivesOtherJkmMonthlyAssistance,

    currentJkmAssistanceProgram,

    additionalCircumstances:
        mapBaAdditionalCircumstances(
            input.additionalCircumstances
        ),
  };
}

// Assemble BA application data
export function mapBaApplicationData(
    input: BaMapperInput
): BaApplicationData {
  // BA requires household information
  requireCompleteHousehold(input);

  // Map shared applicant information
  const commonData = mapCommonApplicationData(
      input,
      "BA",
      {
        includeEmployment: true,
      }
  );

  // Map required BA application sections
  return {
    ...commonData,

    household: mapHousehold(
        input.householdMembers
    ),

    welfareAssistance: mapWelfareAssistance(
        input.welfareAssistance
    ),

    programSpecificData:
        mapBaProgramSpecificData(
            input.baSpecificData
        ),
  };
}
