import type { JobDetail, JobSummary } from "./types.js";

export type JobDatabase = {
  query<Row>(sql: string, params?: unknown[]): Promise<{ rows: Row[] }>;
};

export class PostgresJobRepository {
  constructor(private readonly database: JobDatabase) {}

  async listSummaries(): Promise<JobSummary[]> {
    const result = await this.database.query<JobSummary>(
      `select
         id::text as id,
         title,
         company_name as company,
         city,
         salary_text as salary,
         source_publish_time as "publishTime"
       from jobs
       where is_active = true
       order by last_seen_at desc, id desc`
    );

    return result.rows;
  }

  async findDetailById(id: string): Promise<JobDetail | null> {
    if (!/^[1-9]\d*$/.test(id)) {
      return null;
    }

    const result = await this.database.query<JobDetail>(
      `select
         id::text as id,
         title,
         company_name as company,
         city,
         salary_text as salary,
         source_publish_time as "publishTime",
         duration_text as duration,
         education_text as education,
         work_days_per_week_text as "workDaysPerWeek",
         description,
         source_url as link,
         source,
         tags,
         match_score as "matchScore",
         match_reasons as "matchReasons",
         resume_advice as "resumeAdvice"
       from jobs
       where id = $1 and is_active = true`,
      [id]
    );

    return result.rows[0] ?? null;
  }
}
