# AGENTS.md

Execution entry for agents working on `internship_helper`.

Read this file before every task. Detailed specs live in `docs/`. Keep documentation-only work out of `src`, `data`, and `logs`.

## Project

- Project: `internship_helper`.
- Working directory: `D:\CodeLibrary\internship_helper`.
- Current stage: invitation-only account MVP under local release verification.
- Long-term product target: an online internship information product for about 1000 registered users, 100 to 300 daily active users, and normally 20 to 50 concurrent users.
- Current source status: 实习僧 is the working source. BOSS直聘 has a retained adapter interface and minimal implementation, but it is not enabled by default and is not part of current MVP acceptance.
- Product direction, scope, and priority decisions belong to the product manager.

## Current Status

已实现：

- Local TypeScript/Node project setup.
- 实习僧 AIGC crawl path with 10 real collected records.
- JSON and CSV local storage.
- Merge, dedupe, logging, rule scoring, resume advice.
- Express `/api/jobs`.
- Native HTML/CSS/JS Web UI with search, filters, sorting, detail view, and safe source links.
- Local auto-crawl scheduler.
- PostgreSQL job migration/import and database-backed Web runtime.
- Public job summaries and authenticated full details.
- Invitation registration, password login, seven-day sessions, logout, local account administration, and reset tokens.
- Dedicated authentication UI, container delivery files, health checks, and backup/restore material.

待实现：

- Real PostgreSQL, Compose, backup/restore, and browser release rehearsals.
- Future product enrichment only after product-manager approval.
- BOSS直聘 verification only if the product manager decides it belongs in a later phase.

暂不实现：

- Automatic login, captcha bypass, proxy pools, fingerprint bypass, high-frequency access.
- Ordinary-user crawler controls.
- Microservices, Kubernetes, distributed systems, or other over-engineered online architecture.
- Public Internet deployment, paid infrastructure, and unapproved personal-data features.

## Hard Boundaries

- Only modify files inside `D:\CodeLibrary\internship_helper`.
- Do not modify other projects under `D:\CodeLibrary`.
- Do not delete user files or existing project documents.
- Do not clear, delete, or broadly rewrite `data/`.
- Only update `data/internships.json` and `data/internships.csv` through the approved storage/export flow.
- During documentation-only tasks, do not create or edit `src` business code.
- Never globally install dependencies.

## Git Ban

The Git repository boundary may be above this folder. Do not run Git modification commands unless the user explicitly approves after a risk explanation.

Forbidden without explicit approval:

- `git add .`
- `git commit`
- `git reset`
- `git clean`
- `git rm`
- `git push`

## Dependency Ban

- Do not run `npm init` unless the user explicitly requests project setup.
- Do not run `npm install` unless dependency installation is explicitly approved.
- Do not add package managers or global dependencies.

## Document Priority

When documents conflict, use this order:

1. `AGENTS.md`.
2. Effective decisions recorded in `docs/13_DECISIONS.md` or `13_DECISIONS.md` if that file exists.
3. Current-stage specifications such as `docs/00_PROJECT_BRIEF.md` and `docs/10_IMPLEMENTATION_ROADMAP.md`.
4. Topic rule documents: `docs/01_TECH_STACK.md`, `docs/03_DATA_MODEL.md`, `docs/04_CRAWLER_POLICY.md`, `docs/05_STORAGE_AND_EXPORT.md`, `docs/06_WEB_UI_SPEC.md`, `docs/07_SCORING_AND_RESUME_ADVICE.md`, and `docs/09_FORBIDDEN_ACTIONS.md`.
5. `README.md`.
6. Future planning documents such as `docs/11_ONLINE_PRODUCT_PLAN.md`.
7. Archive and historical documents, including `docs/12_PROJECT_PROGRESS_REPORT.md` and `docs/superpowers/`.

Archive and historical documents must never override current specifications.

## Source Of Truth

- Product scope and stage boundaries: `docs/00_PROJECT_BRIEF.md`
- Tech stack and scripts: `docs/01_TECH_STACK.md`
- Directory responsibilities: `docs/02_DIRECTORY_STRUCTURE.md`
- Data model and crawl config: `docs/03_DATA_MODEL.md`
- Crawler safety and source status: `docs/04_CRAWLER_POLICY.md`
- Storage/export/dedupe: `docs/05_STORAGE_AND_EXPORT.md`
- Web UI behavior: `docs/06_WEB_UI_SPEC.md`
- Scoring and resume advice: `docs/07_SCORING_AND_RESUME_ADVICE.md`
- Acceptance checks: `docs/08_ACCEPTANCE_CHECKLIST.md`
- Forbidden actions: `docs/09_FORBIDDEN_ACTIONS.md`
- Roadmap: `docs/10_IMPLEMENTATION_ROADMAP.md`
- Target online product plan: `docs/11_ONLINE_PRODUCT_PLAN.md`
- Progress archive: `docs/12_PROJECT_PROGRESS_REPORT.md`

## Required Checks Before Completion

- Changed files stay inside `D:\CodeLibrary\internship_helper`.
- No forbidden Git command was executed.
- No dependency install or setup command was executed unless approved.
- No crawler was executed unless explicitly requested and safe for the current task.
- No `src` business code changed during documentation-only work.
- Relevant acceptance checks in `docs/08_ACCEPTANCE_CHECKLIST.md` were reviewed.
