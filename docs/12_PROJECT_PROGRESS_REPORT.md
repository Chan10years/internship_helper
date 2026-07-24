# Project Progress Report

Date: 2026-07-01

Project: `internship_helper`

Working directory: `D:\CodeLibrary\internship_helper`

This document is an archival progress report, not the source of truth for live specifications. Current rules live in `AGENTS.md` and `docs/00` through `docs/11`.

## Summary

`internship_helper` is currently a functional local internship assistant. It can collect a small set of internships, normalize them, merge and deduplicate stored data, export JSON and CSV, score jobs with local rules, provide resume-preparation advice, and display results through a local Web UI.

It is not yet an online multi-user product.

## Current Product State

已实现：

- Local TypeScript project setup.
- Safe visible-browser Playwright crawling.
- Manual login/captcha pause behavior.
- 实习僧 AIGC collection path.
- 10 real 实习僧 records in local data.
- JSON storage and CSV export.
- Merge and deduplication.
- Local rule-based scoring.
- Local resume advice.
- Express `/api/jobs`.
- Native local Web UI.
- Search, filtering, sorting, detail reading, and safe source-link opening.
- Automatic local crawl scheduling.
- Automated tests for core local behavior.

待实现或待验证：

- BOSS直聘 live selector verification.
- Broader source robustness if needed.
- Online product implementation after approval.

暂不实现 during the current local phase:

- Product registration/login/logout.
- Password reset.
- User sessions.
- Database-backed persistence.
- Saved jobs per user.
- Application tracking per user.
- Admin dashboard.
- Cloud deployment.
- HTTPS/domain setup.
- Multi-user security boundaries.
- 1000-user production operation.

## Current Technical Stack

- Node.js.
- TypeScript.
- npm.
- Playwright.
- Chromium.
- Express.
- Native HTML/CSS/JavaScript.
- JSON.
- CSV with `csv-stringify`.
- `tsx`.
- Node built-in test runner.

## Current Source Notes

- 实习僧 is the current enabled source.
- BOSS直聘 code exists as a minimal adapter and needs live selector verification before being treated as working.
- The Web UI reads local data and does not start crawlers.
- The scoring phase was originally planned after the MVP foundation, but it is now implemented and wired into the crawl flow.

## Key Gaps Before Online Use

- Authentication and account management.
- Database schema and persistence.
- Per-user saved jobs, notes, application status, and preferences.
- Admin-only data import/crawl controls.
- Deployment configuration.
- HTTPS and secure cookie settings.
- Backups and recovery.
- Request validation and CSRF protection.
- Login rate limiting.
- Observability and error reporting.
- Load testing for common read paths.

## Recommended Next Decisions

1. Decide whether BOSS直聘 verification is worth doing next.
2. Decide whether to broaden local crawl keywords.
3. Finalize online v1 product scope when ready.
4. Decide online registration policy.
5. Approve online database and auth dependencies before any implementation.

## Safety Notes

- Do not bypass captchas, SMS checks, access controls, or risk controls.
- Do not store third-party recruitment-site passwords, cookies, tokens, or `storageState`.
- Do not let ordinary online users trigger crawler execution.
- Keep crawlers conservative and administrator-controlled.
