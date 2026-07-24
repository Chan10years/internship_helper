import type { InternshipJob, ScoreResult } from "../types.js";

const positiveSignals = [
  ["AIGC", 12],
  ["AI", 8],
  ["AI工具", 12],
  ["生成式", 12],
  ["LLM", 12],
  ["ComfyUI", 10],
  ["前端", 10],
  ["数据", 8],
  ["数据分析", 10],
  ["数字媒体", 10],
  ["C++", 12],
  ["C/C++", 12],
  ["图形学", 12],
  ["OpenCV", 10],
  ["Unity", 10],
  ["Unreal", 10],
  ["UE", 8],
  ["游戏开发", 12]
] as const;

const shortDurationSignals = ["1个月", "1.5个月", "1.5-2个月", "2个月", "暑期", "短期"];
const educationSignals = ["本科", "大一", "大二", "不限"];
const proofSignals = ["实习证明", "可开实习证明", "实习证明"];
const preferredRegions = [
  ["湖南", ["湖南", "长沙"]],
  ["广东", ["广东", "广州", "深圳", "佛山", "东莞", "珠海"]],
  ["湖北", ["湖北", "武汉"]]
] as const;
const negativeSignals = ["研一", "研二", "硕士", "博士", "6个月以上"];
const offTargetSignals = ["销售", "客服", "纯运营"];

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function beforeNonJobText(text: string): string {
  const markers = ["公司简介", "推荐岗位", "相似岗位", "职位百科", "工商信息", "热门职位"];
  const indexes = markers.map((marker) => text.indexOf(marker)).filter((index) => index >= 0);
  const end = indexes.length > 0 ? Math.min(...indexes) : text.length;
  return text.slice(0, end);
}

function coreText(job: InternshipJob): string {
  const fallbackRawText = job.description ? "" : beforeNonJobText(job.rawText);
  return [
    job.title,
    job.city,
    job.duration,
    job.education,
    job.workDaysPerWeek,
    job.description,
    job.tags.join(" "),
    fallbackRawText
  ].join(" ");
}

function findSignalRange(text: string, signal: string): [number, number] | undefined {
  const index = text.indexOf(signal);
  return index === -1 ? undefined : [index, index + signal.length];
}

function rangesOverlap(first: [number, number], second: [number, number]): boolean {
  return first[0] < second[1] && second[0] < first[1];
}

export function scoreJob(job: InternshipJob): ScoreResult {
  let score = 50;
  const reasons: string[] = [];
  const text = coreText(job);
  const claimedPositiveRanges: Array<[number, number]> = [];

  const orderedPositiveSignals = [...positiveSignals].sort((a, b) => b[0].length - a[0].length);
  for (const [signal, points] of orderedPositiveSignals) {
    const range = findSignalRange(text, signal);
    if (range && !claimedPositiveRanges.some((claimedRange) => rangesOverlap(range, claimedRange))) {
      score += points;
      reasons.push(`包含相关技能或方向：${signal}`);
      claimedPositiveRanges.push(range);
    }
  }

  for (const signal of shortDurationSignals) {
    if (job.duration.includes(signal) || (!job.duration && text.includes(signal))) {
      score += 6;
      reasons.push(`实习周期较匹配：${signal}`);
    }
  }

  for (const signal of educationSignals) {
    if (job.education.includes(signal) || (!job.education && text.includes(signal))) {
      score += 5;
      reasons.push(`学历要求较友好：${signal}`);
    }
  }

  for (const signal of proofSignals) {
    if (text.includes(signal)) {
      score += 6;
      reasons.push(`支持实习证明：${signal}`);
      break;
    }
  }

  for (const [region, citySignals] of preferredRegions) {
    if (citySignals.some((signal) => job.city.includes(signal) || (!job.city && text.includes(signal)))) {
      score += 8;
      reasons.push(`地区优先匹配：${region}`);
      break;
    }
  }

  for (const signal of negativeSignals) {
    if (job.education.includes(signal) || job.duration.includes(signal) || job.description.includes(signal)) {
      score -= 15;
      reasons.push(`存在较高门槛：${signal}`);
    }
  }

  if ((job.workDaysPerWeek.includes("5") || text.includes("每周 5 天")) && text.includes("线下")) {
    score -= 6;
    reasons.push("每周 5 天且线下要求较重");
  }

  for (const signal of offTargetSignals) {
    if (text.includes(signal)) {
      score -= 12;
      reasons.push(`岗位方向可能不匹配：${signal}`);
    }
  }

  return {
    matchScore: clampScore(score),
    matchReasons: reasons
  };
}
