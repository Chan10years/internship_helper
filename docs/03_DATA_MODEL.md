# Data Model

This document is the source of truth for shared TypeScript types, local field rules, current crawl defaults, and the planned mapping from local data to an online database.

## Current Source Type

```ts
export type InternshipSource = "boss" | "shixiseng";
```

Status:

- `shixiseng`: implemented and currently enabled.
- `boss`: adapter interface and minimal implementation exist, but BOSS直聘 is not enabled by default and is not part of current MVP acceptance.

## Local InternshipJob

Current local JSON and CSV export use this shape:

```ts
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
```

## Local Field Rules

- `id`, `source`, and `crawledAt` are system-generated and required.
- `link` is required as a string. Use `""` when unavailable.
- Never invent links or source values.
- Missing text fields use `""`.
- Missing list fields use `[]`.
- `matchScore` is optional for unscored records.
- `matchReasons` and `resumeAdvice` use `[]` when no scoring/advice exists.
- Preserve `rawText` when parsing is uncertain.

## Current CrawlConfig

```ts
export type CrawlConfig = {
  keywords: string[];
  cities: string[];
  maxPages: number;
  maxJobsPerSource: number;
  enabledSources: InternshipSource[];
  headless: boolean;
  slowMoMs: number;
};
```

Current default configuration in `src/config.ts`:

- `keywords`: `["AIGC 实习"]`
- `cities`: `[]`
- `maxPages`: `1`
- `maxJobsPerSource`: `10`
- `enabledSources`: `["shixiseng"]`
- `headless`: `false`
- `slowMoMs`: `1200`

These are current code defaults and current test fixtures. They are not long-term product limits.

## Local Deduplication Identity

Storage behavior is defined in `docs/05_STORAGE_AND_EXPORT.md`.

Identity inputs:

- Prefer non-empty normalized `link`.
- If `link.trim()` is empty, use `title + company + city`.

## Planned Online Shared Model

The online product should avoid a full rewrite by mapping the local `InternshipJob` into shared database records.

Planned shared entities:

- `jobs`: shared internship postings.
- `companies`: normalized company records when useful.
- `sources`: source sites such as 实习僧 and BOSS直聘.
- `crawl_tasks`: configured platform crawl or import jobs.
- `crawl_runs`: execution history, status, errors, counts, and timing.
- `job_updates`: optional history of significant field changes.

Shared job fields should include:

- Stable job ID.
- Title.
- Company reference or company name.
- City.
- Salary.
- Duration.
- Education.
- Work days per week.
- Description.
- Source.
- Source URL.
- Publish time when available.
- Tags.
- Raw text or raw snapshot metadata.
- First seen time.
- Last seen time.
- Last updated time.
- Invalid or inactive status.

Online shared data must support deduplication, update tracking, and invalidation when a job disappears or becomes unavailable.

## Planned Online User Model

Private user data must stay separate from shared job data.

Planned user entities:

- `users`: account identity and authentication fields.
- `user_preferences`: cities, roles, skills, availability, education stage, and internship duration preferences.
- `saved_jobs`: per-user saved or favorited jobs.
- `job_scores`: per-user or per-profile scoring results and explanations.
- `resume_profiles`: resume text, structured resume facts, or resume file metadata if approved.
- `export_records`: per-user export history for CSV or other outputs.

Each user should store only their own preferences, saved jobs, scoring results, resume information, and export records.

## Local-To-Online Mapping

Initial mapping:

- `InternshipJob.id` -> `jobs.legacy_local_id` or generated stable job key.
- `title` -> `jobs.title`.
- `company` -> `jobs.company_name` or `companies.name`.
- `city` -> `jobs.city`.
- `salary` -> `jobs.salary_text`.
- `duration` -> `jobs.duration_text`.
- `education` -> `jobs.education_text`.
- `workDaysPerWeek` -> `jobs.work_days_per_week_text`.
- `description` -> `jobs.description`.
- `link` -> `jobs.source_url`.
- `source` -> `sources.code`.
- `publishTime` -> `jobs.source_publish_time`.
- `tags` -> `jobs.tags` or a job/tag relation.
- `rawText` -> `jobs.raw_text` or a raw snapshot table.
- `matchScore`, `matchReasons`, `resumeAdvice` -> seed data for generic scoring only; future personalized scoring belongs in `job_scores`.
- `crawledAt` -> `jobs.first_seen_at` for first import and `jobs.last_seen_at` for refreshes.

## Future Decisions

- Whether to broaden keywords beyond the current AIGC run.
- Whether to enable BOSS直聘 after an explicit source decision.
- Salary parsing rules if numeric filtering is added.
- Exact PostgreSQL schema and migration strategy.
- Whether resume data is text-only, file-based, or structured.
