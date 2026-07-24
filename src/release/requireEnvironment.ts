const mode = process.argv[2];
const requirements: Record<string, string[]> = {
  postgres: ["TEST_DATABASE_URL"],
  e2e: ["E2E_BASE_URL", "E2E_DATABASE_URL"]
};

const names = mode ? requirements[mode] : undefined;
if (!names) {
  throw new Error("Expected release environment mode: postgres or e2e.");
}
const missing = names.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Release check requires: ${missing.join(", ")}`);
}
