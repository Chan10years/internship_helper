import { createHash } from "node:crypto";
import type { Page } from "playwright";
import type { Crawler } from "./Crawler.js";
import type { CrawlConfig, InternshipJob } from "../types.js";
import { createBrowser } from "../browser/createBrowser.js";
import { pauseIfLoginOrCaptcha } from "../browser/loginHelper.js";
import { sleep } from "../utils/sleep.js";
import { logger } from "../utils/logger.js";
import { normalizeText } from "../utils/normalizeText.js";

const source = "shixiseng" as const;
const shixisengOrigin = "https://www.shixiseng.com";

type RawShixisengCard = {
  rawText: string;
  href: string;
  crawledAt: string;
};

type RawShixisengDetail = {
  url: string;
  documentTitle: string;
  heading: string;
  metaDescription: string;
  bodyText: string;
  crawledAt: string;
};

const citySignals = [
  "北京",
  "上海",
  "广州",
  "深圳",
  "杭州",
  "长沙",
  "武汉",
  "沈阳",
  "大连",
  "佛山",
  "东莞",
  "珠海",
  "南京",
  "苏州",
  "成都",
  "重庆",
  "厦门",
  "远程"
];

export function buildShixisengSearchUrl(keyword: string, page: number): URL {
  const url = new URL("/interns", shixisengOrigin);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("page", String(page));
  return url;
}

function makeJobId(raw: string): string {
  return `${source}-${createHash("sha256").update(raw).digest("hex").slice(0, 16)}`;
}

function normalizeHref(href: string): string {
  const value = href.trim();
  if (!value) {
    return "";
  }

  try {
    return new URL(value, shixisengOrigin).toString();
  } catch {
    return "";
  }
}

function normalizedLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => normalizeText(line))
    .filter(Boolean);
}

function firstMatching(lines: string[], pattern: RegExp): string {
  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      return normalizeText(match[1] ?? match[0]);
    }
  }

  return "";
}

function firstCity(lines: string[]): string {
  const text = lines.join(" ");
  return citySignals.find((city) => text.includes(city)) ?? "";
}

function jobScopedLines(lines: string[]): string[] {
  const stopIndex = lines.findIndex((line) =>
    /^(公司简介|推荐岗位|相似岗位|职位百科|工商信息|更多职位|热门职位)/.test(line)
  );
  return stopIndex === -1 ? lines : lines.slice(0, stopIndex);
}

function cityFromLines(lines: string[]): string {
  const jobInfoLine =
    lines.find((line) => /(\/天|薪资面议).*(天[／/]\s*周|实习\d+(?:\.\d+)?\s*个月)/.test(line)) ?? "";
  const fromJobInfo = citySignals.find((city) => jobInfoLine.includes(city));
  if (fromJobInfo) {
    return fromJobInfo;
  }

  const locationIndex = lines.findIndex((line) => line.includes("工作地点"));
  if (locationIndex !== -1) {
    const locationText = lines.slice(locationIndex, locationIndex + 3).join(" ");
    const fromLocation = citySignals.find((city) => locationText.includes(city));
    if (fromLocation) {
      return fromLocation;
    }
  }

  return firstCity(lines);
}

function firstCompany(lines: string[], title: string): string {
  return (
    lines.find((line) => {
      if (line === title) {
        return false;
      }
      return !/(\/天|元\/天|天\/周|每周|个月|本科|大专|硕士|博士|学历|城市|投递|立即|收藏)/.test(line);
    }) ?? ""
  );
}

function titleFromDocumentTitle(documentTitle: string): string {
  return normalizeText(documentTitle.split("实习招聘")[0] ?? documentTitle.split("-")[0] ?? "");
}

function companyFromMeta(metaDescription: string, title: string): string {
  const providedMarker = "提供";
  const start = metaDescription.indexOf(providedMarker);
  const titleIndex = title ? metaDescription.indexOf(title) : -1;

  if (start !== -1 && titleIndex > start + providedMarker.length) {
    return normalizeText(metaDescription.slice(start + providedMarker.length, titleIndex));
  }

  const companyMatch = metaDescription.match(/提供(.+?)实习生招聘/);
  return normalizeText(companyMatch?.[1] ?? "");
}

