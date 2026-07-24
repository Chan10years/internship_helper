import test from "node:test";
import assert from "node:assert/strict";
import { createAutoCrawlScheduler, readAutoCrawlSettings } from "../src/auto/autoCrawl.js";

test("readAutoCrawlSettings defaults to a daily local crawl with immediate first run", () => {
  const settings = readAutoCrawlSettings({});

  assert.equal(settings.intervalMs, 24 * 60 * 60 * 1000);
  assert.equal(settings.runImmediately, true);
});

test("readAutoCrawlSettings accepts a positive minute interval from env", () => {
  const settings = readAutoCrawlSettings({
    AUTO_CRAWL_INTERVAL_MINUTES: "90",
    AUTO_CRAWL_RUN_IMMEDIATELY: "false"
  });

  assert.equal(settings.intervalMs, 90 * 60 * 1000);
  assert.equal(settings.runImmediately, false);
});

test("readAutoCrawlSettings rejects invalid intervals before scheduling", () => {
  assert.throws(
    () => readAutoCrawlSettings({ AUTO_CRAWL_INTERVAL_MINUTES: "0" }),
    /AUTO_CRAWL_INTERVAL_MINUTES must be a positive number/
  );
});

test("createAutoCrawlScheduler runs once immediately and registers the interval", async () => {
  const calls: string[] = [];
  const intervals: Array<{ callback: () => void; intervalMs: number }> = [];
  const scheduler = createAutoCrawlScheduler({
    settings: { intervalMs: 60000, runImmediately: true },
    crawl: async () => {
      calls.push("crawl");
    },
    logInfo: async (message) => {
      calls.push(message);
    },
    logError: async () => undefined,
    setIntervalFn: (callback, intervalMs) => {
      intervals.push({ callback, intervalMs });
      return 1;
    },
    clearIntervalFn: () => undefined
  });

  scheduler.start();
  await scheduler.currentRun;

  assert.equal(intervals.length, 1);
  assert.equal(intervals[0].intervalMs, 60000);
  assert.deepEqual(calls, ["Auto crawl scheduler started. intervalMinutes=1 runImmediately=true", "crawl"]);
});

test("createAutoCrawlScheduler skips overlapping interval ticks", async () => {
  let releaseCrawl: (() => void) | undefined;
  const events: string[] = [];
  const intervals: Array<{ callback: () => void; intervalMs: number }> = [];
  const scheduler = createAutoCrawlScheduler({
    settings: { intervalMs: 60000, runImmediately: true },
    crawl: () =>
      new Promise<void>((resolve) => {
        events.push("crawl-start");
        releaseCrawl = () => {
          events.push("crawl-end");
          resolve();
        };
      }),
    logInfo: async (message) => {
      events.push(message);
    },
    logError: async () => undefined,
    setIntervalFn: (callback, intervalMs) => {
      intervals.push({ callback, intervalMs });
      return 1;
    },
    clearIntervalFn: () => undefined
  });

  scheduler.start();
  intervals[0].callback();
  releaseCrawl?.();
  await scheduler.currentRun;

  assert.deepEqual(events, [
    "Auto crawl scheduler started. intervalMinutes=1 runImmediately=true",
    "crawl-start",
    "Auto crawl skipped because the previous run is still active.",
    "crawl-end"
  ]);
});
