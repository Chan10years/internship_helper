import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { CrawlConfig } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, "..");
export const dataDir = path.join(projectRoot, "data");
export const logsDir = path.join(projectRoot, "logs");
export const internshipsJsonPath = path.join(dataDir, "internships.json");
export const internshipsCsvPath = path.join(dataDir, "internships.csv");
export const appLogPath = path.join(logsDir, "app.log");
export const errorLogPath = path.join(logsDir, "error.log");
export const serverPort = 3000;

const runtimeEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(serverPort)
});

export type RuntimeConfig = {
  databaseUrl: string;
  sessionSecret: string;
  nodeEnv: "development" | "test" | "production";
  port: number;
  isProduction: boolean;
};

export function readRuntimeConfig(environment: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const parsed = runtimeEnvironmentSchema.safeParse(environment);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))].join(", ");
    throw new Error(`Invalid runtime configuration: ${fields}`);
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    sessionSecret: parsed.data.SESSION_SECRET,
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    isProduction: parsed.data.NODE_ENV === "production"
  };
}

export const defaultConfig: CrawlConfig = {
  keywords: ["AIGC 实习"],
  cities: [],
  maxPages: 1,
  maxJobsPerSource: 10,
  enabledSources: ["shixiseng"],
  headless: false,
  slowMoMs: 1200
};
