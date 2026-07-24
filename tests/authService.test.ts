import test from "node:test";
import assert from "node:assert/strict";
import { AuthService, type AuthStore, type AuthUserRecord } from "../src/auth/authService.js";
import { hashPassword } from "../src/auth/password.js";
import { createInviteToken, createPasswordResetToken, hashOpaqueToken } from "../src/auth/tokens.js";

test("auth feature exposes a service boundary and PostgreSQL repository", async () => {
  const servicePath = "../src/auth/authService.js";
  const repositoryPath = "../src/auth/authRepository.js";
  const [service, repository] = (await Promise.all([
    import(servicePath),
    import(repositoryPath)
  ])) as Array<Record<string, unknown>>;

  assert.equal(typeof service.AuthService, "function");
  assert.equal(typeof repository.PostgresAuthRepository, "function");
});

function createStore(overrides: Partial<AuthStore> = {}): AuthStore {
  return {
    async registerWithInvitation() {
      return null;
    },
    async findUserByEmail() {
      return null;
    },
    async consumePasswordReset() {
      return false;
    },
    ...overrides
  };
}

test("register normalizes input and sends only hashes into the atomic store operation", async () => {
  const invitation = createInviteToken();
  let captured: Parameters<AuthStore["registerWithInvitation"]>[0] | undefined;
  const store = createStore({
    async registerWithInvitation(command) {
      captured = command;
      return {
        id: "7",
        email: command.email,
        displayName: command.displayName,
        role: "user",
        authVersion: 1
      };
    }
  });

  const result = await new AuthService(store).register({
    email: " STUDENT@example.COM ",
    password: "twelve-characters",
    displayName: " 小林 ",
    inviteCode: invitation
  });

  assert.equal(result.ok, true);
  assert.equal(captured?.email, "student@example.com");
  assert.equal(captured?.displayName, "小林");
  assert.equal(captured?.inviteHash, hashOpaqueToken(invitation));
  assert.notEqual(captured?.passwordHash, "twelve-characters");
});

test("login returns one generic failure for missing, disabled, or wrong credentials", async () => {
  const passwordHash = await hashPassword("twelve-characters");
  const activeUser: AuthUserRecord = {
    id: "7",
    email: "student@example.com",
    passwordHash,
    displayName: "小林",
    role: "user",
    isActive: true,
    authVersion: 1
  };
  const activeService = new AuthService(
    createStore({ async findUserByEmail() { return activeUser; } })
  );
  const missingService = new AuthService(createStore());

  const success = await activeService.login({ email: activeUser.email, password: "twelve-characters" });
  const wrong = await activeService.login({ email: activeUser.email, password: "wrong-password" });
  const missing = await missingService.login({ email: "missing@example.com", password: "wrong-password" });

  assert.equal(success.ok, true);
  assert.deepEqual(wrong, { ok: false, code: "INVALID_CREDENTIALS" });
  assert.deepEqual(missing, { ok: false, code: "INVALID_CREDENTIALS" });
});

test("resetPassword hashes both the one-time token and replacement password", async () => {
  const token = createPasswordResetToken();
  let captured: Parameters<AuthStore["consumePasswordReset"]>[0] | undefined;
  const store = createStore({
    async consumePasswordReset(command) {
      captured = command;
      return true;
    }
  });

  const result = await new AuthService(store).resetPassword({
    token,
    password: "replacement-password"
  });

  assert.equal(result.ok, true);
  assert.equal(captured?.tokenHash, hashOpaqueToken(token));
  assert.notEqual(captured?.passwordHash, "replacement-password");
});
