import type { Page } from "playwright";
import { createBrowser } from "../browser/createBrowser.js";
import { pauseIfLoginOrCaptcha } from "../browser/loginHelper.js";
import type { Crawler } from "./Crawler.js";
import type { CrawlConfig, InternshipJob } from "../types.js";
import { sleep } from "../utils/sleep.js";
import { normalizeText } from "../utils/normalizeText.js";
import { logger } from "../utils/logger.js";

const source = "boss" as const;
const bossSearchUrl = "https://www.zhipin.com/web/geek/job";

function makeJobId(sourceName: string, raw: string): string {
  return `${sourceName}-${Buffer.from(raw).toString("base64url").slice(0, 16)}`;
}

async function collectFromPage(page: Page, limit: number): Promise<InternshipJob[]> {
  // TODO: Verify BOSS直聘 list card selector in a live headed browser session.
  const cards = await page.locator(".job-card-wrapper, .job-list-box li").all();
  const jobs: InternshipJob[] = [];

  for (const card of cards.slice(0, limit)) {
    const rawText = normalizeText(await card.innerText().catch(() => ""));
    if (!rawText) {
      continue;
    }

    // TODO: Verify each nested selector; current values are conservative debugging candidates.
    const title = normalizeText(await card.locator(".job-name, .job-title").first().innerText().catch(() => ""));
    const company = normalizeText(await card.locator(".company-name").first().innerText().catch(() => ""));
    const link = await card.locator("a").first().getAttribute("href").catch(() => "");
    const normalizedLink = link?.startsWith("http") ? link : link ? `https://www.zhipin.com${link}` : "";

    jobs.push({
      id: makeJobId(source, normalizedLink || `${title}|${company}|${rawText}`),
      title,
      company,
      city: "",
      salary: "",
      duration: "",
      education: "",
      workDaysPerWeek: "",
      description: "",
      link: normalizedLink,
      source,
      publishTime: "",
      tags: [],
      rawText,
      matchReasons: [],
      resumeAdvice: [],
      crawledAt: new Date().toISOString()
    });

    await sleep(1000);
  }

  return jobs;
}

export const bossCrawler: Crawler = {
  source,
  async crawl(config: CrawlConfig): Promise<InternshipJob[]> {
    const session = await createBrowser(config);
    const jobs: InternshipJob[] = [];

    try {
      for (const keyword of config.keywords) {
        if (jobs.length >= config.maxJobsPerSource) {
          break;
        }

        const url = `${bossSearchUrl}?query=${encodeURIComponent(keyword)}`;
        await logger.info(`BOSS crawl keyword=${keyword} page=1`);
        await session.page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await pauseIfLoginOrCaptcha(session.page);
        await sleep(config.slowMoMs);
        const remaining = config.maxJobsPerSource - jobs.length;
        jobs.push(...(await collectFromPage(session.page, remaining)));
        await sleep(config.slowMoMs);
      }
    } finally {
      await session.browser.close();
    }

    return jobs;
  }
};
