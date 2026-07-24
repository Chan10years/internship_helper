import { chromium, type Browser, type Page } from "playwright";
import type { CrawlConfig } from "../types.js";

export type BrowserSession = {
  browser: Browser;
  page: Page;
};

export async function createBrowser(config: CrawlConfig): Promise<BrowserSession> {
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMoMs
  });
  const page = await browser.newPage();
  return { browser, page };
}
