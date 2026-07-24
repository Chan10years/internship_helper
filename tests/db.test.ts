import test from "node:test";
import assert from "node:assert/strict";
import { initialMigrationSql } from "../src/db/migrations.js";
import { toJobUpsert } from "../src/db/jobImport.js";
import type { InternshipJob } from "../src/types.js";

function job(overrides: Partial<InternshipJob> = {}): InternshipJob {
  return {
    id: "local-1",
    title: "AIGC内容实习生",
    company: "示例公司",
    city: "上海",
    salary: "200-300/天",
    duration: "3个月",
    education: "本科",
    workDaysPerWeek: "5天／周",
    description: "参与 AIGC 内容生产。",
    link: "https://example.com/jobs/1",
    source: "shixiseng",
    publishTime: "2026-06-12 10:56:00",
    tags: ["AIGC", "内容"],
    rawText: "原始岗位文本",
    matchScore: 82,
    matchReasons: ["包含 AIGC"],
    resumeAdvice: ["突出项目经验"],
    crawledAt: "2026-06-16T09:33:38.824Z",
    ...overrides
  };
}

test("initial PostgreSQL migration creates only the approved online MVP tables", () => {
  const sql = initialMigrationSql;

  assert.match(sql, /create table if not exists users/i);
  assert.match(sql, /create table if not exists jobs/i);
  assert.match(sql, /create table if not exists invitations/i);
  assert.match(sql, /create table if not exists web_sessions/i);
  assert.match(sql, /create table if not exists password_reset_tokens/i);
  assert.match(sql, /auth_version\s+integer\s+not null\s+default\s+1/i);
  assert.match(sql, /sid\s+varchar\s+not null\s+primary key/i);
  assert.doesNotMatch(sql, /create table if not exists favorites/i);
  assert.doesNotMatch(sql, /create table if not exists application_statuses/i);
  assert.match(sql, /dedupe_key\s+text\s+not null\s+unique/i);
  assert.match(sql, /001_initial_postgres_foundation/);
  assert.match(sql, /raise exception/i);
});

test("toJobUpsert maps an InternshipJob into database fields and preserves local dedupe identity", () => {
  const mapped = toJobUpsert(job());

  assert.equal(mapped.legacyLocalId, "local-1");
  assert.equal(mapped.title, "AIGC内容实习生");
  assert.equal(mapped.companyName, "示例公司");
  assert.equal(mapped.salaryText, "200-300/天");
  assert.equal(mapped.workDaysPerWeekText, "5天／周");
  assert.equal(mapped.sourceUrl, "https://example.com/jobs/1");
  assert.equal(mapped.dedupeKey, "link:https://example.com/jobs/1");
  assert.deepEqual(mapped.tags, ["AIGC", "内容"]);
  assert.deepEqual(mapped.matchReasons, ["包含 AIGC"]);
  assert.deepEqual(mapped.resumeAdvice, ["突出项目经验"]);
  assert.equal(mapped.firstSeenAt.toISOString(), "2026-06-16T09:33:38.824Z");
  assert.equal(mapped.lastSeenAt.toISOString(), "2026-06-16T09:33:38.824Z");
});

test("toJobUpsert uses title company city fallback identity when a job has no source URL", () => {
  const mapped = toJobUpsert(job({ link: "", title: "后端实习", company: "数据库公司", city: "杭州" }));

  assert.equal(mapped.sourceUrl, "");
  assert.equal(mapped.dedupeKey, "fallback:后端实习|数据库公司|杭州");
});
