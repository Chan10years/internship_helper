import { fileURLToPath } from "node:url";
import path from "node:path";
import { PostgresAuthRepository } from "../auth/authRepository.js";
import { createDatabasePool } from "../db/client.js";
import { AdminService } from "./adminService.js";

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function requiredOption(args: string[], name: string): string {
  const value = option(args, name);
  if (!value) {
    throw new Error(`Missing required option: ${name}`);
  }
  return value;
}

export async function runAdminCommand(args: string[]): Promise<string> {
  const command = args[0];
  if (!command) {
    throw new Error("Expected invite:create, account:disable, account:enable, or password-reset:create.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for admin commands.");
  }
  const pool = createDatabasePool(databaseUrl);
  try {
    const service = new AdminService(new PostgresAuthRepository(pool));

    if (command === "invite:create") {
      const daysText = option(args, "--days");
      const invitation = await service.createInvitation(daysText ? Number(daysText) : 7);
      return `邀请码（仅显示本次）：${invitation.code}\n过期时间：${invitation.expiresAt.toISOString()}`;
    }

    if (command === "account:disable" || command === "account:enable") {
      const email = requiredOption(args, "--email");
      const active = command === "account:enable";
      const updated = await service.setAccountActive(email, active);
      if (!updated) {
        throw new Error("Account was not found.");
      }
      return active ? "账号已恢复，旧会话已失效。" : "账号已停用，旧会话已失效。";
    }

    if (command === "password-reset:create") {
      const email = requiredOption(args, "--email");
      const origin = option(args, "--origin") ?? "http://localhost:3000";
      const reset = await service.createPasswordReset(email, origin);
      if (!reset.ok) {
        throw new Error("Active account was not found.");
      }
      return `密码重置链接（仅显示本次）：${reset.url}\n过期时间：${reset.expiresAt.toISOString()}`;
    }

    throw new Error(`Unknown admin command: ${command}`);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void runAdminCommand(process.argv.slice(2))
    .then((message) => console.log(message))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown admin command failure.";
      console.error(`Admin command failed: ${message}`);
      process.exitCode = 1;
    });
}
