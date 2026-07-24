import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readJobsPayload } from "../src/server/server.js";

test("readJobsPayload reports missing data file as an empty local dataset", async () => {
  const result = await readJobsPayload(path.join(os.tmpdir(), "internship-helper-missing.json"));

  assert.equal(result.ok, true);
  assert.equal(result.state, "missing");
  assert.deepEqual(result.jobs, []);
});

test("readJobsPayload distinguishes a normal empty dataset", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "internship-helper-server-"));
  const filePath = path.join(dir, "internships.json");
  await fs.writeFile(filePath, "[]", "utf8");

  const result = await readJobsPayload(filePath);

  assert.equal(result.ok, true);
  assert.equal(result.state, "empty");
  assert.deepEqual(result.jobs, []);
});

test("readJobsPayload reports damaged JSON without throwing an Express default error", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "internship-helper-server-"));
  const filePath = path.join(dir, "internships.json");
  await fs.writeFile(filePath, "{broken", "utf8");

  const result = await readJobsPayload(filePath);

  assert.equal(result.ok, false);
  assert.equal(result.state, "invalid-json");
  assert.match(result.message, /JSON/);
});

test("readJobsPayload rejects non-array top-level data", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "internship-helper-server-"));
  const filePath = path.join(dir, "internships.json");
  await fs.writeFile(filePath, "{\"jobs\":[]}", "utf8");

  const result = await readJobsPayload(filePath);

  assert.equal(result.ok, false);
  assert.equal(result.state, "invalid-shape");
  assert.match(result.message, /数组/);
});
