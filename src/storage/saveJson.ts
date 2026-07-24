import fs from "node:fs/promises";
import path from "node:path";
import type { InternshipJob } from "../types.js";

export async function saveJson(filePath: string, jobs: InternshipJob[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(jobs, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, filePath);
}
