import type { InternshipSource } from "../types.js";

export type JobSummary = {
  id: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  publishTime: string;
};

export type JobDetail = JobSummary & {
  duration: string;
  education: string;
  workDaysPerWeek: string;
  description: string;
  link: string;
  source: InternshipSource;
  tags: string[];
  matchScore: number | null;
  matchReasons: string[];
  resumeAdvice: string[];
};
