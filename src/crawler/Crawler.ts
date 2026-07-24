import type { CrawlConfig, InternshipJob, InternshipSource } from "../types.js";

export interface Crawler {
  source: InternshipSource;
  crawl(config: CrawlConfig): Promise<InternshipJob[]>;
}
