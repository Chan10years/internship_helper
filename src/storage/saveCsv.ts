import fs from "node:fs/promises";
import path from "node:path";
import { stringify } from "csv-stringify/sync";
import type { InternshipJob } from "../types.js";

const columns = [
  "title",
  "company",
  "city",
  "salary",
  "duration",
  "education",
  "workDaysPerWeek",
  "matchScore",
  "matchReasons",
  "resumeAdvice",
  "link",
  "source",
  "crawledAt"
];

export async function saveCsv(filePath: string, jobs: InternshipJob[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const records = jobs.map((job) => ({
    title: job.title,
    company: job.company,
    city: job.city,
    salary: job.salary,
    duration: job.duration,
    education: job.education,
    workDaysPerWeek: job.workDaysPerWeek,
    matchScore: job.matchScore ?? "",
    matchReasons: job.matchReasons.join(" | "),
    resumeAdvice: job.resumeAdvice.join(" | "),
    link: job.link,
    source: job.source,
    crawledAt: job.crawledAt
  }));
  const csv = stringify(records, { header: true, columns });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, csv, "utf8");
  await fs.rename(tmpPath, filePath);
}
