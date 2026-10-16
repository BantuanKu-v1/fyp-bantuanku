module.exports = {
    preset: "jest-expo",
    testMatch: [
        "**/__tests__/**/*.(test|spec).(ts|tsx)",
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
    ],
    collectCoverageFrom: [
        "src/schemas/**/*.{ts,tsx}",
        "src/utils/**/*.{ts,tsx}",
        "src/services/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
        "!**/*.d.ts",
    ],
    coverageDirectory: "coverage",
    coverageReporters: [
        "text",
        "html",
        "lcov",
        "json-summary",
    ],
    reporters: [
        "default",
        [
            "jest-junit",
            {
                outputDirectory: "test-reports",
                outputName: "junit.xml",
                suiteName: "BantuanKu Automated Tests",
            },
        ],
    ],
};
