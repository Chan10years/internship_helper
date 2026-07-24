import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mergeJobs } from "../src/storage/mergeJobs.js";
import { saveCsv } from "../src/storage/saveCsv.js";
import type { InternshipJob } from "../src/types.js";

function job(overrides: Partial<InternshipJob>): InternshipJob {
  return {
    id: "id-1",
    title: "前端实习",
    company: "示例公司",
    city: "上海",
    salary: "",
    duration: "",
    education: "",
    workDaysPerWeek: "",
    description: "",
    link: "",
    source: "boss",
    publishTime: "",
    tags: [],
    rawText: "",
    matchReasons: [],
    resumeAdvice: [],
    crawledAt: "2026-06-16T00:00:00.000Z",
    ...overrides
  };
}

test("mergeJobs deduplicates by non-empty link, updates stable id, and preserves first crawledAt", () => {
  const existing = job({ id: "old", link: "https://example.com/job", title: "旧标题" });
  const incoming = job({
    id: "new",
    link: "https://example.com/job",
    title: "新标题",
    salary: "200/天",
    crawledAt: "2026-06-17T00:00:00.000Z"
  });

  const result = mergeJobs([existing], [incoming]);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "new");
  assert.equal(result[0].title, "新标题");
  assert.equal(result[0].salary, "200/天");
  assert.equal(result[0].crawledAt, "2026-06-16T00:00:00.000Z");
});

test("mergeJobs deduplicates empty links by title company and city", () => {
  const result = mergeJobs(
    [job({ id: "old", link: "", title: "游戏开发实习", company: "A", city: "北京" })],
    [job({ id: "new", link: "", title: "游戏开发实习", company: "A", city: "北京", salary: "150/天" })]
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].salary, "150/天");
});

test("mergeJobs merges an old empty-link record when a later crawl finds its link", () => {
  const result = mergeJobs(
    [job({ id: "old", link: "", title: "游戏开发实习", company: "A", city: "北京" })],
    [
      job({
        id: "new",
        link: "https://example.com/game",
        title: "游戏开发实习",
        company: "A",
        city: "北京",
        salary: "150/天"
      })
    ]
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "new");
  assert.equal(result[0].link, "https://example.com/game");
  assert.equal(result[0].salary, "150/天");
});

test("saveCsv uses the documented stable columns and csv-stringify escaping", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "internship-helper-"));
  const filePath = path.join(dir, "internships.csv");

  await saveCsv(filePath, [
    job({
      title: "图形学, 实习",
      company: "示例\"公司",
      description: "负责AIGC工具,\n图形学验证",
      tags: ["AI", "AIGC"],
      link: "https://example.com/job?id=1&kw=AIGC",
      matchReasons: ["包含 C++", "包含\n图形学"],
      resumeAdvice: ["补充项目, 保持简洁"]
    })
  ]);

  const csv = await fs.readFile(filePath, "utf8");
  assert.ok(
    csv.startsWith(
      "title,company,city,salary,duration,education,workDaysPerWeek,matchScore,matchReasons,resumeAdvice,link,source,crawledAt\n"
    )
  );
  assert.match(csv, /"图形学, 实习"/);
  assert.match(csv, /"示例""公司"/);
  assert.match(csv, /https:\/\/example\.com\/job\?id=1&kw=AIGC/);
  assert.match(csv, /"包含 C\+\+ \| 包含\n图形学"/);
  assert.match(csv, /"补充项目, 保持简洁"/);
});
