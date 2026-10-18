import { DOSM_HOUSEHOLD_INCOME_API_URL, DOSM_HOUSEHOLD_POVERTY_API_URL } from "../constants/api";

type HouseholdIncomeApiResult = {
  date: string;
  income_mean: number;
  income_media: number;
};

type PovertyApiResult = {
  date: string;
  poverty_absolute: number;
  poverty_hardcore: number;
  poverty_relative: number;
};

export type HouseholdIncomeResult = {
  year: number;
  meanIncome: number;
  medianIncome: number;
};

export type PovertyResult = {
  year: number;
  absolutePovertyRate: number;
  hardcorePovertyRate: number;
  relativePovertyRate: number;
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

// TODO-1: Add 7-day persistent cache with in-memory cache + stale-data fallback
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

let householdIncomeCache: CacheEntry<HouseholdIncomeResult | null> | null = null;
let povertyCache: CacheEntry<PovertyResult | null> | null = null;

async function fetchLatestRecord<T extends { date: string }>(
    url: string
): Promise<T | null> {
  const response = await fetch(`${url}&sort=date:desc&limit=1`);

  if (!response.ok) {
    throw new Error(`Statistics lookup failed with status ${response.status}`);
  }

  const data: T[] = await response.json();

  if (data.length === 0) {
    return null;
  }

  return data[0];
}

export async function getLatestHouseholdIncome(): Promise<HouseholdIncomeResult | null> {
  if (householdIncomeCache && Date.now() < householdIncomeCache.expiresAt) {
    return householdIncomeCache.data;
  }

  const result = await fetchLatestRecord<HouseholdIncomeApiResult>(
      DOSM_HOUSEHOLD_INCOME_API_URL
  );

  const data: HouseholdIncomeResult | null = result
      ? {
        year: Number(result.date.slice(0, 4)),
        meanIncome: result.income_mean,
        medianIncome: result.income_media,
      }
      : null;

  householdIncomeCache = {
    data,
    expiresAt: Date.now() + CACHE_DURATION,
  };

  return data;
}

export async function getLatestPovertyStats(): Promise<PovertyResult | null> {
  if (povertyCache && Date.now() < povertyCache.expiresAt) {
    return povertyCache.data;
  }

  const result = await fetchLatestRecord<PovertyApiResult>(
      DOSM_HOUSEHOLD_POVERTY_API_URL
  );

  const data: PovertyResult | null = result
      ? {
        year: Number(result.date.slice(0, 4)),
        absolutePovertyRate: result.poverty_absolute,
        hardcorePovertyRate: result.poverty_hardcore,
        relativePovertyRate: result.poverty_relative,
      }
      : null;

  povertyCache = {
    data,
    expiresAt: Date.now() + CACHE_DURATION,
  };

  return data;
}
