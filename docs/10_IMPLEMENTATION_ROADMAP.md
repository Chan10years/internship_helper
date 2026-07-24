# Implementation Roadmap

This document is the source of truth for phase order and phase boundaries.

Detailed rules live in topic documents. Do not implement a later phase until the product manager approves that phase.

## Effective status on 2026-07-22

The product manager approved a bounded combination of the former database, account, UI, and deployment phases. Implemented code now includes PostgreSQL migration/import, invitation authentication, protected detail APIs, administrator commands, auth UI, container delivery, health checks, and backup/restore material. Real PostgreSQL, backup/restore, and browser release rehearsals remain verification gates rather than completed claims. Preferences, saved jobs, resumes, background queues, public deployment, and scaling work remain unapproved.

## Phase 1: Local MVP Validation

目标:

- Prove that the local assistant can collect, normalize, store, score, export, and browse internship jobs.

主要任务:

- Keep the current TypeScript/Node local app working.
- Keep 实习僧 as the current enabled source.
- Keep BOSS直聘 as a retained adapter interface, not a current acceptance item.
- Maintain JSON and CSV export.
- Maintain local Web UI, local scoring, and resume advice.
- Keep crawler safety boundaries.

完成产物:

- Local runnable MVP.
- `data/internships.json`.
- `data/internships.csv`.
- `/api/jobs`.
- Local Web UI.

验收标准:

- Local MVP checklist in `docs/08_ACCEPTANCE_CHECKLIST.md` passes for relevant tasks.
- No unapproved dependency, framework, database, or crawler expansion is added.

暂不处理:

- Product login.
- Database migration.
- Online deployment.
- Multi-user features.
- Microservices or Kubernetes.

## Phase 2: Local Product Completion

目标:

- Make the local product more reliable before online migration.

主要任务:

- Improve local data quality if needed.
- Improve parsing and filtering if needed.
- Add fixture coverage for known crawl and parsing cases.
- Decide whether BOSS直聘 verification is worth doing.
- Keep local configuration explicit and conservative.

完成产物:

- More stable local product.
- Better tests or fixtures.
- Clear source status.

验收标准:

- Existing local behavior remains working.
- New local behavior has focused tests.
- No online architecture is introduced early.

暂不处理:

- User accounts.
- Database-backed user data.
- Public deployment.

## Phase 3: Backend Database Migration

目标:

- Move shared job data toward an online-ready database without breaking the local workflow.

主要任务:

- Approve PostgreSQL and migration tooling.
- Design shared job, company, source, crawl task, crawl run, update, and invalidation models.
- Map local `InternshipJob` fields to database fields.
- Import existing JSON jobs.
- Keep CSV export available.

完成产物:

- Database schema.
- Migration scripts.
- Import path from `data/internships.json`.
- Database-backed job read path.

验收标准:

- Existing jobs can be imported without losing core fields.
- Shared jobs have dedupe keys, last-seen time, update time, and invalid/inactive status.
- Local JSON/CSV workflow remains recoverable or has a documented replacement.

暂不处理:

- Large distributed data pipelines.
- Microservices.
- Kubernetes.

## Phase 4: Registration, Login, And Personal Data

目标:

- Add account and private user data foundations.

主要任务:

- Add registration, login, logout, sessions, and password handling.
- Add user preferences.
- Add saved jobs.
- Add per-user scoring results.
- Add resume profile storage only after privacy behavior is decided.
- Add user export records.

完成产物:

- Authenticated single-user and then multi-user data paths.
- Private user tables separated from shared jobs.

验收标准:

- Users cannot read or modify other users' private data.
- APIs involving user data require authentication and authorization.
- Account routes have basic rate limiting and safe error responses.

暂不处理:

- Employer accounts.
- Payments.
- Public job posting by companies.

## Phase 5: Platform Collection And Background Tasks

目标:

- Replace user-driven crawling assumptions with platform-controlled collection.

主要任务:

- Add a background task queue.
- Add scheduled or administrator-controlled crawl/import tasks.
- Deduplicate tasks by source, keyword, city, and filter set where practical.
- Add frequency limits, retry limits, and pause controls.
- Record crawl runs and errors.
- Update shared jobs and invalid/inactive status.

完成产物:

- Platform collection pipeline.
- Task and run records.
- Shared job catalog refresh workflow.

验收标准:

- Ordinary users cannot trigger unlimited Playwright runs.
- Multiple users share the same collected job records.
- Failed tasks stop safely and are visible to administrators.

暂不处理:

- Proxy pools.
- Captcha bypass.
- Fingerprint bypass.
- Per-user crawler sessions.

## Phase 6: Deployment, Monitoring, Security, And Backup

目标:

- Make the online product operable and recoverable.

主要任务:

- Choose deployment target.
- Configure production environment variables.
- Configure HTTPS and secure cookies.
- Add logs, monitoring, and health checks.
- Add database backup and restore procedure.
- Add privacy deletion workflow.
- Review API validation, rate limiting, and error protection.

完成产物:

- Deployable online application.
- Operational runbook.
- Backup and restore plan.
- Privacy deletion procedure.

验收标准:

- Common failures are logged without leaking secrets.
- Data can be restored from backup.
- User deletion/privacy flow is documented and testable.

暂不处理:

- Complex multi-region deployment.
- Kubernetes.
- Microservice decomposition.

## Phase 7: Small-Scope Testing

目标:

- Validate the online product with limited real use before broader rollout.

主要任务:

- Run a small beta.
- Observe read performance, job refresh reliability, account flows, and error rates.
- Test common search/filter/detail/scoring paths.
- Fix safety or privacy issues before expanding.

完成产物:

- Beta findings.
- Stabilization fixes.
- Updated operational checklist.

验收标准:

- Core flows work for real users.
- No critical privacy or auth issue remains open.
- Background tasks do not overload sources.

暂不处理:

- Public launch.
- 1000-user growth push.

## Phase 8: Scale To About 1000 Registered Users

目标:

- Support about 1000 registered users, 100 to 300 daily active users, and normally 20 to 50 concurrent users.

主要任务:

- Load-test common read paths.
- Add or tune indexes.
- Tune task frequency and retry policy.
- Improve observability for API, database, and background tasks.
- Add caching only if measured bottlenecks require it.
- Review backup, restore, and privacy deletion under expected load.

完成产物:

- 1000-user readiness report.
- Tuned database indexes.
- Operational monitoring.
- Updated runbook.

验收标准:

- Common read paths are responsive at target usage.
- Background tasks remain controlled.
- User data isolation, backup, and deletion workflows still work.

暂不处理:

- Microservices unless the single application has proven limits.
- Kubernetes unless deployment constraints require it.
- Large-scale scraping.
