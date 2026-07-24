# Online MVP Operations

This runbook covers the approved invitation-only modular monolith. Commands are written for Windows with `npm.cmd`.

## 1. Prerequisites

- Node.js `24.14.1` for host development.
- Docker Desktop with Docker Compose.
- A copied `.env` based on `.env.example`.
- `POSTGRES_PASSWORD` must be a new strong database password.
- `SESSION_SECRET` must be a new random value of at least 32 characters.
- Never commit `.env`, database dumps, invitation codes, or reset links.

## 2. First local start

1. Copy `.env.example` to `.env` and fill the two secrets.
2. Start PostgreSQL: `npm.cmd run db:up`.
3. Apply migrations: `npm.cmd run db:migrate`.
4. Import the preserved JSON jobs once: `npm.cmd run db:import-jobs`.
5. Verify tables and job count: `npm.cmd run db:verify`.
6. Start the host application: `npm.cmd run web`.
7. Open `http://localhost:3000/`.

The import is idempotent: repeating it updates matching jobs instead of duplicating them. The Web runtime reads PostgreSQL only; JSON is not a fallback business path.

To run the complete container stack, use `docker compose up --build -d`. It starts PostgreSQL, runs the migration job, then starts the application. Import existing local jobs explicitly with `docker compose --profile tools run --rm import-jobs`.

## 3. Local administrator commands

Run these only on a trusted local terminal with `DATABASE_URL` configured:

```text
npm.cmd run admin -- invite:create
npm.cmd run admin -- invite:create --days 7
npm.cmd run admin -- account:disable --email user@example.com
npm.cmd run admin -- account:enable --email user@example.com
npm.cmd run admin -- password-reset:create --email user@example.com --origin http://localhost:3000
```

Invitation codes and reset links are shown once. Send them through an appropriate private channel; do not paste them into application logs. Disabling or restoring an account rotates its authentication version and removes old sessions. Completing a password reset does the same.

## 4. Backup and restore

Create a timestamped custom-format backup inside `backups/`:

```text
powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
```

Restore is destructive to current database objects and therefore requires an explicit flag:

```text
powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -BackupPath backups/internship-helper-YYYYMMDD-HHMMSS.dump -ConfirmRestore
npm.cmd run db:verify
```

Before every upgrade, create a backup and record the current image/version. A failed additive migration should stop the release. Roll back the application image first; if the schema or data was changed incompatibly, restore the pre-upgrade dump. Migrations intentionally do not auto-delete or auto-rebuild an unknown database.

## 5. Release verification

Fast local verification:

```text
npm.cmd run check
npm.cmd run build
```

Full verification requires disposable PostgreSQL integration access and a running application:

```text
set TEST_DATABASE_URL=postgresql://...
set DATABASE_URL=postgresql://...
set E2E_BASE_URL=http://localhost:3000
set E2E_DATABASE_URL=postgresql://...
npm.cmd run release:check
```

`release:check` covers type checking, all unit tests, production build, database verification, PostgreSQL migration/import/concurrency tests, and desktop/mobile browser flows. Integration tests create and remove only a randomly named `integration_*` schema. E2E creates and removes a uniquely named test account and invitation.

## 6. Health and troubleshooting

- `/health/live`: Express process responds.
- `/health/ready`: application can query PostgreSQL.
- Application refuses startup if `DATABASE_URL` or `SESSION_SECRET` is missing or invalid.
- `503` readiness: inspect `docker compose ps` and PostgreSQL health before restarting the app.
- Migration warning about `001_initial_postgres_foundation`: stop. Do not delete or recreate the database; prepare a manual migration-risk report.
- Login failures deliberately use one generic message. Inspect only sanitized server errors; never add password, Cookie, invitation, reset token, or connection-string logging.

## 7. Known limits

- This delivery does not purchase a server/domain or publish to the public Internet.
- Email verification and email-based password recovery are not included; the local administrator supplies reset links.
- Source/tag/match information appears in authenticated job detail, not in the public list.
- No favorites, applications, personalized recommendations, resumes, notifications, payments, or administrator Web UI.
- No user can start a crawler from the product.
- Real PostgreSQL, backup/restore, and E2E checks must be run in an environment where Docker/PostgreSQL and the Playwright browser are available.
