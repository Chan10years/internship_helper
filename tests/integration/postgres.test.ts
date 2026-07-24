import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Client, Pool } from "pg";
import { runInitialMigration } from "../../src/db/migrations.js";
import { importJobs } from "../../src/db/jobImport.js";
import { PostgresAuthRepository } from "../../src/auth/authRepository.js";
import { AuthService } from "../../src/auth/authService.js";
import { createInviteToken, hashOpaqueToken } from "../../src/auth/tokens.js";
import type { InternshipJob } from "../../src/types.js";

const connectionString = process.env.TEST_DATABASE_URL;

const exampleJob: InternshipJob = {
  id: "integration-job-1",
  title: "AIGC 产品实习生",
  company: "测试公司",
  city: "上海",
  salary: "200/天",
  duration: "3个月",
  education: "本科",
  workDaysPerWeek: "4天",
  description: "参与产品研究",
  link: "https://example.invalid/jobs/integration-1",
  source: "shixiseng",
  publishTime: "今天",
  tags: ["AIGC"],
  rawText: "integration-only",
  matchScore: 80,
  matchReasons: ["方向匹配"],
  resumeAdvice: ["突出项目"],
  crawledAt: "2026-07-22T08:00:00.000Z"
};

test("PostgreSQL migration, idempotent import, and concurrent invitation consumption", {
  skip: connectionString ? false : "TEST_DATABASE_URL is not configured"
}, async () => {
  assert.ok(connectionString);
  const schema = `integration_${randomBytes(8).toString("hex")}`;
  const admin = new Client({ connectionString });
  await admin.connect();
  await admin.query(`create schema ${schema}`);

  const pool = new Pool({ connectionString, options: `-c search_path=${schema}` });
  try {
    const migrationClient = await pool.connect();
    try {
      await runInitialMigration(migrationClient);
      await runInitialMigration(migrationClient);
      await importJobs(migrationClient, [exampleJob]);
      await importJobs(migrationClient, [exampleJob]);
    } finally {
      migrationClient.release();
    }

    const jobs = await pool.query<{ count: string }>("select count(*) as count from jobs");
    assert.equal(Number(jobs.rows[0].count), 1);

    const invite = createInviteToken();
    await pool.query(
      `insert into invitations (code_hash, expires_at)
       values ($1, now() + interval '7 days')`,
      [hashOpaqueToken(invite)]
    );
    const repository = new PostgresAuthRepository(pool);
    const auth = new AuthService(repository);
    const attempts = await Promise.all([
      auth.register({ email: "first@example.invalid", password: "twelve-characters", displayName: "甲", inviteCode: invite }),
      auth.register({ email: "second@example.invalid", password: "twelve-characters", displayName: "乙", inviteCode: invite })
    ]);
    assert.equal(attempts.filter((result) => result.ok).length, 1);
  } finally {
    await pool.end();
    if (!/^integration_[a-f0-9]{16}$/.test(schema)) {
      throw new Error("Refusing to remove an unexpected integration schema.");
    }
    await admin.query(`drop schema ${schema} cascade`);
    await admin.end();
  }
});
