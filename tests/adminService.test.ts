import test from "node:test";
import assert from "node:assert/strict";
import { AdminService, type AdminStore } from "../src/admin/adminService.js";
import { hashOpaqueToken } from "../src/auth/tokens.js";

function store(overrides: Partial<AdminStore> = {}): AdminStore {
  return {
    async createInvitation() {},
    async setAccountActive() { return false; },
    async createPasswordReset() { return false; },
    ...overrides
  };
}

test("admin creates a seven-day one-time invitation while persisting only its hash", async () => {
  let captured: Parameters<AdminStore["createInvitation"]>[0] | undefined;
  const now = new Date("2026-07-22T08:00:00Z");
  const service = new AdminService(store({ async createInvitation(command) { captured = command; } }), () => now);

  const invitation = await service.createInvitation();

  assert.match(invitation.code, /^ih_inv_[A-Za-z0-9_-]{43}$/);
  assert.equal(captured?.codeHash, hashOpaqueToken(invitation.code));
  assert.equal(captured?.expiresAt.toISOString(), "2026-07-29T08:00:00.000Z");
});

test("account state changes normalize email and delegate session invalidation to the store", async () => {
  let captured: Parameters<AdminStore["setAccountActive"]>[0] | undefined;
  const service = new AdminService(store({ async setAccountActive(command) { captured = command; return true; } }));

  const updated = await service.setAccountActive(" STUDENT@example.COM ", false);

  assert.equal(updated, true);
  assert.equal(captured?.email, "student@example.com");
  assert.equal(captured?.isActive, false);
});

test("password reset creation returns a local link and stores only the token hash", async () => {
  let captured: Parameters<AdminStore["createPasswordReset"]>[0] | undefined;
  const service = new AdminService(store({ async createPasswordReset(command) { captured = command; return true; } }));

  const reset = await service.createPasswordReset("student@example.com", "http://localhost:3000");

  assert.equal(reset.ok, true);
  if (!reset.ok) return;
  const token = new URL(reset.url).searchParams.get("token");
  assert.ok(token);
  assert.equal(captured?.tokenHash, hashOpaqueToken(token));
  assert.notEqual(captured?.tokenHash, token);
});
