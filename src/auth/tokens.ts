import { createHash, randomBytes } from "node:crypto";

function createOpaqueToken(prefix: string): string {
  return `${prefix}${randomBytes(32).toString("base64url")}`;
}

export function createInviteToken(): string {
  return createOpaqueToken("ih_inv_");
}

export function createPasswordResetToken(): string {
  return createOpaqueToken("ih_reset_");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
