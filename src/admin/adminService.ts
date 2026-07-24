import { z } from "zod";
import { createInviteToken, createPasswordResetToken, hashOpaqueToken } from "../auth/tokens.js";

const normalizedEmail = z.string().trim().toLowerCase().email().max(254);
const dayMilliseconds = 24 * 60 * 60 * 1_000;

export interface CreateInvitationCommand {
  codeHash: string;
  expiresAt: Date;
  now: Date;
}

export interface SetAccountActiveCommand {
  email: string;
  isActive: boolean;
  now: Date;
}

export interface CreatePasswordResetCommand {
  email: string;
  tokenHash: string;
  expiresAt: Date;
  now: Date;
}

export interface AdminStore {
  createInvitation(command: CreateInvitationCommand): Promise<void>;
  setAccountActive(command: SetAccountActiveCommand): Promise<boolean>;
  createPasswordReset(command: CreatePasswordResetCommand): Promise<boolean>;
}

export class AdminService {
  constructor(
    private readonly store: AdminStore,
    private readonly now: () => Date = () => new Date()
  ) {}

  async createInvitation(validDays = 7): Promise<{ code: string; expiresAt: Date }> {
    if (!Number.isInteger(validDays) || validDays < 1 || validDays > 30) {
      throw new Error("Invitation validity must be an integer between 1 and 30 days.");
    }
    const now = this.now();
    const expiresAt = new Date(now.getTime() + validDays * dayMilliseconds);
    const code = createInviteToken();
    await this.store.createInvitation({ codeHash: hashOpaqueToken(code), expiresAt, now });
    return { code, expiresAt };
  }

  async setAccountActive(email: string, isActive: boolean): Promise<boolean> {
    return this.store.setAccountActive({
      email: normalizedEmail.parse(email),
      isActive,
      now: this.now()
    });
  }

  async createPasswordReset(
    email: string,
    applicationOrigin: string
  ): Promise<{ ok: false } | { ok: true; url: string; expiresAt: Date }> {
    const now = this.now();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1_000);
    const token = createPasswordResetToken();
    const created = await this.store.createPasswordReset({
      email: normalizedEmail.parse(email),
      tokenHash: hashOpaqueToken(token),
      expiresAt,
      now
    });
    if (!created) {
      return { ok: false };
    }

    const resetUrl = new URL("/reset-password.html", applicationOrigin);
    resetUrl.searchParams.set("token", token);
    return { ok: true, url: resetUrl.toString(), expiresAt };
  }
}
