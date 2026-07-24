import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuthService } from "../auth/authService.js";
import { PostgresAuthRepository } from "../auth/authRepository.js";
import { internshipsJsonPath, readRuntimeConfig } from "../config.js";
import { createDatabasePool } from "../db/client.js";
import { initialMigrationName } from "../db/migrations.js";
import { PostgresJobRepository } from "../jobs/jobRepository.js";
import type { InternshipJob } from "../types.js";
import { createWebApp } from "./app.js";

type JobsPayload =
  | { ok: true; state: "ready" | "empty" | "missing"; jobs: InternshipJob[] }
  | { ok: false; state: "invalid-json" | "invalid-shape"; status: number; message: string };

export async function readJobsPayload(filePath = internshipsJsonPath): Promise<JobsPayload> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;

    if (!Array.isArray(parsed)) {
      return {
        ok: false,
        state: "invalid-shape",
        status: 500,
        message: "岗位数据格式错误：JSON 顶层必须是数组。"
      };
    }

    const jobs = parsed as InternshipJob[];
    return { ok: true, state: jobs.length > 0 ? "ready" : "empty", jobs };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { ok: true, state: "missing", jobs: [] };
    }
    if (error instanceof SyntaxError) {
      return {
        ok: false,
        state: "invalid-json",
        status: 500,
        message: "岗位数据 JSON 损坏，无法读取。"
      };
    }
    throw error;
  }
}

export async function startWebServer(): Promise<void> {
  const config = readRuntimeConfig();
  const pool = createDatabasePool(config.databaseUrl);
  const jobs = new PostgresJobRepository(pool);
  const authRepository = new PostgresAuthRepository(pool);
  const authService = new AuthService(authRepository);
  const PgSessionStore = connectPgSimple(session);
  const sessionStore = new PgSessionStore({
    pool,
    tableName: "web_sessions",
    createTableIfMissing: false,
    pruneSessionInterval: 15 * 60
  });
  const publicDir = path.join(process.cwd(), "src", "server", "public");
  const app = createWebApp({
    jobs,
    authService,
    resolveSessionUser: (id) => authRepository.findUserById(id),
    async isReady() {
      try {
        const result = await pool.query<{ ready: boolean }>(
          `select exists (
             select 1 from schema_migrations where name = $1
           ) as ready`,
          [initialMigrationName]
        );
        return result.rows[0]?.ready === true;
      } catch {
        return false;
      }
    },
    sessionStore,
    sessionSecret: config.sessionSecret,
    isProduction: config.isProduction,
    publicDir
  });
  const server = app.listen(config.port, () => {
    console.log(`internship_helper web UI is listening on port ${config.port}.`);
  });

  let closing = false;
  const close = (): void => {
    if (closing) {
      return;
    }
    closing = true;
    server.close((serverError) => {
      sessionStore.close();
      void pool.end().finally(() => {
        process.exitCode = serverError ? 1 : 0;
      });
    });
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void startWebServer().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown startup error.";
    console.error(`Unable to start internship_helper: ${message}`);
    process.exitCode = 1;
  });
}