function companyFromBody(lines: string[]): string {
  const companyIndex = lines.findIndex((line) => line === "公司简介" || line.endsWith("公司简介"));
  if (companyIndex !== -1) {
    const multilineCompany = lines.slice(companyIndex + 1).find((line) => {
      return !/(不限|民营企业|外资|合资|国企|\d+-\d+人|职位百科|产品服务)/.test(line);
    });

    if (multilineCompany) {
      return multilineCompany;
    }
  }

  const collapsed = lines.join(" ");
  const afterCompanyIntro = collapsed.split("公司简介")[1] ?? "";
  const match = afterCompanyIntro.match(
    /^\s*(.+?)(?:\s+(?:“|互联网|广告|汽车|不限|民营企业|外资|合资|国企|\d+-\d+人|职位百科|产品服务|实力|收获|大牛|弹性|实习生|校园招聘)|$)/
  );
  return normalizeText(match?.[1] ?? "");
}

function descriptionFromBody(bodyText: string): string {
  const start = bodyText.indexOf("职位描述：");
  if (start === -1) {
    return normalizeText(bodyText);
  }

  const afterStart = bodyText.slice(start + "职位描述：".length);
  const endMarkers = ["投递要求：", "工作地点：", "求职中若出现", "公司简介"];
  const endIndexes = endMarkers.map((marker) => afterStart.indexOf(marker)).filter((index) => index >= 0);
  const end = endIndexes.length > 0 ? Math.min(...endIndexes) : afterStart.length;
  return normalizeText(afterStart.slice(0, end));
}

export function normalizeShixisengCard(card: RawShixisengCard): InternshipJob {
  const lines = normalizedLines(card.rawText);
  const scopedLines = jobScopedLines(lines);
  const title = lines[0] ?? "";
  const company = firstCompany(scopedLines.slice(1), title);
  const link = normalizeHref(card.href);
  const city = cityFromLines(scopedLines);
  const salary = firstMatching(scopedLines, /(\d+\s*[-~至到]?\s*\d*\s*(?:元\/天|\/天|k\/月|K\/月|元\/月)|面议)/);
  const duration = firstMatching(scopedLines, /(\d+(?:\.\d+)?\s*(?:[-~至到]\s*\d+(?:\.\d+)?)?\s*个月(?:以上)?|暑期|短期)/);
  const education = firstMatching(scopedLines, /(大专|本科|硕士|博士|大一|大二|不限)/);
  const workDaysPerWeek = firstMatching(scopedLines, /(\d+\s*天[／/]\s*周|每周\s*\d+\s*天)/);
  const rawText = normalizeText(card.rawText);

  return {
    id: makeJobId(link || `${title}|${company}|${city}|${rawText}`),
    title,
    company,
    city,
    salary,
    duration,
    education,
    workDaysPerWeek,
    description: rawText,
    link,
    source,
    publishTime: "",
    tags: [],
    rawText,
    matchReasons: [],
    resumeAdvice: [],
    crawledAt: card.crawledAt
  };
}

export function normalizeShixisengDetail(detail: RawShixisengDetail): InternshipJob {
  const lines = normalizedLines(detail.bodyText);
  const scopedLines = jobScopedLines(lines);
  const title = normalizeText(detail.heading) || titleFromDocumentTitle(detail.documentTitle);
  const company = companyFromMeta(detail.metaDescription, title) || companyFromBody(lines);
  const link = normalizeHref(detail.url);
  const city = cityFromLines(scopedLines);
  const salary = firstMatching(scopedLines, /(\d+\s*[-~至到]\s*\d+\s*(?:元\/天|\/天|k\/月|K\/月|元\/月)|薪资面议|面议)/);
  const duration = firstMatching(scopedLines, /(?:实习)?(\d+(?:\.\d+)?\s*(?:[-~至到]\s*\d+(?:\.\d+)?)?\s*个月(?:以上)?|暑期|短期)/);
  const education = firstMatching(scopedLines, /(大专|本科|硕士|博士|大一|大二|不限)/);
  const workDaysPerWeek = firstMatching(scopedLines, /(\d+\s*天[／/]\s*周|每周\s*\d+\s*天)/);
  const description = descriptionFromBody(detail.bodyText);
  const rawText = normalizeText(detail.bodyText);

  return {
    id: makeJobId(link || `${title}|${company}|${city}|${rawText}`),
    title,
    company,
    city,
    salary,
    duration,
    education,
    workDaysPerWeek,
    description,
    link,
    source,
    publishTime: firstMatching(lines, /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/),
    tags: [],
    rawText,
    matchReasons: [],
    resumeAdvice: [],
    crawledAt: detail.crawledAt
  };
}

