# Online Product Plan

This document describes the target beyond the approved invitation-only account MVP. The bounded PostgreSQL/auth/deployment foundation is now implemented locally; larger personal-data and scale features remain future work.

## Target

Build an online internship information product that supports about:

- 1000 registered users.
- 100 to 300 daily active users.
- 20 to 50 concurrent users under normal conditions.

The online product should grow from the current local MVP without requiring a full rewrite of job data, scoring concepts, or browsing behavior.

## Current Boundary

当前阶段已实现本地代码、待真实环境总验收：

- Invitation registration/login/logout and PostgreSQL-backed job data.

当前阶段暂不实现：

- User preferences.
- Saved jobs.
- Resume profile storage.
- Subscription or notification workflows.
- Public deployment.
- Multi-user data isolation.

Planning for these capabilities is allowed. Implementing them requires explicit product-manager approval for the relevant roadmap phase and dependencies.

## Product Stages

### Online Single-User Version

Purpose:

- Move shared job storage from local JSON to a database.
- Keep the product usable by one authenticated user or administrator.
- Validate database-backed browsing and platform-controlled collection.

### Target Multi-User Version

Purpose:

- Support registration, login, personal preferences, saved jobs, resume matching, scoring results, and subscription or alert workflows.
- Keep shared job data separate from private user data.
- Operate safely for the target first-stage capacity.

## Architecture Principles

Required principles:

1. The platform collects jobs centrally. Each user must not independently start Playwright.
2. Job data goes into a shared job database.
3. User data is separated from shared job data.
4. Each user stores only their own preferences, saved jobs, scoring results, resume information, and export or subscription records.
5. Crawlers run through scheduled tasks, administrator-controlled tasks, or background jobs.
6. Jobs need deduplication, update time, last-seen time, and invalid/inactive status.
7. APIs need authentication, authorization, rate limiting, validation, and safe error handling.
8. The product needs logs, monitoring, backups, restore procedure, and privacy deletion mechanisms.
9. The first online stage must not use microservices or Kubernetes.
10. Prefer a single application, PostgreSQL, and a background task queue.

## Recommended Online Stack

Candidate stack, pending phase approval:

- Runtime: TypeScript and Node.js.
- Server: Express or an Express-compatible framework.
- Database: PostgreSQL.
- Authentication: approved password hashing, sessions, authorization checks, and password reset flow.
- Background work: a task queue for crawl refreshes, imports, scoring jobs, exports, subscriptions, and cleanup jobs.
- File handling: object storage or file storage only if resume files or generated exports are approved.
- Operations: logging, monitoring, health checks, backups, and restore tooling.

Redis, caching, worker separation, and additional infrastructure should be added only if measured needs appear. The first online version should remain a manageable monolith.

## Data Ownership

Shared platform data:

- Jobs.
- Companies.
- Sources.
- Crawl tasks.
- Crawl runs.
- Job update history or last-update metadata.
- Invalid or inactive job status.

Private user data:

- Account identity.
- Preferences.
- Saved jobs.
- Application status if approved.
- Per-user scoring results.
- Resume profile or resume file metadata if approved.
- Export records.
- Subscription or alert settings if approved.

Private user data must not be mixed into shared job records.

## Platform Collection

Online collection should:

- Run as platform background work.
- Deduplicate tasks by source, keyword, city, and filters where practical.
- Enforce frequency limits.
- Enforce retry limits.
- Allow administrators to pause a task or source.
- Record started time, finished time, status, counts, errors, and next scheduled time.
- Update shared jobs rather than creating per-user duplicates.

Online collection must continue to obey:

- No automatic login.
- No captcha bypass.
- No proxy pools.
- No fingerprint bypass.
- No saved third-party recruitment-site credentials, cookies, tokens, or `storageState` for users.

## APIs

APIs should include:

- Public or authenticated job browsing routes according to the approved access model.
- Authenticated user preference routes.
- Authenticated saved-job routes.
- Authenticated resume/profile routes if approved.
- Authenticated export routes.
- Administrator-only import and crawl task routes.

API requirements:

- Authentication for user data.
- Authorization for private records and admin routes.
- Rate limiting for account and API routes.
- Request validation.
- Safe error responses.
- Logging without leaking secrets.

## Security And Privacy

The online product must plan:

- Password hashing.
- Secure session cookies.
- CSRF protection or equivalent state-changing request protection.
- Secrets in environment variables, never source files.
- Privacy deletion for user profile, resume, saved jobs, scoring results, and export records.
- Backup and restore before broader rollout.
- Monitoring and alerting before the 1000-user target stage.

## Non-Goals For First Online Stage

- Microservices.
- Kubernetes.
- Complex distributed systems.
- Large-scale scraping.
- User-triggered Playwright crawling.
- Recruitment-site credential storage for users.
- Captcha bypass.
- Proxy pools.
- Fingerprint bypass.
- Real LLM or API-key workflows.
- Payments.
- Employer accounts.

## Success Criteria

Online single-user success:

- Shared jobs are stored in PostgreSQL.
- Current local job data can be imported.
- A user or administrator can browse, filter, score, and export jobs.
- Platform-controlled collection can update shared jobs.

Target multi-user success:

- Users can register, log in, manage preferences, save jobs, receive scoring/advice, and manage resume/profile data where approved.
- Private data is isolated by user.
- The platform can serve the target first-stage capacity with logs, monitoring, backups, and deletion workflows.
