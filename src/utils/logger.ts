import fs from "node:fs/promises";
import path from "node:path";
import { appLogPath, errorLogPath, logsDir } from "../config.js";

async function append(filePath: string, level: string, message: string): Promise<void> {
  await fs.mkdir(logsDir, { recursive: true });
  const line = `${new Date().toISOString()} [${level}] ${message}\n`;
  await fs.appendFile(filePath, line, "utf8");
}

export const logger = {
  async info(message: string): Promise<void> {
    console.log(message);
    await append(appLogPath, "INFO", message);
  },
  async error(message: string, error?: unknown): Promise<void> {
    const detail = error instanceof Error ? `${message}: ${error.message}` : message;
    console.error(detail);
    await append(errorLogPath, "ERROR", detail);
  }
};
