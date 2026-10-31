module.exports = {
    rootDir: __dirname,
    testEnvironment: "node",
    testMatch: [
        "<rootDir>/sandbox/tests/**/*.supabase.test.ts",
    ],
    transform: {
        "^.+\\.[jt]sx?$": [
            "babel-jest",
            {
                babelrc: false,
                configFile: false,
                presets: [
                    [
                        "@babel/preset-env",
                        {
                            targets: {
                                node: "current",
                            },
                            modules: "commonjs",
                        },
                    ],
                    "@babel/preset-typescript",
                ],
            },
        ],
    },
    setupFiles: [
        "<rootDir>/sandbox/setupSupabaseTestEnv.cjs",
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
    ],
    testTimeout: 30000,
    clearMocks: true,
    reporters: [
        "default",
        [
            "jest-junit",
            {
                outputDirectory: "test-reports",
                outputName: "supabase-junit.xml",
                suiteName: "BantuanKu Real Supabase Tests",
            },
        ],
    ],
};
