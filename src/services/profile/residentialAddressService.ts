import { supabase } from "../../lib/supabase";
import type { RegisterResidenceFormData } from "../../schemas/registration";
import { getCurrentProfileId } from "./profileService";
import { STATE_TERRITORY_MAP } from "../../constants/registration";

export type ResidentialAddress = {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  postcode: string;
  city: string;
  stateTerritory: string;
  countryCode: string;
};

export const getResidentialAddress =
    async (): Promise<ResidentialAddress | null> => {
      const profileId = await getCurrentProfileId();

      const {
        data,
        error
      } = await supabase
          .from("addresses")
          .select(
              "id, address_line_1, address_line_2, postcode, city, state_territory, country_code"
          )
          .eq("profile_id", profileId)
          .eq("address_type", "residential")
          .eq("is_primary", true)
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        postcode: data.postcode,
        city: data.city,
        stateTerritory: data.state_territory,
        countryCode: data.country_code,
      };
    };

export const updateResidentialAddress =
    async (
        addressId: string,
        values: RegisterResidenceFormData
    ): Promise<void> => {
      const profileId = await getCurrentProfileId();

      const {
        data,
        error
      } = await supabase
          .from("addresses")
          .update({
            address_line_1: values.addressLine1.trim(),
            address_line_2: values.addressLine2?.trim() || null,
            postcode: values.postcode,
            city: values.city.trim(),
            state_territory: STATE_TERRITORY_MAP[values.stateTerritory as keyof typeof STATE_TERRITORY_MAP],
          })
          .eq("id", addressId)
          .eq("profile_id", profileId)
          .eq("address_type", "residential")
          .eq("is_primary", true)
          .select("id")
          .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Residential address not found.");
      }
    };
