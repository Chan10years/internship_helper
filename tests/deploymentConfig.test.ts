import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("local database configuration pins PostgreSQL 17 and persists its data", async () => {
  const compose = await fs.readFile("compose.yaml", "utf8");

  assert.match(compose, /postgres:17\.10/);
  assert.match(compose, /healthcheck:/);
  assert.match(compose, /postgres_data:/);
});

test("environment template documents every required runtime secret", async () => {
  const template = await fs.readFile(".env.example", "utf8");

  assert.match(template, /^DATABASE_URL=/m);
  assert.match(template, /^SESSION_SECRET=/m);
  assert.match(template, /^POSTGRES_PASSWORD=/m);
  assert.doesNotMatch(template, /SESSION_SECRET=.{32,}/);
});

test("project pins the approved Node.js runtime", async () => {
  const version = await fs.readFile(".node-version", "utf8");

  assert.equal(version.trim(), "24.14.1");
});

test("deployment image runs the compiled modular application as a non-root user", async () => {
  const dockerfile = await fs.readFile("Dockerfile", "utf8");

  assert.match(dockerfile, /FROM node:24\.14\.1-alpine/);
  assert.match(dockerfile, /npm ci --omit=dev/);
  assert.match(dockerfile, /USER node/);
  assert.match(dockerfile, /dist\/src\/server\/server\.js/);
});

test("compose starts migration before the application and checks readiness", async () => {
  const compose = await fs.readFile("compose.yaml", "utf8");

  assert.match(compose, /^  migrate:/m);
  assert.match(compose, /^  app:/m);
  assert.match(compose, /service_completed_successfully/);
  assert.match(compose, /\/health\/ready/);
});
