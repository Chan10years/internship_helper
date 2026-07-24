import type { InternshipJob } from "../types.js";

export function getJobIdentity(job: InternshipJob): string {
  const link = job.link.trim();
  if (link) {
    return getLinkIdentity(link);
  }

  return getFallbackIdentity(job);
}

export function getLinkIdentity(link: string): string {
  return `link:${link.trim()}`;
}

export function getFallbackIdentity(job: InternshipJob): string {
  return `fallback:${job.title.trim()}|${job.company.trim()}|${job.city.trim()}`;
}

export function dedupeJobs(jobs: InternshipJob[]): InternshipJob[] {
  const seen = new Map<string, InternshipJob>();

  for (const job of jobs) {
    const identity = getJobIdentity(job);
    if (!seen.has(identity)) {
      seen.set(identity, job);
    }
  }

  return [...seen.values()];
}
