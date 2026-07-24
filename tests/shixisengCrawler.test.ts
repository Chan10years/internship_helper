import test from "node:test";
import assert from "node:assert/strict";
import { defaultConfig } from "../src/config.js";
import {
  buildShixisengSearchUrl,
  normalizeShixisengCard,
  normalizeShixisengDetail
} from "../src/crawler/shixisengCrawler.js";

test("default crawl config targets the requested shixiseng AIGC run", () => {
  assert.deepEqual(defaultConfig.enabledSources, ["shixiseng"]);
  assert.deepEqual(defaultConfig.keywords, ["AIGC 实习"]);
  assert.equal(defaultConfig.maxPages, 1);
  assert.equal(defaultConfig.maxJobsPerSource, 10);
  assert.equal(defaultConfig.headless, false);
});

test("buildShixisengSearchUrl points to a real keyword listing page", () => {
  const url = buildShixisengSearchUrl("AIGC 实习", 1);

  assert.equal(url.hostname, "www.shixiseng.com");
  assert.match(url.pathname, /intern/);
  assert.equal(url.searchParams.get("keyword"), "AIGC 实习");
  assert.equal(url.searchParams.get("page"), "1");
});

test("normalizeShixisengCard extracts stable fields from a visible job card", () => {
  const job = normalizeShixisengCard({
    rawText: [
      "AIGC 产品实习生",
      "某科技公司",
      "广州",
      "150-200/天",
      "本科",
      "3天/周",
      "2个月",
      "可开实习证明",
      "AI工具 数字媒体"
    ].join("\n"),
    href: "/intern/inn_abc123",
    crawledAt: "2026-06-16T00:00:00.000Z"
  });

  assert.equal(job.title, "AIGC 产品实习生");
  assert.equal(job.company, "某科技公司");
  assert.equal(job.city, "广州");
  assert.equal(job.salary, "150-200/天");
  assert.equal(job.education, "本科");
  assert.equal(job.workDaysPerWeek, "3天/周");
  assert.equal(job.duration, "2个月");
  assert.equal(job.link, "https://www.shixiseng.com/intern/inn_abc123");
  assert.equal(job.source, "shixiseng");
  assert.match(job.rawText, /可开实习证明/);
});

test("normalizeShixisengCard creates distinct ids for distinct links", () => {
  const first = normalizeShixisengCard({
    rawText: "AIGC 实习\n公司 A",
    href: "/intern/inn_first",
    crawledAt: "2026-06-16T00:00:00.000Z"
  });
  const second = normalizeShixisengCard({
    rawText: "AIGC 实习\n公司 B",
    href: "/intern/inn_second",
    crawledAt: "2026-06-16T00:00:00.000Z"
  });

  assert.notEqual(first.id, second.id);
});

test("normalizeShixisengDetail prefers clean detail page fields", () => {
  const job = normalizeShixisengDetail({
    url: "https://www.shixiseng.com/intern/inn_gcqh1x4ivjnq?pcm=pc_SearchList",
    documentTitle: "AIGC内容实习生实习招聘-扶光实习生招聘-实习僧",
    heading: "AIGC内容实习生",
    metaDescription:
      "实习僧为您提供扶光AIGC内容实习生实习生招聘信息，包含扶光AIGC内容实习生实习生的岗位职责、任职要求、工作内容说明、薪资待遇等招聘信息。",
    bodyText: [
      "AIGC内容实习生",
      "2026-06-12 10:56:00 刷新",
      "200-300/天 深圳 本科 5天／周 实习3个月",
      "可转正实习",
      "职位描述：",
      "使用AI工具辅助内容生成，参与真实项目。",
      "投递要求：",
      "工作地点：",
      "广东省/深圳市/宝安区"
    ].join("\n"),
    crawledAt: "2026-06-16T00:00:00.000Z"
  });

  assert.equal(job.title, "AIGC内容实习生");
  assert.equal(job.company, "扶光");
  assert.equal(job.city, "深圳");
  assert.equal(job.salary, "200-300/天");
  assert.equal(job.education, "本科");
  assert.equal(job.workDaysPerWeek, "5天／周");
  assert.equal(job.duration, "3个月");
  assert.match(job.description, /使用AI工具/);
});

