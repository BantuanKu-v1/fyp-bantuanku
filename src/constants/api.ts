// Link: https://data.gov.my/data-catalogue/poskod
export const DATA_GOV_MY_API_URL = "https://api.data.gov.my/data-catalogue"; // Used in postcodeService.ts

// Link: https://open.dosm.gov.my/data-catalogue/hh_poverty
export const DOSM_HOUSEHOLD_INCOME_API_URL = `${DATA_GOV_MY_API_URL}?id=hh_income`;

// Link: https://open.dosm.gov.my/data-catalogue/hh_income
export const DOSM_HOUSEHOLD_POVERTY_API_URL = `${DATA_GOV_MY_API_URL}?id=hh_poverty`;
