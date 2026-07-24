import fs from "node:fs/promises";
import type { InternshipJob } from "../types.js";

export async function loadJobs(filePath: string): Promise<InternshipJob[]> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    return Array.isArray(parsed) ? (parsed as InternshipJob[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}
