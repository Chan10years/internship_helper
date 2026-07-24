# Crawler Policy

This document is the source of truth for crawler behavior, source status, safety, login/captcha handling, limits, failure handling, and future online collection principles.

## Source Status

已实现：

- 实习僧 adapter is implemented, currently enabled, and has successfully collected 10 AIGC-related jobs.

保留但不纳入当前 MVP 验收：

- BOSS直聘 adapter interface and minimal implementation exist with TODO-marked selectors.
- BOSS直聘 is not enabled by default.
- BOSS直聘 should not be treated as a required current-stage success condition unless the product manager approves that scope.

暂不实现：

- Automatic login.
- Captcha or SMS bypass.
- Access-control or risk-control bypass.
- Proxy pools.
- Browser fingerprint bypass.
- High-frequency access.

## Adapter Contract

Each website has one crawler adapter implementing:

```ts
interface Crawler {
  source: InternshipSource;
  crawl(config: CrawlConfig): Promise<InternshipJob[]>;
}
```

Crawler adapters collect and normalize only. They do not save files, export CSV, score jobs, or serve UI data.

## Adapter Responsibilities

Each adapter:

- Opens source website pages.
- Searches configured keywords.
- Extracts listing and detail data where available.
- Normalizes records into `InternshipJob[]`.
- Keeps real website selectors inside the adapter.
- Adds nearby `TODO` comments for uncertain selectors.
- Uses empty strings or empty arrays for missing fields.
- Never fabricates source data.

## Login And Captcha Handling

- Only allow login to the user's own accounts.
- When login or captcha appears, pause and let the user complete it manually.
- Use this exact terminal prompt:

```text
请在弹出的浏览器中手动登录自己的账号。如果出现验证码，请手动完成。完成后回到终端按 Enter 继续。
```

- After manual action, wait for Enter or terminal confirmation before continuing.
- Do not save, export, print, copy, or commit passwords, cookies, tokens, or `storageState`.
- Do not add automatic login or credential replay.

## Browser Profile Policy

- `.browser-profile/` may be used only to persist the user's own local browser login state when browser persistence is implemented.
- `.browser-profile/` must be listed in `.gitignore` before use.
- Documentation-only tasks must not create `.browser-profile/`.
- README must warn that `.browser-profile/` may contain login cookies if browser persistence is used.

## Local Crawl Limits

- Use visible browser mode by default: `headless: false`.
- Use the current defaults from `docs/03_DATA_MODEL.md`.
- Keep crawl scope configurable through `CrawlConfig`.
- Add delays, limits, and clear stop conditions.
- Do not remove sleeps unless the product manager approves a revised crawl policy.
- Do not retry indefinitely.

## Local Automatic Scheduling

已实现：

- `npm run auto:crawl` starts a local scheduler.
- Default interval is 24 hours.
- `AUTO_CRAWL_INTERVAL_MINUTES` must be a positive number.
- `AUTO_CRAWL_RUN_IMMEDIATELY=false` starts without an immediate first run.
- Overlapping scheduled runs are skipped.

The scheduler must call the same crawl, storage, scoring, merge, and export flow as manual crawling.

## Online Collection Principles

For the future online product:

- Crawlers are platform background tasks, not user-owned browser sessions.
- Ordinary users must not directly trigger unlimited collection.
- Multiple users share the same collected job catalog.
- The same source, keyword, city, and filter set should be deduplicated as a crawl task where practical.
- Crawl tasks must have frequency limits.
- Crawl tasks must have failure retry limits.
- Operators must be able to pause or disable a source, keyword, or task.
- Platform crawling must still follow the same safety boundaries: no automatic login, no captcha bypass, no proxy pools, no fingerprint bypass, and no saved account credentials.
- Collection results must feed the shared job database, not per-user private job stores.
- Background tasks should record status, started time, finished time, counts, errors, and next scheduled time.

## Online Failure Handling

The future online task system should:

- Detect blocked, captcha, login-required, or layout-changed states where practical.
- Stop or pause a task instead of retrying forever.
- Mark source errors without exposing secrets.
- Preserve partial valid results when safe.
- Record enough diagnostics for administrators to decide whether a source needs verification.

## Future Decisions

- Whether BOSS直聘 verification belongs in a later phase.
- Whether screenshots should be saved for debugging.
- Exact online task queue technology.
- Per-source refresh intervals.
