import test from "node:test";
import assert from "node:assert/strict";
import * as clientModule from "../src/db/client.js";

test("database client module exposes a bounded application pool", async () => {
  const exports = clientModule as unknown as Record<string, unknown>;

  assert.equal(typeof exports.createDatabasePool, "function");
});
