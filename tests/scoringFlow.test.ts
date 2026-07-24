import test from "node:test";
import assert from "node:assert/strict";
import { scoreAndAdviseJob } from "../src/scoring/scoreAndAdviseJob.js";
import type { InternshipJob } from "../src/types.js";

const baseJob: InternshipJob = {
  id: "id",
  title: "AIGC 实习",
  company: "示例公司",
  city: "广州",
  salary: "",
  duration: "2个月",
  education: "大一可投",
  workDaysPerWeek: "",
  description: "AI工具 可开实习证明",
  link: "https://example.com/job",
  source: "shixiseng",
  publishTime: "",
  tags: [],
  rawText: "AIGC 前端",
  matchReasons: [],
  resumeAdvice: [],
  crawledAt: "2026-06-16T00:00:00.000Z"
};

test("scoreAndAdviseJob returns a copy with score reasons and advice filled", () => {
  const scored = scoreAndAdviseJob(baseJob);

  assert.notEqual(scored, baseJob);
  assert.equal(scored.id, baseJob.id);
  assert.equal(typeof scored.matchScore, "number");
  assert.ok(scored.matchReasons.length > 0);
  assert.ok(scored.resumeAdvice.length > 0);
});
