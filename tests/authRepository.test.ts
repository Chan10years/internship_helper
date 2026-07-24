import test from "node:test";
import assert from "node:assert/strict";
import { PostgresAuthRepository } from "../src/auth/authRepository.js";

type QueryResult = { rows: Array<Record<string, unknown>>; rowCount: number };

class FakeClient {
  readonly calls: Array<{ sql: string; params?: readonly unknown[] }> = [];

  constructor(private readonly results: QueryResult[]) {}

  async query(sql: string, params?: readonly unknown[]): Promise<QueryResult> {
    this.calls.push({ sql, params });
    if (/^(begin|commit|rollback)$/i.test(sql.trim())) {
      return { rows: [], rowCount: 0 };
    }
    const result = this.results.shift();
    if (!result) {
      throw new Error(`Missing fake result for SQL: ${sql}`);
    }
    return result;
  }

  release(): void {}
}

class FakePool {
  constructor(readonly client: FakeClient) {}
  async connect(): Promise<FakeClient> {
    return this.client;
  }
  async query(sql: string, params?: readonly unknown[]): Promise<QueryResult> {
    return this.client.query(sql, params);
  }
}

test("registration locks and consumes one valid invitation in one transaction", async () => {
  const client = new FakeClient([
    { rows: [{ id: "3" }], rowCount: 1 },
    {
      rows: [{ id: "7", email: "student@example.com", display_name: "小林", role: "user", auth_version: 1 }],
      rowCount: 1
    },
    { rows: [], rowCount: 1 }
  ]);
  const repository = new PostgresAuthRepository(new FakePool(client));

  const user = await repository.registerWithInvitation({
    email: "student@example.com",
    displayName: "小林",
    passwordHash: "hash",
    inviteHash: "invite-hash",
    now: new Date("2026-07-22T08:00:00Z")
  });

  assert.deepEqual(user, {
    id: "7",
    email: "student@example.com",
    displayName: "小林",
    role: "user",
    authVersion: 1
  });
  assert.match(client.calls[1].sql, /for update/i);
  assert.deepEqual(client.calls[1].params, ["invite-hash", new Date("2026-07-22T08:00:00Z")]);
  assert.match(client.calls.at(-1)?.sql ?? "", /^commit$/i);
});

test("registration rolls back without creating a user when invitation is unavailable", async () => {
  const client = new FakeClient([{ rows: [], rowCount: 0 }]);
  const repository = new PostgresAuthRepository(new FakePool(client));

  const user = await repository.registerWithInvitation({
    email: "student@example.com",
    displayName: "小林",
    passwordHash: "hash",
    inviteHash: "used-or-expired",
    now: new Date()
  });

  assert.equal(user, null);
  assert.match(client.calls.at(-1)?.sql ?? "", /^rollback$/i);
  assert.equal(client.calls.some(({ sql }) => /insert into users/i.test(sql)), false);
});

test("password reset consumes its token, rotates auth version, and removes old sessions", async () => {
  const client = new FakeClient([
    { rows: [{ id: "11", user_id: "7" }], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [], rowCount: 2 }
  ]);
  const repository = new PostgresAuthRepository(new FakePool(client));

  const reset = await repository.consumePasswordReset({
    tokenHash: "reset-hash",
    passwordHash: "new-password-hash",
    now: new Date("2026-07-22T08:00:00Z")
  });

  assert.equal(reset, true);
  assert.equal(client.calls.some(({ sql }) => /auth_version\s*=\s*auth_version\s*\+\s*1/i.test(sql)), true);
  assert.equal(client.calls.some(({ sql }) => /delete from web_sessions/i.test(sql)), true);
  assert.match(client.calls.at(-1)?.sql ?? "", /^commit$/i);
});

test("user lookup is parameterized and maps database names", async () => {
  const client = new FakeClient([{
    rows: [{
      id: "7",
      email: "student@example.com",
      password_hash: "hash",
      display_name: "小林",
      role: "admin",
      is_active: true,
      auth_version: 4
    }],
    rowCount: 1
  }]);
  const repository = new PostgresAuthRepository(new FakePool(client));

  const user = await repository.findUserByEmail("student@example.com");

  assert.deepEqual(user, {
    id: "7",
    email: "student@example.com",
    passwordHash: "hash",
    displayName: "小林",
    role: "admin",
    isActive: true,
    authVersion: 4
  });
  assert.equal(client.calls[0].sql.includes("student@example.com"), false);
  assert.deepEqual(client.calls[0].params, ["student@example.com"]);
});

test("session lookup resolves by id so every protected request can revalidate account state", async () => {
  const client = new FakeClient([{
    rows: [{
      id: "7", email: "student@example.com", password_hash: "hash", display_name: "小林",
      role: "user", is_active: false, auth_version: 5
    }],
    rowCount: 1
  }]);
  const repository = new PostgresAuthRepository(new FakePool(client));

  const record = await repository.findUserById("7");

  assert.equal(record?.isActive, false);
  assert.equal(record?.authVersion, 5);
  assert.equal(client.calls[0].sql.includes("where id = $1"), true);
  assert.deepEqual(client.calls[0].params, ["7"]);
});

test("disabling an account rotates its auth version and deletes every stored session", async () => {
  const client = new FakeClient([
    { rows: [{ id: "7" }], rowCount: 1 },
    { rows: [], rowCount: 2 }
  ]);
  const repository = new PostgresAuthRepository(new FakePool(client));

  const updated = await repository.setAccountActive({
    email: "student@example.com",
    isActive: false,
    now: new Date("2026-07-22T08:00:00Z")
  });

  assert.equal(updated, true);
  assert.equal(client.calls.some(({ sql }) => /auth_version\s*=\s*auth_version\s*\+\s*1/i.test(sql)), true);
  assert.equal(client.calls.some(({ sql }) => /delete from web_sessions/i.test(sql)), true);
});

test("admin reset creation invalidates older unused tokens before inserting a new hash", async () => {
  const client = new FakeClient([
    { rows: [{ id: "7" }], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [], rowCount: 1 }
  ]);
  const repository = new PostgresAuthRepository(new FakePool(client));

  const created = await repository.createPasswordReset({
    email: "student@example.com",
    tokenHash: "new-reset-hash",
    expiresAt: new Date("2026-07-22T08:30:00Z"),
    now: new Date("2026-07-22T08:00:00Z")
  });

  assert.equal(created, true);
  assert.equal(client.calls.some(({ sql }) => /update password_reset_tokens/i.test(sql)), true);
  assert.equal(client.calls.some(({ sql }) => /insert into password_reset_tokens/i.test(sql)), true);
});
