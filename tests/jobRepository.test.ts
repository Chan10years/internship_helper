import test from "node:test";
import assert from "node:assert/strict";
import { PostgresJobRepository, type JobDatabase } from "../src/jobs/jobRepository.js";

test("jobs feature exposes a focused PostgreSQL repository", async () => {
  const modulePath = "../src/jobs/jobRepository.js";
  const repositoryModule = (await import(modulePath)) as Record<string, unknown>;

  assert.equal(typeof repositoryModule.PostgresJobRepository, "function");
});

test("listSummaries returns only the approved public job fields", async () => {
  const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
  const database = {
    async query(sql: string, params?: readonly unknown[]) {
      calls.push({ sql, params });
      return {
        rows: [
          {
            id: "42",
            title: "AIGC 产品实习生",
            company: "示例公司",
            city: "上海",
            salary: "200/天",
            publishTime: "2026-07-20"
          }
        ]
      };
    }
  } as unknown as JobDatabase;

  const repository = new PostgresJobRepository(database);
  const jobs = await repository.listSummaries();

  assert.deepEqual(jobs, [
    {
      id: "42",
      title: "AIGC 产品实习生",
      company: "示例公司",
      city: "上海",
      salary: "200/天",
      publishTime: "2026-07-20"
    }
  ]);
  assert.equal(calls.length, 1);
  assert.doesNotMatch(calls[0].sql, /description|source_url|raw_text|match_reasons|resume_advice/i);
});

test("findDetailById parameterizes the id and never selects rawText", async () => {
  const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
  const database = {
    async query(sql: string, params?: readonly unknown[]) {
      calls.push({ sql, params });
      return {
        rows: [
          {
            id: "42",
            title: "AIGC 产品实习生",
            company: "示例公司",
            city: "上海",
            salary: "200/天",
            publishTime: "2026-07-20",
            duration: "3个月",
            education: "本科",
            workDaysPerWeek: "4天/周",
            description: "参与产品设计。",
            link: "https://example.com/jobs/42",
            source: "shixiseng",
            tags: ["AIGC"],
            matchScore: 88,
            matchReasons: ["方向匹配"],
            resumeAdvice: ["突出产品项目"]
          }
        ]
      };
    }
  } as unknown as JobDatabase;

  const repository = new PostgresJobRepository(database);
  const detail = await repository.findDetailById("42");

  assert.equal(detail?.id, "42");
  assert.deepEqual(calls[0].params, ["42"]);
  assert.doesNotMatch(calls[0].sql, /raw_text/i);
});

test("findDetailById rejects invalid public identifiers without querying", async () => {
  let queryCount = 0;
  const database = {
    async query() {
      queryCount += 1;
      return { rows: [] };
    }
  } as unknown as JobDatabase;

  const repository = new PostgresJobRepository(database);

  assert.equal(await repository.findDetailById("1 OR 1=1"), null);
  assert.equal(queryCount, 0);
});
