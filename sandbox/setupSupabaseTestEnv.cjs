const path = require("node:path");
const fs = require("node:fs");
const dotenv = require("dotenv");

const envPath = path.resolve(
    __dirname,
    ".supabase-test.env"
);

if (!fs.existsSync(envPath)) {
    throw new Error(
        `Supabase test environment file not found: ${envPath}`
    );
}

const result = dotenv.config({
    path: envPath,
    quiet: true,
    override: true,
});

if (result.error) {
    throw result.error;
}

const requiredVariables = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_KEY",
    "TEST_APPLICANT_EMAIL",
    "TEST_APPLICANT_PASSWORD",
];

const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]
);

if (missingVariables.length > 0) {
    throw new Error(
        `Missing Supabase test variables: ${missingVariables.join(", ")}`
    );
}
