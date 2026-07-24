# Effective Product Decisions

## 2026-07-22 — Invitation-only online MVP is approved

Status: effective.

The product manager approved implementation of the database-backed account MVP. This replaces earlier statements that PostgreSQL, accounts, and deployment are “future only” for this development node.

Approved scope:

- Modular Express 5 monolith on Node.js 24 and strict TypeScript.
- PostgreSQL 17 as the Web runtime source of truth.
- Public job summaries and authenticated full job details.
- Invitation registration, password login, seven-day server sessions, logout, and one-time password reset.
- Local administrator commands for invitations, account state, and reset links.
- Native full-screen authentication pages, Docker Compose, Dockerfile, tests, backup, and restore material.

Still excluded:

- Favorites, application tracking, preferences, recommendations, email, payments, resume storage, administrator Web UI, user-triggered crawling, microservices, Redis, queues, Kubernetes, JWT, and public Internet deployment.
- No existing or experimental database may be deleted or rebuilt automatically. Any database containing `001_initial_postgres_foundation` requires manual non-destructive review.
