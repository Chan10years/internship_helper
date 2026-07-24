import { runCrawl } from "./crawl/runCrawl.js";
import { logger } from "./utils/logger.js";

runCrawl().catch(async (error: unknown) => {
  await logger.error("Crawl failed", error);
  process.exitCode = 1;
});
