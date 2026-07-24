import test from "node:test";
import assert from "node:assert/strict";
import { resumeAdvice } from "../src/scoring/resumeAdvice.js";
import { scoreJob } from "../src/scoring/scoreJob.js";
import type { InternshipJob } from "../src/types.js";

const baseJob: InternshipJob = {
  id: "id",
  title: "",
  company: "",
  city: "",
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
  crawledAt: "2026-06-16T00:00:00.000Z"
};

test("scoreJob rewards local target skills and clamps score", () => {
  const result = scoreJob({
    ...baseJob,
    title: "AIGC 游戏开发实习",
    description: "C++ Unity 图形学 OpenCV ComfyUI 暑期 本科"
  });

  assert.equal(result.matchScore, 100);
  assert.ok(result.matchReasons.some((reason) => reason.includes("AIGC")));
});

test("scoreJob penalizes off-target and advanced-degree requirements", () => {
  const result = scoreJob({
    ...baseJob,
    title: "客服运营实习",
    education: "硕士",
    duration: "6个月以上",
    description: "纯运营 销售 每周 5 天 线下"
  });

  assert.ok(result.matchScore < 50);
  assert.ok(result.matchReasons.some((reason) => reason.includes("硕士")));
});

test("scoreJob rewards summer freshman-friendly proof and preferred regions", () => {
  const result = scoreJob({
    ...baseJob,
    title: "数字媒体 AIGC 工具实习生",
    city: "广州",
    duration: "1.5-2个月 暑期",
    education: "大一可投 本科",
    description: "AI工具 数据分析 可开实习证明"
  });

  assert.ok(result.matchScore >= 90);
  assert.ok(result.matchReasons.some((reason) => reason.includes("1.5-2个月")));
  assert.ok(result.matchReasons.some((reason) => reason.includes("大一")));
  assert.ok(result.matchReasons.some((reason) => reason.includes("实习证明")));
  assert.ok(result.matchReasons.some((reason) => reason.includes("广东")));
});

test("scoreJob does not double count AI inside AIGC", () => {
  const result = scoreJob({
    ...baseJob,
    title: "AIGC 产品实习",
    description: "参与生成式内容工具设计"
  });

  assert.ok(result.matchReasons.some((reason) => reason.includes("AIGC")));
  assert.ok(!result.matchReasons.includes("包含相关技能或方向：AI"));
});

test("scoreJob ignores rawText footer friendliness when structured fields are stricter", () => {
  const result = scoreJob({
    ...baseJob,
    title: "AIGC算法实习生",
    city: "大连",
    education: "硕士",
    duration: "6个月以上",
    workDaysPerWeek: "5天／周",
    description: "负责模型评估和算法实验，线下办公。",
    rawText: "公司简介 北京 学历不限 实习2个月 每周 3 天 可开实习证明 AI工具"
  });

  assert.ok(result.matchScore < 50);
  assert.ok(result.matchReasons.some((reason) => reason.includes("硕士")));
  assert.ok(result.matchReasons.some((reason) => reason.includes("6个月以上")));
  assert.ok(!result.matchReasons.some((reason) => reason.includes("学历要求较友好：不限")));
  assert.ok(!result.matchReasons.some((reason) => reason.includes("实习周期较匹配：2个月")));
});

test("resumeAdvice only returns advice tied to visible job text", () => {
  const advice = resumeAdvice({
    ...baseJob,
    title: "前端 AIGC 实习",
    description: "需要 ComfyUI 和 HTML CSS JavaScript"
  });

  assert.ok(advice.some((item) => item.includes("ComfyUI")));
  assert.ok(advice.some((item) => item.includes("HTML/CSS/JS")));
});
