import { defaultConfig, internshipsCsvPath, internshipsJsonPath } from "../config.js";
import { bossCrawler } from "../crawler/bossCrawler.js";
import { shixisengCrawler } from "../crawler/shixisengCrawler.js";
import { scoreAndAdviseJob } from "../scoring/scoreAndAdviseJob.js";
import { loadJobs } from "../storage/loadJobs.js";
import { mergeJobs } from "../storage/mergeJobs.js";
import { saveCsv } from "../storage/saveCsv.js";
import { saveJson } from "../storage/saveJson.js";
import type { InternshipJob } from "../types.js";
import { logger } from "../utils/logger.js";

const crawlers = [bossCrawler, shixisengCrawler];

export async function runCrawl(): Promise<void> {
  const collected: InternshipJob[] = [];

  for (const crawler of crawlers) {
    if (!defaultConfig.enabledSources.includes(crawler.source)) {
      continue;
    }

    const jobs = await crawler.crawl(defaultConfig);
    collected.push(...jobs);
  }

  const scored = collected.map(scoreAndAdviseJob);
  const existing = await loadJobs(internshipsJsonPath);
  const merged = mergeJobs(existing, scored);
  await saveJson(internshipsJsonPath, merged);
  await saveCsv(internshipsCsvPath, merged);
  await logger.info(`Saved ${merged.length} internships to JSON and CSV.`);
}
