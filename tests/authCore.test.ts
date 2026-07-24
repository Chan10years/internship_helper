import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/auth/password.js";
import { createInviteToken, createPasswordResetToken, hashOpaqueToken } from "../src/auth/tokens.js";
import {
  loginInputSchema,
  passwordResetInputSchema,
  registerInputSchema
} from "../src/auth/validation.js";

test("auth feature exposes password, token, and validation primitives", async () => {
  const passwordPath = "../src/auth/password.js";
  const tokenPath = "../src/auth/tokens.js";
  const validationPath = "../src/auth/validation.js";
  const [password, tokens, validation] = (await Promise.all([
    import(passwordPath),
    import(tokenPath),
    import(validationPath)
  ])) as Array<Record<string, unknown>>;

  assert.equal(typeof password.hashPassword, "function");
  assert.equal(typeof password.verifyPassword, "function");
  assert.equal(typeof tokens.createInviteToken, "function");
  assert.equal(typeof tokens.createPasswordResetToken, "function");
  assert.equal(typeof tokens.hashOpaqueToken, "function");
  assert.equal(typeof validation.registerInputSchema, "object");
  assert.equal(typeof validation.loginInputSchema, "object");
  assert.equal(typeof validation.passwordResetInputSchema, "object");
});

test("password hashes use scrypt with a random salt and verify safely", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");

  assert.match(first, /^scrypt\$131072\$8\$1\$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct horse battery staple", first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
  assert.equal(await verifyPassword("anything", "malformed"), false);
});

test("opaque invitation and reset tokens are random, prefixed, and stored by hash", () => {
  const invitation = createInviteToken();
  const reset = createPasswordResetToken();

  assert.match(invitation, /^ih_inv_[A-Za-z0-9_-]{43}$/);
  assert.match(reset, /^ih_reset_[A-Za-z0-9_-]{43}$/);
  assert.notEqual(invitation, createInviteToken());
  assert.match(hashOpaqueToken(invitation), /^[a-f0-9]{64}$/);
  assert.equal(hashOpaqueToken(invitation), hashOpaqueToken(invitation));
  assert.notEqual(hashOpaqueToken(invitation), invitation);
});

test("registration validation normalizes identity fields and enforces strong input", () => {
  const valid = registerInputSchema.parse({
    email: "  STUDENT@Example.COM ",
    password: "twelve-characters",
    displayName: "  小林  ",
    inviteCode: createInviteToken()
  });

  assert.equal(valid.email, "student@example.com");
  assert.equal(valid.displayName, "小林");
  assert.equal(registerInputSchema.safeParse({ ...valid, password: "short" }).success, false);
  assert.equal(loginInputSchema.safeParse({ email: valid.email, password: valid.password }).success, true);
  assert.equal(
    passwordResetInputSchema.safeParse({ token: createPasswordResetToken(), password: valid.password }).success,
    true
  );
});
