import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.testing", override: true });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SEED_SUPABASE_SECRET_KEY;
const testPassword = process.env.SEED_TEST_PASSWORD;

if (!supabaseUrl || !supabaseSecretKey || !testPassword) {
  throw new Error("Missing Supabase testing environment variables.");
}

const expectedTestProjectUrl =
    "https://ojmrskkmhofezyheidqy.supabase.co";

if (supabaseUrl.replace(/\/$/, "") !== expectedTestProjectUrl) {
  throw new Error("Seeding is only allowed in the testing project.");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface HouseholdMember {
  fullName: string;
  relationship: "spouse" | "child" | "parent" | "sibling";
  dateOfBirth: string;
  isStudent?: boolean;
  studyMode?: "full_time" | "part_time";
  institutionType?: "ipta" | "ipts" | "school" | "other";
}

interface TestApplicant {
  testId: string;
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  maritalStatus: string | null;
  employmentStatus:
      | "employed"
      | "self_employed"
      | "unemployed"
      | "retired"
      | "not_working";
  stateTerritory: string;
  city: string;
  postcode: string;
  monthlyPersonalIncome: number | null;
  monthlyHouseholdIncome: number | null;
  incomeSource: string | null;
  householdMembersComplete: boolean | null;
  householdMembers?: HouseholdMember[];
  healthProfile?: Record<string, unknown>;
  livingArrangement?: Record<string, unknown>;
  welfareAssistance?: Record<string, unknown>;
  caregiver?: Record<string, unknown>;
}

const testApplicants: TestApplicant[] = [
  {
    testId: "TEST01",
    fullName: "Test Senior Low Income",
    dateOfBirth: "1956-04-15",
    gender: "male",
    maritalStatus: "widowed",
    employmentStatus: "retired",
    stateTerritory: "Selangor",
    city: "Shah Alam",
    postcode: "40000",
    monthlyPersonalIncome: 300,
    monthlyHouseholdIncome: 300,
    incomeSource: "pension",
    householdMembersComplete: true,
    livingArrangement: {
      lives_with_family: false,
      depends_on_family: false,
      depends_on_caregiver: false,
      is_in_institution: false,
    },
  },
  {
    testId: "TEST02",
    fullName: "Test Below Senior Age",
    dateOfBirth: "1971-06-20",
    gender: "female",
    maritalStatus: "single",
    employmentStatus: "not_working",
    stateTerritory: "Selangor",
    city: "Petaling Jaya",
    postcode: "46000",
    monthlyPersonalIncome: 300,
    monthlyHouseholdIncome: 300,
    incomeSource: "family_support",
    householdMembersComplete: true,
    livingArrangement: {
      is_in_institution: false,
    },
  },
  {
    testId: "TEST03",
    fullName: "Test Federal Territory Low Income",
    dateOfBirth: "1981-03-12",
    gender: "female",
    maritalStatus: "single",
    employmentStatus: "not_working",
    stateTerritory: "Kuala Lumpur",
    city: "Kuala Lumpur",
    postcode: "50000",
    monthlyPersonalIncome: 500,
    monthlyHouseholdIncome: 500,
    incomeSource: "family_support",
    householdMembersComplete: true,
  },
  {
    testId: "TEST04",
    fullName: "Test Existing JKM Recipient",
    dateOfBirth: "1976-09-10",
    gender: "male",
    maritalStatus: "single",
    employmentStatus: "not_working",
    stateTerritory: "Putrajaya",
    city: "Putrajaya",
    postcode: "62000",
    monthlyPersonalIncome: 400,
    monthlyHouseholdIncome: 400,
    incomeSource: "government_assistance",
    householdMembersComplete: true,
    welfareAssistance: {
      program_name: "Synthetic JKM Monthly Assistance",
      agency: "JKM",
      assistance_type: "monthly",
      monthly_amount: 400,
      is_active: true,
      start_date: "2026-01-01",
    },
  },
  {
    testId: "TEST05",
    fullName: "Test Assistive Equipment Applicant",
    dateOfBirth: "1991-07-18",
    gender: "female",
    maritalStatus: "single",
    employmentStatus: "not_working",
    stateTerritory: "Perak",
    city: "Ipoh",
    postcode: "30000",
    monthlyPersonalIncome: 500,
    monthlyHouseholdIncome: 500,
    incomeSource: "family_support",
    householdMembersComplete: true,
    healthProfile: {
      is_oku: true,
      oku_registered: true,
      disability_description: "Synthetic mobility impairment",
    },
  },
  {
    testId: "TEST06",
    fullName: "Test Caregiver Applicant",
    dateOfBirth: "1986-02-14",
    gender: "female",
    maritalStatus: "married",
    employmentStatus: "not_working",
    stateTerritory: "Johor",
    city: "Johor Bahru",
    postcode: "80000",
    monthlyPersonalIncome: 0,
    monthlyHouseholdIncome: 2200,
    incomeSource: "family_support",
    householdMembersComplete: true,
    householdMembers: [
      {
        fullName: "Test Elderly Parent",
        relationship: "parent",
        dateOfBirth: "1950-05-11",
      },
    ],
    livingArrangement: {
      lives_with_family: true,
      depends_on_caregiver: false,
    },
  },
  {
    testId: "TEST07",
    fullName: "Test Continuous Treatment Patient",
    dateOfBirth: "1976-01-25",
    gender: "male",
    maritalStatus: "single",
    employmentStatus: "not_working",
    stateTerritory: "Kedah",
    city: "Alor Setar",
    postcode: "05000",
    monthlyPersonalIncome: 500,
    monthlyHouseholdIncome: 500,
    incomeSource: "family_support",
    householdMembersComplete: true,
    healthProfile: {
      has_chronic_illness: true,
      chronic_illness_details: "Synthetic chronic illness",
      is_bedridden: false,
      requires_continuous_treatment: true,
      treatment_start_date: "2026-01-01",
    },
  },
  {
    testId: "TEST08",
    fullName: "Test Married Household",
    dateOfBirth: "1988-08-08",
    gender: "male",
    maritalStatus: "married",
    employmentStatus: "employed",
    stateTerritory: "Selangor",
    city: "Kajang",
    postcode: "43000",
    monthlyPersonalIncome: 2000,
    monthlyHouseholdIncome: 3500,
    incomeSource: "salary",
    householdMembersComplete: true,
    householdMembers: [
      {
        fullName: "Test Spouse",
        relationship: "spouse",
        dateOfBirth: "1990-04-12",
      },
      {
        fullName: "Test Child",
        relationship: "child",
        dateOfBirth: "2015-05-10",
        isStudent: true,
        studyMode: "full_time",
        institutionType: "school",
      },
    ],
  },
  {
    testId: "TEST09",
    fullName: "Test Single Low Income",
    dateOfBirth: "2001-03-21",
    gender: "female",
    maritalStatus: "single",
    employmentStatus: "employed",
    stateTerritory: "Melaka",
    city: "Melaka",
    postcode: "75000",
    monthlyPersonalIncome: 1800,
    monthlyHouseholdIncome: 1800,
    incomeSource: "salary",
    householdMembersComplete: true,
  },
  {
    testId: "TEST10",
    fullName: "Test Incomplete Applicant",
    dateOfBirth: "1995-10-10",
    gender: "male",
    maritalStatus: null,
    employmentStatus: "not_working",
    stateTerritory: "Pahang",
    city: "Kuantan",
    postcode: "25000",
    monthlyPersonalIncome: null,
    monthlyHouseholdIncome: null,
    incomeSource: null,
    householdMembersComplete: null,
  },
];

// Generate a unique synthetic identifier for database testing.
// This is not a real Malaysian NRIC.
function generateTestIdentificationNo(
    dateOfBirth: string,
    sequence: number
): string {
  const datePart = dateOfBirth.replaceAll("-", "").slice(2);
  const sequencePart = String(sequence).padStart(6, "0");

  return `${datePart}${sequencePart}`;
}

async function getExistingAuthUser(email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const existingUser = data.users.find(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return existingUser;
    }

    if (data.users.length < 100) {
      return null;
    }

    page++;
  }
}

