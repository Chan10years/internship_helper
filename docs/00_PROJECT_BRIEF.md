# Project Brief

This document defines product direction, stage boundaries, and product scope. Detailed implementation rules live in the topic documents.

## Product Position

`internship_helper` is currently an approved invitation-only online MVP under local verification. It combines the proven local collection/scoring workflow with PostgreSQL-backed job browsing and a real account boundary.

The confirmed long-term goal is to evolve it into an online internship information product that supports about 1000 registered users, 100 to 300 daily active users, and normally 20 to 50 concurrent users.

The project should keep the current local MVP useful while avoiding choices that block a later online architecture. It should also avoid premature complexity: no microservices, Kubernetes, or complex distributed system design for the first online stage.

## Product Owner

The user is the product manager. Agents may make conservative technical organization decisions, but product scope, priority, and tradeoffs require product-manager approval.

## Stage Definitions

### Current Stage: Invitation-Only Account MVP

Goal: prove the complete visitor → invitation registration/login → protected job-detail flow and make it reproducible and deployable.

已实现：

- 实习僧 AIGC crawl path has run successfully.
- 10 real 实习僧 job records exist in local data files.
- JSON storage and CSV export.
- Merge and deduplication.
- Local deterministic rule scoring.
- Local resume-preparation advice.
- Express `/api/jobs`.
- Native HTML/CSS/JS Web UI for search, filtering, sorting, detail reading, and safe source-link opening.
- Local automatic crawl scheduling.
- Automated tests around storage, crawler normalization, scoring, scheduler behavior, login/captcha detection, and UI structure.
- PostgreSQL job source of truth, public summaries, authenticated full details, invitation accounts, secure sessions, administrator CLI, auth pages, and deployment material.

Current-stage scope includes:

- Safe, visible-browser crawling.
- Local JSON and CSV persistence.
- Local web browsing and filtering.
- Local scoring and resume advice.
- Local scheduled crawl wrapper.

Current-stage scope does not include:

- Public Internet deployment or buying infrastructure.
- User profile storage.
- Real LLM or API-key workflows.
- Ordinary users triggering crawlers from a web account.
- BOSS直聘 as an MVP acceptance requirement.

### Next Stage: Product Enrichment After Acceptance

Goal: move the product toward a server/database architecture while keeping scope small.

Expected direction:

- Keep one primary application rather than splitting into services.
- Validate the existing shared PostgreSQL job data in a real release rehearsal.
- Preserve current browsing, filtering, scoring, and export workflows.
- Consider preferences, saved jobs, or applications only after a separate product decision.
- Keep platform-controlled crawling separate from user-facing browsing.

### Target Stage: Multi-User Online Product

Goal: support registration, login, personal preferences, saved jobs, resume matching, subscriptions or alerts, and private user data for about 1000 registered users.

Target-stage capabilities may include:

- Registration and login.
- Personal preferences.
- Saved jobs and application status.
- Per-user scoring results.
- Resume information with privacy and deletion controls.
- Subscription or notification workflows.
- Shared job catalog.
- Platform-controlled background collection.

## Long-Term Product Boundaries

The online product must:

- Use platform-level collection, not per-user Playwright crawling.
- Keep shared job data separate from private user data.
- Keep user data private by default.
- Support operational basics such as logs, monitoring, backup, and privacy deletion before broader use.

The online product must not:

- Let ordinary users start unlimited crawls.
- Store third-party recruitment-site credentials, cookies, tokens, or `storageState` for users.
- Bypass captchas, SMS checks, access controls, or risk controls.
- Require microservices or Kubernetes in the first online implementation.

## Topic Documents

- Stack and dependencies: `docs/01_TECH_STACK.md`
- Directory responsibilities: `docs/02_DIRECTORY_STRUCTURE.md`
- Data model and crawl config: `docs/03_DATA_MODEL.md`
- Crawler policy: `docs/04_CRAWLER_POLICY.md`
- Storage/export: `docs/05_STORAGE_AND_EXPORT.md`
- Web UI: `docs/06_WEB_UI_SPEC.md`
- Scoring/advice: `docs/07_SCORING_AND_RESUME_ADVICE.md`
- Acceptance checks: `docs/08_ACCEPTANCE_CHECKLIST.md`
- Forbidden actions: `docs/09_FORBIDDEN_ACTIONS.md`
- Roadmap: `docs/10_IMPLEMENTATION_ROADMAP.md`
- Online product plan: `docs/11_ONLINE_PRODUCT_PLAN.md`

## Open Product Questions

- Whether BOSS直聘 should remain a placeholder or become a verified source later.
- Whether registration should remain invitation-only after the MVP.
- Whether online user profiles store structured preferences, resume text, or both.
- Whether subscriptions mean email alerts, in-app saved searches, or another mechanism.
- Deployment target and backup policy for the future online phase.
