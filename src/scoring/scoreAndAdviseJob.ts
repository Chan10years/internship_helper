import type { InternshipJob } from "../types.js";
import { resumeAdvice } from "./resumeAdvice.js";
import { scoreJob } from "./scoreJob.js";

export function scoreAndAdviseJob(job: InternshipJob): InternshipJob {
  const score = scoreJob(job);

  return {
    ...job,
    matchScore: score.matchScore,
    matchReasons: score.matchReasons,
    resumeAdvice: resumeAdvice(job)
  };
}