async function createTestAuthUser(email: string) {
  const existingUser = await getExistingAuthUser(email);

  if (existingUser) {
    return existingUser.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: testPassword,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(
        `Failed to create Auth user: ${error?.message ?? "Unknown error"}`
    );
  }

  return data.user.id;
}

async function insertRecord(
    tableName: string,
    record: Record<string, unknown>
) {
  const { error } = await supabase.from(tableName).insert(record);

  if (error) {
    throw new Error(`Failed to insert ${tableName}: ${error.message}`);
  }
}

async function seedTestApplicants(
    applicant: TestApplicant,
    index: number
) {
  const email = `bantuanku.${applicant.testId.toLowerCase()}@example.com`;

  console.log(`Seeding ${applicant.testId}...`);

  const userId = await createTestAuthUser(email);

  const { data: existingProfile, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingProfile) {
    console.log(`${applicant.testId} already exists. Skipping.`);
    return;
  }

  const identificationNo = generateTestIdentificationNo(
      applicant.dateOfBirth,
      index + 1
  );

  const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: applicant.fullName,
        identification_no: identificationNo,
        date_of_birth: applicant.dateOfBirth,
        gender: applicant.gender,
        citizenship: "malaysian",
        marital_status: applicant.maritalStatus,
        employment_status: applicant.employmentStatus,
        email,
        preferred_language: "en",
      })
      .select("id")
      .single();

  if (profileError || !profile) {
    throw new Error(
        `Failed to create profile: ${profileError?.message ?? "Unknown error"}`
    );
  }

  const profileId = profile.id;

  await insertRecord("addresses", {
    profile_id: profileId,
    address_line_1: `${index + 1} Jalan Ujian`,
    postcode: applicant.postcode,
    city: applicant.city,
    state_territory: applicant.stateTerritory,
    country_code: "MY",
    address_type: "residential",
    is_primary: true,
  });

  await insertRecord("financial_profiles", {
    profile_id: profileId,
    monthly_personal_income: applicant.monthlyPersonalIncome,
    monthly_household_income: applicant.monthlyHouseholdIncome,
    income_source: applicant.incomeSource,
  });

  if (applicant.householdMembers?.length) {
    for (const [memberIndex, member] of applicant.householdMembers.entries()) {
      await insertRecord("household_members", {
        profile_id: profileId,
        full_name: member.fullName,
        relationship: member.relationship,
        date_of_birth: member.dateOfBirth,
        is_student: member.isStudent ?? false,
        study_mode: member.studyMode ?? null,
        institution_type: member.institutionType ?? null,
        citizenship: "malaysian",
        identification_no: generateTestIdentificationNo(
            member.dateOfBirth,
            1000 + index * 10 + memberIndex
        ),
      });
    }
  }

  if (applicant.healthProfile) {
    await insertRecord("health_profiles", {
      profile_id: profileId,
      ...applicant.healthProfile,
    });
  }

  if (applicant.livingArrangement) {
    await insertRecord("living_arrangements", {
      profile_id: profileId,
      ...applicant.livingArrangement,
    });
  }

  if (applicant.welfareAssistance) {
    await insertRecord("welfare_assistance", {
      profile_id: profileId,
      ...applicant.welfareAssistance,
    });
  }

  if (applicant.caregiver) {
    await insertRecord("caregivers", {
      profile_id: profileId,
      ...applicant.caregiver,
    });
  }

  // Update only after household member records have been inserted.
  if (applicant.householdMembersComplete !== null) {
    const { error } = await supabase
        .from("profiles")
        .update({
          household_members_complete: applicant.householdMembersComplete,
        })
        .eq("id", profileId);

    if (error) {
      throw error;
    }
  }

  console.log(`${applicant.testId} seeded successfully.`);
}

async function main() {
  console.log("Starting BantuanKu test applicant seeding...");

  for (const [index, applicant] of testApplicants.entries()) {
    await seedTestApplicants(applicant, index);
  }

  // for (const [index, applicant] of testApplicants.slice(0, 1).entries()) {
  //   await seedTestApplicants(applicant, index);
  // }

  console.log("Test applicant seeding completed.");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
