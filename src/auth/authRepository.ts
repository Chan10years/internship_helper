import type {
  AuthStore,
  AuthUserRecord,
  ConsumePasswordResetCommand,
  RegisterWithInvitationCommand,
  SessionUser,
  UserRole
} from "./authService.js";
import type {
  CreateInvitationCommand,
  CreatePasswordResetCommand,
  SetAccountActiveCommand
} from "../admin/adminService.js";

interface DatabaseResult {
  rows: Array<Record<string, unknown>>;
  rowCount: number | null;
}

interface DatabaseClient {
  query(sql: string, params?: readonly unknown[]): Promise<DatabaseResult>;
  release(): void;
}

interface DatabasePool {
  query(sql: string, params?: readonly unknown[]): Promise<DatabaseResult>;
  connect(): Promise<DatabaseClient>;
}

function readString(row: Record<string, unknown>, column: string): string {
  const value = row[column];
  if (typeof value !== "string") {
    throw new Error(`Database returned an invalid ${column} value.`);
  }
  return value;
}

function readInteger(row: Record<string, unknown>, column: string): number {
  const value = row[column];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`Database returned an invalid ${column} value.`);
  }
  return value;
}

function readRole(row: Record<string, unknown>): UserRole {
  const role = row.role;
  if (role !== "user" && role !== "admin") {
    throw new Error("Database returned an invalid role value.");
  }
  return role;
}

function mapSessionUser(row: Record<string, unknown>): SessionUser {
  return {
    id: readString(row, "id"),
    email: readString(row, "email"),
    displayName: readString(row, "display_name"),
    role: readRole(row),
    authVersion: readInteger(row, "auth_version")
  };
}

function mapAuthUser(row: Record<string, unknown>): AuthUserRecord {
  if (typeof row.is_active !== "boolean") {
    throw new Error("Database returned an invalid is_active value.");
  }
  return {
    ...mapSessionUser(row),
    passwordHash: readString(row, "password_hash"),
    isActive: row.is_active
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export class PostgresAuthRepository implements AuthStore {
  constructor(private readonly database: DatabasePool) {}

  async registerWithInvitation(
    command: RegisterWithInvitationCommand
  ): Promise<SessionUser | null> {
    const client = await this.database.connect();
    await client.query("begin");
    try {
      const invitation = await client.query(
        `select id::text as id
         from invitations
         where code_hash = $1
           and used_at is null
           and expires_at > $2
         for update`,
        [command.inviteHash, command.now]
      );
      const invitationRow = invitation.rows[0];
      if (!invitationRow) {
        await client.query("rollback");
        return null;
      }

      const userResult = await client.query(
        `insert into users (email, password_hash, display_name)
         values ($1, $2, $3)
         returning id::text as id, email, display_name, role, auth_version`,
        [command.email, command.passwordHash, command.displayName]
      );
      const userRow = userResult.rows[0];
      if (!userRow) {
        throw new Error("User registration did not return the new account.");
      }

      const user = mapSessionUser(userRow);
      await client.query(
        `update invitations
         set used_at = $1, used_by_user_id = $2
         where id = $3`,
        [command.now, user.id, readString(invitationRow, "id")]
      );
      await client.query("commit");
      return user;
    } catch (error) {
      await client.query("rollback");
      if (isUniqueViolation(error)) {
        return null;
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const result = await this.database.query(
      `select id::text as id, email, password_hash, display_name, role, is_active, auth_version
       from users
       where lower(email) = lower($1)
       limit 1`,
      [email]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return mapAuthUser(row);
  }

  async findUserById(id: string): Promise<AuthUserRecord | null> {
    if (!/^[1-9]\d*$/.test(id)) {
      return null;
    }
    const result = await this.database.query(
      `select id::text as id, email, password_hash, display_name, role, is_active, auth_version
       from users
       where id = $1
       limit 1`,
      [id]
    );
    const row = result.rows[0];
    return row ? mapAuthUser(row) : null;
  }

  async consumePasswordReset(command: ConsumePasswordResetCommand): Promise<boolean> {
    const client = await this.database.connect();
    await client.query("begin");
    try {
      const tokenResult = await client.query(
        `select id::text as id, user_id::text as user_id
         from password_reset_tokens
         where token_hash = $1
           and used_at is null
           and expires_at > $2
         for update`,
        [command.tokenHash, command.now]
      );
      const token = tokenResult.rows[0];
      if (!token) {
        await client.query("rollback");
        return false;
      }

      const userId = readString(token, "user_id");
      await client.query(
        `update users
         set password_hash = $1,
             auth_version = auth_version + 1,
             updated_at = $2
         where id = $3`,
        [command.passwordHash, command.now, userId]
      );
      await client.query(
        `update password_reset_tokens
         set used_at = $1
         where id = $2`,
        [command.now, readString(token, "id")]
      );
      await client.query(
        `delete from web_sessions
         where sess ->> 'userId' = $1`,
        [userId]
      );
      await client.query("commit");
      return true;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async createInvitation(command: CreateInvitationCommand): Promise<void> {
    await this.database.query(
      `insert into invitations (code_hash, expires_at, created_at)
       values ($1, $2, $3)`,
      [command.codeHash, command.expiresAt, command.now]
    );
  }

  async setAccountActive(command: SetAccountActiveCommand): Promise<boolean> {
    const client = await this.database.connect();
    await client.query("begin");
    try {
      const result = await client.query(
        `update users
         set is_active = $1,
             auth_version = auth_version + 1,
             updated_at = $2
         where lower(email) = lower($3)
         returning id::text as id`,
        [command.isActive, command.now, command.email]
      );
      const user = result.rows[0];
      if (!user) {
        await client.query("rollback");
        return false;
      }
      await client.query(
        `delete from web_sessions
         where sess ->> 'userId' = $1`,
        [readString(user, "id")]
      );
      await client.query("commit");
      return true;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async createPasswordReset(command: CreatePasswordResetCommand): Promise<boolean> {
    const client = await this.database.connect();
    await client.query("begin");
    try {
      const userResult = await client.query(
        `select id::text as id
         from users
         where lower(email) = lower($1) and is_active = true
         for update`,
        [command.email]
      );
      const user = userResult.rows[0];
      if (!user) {
        await client.query("rollback");
        return false;
      }
      const userId = readString(user, "id");
      await client.query(
        `update password_reset_tokens
         set used_at = $1
         where user_id = $2 and used_at is null`,
        [command.now, userId]
      );
      await client.query(
        `insert into password_reset_tokens
           (user_id, token_hash, expires_at, created_at)
         values ($1, $2, $3, $4)`,
        [userId, command.tokenHash, command.expiresAt, command.now]
      );
      await client.query("commit");
      return true;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