async function collectRawCards(page: Page, limit: number): Promise<RawShixisengCard[]> {
  const crawledAt = new Date().toISOString();
  const script = `
    (() => {
      const evaluatedAt = ${JSON.stringify(crawledAt)};
      const evaluatedLimit = ${JSON.stringify(limit)};
      const normalize = (value) => value.replace(/\\s+/g, " ").trim();
      const cardTextLooksUseful = (text) => /实习|\\/天|天\\/周|个月|薪/.test(text);
      const toAbsoluteHref = (href) => {
        try {
          return new URL(href, "https://www.shixiseng.com").toString();
        } catch {
          return "";
        }
      };
      const pickContainer = (anchor) => {
        let current = anchor;
        let best = anchor;

        for (let depth = 0; depth < 6 && current; depth += 1) {
          const text = normalize(current.innerText || "");
          if (text.length >= 20 && text.length <= 1200 && cardTextLooksUseful(text)) {
            best = current;
          }
          current = current.parentElement;
        }

        return best;
      };

      const seen = new Set();
      const cards = [];
      const anchors = Array.from(document.querySelectorAll("a[href]")).filter((anchor) => {
        const href = anchor.getAttribute("href") || "";
        return /\\/intern\\//.test(href);
      });

      for (const anchor of anchors) {
        if (cards.length >= evaluatedLimit) {
          break;
        }

        const href = toAbsoluteHref(anchor.getAttribute("href") || "");
        const container = pickContainer(anchor);
        const rawText = normalize(container.innerText || "");
        const key = href || rawText;

        if (!key || seen.has(key) || !cardTextLooksUseful(rawText)) {
          continue;
        }

        seen.add(key);
        cards.push({ rawText, href, crawledAt: evaluatedAt });
      }

      return cards;
    })()
  `;

  // TODO: Re-verify 实习僧 card class names when the live site layout changes.
  return page.evaluate(script) as Promise<RawShixisengCard[]>;
}

async function collectFromPage(page: Page, limit: number): Promise<InternshipJob[]> {
  const rawCards = await collectRawCards(page, limit);
  const jobs: InternshipJob[] = [];

  for (const rawCard of rawCards) {
    if (jobs.length >= limit) {
      break;
    }

    const job = rawCard.href
      ? await collectFromDetailPage(page, rawCard.href, rawCard.crawledAt).catch(async () => normalizeShixisengCard(rawCard))
      : normalizeShixisengCard(rawCard);
    if (job.rawText) {
      jobs.push(job);
    }

    await sleep(1200);
  }

  return jobs;
}

async function collectFromDetailPage(page: Page, url: string, crawledAt: string): Promise<InternshipJob> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
  await pauseIfLoginOrCaptcha(page);

  const script = `
    (() => {
      const meta = document.querySelector('meta[name="description"]');
      const heading = document.querySelector('h1,.new_job_name,.job_name,.title');
      return {
        url: ${JSON.stringify(url)},
        documentTitle: document.title || "",
        heading: heading ? heading.innerText : "",
        metaDescription: meta ? meta.getAttribute("content") || "" : "",
        bodyText: document.body ? document.body.innerText || "" : "",
        crawledAt: ${JSON.stringify(crawledAt)}
      };
    })()
  `;

  const detail = (await page.evaluate(script)) as RawShixisengDetail;
  return normalizeShixisengDetail(detail);
}

export const shixisengCrawler: Crawler = {
  source,
  async crawl(config: CrawlConfig): Promise<InternshipJob[]> {
    const session = await createBrowser(config);
    const jobs: InternshipJob[] = [];

    try {
      for (const keyword of config.keywords) {
        if (jobs.length >= config.maxJobsPerSource) {
          break;
        }

        for (let pageNumber = 1; pageNumber <= config.maxPages; pageNumber += 1) {
          if (jobs.length >= config.maxJobsPerSource) {
            break;
          }

          const url = buildShixisengSearchUrl(keyword, pageNumber);
          await logger.info(`实习僧 crawl keyword=${keyword} page=${pageNumber} url=${url.toString()}`);
          await session.page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
          await session.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
          await pauseIfLoginOrCaptcha(session.page);
          await sleep(config.slowMoMs);

          const remaining = config.maxJobsPerSource - jobs.length;
          const pageJobs = await collectFromPage(session.page, remaining);
          await logger.info(`实习僧 collected ${pageJobs.length} cards keyword=${keyword} page=${pageNumber}`);
          jobs.push(...pageJobs);
          await sleep(config.slowMoMs);
        }
      }
    } finally {
      await session.browser.close();
    }

    return jobs;
  }
};
