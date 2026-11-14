export interface EligibilityTestResult {
  programCode: string;
  status: string | null;
  error?: string | null;
  matchedRuleIds?: string[];
  missingInformation?: Array<{
    field?: string;
    description?: string;
  }>;
  unmetConditions?: Array<{
    field?: string;
    description?: string;
  }>;
}

export function logEligibilityTestReport(
    accountId: string,
    results: EligibilityTestResult[]
): void {
  if (!__DEV__) {
    return;
  }

  const line = "=".repeat(46);
  const divider = "-".repeat(46);

  const report: string[] = [
    line,
    " BANTUANKU - ELIGIBILITY TEST REPORT",
    line,
    `Account: ${accountId}`,
    `Programs assessed: ${results.length}`,
    "",
  ];

  for (const result of results) {
    report.push(
        `${result.programCode.padEnd(4)} | ${
            result.status
                ? result.status.replace(/_/g, " ").toUpperCase()
                : "ASSESSMENT FAILED"
        }`
    );
  }

  report.push("", divider, "ASSESSMENT DETAILS", divider);

  for (const result of results) {
    const uniqueMissingFields = [
      ...new Set(
          result.missingInformation?.map(
              (item) => item.field ?? item.description ?? "Unknown"
          ) ?? []
      ),
    ];

    report.push(
        "",
        `[${result.programCode}]`,
        `Status: ${result.status ?? "Assessment failed"}`,
        `Matched rules: ${result.matchedRuleIds?.join(", ") || "None"}`,
        `Missing information: ${uniqueMissingFields.length}`,
        `Failed conditions: ${result.unmetConditions?.length ?? "Not provided"}`,
        `Assessment error: ${result.error ?? "None"}`
    );

    if (uniqueMissingFields.length > 0) {
      report.push("Missing fields:");

      for (const field of uniqueMissingFields) {
        report.push(` - ${field}`);
      }
    }
  }

  report.push(line);

  console.log(report.join("\n"));
}
