import { hashPassword, verifyPassword } from "./password.js";
import { hashOpaqueToken } from "./tokens.js";
import {
  loginInputSchema,
  passwordResetInputSchema,
  registerInputSchema
} from "./validation.js";

export type UserRole = "user" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  authVersion: number;
}

export interface AuthUserRecord extends SessionUser {
  passwordHash: string;
  isActive: boolean;
}

export interface RegisterWithInvitationCommand {
  email: string;
  displayName: string;
  passwordHash: string;
  inviteHash: string;
  now: Date;
}

export interface ConsumePasswordResetCommand {
  tokenHash: string;
  passwordHash: string;
  now: Date;
}

export interface AuthStore {
  registerWithInvitation(command: RegisterWithInvitationCommand): Promise<SessionUser | null>;
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  consumePasswordReset(command: ConsumePasswordResetCommand): Promise<boolean>;
}

export type AuthenticationResult =
  | { ok: true; user: SessionUser }
  | { ok: false; code: "INVALID_CREDENTIALS" };

export type RegistrationResult =
  | { ok: true; user: SessionUser }
  | { ok: false; code: "INVALID_INPUT" | "REGISTRATION_UNAVAILABLE" };

export type PasswordResetResult =
  | { ok: true }
  | { ok: false; code: "INVALID_RESET" };

function toSessionUser(user: AuthUserRecord): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    authVersion: user.authVersion
  };
}

export class AuthService {
  constructor(
    private readonly store: AuthStore,
    private readonly now: () => Date = () => new Date()
  ) {}

  async register(input: unknown): Promise<RegistrationResult> {
    const parsed = registerInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const user = await this.store.registerWithInvitation({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      passwordHash: await hashPassword(parsed.data.password),
      inviteHash: hashOpaqueToken(parsed.data.inviteCode),
      now: this.now()
    });

    return user
      ? { ok: true, user }
      : { ok: false, code: "REGISTRATION_UNAVAILABLE" };
  }

  async login(input: unknown): Promise<AuthenticationResult> {
    const parsed = loginInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }

    const user = await this.store.findUserByEmail(parsed.data.email);
    if (!user) {
      // Perform the same expensive operation for unknown accounts to reduce timing clues.
      await hashPassword(parsed.data.password);
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }

    const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!passwordMatches || !user.isActive) {
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }

    return { ok: true, user: toSessionUser(user) };
  }

  async resetPassword(input: unknown): Promise<PasswordResetResult> {
    const parsed = passwordResetInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, code: "INVALID_RESET" };
    }

    const reset = await this.store.consumePasswordReset({
      tokenHash: hashOpaqueToken(parsed.data.token),
      passwordHash: await hashPassword(parsed.data.password),
      now: this.now()
    });

    return reset ? { ok: true } : { ok: false, code: "INVALID_RESET" };
  }
}
