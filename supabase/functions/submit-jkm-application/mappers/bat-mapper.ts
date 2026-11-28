import { HttpError } from "../../_shared/response.ts";

import {
  mapCommonApplicationData,
  mapHousehold,
  mapHealth,
  mapRequiredText,
  mapNullableText,
  mapNullableBoolean,
  mapNullableNumber,
  mapNullableIdentificationNo,
  requireCompleteHousehold,
  type JkmCommonMapperInput,
  type JkmSourceRecord,
} from "./common-mapper.ts";

import type {
  JkmApplicantData,
  JkmHealthData,
  BatBeneficiaryType,
  BatBeneficiaryData,
  BatEquipmentData,
  BatRecommendingAuthority,
  BatRecommendationData,
  BatProgramSpecificData,
  BatApplicationData,
} from "../jkm-types.ts";

// BAT-specific mapper input
export interface BatBeneficiaryMapperInput {
  type: unknown;
  fullName?: unknown;
  identificationNo?: unknown;
  relationshipToApplicant?: unknown;

  health?: JkmSourceRecord | null;
}

export interface BatEquipmentMapperInput {
  equipmentType: unknown;
  equipmentDescription: unknown;
  purpose: unknown;
  estimatedCost?: unknown;
  supplierName?: unknown;
  quotationAvailable?: unknown;
}

export interface BatRecommendationMapperInput {
  recommendationAvailable?: unknown;
  recommendingAuthority?: unknown;
  recommendationOfficerName?: unknown;
  recommendationInstitution?: unknown;
  recommendationDetails?: unknown;
}

export interface BatSpecificMapperInput {
  beneficiary: BatBeneficiaryMapperInput;

  functionalLimitationDescription?: unknown;

  equipment: BatEquipmentMapperInput;

  recommendation: BatRecommendationMapperInput;

  additionalJustification?: unknown;
}

export interface BatMapperInput
    extends JkmCommonMapperInput {
  batSpecificData: BatSpecificMapperInput;
}

// BAT beneficiary type
function mapBatBeneficiaryType(
    value: unknown
): BatBeneficiaryType {
  if (
      value === "applicant" ||
      value === "dependent"
  ) {
    return value;
  }

  throw new HttpError(
      422,
      "Please select a valid BAT beneficiary type"
  );
}

// BAT recommending authority
function mapBatRecommendingAuthority(
    value: unknown
): BatRecommendingAuthority | null {
  const authority = mapNullableText(
      value,
      "Recommending authority",
      50
  );

  if (authority === null) {
    return null;
  }

  if (
      authority === "medical_officer" ||
      authority === "jkm_officer" ||
      authority === "other"
  ) {
    return authority;
  }

  throw new HttpError(
      422,
      "Invalid recommending authority"
  );
}

// BAT beneficiary information
export function mapBatBeneficiary(
    input: BatBeneficiaryMapperInput,
    applicant: JkmApplicantData,
    applicantHealth: JkmHealthData
): BatBeneficiaryData {
  const type = mapBatBeneficiaryType(
      input.type
  );

  // Applicant is also the beneficiary
  if (type === "applicant") {
    const declaredName = mapNullableText(
        input.fullName,
        "Beneficiary full name",
        150
    );

    const declaredIdentificationNo =
        mapNullableIdentificationNo(
            input.identificationNo,
            "Beneficiary identification number"
        );

    if (
        declaredName !== null &&
        declaredName !== applicant.fullName
    ) {
      throw new HttpError(
          422,
          "The beneficiary name must match the applicant name"
      );
    }

    if (
        declaredIdentificationNo !== null &&
        declaredIdentificationNo !==
        applicant.identificationNo
    ) {
      throw new HttpError(
          422,
          "The beneficiary identification number must match the applicant identification number"
      );
    }

    return {
      type,

      fullName: applicant.fullName,

      identificationNo:
      applicant.identificationNo,

      relationshipToApplicant: null,

      health: applicantHealth,
    };
  }

  // Applicant is applying for a dependent
  const fullName = mapRequiredText(
      input.fullName,
      "Dependent beneficiary full name",
      150
  );

  const identificationNo =
      mapNullableIdentificationNo(
          input.identificationNo,
          "Dependent beneficiary identification number"
      );

  const relationshipToApplicant =
      mapRequiredText(
          input.relationshipToApplicant,
          "Beneficiary relationship to applicant",
          50
      );

  // The dependent must be a different individual
  if (
      identificationNo !== null &&
      identificationNo ===
      applicant.identificationNo
  ) {
    throw new HttpError(
        422,
        "The dependent beneficiary must not have the same identification number as the applicant"
    );
  }

  return {
    type,

    fullName,

    identificationNo,

    relationshipToApplicant,

    // Never substitute the applicant's health information for a dependent beneficiary
    health: mapHealth(
        input.health ?? null
    ),
  };
}

