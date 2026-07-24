import type { InternshipJob } from "../types.js";
import { getFallbackIdentity, getLinkIdentity } from "../utils/dedupe.js";

function mergeJob(existing: InternshipJob, incoming: InternshipJob): InternshipJob {
  return {
    ...existing,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== "";
      })
    ),
    crawledAt: existing.crawledAt,
    matchScore: incoming.matchScore ?? existing.matchScore
  };
}

export function mergeJobs(existing: InternshipJob[], incoming: InternshipJob[]): InternshipJob[] {
  const merged = [...existing];

  for (const incomingJob of incoming) {
    const currentIndex = findMergeIndex(merged, incomingJob);
    if (currentIndex === -1) {
      merged.push(incomingJob);
    } else {
      merged[currentIndex] = mergeJob(merged[currentIndex], incomingJob);
    }
  }

  return merged;
}

function findMergeIndex(existing: InternshipJob[], incoming: InternshipJob): number {
  const incomingLink = incoming.link.trim();
  if (incomingLink) {
    const linkIdentity = getLinkIdentity(incomingLink);
    const linkIndex = existing.findIndex((job) => job.link.trim() && getLinkIdentity(job.link) === linkIdentity);
    if (linkIndex !== -1) {
      return linkIndex;
    }
  }

  const fallbackIdentity = getFallbackIdentity(incoming);
  return existing.findIndex((job) => getFallbackIdentity(job) === fallbackIdentity);
}
