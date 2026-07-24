export type InternshipSource = "boss" | "shixiseng";

export type InternshipJob = {
  id: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  duration: string;
  education: string;
  workDaysPerWeek: string;
  description: string;
  link: string;
  source: InternshipSource;
  publishTime: string;
  tags: string[];
  rawText: string;
  matchScore?: number;
  matchReasons: string[];
  resumeAdvice: string[];
  crawledAt: string;
};

export type CrawlConfig = {
  keywords: string[];
  cities: string[];
  maxPages: number;
  maxJobsPerSource: number;
  enabledSources: InternshipSource[];
  headless: boolean;
  slowMoMs: number;
};

export type ScoreResult = {
  matchScore: number;
  matchReasons: string[];
};