// BAT equipment information
export function mapBatEquipment(
    input: BatEquipmentMapperInput
): BatEquipmentData {
  return {
    equipmentType: mapRequiredText(
        input.equipmentType,
        "Equipment type",
        150
    ),

    equipmentDescription: mapRequiredText(
        input.equipmentDescription,
        "Equipment description",
        3000
    ),

    purpose: mapRequiredText(
        input.purpose,
        "Equipment purpose",
        3000
    ),

    estimatedCost: mapNullableNumber(
        input.estimatedCost,
        "Estimated equipment cost"
    ),

    supplierName: mapNullableText(
        input.supplierName,
        "Equipment supplier name",
        200
    ),

    quotationAvailable: mapNullableBoolean(
        input.quotationAvailable,
        "Equipment quotation availability"
    ),
  };
}

// BAT recommendation information
export function mapBatRecommendation(
    input: BatRecommendationMapperInput
): BatRecommendationData {
  const recommendation: BatRecommendationData = {
    recommendationAvailable: mapNullableBoolean(
        input.recommendationAvailable,
        "Recommendation availability"
    ),

    recommendingAuthority:
        mapBatRecommendingAuthority(
            input.recommendingAuthority
        ),

    recommendationOfficerName: mapNullableText(
        input.recommendationOfficerName,
        "Recommendation officer name",
        150
    ),

    recommendationInstitution: mapNullableText(
        input.recommendationInstitution,
        "Recommendation institution",
        200
    ),

    recommendationDetails: mapNullableText(
        input.recommendationDetails,
        "Recommendation details",
        3000
    ),
  };

  // Available recommendations require an authority
  if (
      recommendation.recommendationAvailable === true &&
      recommendation.recommendingAuthority === null
  ) {
    throw new HttpError(
        422,
        "Please specify the recommending authority"
    );
  }

  // Other recommending authorities require details
  if (
      recommendation.recommendingAuthority === "other" &&
      recommendation.recommendationDetails === null
  ) {
    throw new HttpError(
        422,
        "Please provide details of the recommending authority"
    );
  }

  return recommendation;
}

// BAT program-specific data
export function mapBatProgramSpecificData(
    input: BatSpecificMapperInput,
    applicant: JkmApplicantData,
    applicantHealth: JkmHealthData
): BatProgramSpecificData {
  const beneficiary = mapBatBeneficiary(
      input.beneficiary,
      applicant,
      applicantHealth
  );

  const equipment = mapBatEquipment(
      input.equipment
  );

  const recommendation = mapBatRecommendation(
      input.recommendation
  );

  const additionalJustification = mapNullableText(
      input.additionalJustification,
      "Additional equipment justification",
      3000
  );

  // Equipment exceeding RM20,000 requires justification
  if (
      equipment.estimatedCost !== null &&
      equipment.estimatedCost > 20000 &&
      additionalJustification === null
  ) {
    throw new HttpError(
        422,
        "Additional justification is required for equipment exceeding RM20,000"
    );
  }

  return {
    beneficiary,

    functionalLimitationDescription: mapNullableText(
        input.functionalLimitationDescription,
        "Functional limitation description",
        3000
    ),

    equipment,

    recommendation,

    additionalJustification,
  };
}

// Assemble BAT application data
export function mapBatApplicationData(
    input: BatMapperInput
): BatApplicationData {
  // BAT requires household information
  requireCompleteHousehold(input);

  // Map shared applicant information
  const commonData = mapCommonApplicationData(
      input,
      "BAT",
      {
        includeEmployment: true,
      }
  );

  const applicantHealth = mapHealth(
      input.healthProfile
  );

  // Map required BAT application sections
  return {
    ...commonData,

    household: mapHousehold(
        input.householdMembers
    ),

    health: applicantHealth,

    programSpecificData:
        mapBatProgramSpecificData(
            input.batSpecificData,
            commonData.applicant,
            applicantHealth
        ),
  };
}
