# Directory Structure

This document is the source of truth for current project layout and module responsibilities.

## Current Layout

```text
internship_helper/
  AGENTS.md
  README.md
  package.json
  package-lock.json
  tsconfig.json
  data/
    internships.json
    internships.csv
  docs/
    00_PROJECT_BRIEF.md
    ...
    12_PROJECT_PROGRESS_REPORT.md
    superpowers/              # archived implementation specs/plans
  logs/
    app.log
    error.log
  src/
    main.ts
    config.ts
    types.ts
    auto/
      autoCrawl.ts
    browser/
      createBrowser.ts
      loginHelper.ts
    crawl/
      runCrawl.ts
    crawler/
      Crawler.ts
      bossCrawler.ts
      shixisengCrawler.ts
    scoring/
      scoreAndAdviseJob.ts
      scoreJob.ts
      resumeAdvice.ts
    server/
      server.ts
      public/
        index.html
        style.css
        app.js
        descriptionParser.js
        descriptionParser.d.ts
        assets/
    storage/
      loadJobs.ts
      mergeJobs.ts
      saveCsv.ts
      saveJson.ts
    utils/
  tests/
```

## Module Responsibilities

- `src/main.ts`: command entry that starts the crawl flow.
- `src/config.ts`: local paths, server port, and current crawl defaults.
- `src/types.ts`: shared TypeScript types.
- `src/auto/`: local scheduler wrapper around the approved crawl flow.
- `src/browser/`: Playwright browser creation and manual login/captcha pause helpers.
- `src/crawl/`: crawl orchestration across enabled source adapters, scoring, storage, and export.
- `src/crawler/`: source adapters. Adapters collect and normalize only; they do not save files or serve UI data.
- `src/scoring/`: local deterministic scoring and resume advice. It does not access browser or filesystem APIs.
- `src/server/`: Express server and static local UI. Server reads `data/internships.json` and does not invoke crawlers.
- `src/server/public/`: native frontend assets.
- `src/storage/`: load, merge, deduplicate, save JSON, and export CSV.
- `src/utils/`: small shared helpers.
- `data/`: local runtime job data. Do not clear or delete it.
- `logs/`: local runtime logs. Do not delete logs during documentation-only work.
- `tests/`: automated tests.
- `docs/superpowers/`: archived UI redesign spec/plan. It is historical context, not the current source of truth.

## Boundary Rules

- Keep crawler, storage, scoring, and server/UI concerns separate.
- Keep real website selectors inside crawler adapters.
- Keep modules single-purpose and types explicit.
- Missing source fields become empty strings or empty arrays.
- Do not fabricate source data.
- Do not scaffold runtime files during documentation-only tasks.
