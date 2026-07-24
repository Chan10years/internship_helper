import test from "node:test";
import assert from "node:assert/strict";
import * as configModule from "../src/config.js";

test("config module exposes explicit runtime environment validation", () => {
  const exports = configModule as unknown as Record<string, unknown>;

  assert.equal(typeof exports.readRuntimeConfig, "function");
});

test("readRuntimeConfig validates and normalizes the required server settings", () => {
  const result = configModule.readRuntimeConfig({
    DATABASE_URL: "postgres://app:secret@localhost:5432/internship_helper",
    SESSION_SECRET: "0123456789abcdef0123456789abcdef",
    NODE_ENV: "production",
    PORT: "4100"
  });

  assert.deepEqual(result, {
    databaseUrl: "postgres://app:secret@localhost:5432/internship_helper",
    sessionSecret: "0123456789abcdef0123456789abcdef",
    nodeEnv: "production",
    port: 4100,
    isProduction: true
  });
});

test("readRuntimeConfig rejects missing secrets instead of using unsafe defaults", () => {
  assert.throws(
    () => configModule.readRuntimeConfig({ DATABASE_URL: "postgres://localhost/app" }),
    /SESSION_SECRET/
  );
});