test("normalizeShixisengDetail does not use footer company city as job city", () => {
  const job = normalizeShixisengDetail({
    url: "https://www.shixiseng.com/intern/inn_city",
    documentTitle: "AIGC视频剪辑实习招聘-爱看互动实习生招聘-实习僧",
    heading: "AIGC视频剪辑",
    metaDescription: "",
    bodyText: [
      "AIGC视频剪辑",
      "2026-05-08 14:36:39 刷新",
      "薪资面议 沈阳 大专 6天／周 实习6个月",
      "职位描述：",
      "负责AIGC短剧的剪辑制作。",
      "工作地点：",
      "辽宁省/沈阳市/和平区",
      "公司简介",
      "爱看互动",
      "互联网/游戏/软件",
      "成都萌想科技有限责任公司版权所有"
    ].join("\n"),
    crawledAt: "2026-06-16T00:00:00.000Z"
  });

  assert.equal(job.city, "沈阳");
  assert.equal(job.company, "爱看互动");
});

test("normalizeShixisengDetail keeps job fields ahead of company intro and footer text", () => {
  const job = normalizeShixisengDetail({
    url: "https://www.shixiseng.com/intern/inn_polluted",
    documentTitle: "AIGC算法实习生实习招聘-示例科技实习生招聘-实习僧",
    heading: "AIGC算法实习生",
    metaDescription: "实习僧为您提供示例科技AIGC算法实习生实习生招聘信息。",
    bodyText: [
      "AIGC算法实习生",
      "2026-06-12 10:56:00 刷新",
      "250-500/天 大连 硕士 5天／周 实习3个月",
      "职位描述：",
      "负责AIGC算法应用，岗位要求硕士基础。",
      "投递要求：",
      "工作地点：",
      "辽宁省/大连市/甘井子区",
      "公司简介",
      "示例科技",
      "北京",
      "学历不限",
      "实习6个月以上",
      "每周 3 天",
      "推荐岗位",
      "AIGC内容实习 150-180/天 厦门 本科 3天／周 实习2个月"
    ].join("\n"),
    crawledAt: "2026-06-16T00:00:00.000Z"
  });

  assert.equal(job.city, "大连");
  assert.equal(job.education, "硕士");
  assert.equal(job.workDaysPerWeek, "5天／周");
  assert.equal(job.duration, "3个月");
});

test("normalizeShixisengDetail extracts company from collapsed raw text", () => {
  const job = normalizeShixisengDetail({
    url: "https://www.shixiseng.com/intern/inn_company",
    documentTitle: "AIGC实习生实习招聘-实习僧",
    heading: "AIGC实习生",
    metaDescription: "",
    bodyText:
      "AIGC实习生 2026-06-12 10:56:00 刷新 200-300/天 深圳 本科 5天／周 实习3个月 职位描述： 使用AI工具。 公司简介 扶光 不限 民营企业 15-50人 职位百科",
    crawledAt: "2026-06-16T00:00:00.000Z"
  });

  assert.equal(job.company, "扶光");
});

test("normalizeShixisengDetail keeps collapsed company names concise", () => {
  const job = normalizeShixisengDetail({
    url: "https://www.shixiseng.com/intern/inn_company_short",
    documentTitle: "AIGC视频实习生实习招聘-实习僧",
    heading: "AIGC视频实习生",
    metaDescription: "",
    bodyText:
      "AIGC视频实习生 200-250/天 北京 不限 5天／周 实习3个月 职位描述： AIGC视频。 公司简介 百度 “百度，全球的中文搜索引擎、的中文网站” 实力大背景 年轻群体 职位百科",
    crawledAt: "2026-06-16T00:00:00.000Z"
  });

  assert.equal(job.company, "百度");
});
