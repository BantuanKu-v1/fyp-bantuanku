import { StateTerritoryValue } from "../constants/profile/registration.ts";
import { DATA_GOV_MY_API_URL } from "../constants/api/api.ts";

type PostcodeApiResult = {
  postcode: string;
  city: string;
  state: string;
};

export type PostcodeResult = {
  postcode: string;
  city: string;
  stateTerritory: StateTerritoryValue;
};

const STATE_MAP: Record<string, StateTerritoryValue> = {
  Johor: "johor",
  Kedah: "kedah",
  Kelantan: "kelantan",
  Melaka: "melaka",
  "Negeri Sembilan": "negeri_sembilan",
  Pahang: "pahang",
  "Pulau Pinang": "penang",
  Perak: "perak",
  Perlis: "perlis",
  Sabah: "sabah",
  Sarawak: "sarawak",
  Selangor: "selangor",
  Terengganu: "terengganu",
  "W.P. Kuala Lumpur": "kuala_lumpur",
  "W.P. Labuan": "labuan",
  "W.P. Putrajaya": "putrajaya",
};

export async function lookupPostcode(
    postcode: string
): Promise<PostcodeResult | null> {
  const filter = encodeURIComponent(`${postcode}@postcode`);
  const POSTCODE_DATASET_ID = "poskod";

  const response = await fetch(
      `${DATA_GOV_MY_API_URL}?id=${POSTCODE_DATASET_ID}&filter=${filter}&limit=10`
  );

  if (!response.ok) {
    throw new Error(
        `Postcode lookup failed with status ${response.status}`
    );
  }

  const data: PostcodeApiResult[] = await response.json();

  if (data.length === 0) {
    return null;
  }

  const result = data[0];
  const stateTerritory = STATE_MAP[result.state];

  if (!stateTerritory) {
    throw new Error(
        `Unsupported postcode state: ${result.state}`
    );
  }

  return {
    postcode: result.postcode,
    city: result.city,
    stateTerritory
  };
}
