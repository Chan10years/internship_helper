# Acceptance Checklist

This document is the source of truth for milestone and safety acceptance checks.

Use only the relevant section for the current task. Future checks are not current implementation claims.

## A. Local MVP Acceptance

Current-stage acceptance:

- [ ] `AGENTS.md` is an execution entry, not a duplicate full spec.
- [ ] `README.md` matches the current implemented local product.
- [ ] Current status is separated from future target status.
- [ ] No files outside `D:\CodeLibrary\internship_helper` are modified.
- [ ] No Git modification commands are used unless explicitly approved.
- [ ] No dependencies are installed unless explicitly approved.
- [ ] No `src` business code is changed during documentation-only tasks.
- [ ] No crawler is executed during documentation-only tasks.
- [ ] npm remains the only package manager.
- [ ] No unapproved frontend framework, database, API-key workflow, or global dependency is added.
- [ ] `.gitignore` includes `node_modules/`, `dist/`, `logs/`, `.browser-profile/`, `data/*.tmp`, and `.env`.

Crawler and data acceptance:

- [ ] `npm run crawl` uses visible Chromium by default.
- [ ] Login-required or captcha pages pause with the exact required Chinese prompt.
- [ ] No captcha bypass, proxy pool, fingerprint bypass, or high-frequency logic exists.
- [ ] 实习僧 remains the current enabled source unless a product decision changes the default.
- [ ] BOSS直聘 is not treated as current MVP acceptance unless explicitly approved.
- [ ] `data/internships.json` and `data/internships.csv` are preserved unless updated through the approved storage/export flow.
- [ ] Shared types follow `docs/03_DATA_MODEL.md`.
- [ ] Missing text fields normalize to empty strings.
- [ ] Missing list fields normalize to empty arrays.
- [ ] `link` remains a required string and is never fabricated.
- [ ] CSV export uses `csv-stringify`.
- [ ] Deduplication uses non-empty `link`, then `title + company + city`.

Web and scoring acceptance:

- [ ] `/api/jobs` reads local data and does not invoke crawlers.
- [ ] `npm run web` can start the local page.
- [ ] Local page displays data from `/api/jobs`.
- [ ] Web UI can search, filter, sort, view details, and open safe source links.
- [ ] UI remains usable when scoring fields are missing.
- [ ] Empty states and load failures are visible.
- [ ] Job data is rendered safely without direct insertion of untrusted HTML.
- [ ] Keyboard and reduced-motion behavior remain intact.
- [ ] Scoring remains local, deterministic, rule-based, explainable, and non-networked.

## B. Online Single-User Version Acceptance

This layer is for a future approved phase. It is not currently implemented.

- [ ] Current local JSON/CSV data can be migrated or imported into PostgreSQL.
- [ ] Shared job records preserve the local `InternshipJob` fields or documented equivalents.
- [ ] Job browsing APIs read from the database rather than directly from JSON.
- [ ] One authenticated user can log in and manage their own preferences.
- [ ] User preferences are stored separately from shared jobs.
- [ ] Saved jobs are stored per user.
- [ ] Scoring results can be associated with a user or preference profile.
- [ ] Platform background collection can update the shared job catalog.
- [ ] Ordinary users cannot trigger unlimited crawling.
- [ ] API routes require authentication where user data is involved.
- [ ] Basic rate limits and error handling exist for account and API routes.
- [ ] Logs and backups exist for the database-backed version.
- [ ] Privacy deletion expectations are documented before storing resume or profile data.

## C. 1000 Registered User Target Acceptance

This layer is for the target multi-user product. It is not currently implemented.

- [ ] The product supports registration, login, logout, and session handling.
- [ ] Private user data is isolated between users.
- [ ] Shared jobs are stored once and reused across users.
- [ ] Users can maintain preferences, saved jobs, scoring results, resume information, and export records.
- [ ] Platform collection runs through scheduled or background tasks.
- [ ] Crawl tasks have deduplication, frequency limits, retry limits, and pause controls.
- [ ] Jobs have last-seen, updated, and invalid/inactive status.
- [ ] APIs have authentication, authorization, rate limiting, validation, and safe error responses.
- [ ] Logs, monitoring, backups, restore procedure, and privacy deletion workflow are in place.
- [ ] The system is tested against about 1000 registered users, 100 to 300 daily active users, and normally 20 to 50 concurrent users.
- [ ] The architecture remains a manageable single application plus PostgreSQL plus background task queue unless a real scaling issue justifies more complexity.
- [ ] Microservices and Kubernetes are not introduced without a later explicit architecture decision.

## D. Invitation-Only Account MVP Acceptance

- [x] Public job API returns only id, title, company, city, salary, and publish time.
- [x] Full job detail is rejected without a valid active server session.
- [x] Invitation registration, password login, logout, and password reset routes exist with validation, CSRF, and rate limiting.
- [x] Passwords use salted scrypt hashes; invitation and reset tokens are stored by hash.
- [x] Account disable/enable and completed password reset invalidate old sessions.
- [x] PostgreSQL migrations and JSON job import are versioned/transactional and import is idempotent.
- [x] Authentication pages support desktop/mobile layouts, keyboard focus, status messages, and reduced motion.
- [x] Dockerfile, Compose ordering, health endpoints, environment validation, and administrator commands exist.
- [x] Unit/type/build verification passes in the local Codex environment.
- [ ] Real PostgreSQL integration test passes with `TEST_DATABASE_URL`.
- [ ] Desktop and mobile E2E passes against a running PostgreSQL-backed application.
- [ ] A backup is created and restored successfully in a disposable environment.
- [ ] A fresh Compose environment completes migration, import, startup, and rollback rehearsal.
