# Tech Stack

This document is the source of truth for the approved invitation-only online MVP stack.

## Runtime and application

- Node.js `24.14.1` (`.node-version`).
- TypeScript strict mode, npm, and `package-lock.json`.
- Express 5 modular monolith.
- PostgreSQL 17.10 as the Web runtime source of truth.
- Native HTML, CSS, and JavaScript; no frontend build framework.
- Node.js built-in test runner and Playwright.
- Docker Compose for local PostgreSQL/application orchestration and Dockerfile for delivery.

Approved runtime security components:

- `express-session` 1.19.0 (MIT).
- `connect-pg-simple` 10.0.0 (MIT).
- `zod` 4.3.6 (MIT).
- `helmet` 8.3.0 (MIT).
- `express-rate-limit` 8.6.0 (MIT).
- `csrf-sync` 4.2.1 (ISC).

Existing crawler/export components remain `playwright` and `csv-stringify`. Passwords use Node.js built-in `crypto.scrypt`; no additional password package is required.

## npm scripts

- `npm.cmd run web`: start the PostgreSQL-backed Web application.
- `npm.cmd run db:up`, `db:down`, `db:status`: local PostgreSQL lifecycle.
- `npm.cmd run db:migrate`: apply the versioned transaction migration.
- `npm.cmd run db:import-jobs`: idempotently import preserved JSON jobs.
- `npm.cmd run db:verify`: report required tables, migrations, and job count.
- `npm.cmd run admin -- ...`: local invitation/account/reset administration.
- `npm.cmd run check`: strict type check plus normal test suite.
- `npm.cmd run build`: production TypeScript build.
- `npm.cmd run test:postgres`: real PostgreSQL integration test; requires `TEST_DATABASE_URL`.
- `npm.cmd run test:e2e`: desktop/mobile flow; requires E2E environment variables.
- `npm.cmd run release:check`: full release gate.

Crawler scripts remain available but must not be run unless explicitly requested. Windows instructions use `npm.cmd` to avoid PowerShell execution-policy surprises.

## Fixed boundaries

Do not introduce React, Vue, Next.js, Electron, pnpm, yarn, JWT, Redis, a task queue, microservices, Kubernetes, real LLM/API-key workflows, or user-side Playwright/crawler controls in this stage. Dependencies are never installed globally and any new package still requires product-manager approval.
