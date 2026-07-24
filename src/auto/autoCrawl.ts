import { runCrawl } from "../crawl/runCrawl.js";
import { logger } from "../utils/logger.js";

export type AutoCrawlSettings = {
  intervalMs: number;
  runImmediately: boolean;
};

type AutoCrawlSchedulerOptions = {
  settings: AutoCrawlSettings;
  crawl: () => Promise<void>;
  logInfo: (message: string) => Promise<void>;
  logError: (message: string, error?: unknown) => Promise<void>;
  setIntervalFn: (callback: () => void, intervalMs: number) => unknown;
  clearIntervalFn: (handle: unknown) => void;
};

export type AutoCrawlScheduler = {
  currentRun: Promise<void> | undefined;
  start(): void;
  stop(): void;
};

const defaultIntervalMinutes = 24 * 60;

export function readAutoCrawlSettings(env: NodeJS.ProcessEnv): AutoCrawlSettings {
  const rawInterval = env.AUTO_CRAWL_INTERVAL_MINUTES?.trim();
  const intervalMinutes = rawInterval ? Number(rawInterval) : defaultIntervalMinutes;

  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new Error("AUTO_CRAWL_INTERVAL_MINUTES must be a positive number.");
  }

  return {
    intervalMs: intervalMinutes * 60 * 1000,
    runImmediately: env.AUTO_CRAWL_RUN_IMMEDIATELY?.trim().toLowerCase() !== "false"
  };
}

export function createAutoCrawlScheduler(options: AutoCrawlSchedulerOptions): AutoCrawlScheduler {
  let intervalHandle: unknown;
  let activeRun: Promise<void> | undefined;

  async function runOnce(): Promise<void> {
    if (activeRun) {
      await options.logInfo("Auto crawl skipped because the previous run is still active.");
      return;
    }

    activeRun = options
      .crawl()
      .catch(async (error: unknown) => {
        await options.logError("Auto crawl failed", error);
      })
      .finally(() => {
        activeRun = undefined;
      });

    await activeRun;
  }

  return {
    get currentRun() {
      return activeRun;
    },
    start(): void {
      const intervalMinutes = options.settings.intervalMs / 60000;
      void options.logInfo(
        `Auto crawl scheduler started. intervalMinutes=${intervalMinutes} runImmediately=${options.settings.runImmediately}`
      );
      intervalHandle = options.setIntervalFn(() => {
        void runOnce();
      }, options.settings.intervalMs);

      if (options.settings.runImmediately) {
        void runOnce();
      }
    },
    stop(): void {
      if (intervalHandle) {
        options.clearIntervalFn(intervalHandle);
        intervalHandle = undefined;
      }
    }
  };
}

const isDirectRun = process.argv[1]?.endsWith("autoCrawl.ts") || process.argv[1]?.endsWith("autoCrawl.js");

if (isDirectRun) {
  try {
    const scheduler = createAutoCrawlScheduler({
      settings: readAutoCrawlSettings(process.env),
      crawl: runCrawl,
      logInfo: logger.info,
      logError: logger.error,
      setIntervalFn: setInterval,
      clearIntervalFn: (handle) => {
        clearInterval(handle as ReturnType<typeof setInterval>);
      }
    });

    scheduler.start();

    process.on("SIGINT", () => {
      scheduler.stop();
      process.exit(0);
    });
  } catch (error: unknown) {
    await logger.error("Auto crawl scheduler failed to start", error);
    process.exitCode = 1;
  }
}
