import type { InternshipJob } from "../types.js";
import { getJobIdentity } from "../utils/dedupe.js";
import type { Queryable } from "./migrations.js";

export type JobUpsert = {
  legacyLocalId: string;
  source: InternshipJob["source"];
  sourceUrl: string;
  dedupeKey: string;
  title: string;
  companyName: string;
  city: string;
  salaryText: string;
  durationText: string;
  educationText: string;
  workDaysPerWeekText: string;
  description: string;
  sourcePublishTime: string;
  tags: string[];
  rawText: string;
  matchScore: number | null;
  matchReasons: string[];
  resumeAdvice: string[];
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export function toJobUpsert(job: InternshipJob): JobUpsert {
  const crawledAt = parseDateOrNow(job.crawledAt);

  return {
    legacyLocalId: job.id,
    source: job.source,
    sourceUrl: job.link,
    dedupeKey: getJobIdentity(job),
    title: job.title,
    companyName: job.company,
    city: job.city,
    salaryText: job.salary,
    durationText: job.duration,
    educationText: job.education,
    workDaysPerWeekText: job.workDaysPerWeek,
    description: job.description,
    sourcePublishTime: job.publishTime,
    tags: job.tags,
    rawText: job.rawText,
    matchScore: job.matchScore ?? null,
    matchReasons: job.matchReasons,
    resumeAdvice: job.resumeAdvice,
    firstSeenAt: crawledAt,
    lastSeenAt: crawledAt
  };
}

export async function importJobs(client: Queryable, jobs: InternshipJob[]): Promise<number> {
  let imported = 0;

  await client.query("begin");
  try {
    for (const job of jobs) {
      await upsertJob(client, toJobUpsert(job));
      imported += 1;
    }
    await client.query("commit");
    return imported;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function upsertJob(client: Queryable, job: JobUpsert): Promise<void> {
  await client.query(
    `insert into jobs (
      legacy_local_id,
      source,
      source_url,
      dedupe_key,
      title,
      company_name,
      city,
      salary_text,
      duration_text,
      education_text,
      work_days_per_week_text,
      description,
      source_publish_time,
      tags,
      raw_text,
      match_score,
      match_reasons,
      resume_advice,
      first_seen_at,
      last_seen_at,
      is_active
    )
    values (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, true
    )
    on conflict (dedupe_key) do update set
      legacy_local_id = excluded.legacy_local_id,
      source = excluded.source,
      source_url = excluded.source_url,
      title = excluded.title,
      company_name = excluded.company_name,
      city = excluded.city,
      salary_text = excluded.salary_text,
      duration_text = excluded.duration_text,
      education_text = excluded.education_text,
      work_days_per_week_text = excluded.work_days_per_week_text,
      description = excluded.description,
      source_publish_time = excluded.source_publish_time,
      tags = excluded.tags,
      raw_text = excluded.raw_text,
      match_score = excluded.match_score,
      match_reasons = excluded.match_reasons,
      resume_advice = excluded.resume_advice,
      first_seen_at = least(jobs.first_seen_at, excluded.first_seen_at),
      last_seen_at = greatest(jobs.last_seen_at, excluded.last_seen_at),
      updated_at = now(),
      is_active = true`,
    [
      job.legacyLocalId,
      job.source,
      job.sourceUrl,
      job.dedupeKey,
      job.title,
      job.companyName,
      job.city,
      job.salaryText,
      job.durationText,
      job.educationText,
      job.workDaysPerWeekText,
      job.description,
      job.sourcePublishTime,
      job.tags,
      job.rawText,
      job.matchScore,
      job.matchReasons,
      job.resumeAdvice,
      job.firstSeenAt,
      job.lastSeenAt
    ]
  );
}

function parseDateOrNow(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}
