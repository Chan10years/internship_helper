# Web UI Spec

This document is the source of truth for the current local Web UI behavior.

Stack rules live in `docs/01_TECH_STACK.md`; data shape lives in `docs/03_DATA_MODEL.md`.

## Current Status

已实现：

- Start command: `npm run web`.
- Local URL: `http://localhost:3000/`.
- Data API: `/api/jobs`.
- Data source: `data/internships.json`.
- Native HTML/CSS/JavaScript frontend.
- Search, filters, sorting, detail view, and safe source-link opening.
- Cinematic editorial UI redesign with local image assets.

暂不实现：

- Web UI-triggered crawling.
- Product login.
- Saved jobs.
- Application tracking.
- Database reads.
- External image or font dependencies.

## Server Rule

The server reads existing local data. It must not directly call crawlers.

## Job List Behavior

- Show real local jobs only.
- Search across title, company, city, description, tags, and raw text.
- Filter by city, source, company, and tags.
- Sort by `matchScore`, with unscored jobs last.
- Display unscored jobs as `未评分`, not `0`.
- Open original job links only when the link is a safe HTTP/HTTPS URL.

## Detail Behavior

The detail view shows:

- Title, company, city, salary, duration, education, work days, source, and crawl time.
- Parsed description groups where available.
- Raw or fallback description when parsing is incomplete.
- Tags.
- Match score, match reasons, and resume advice when available.
- Original source link only when safe.

## UI Rules

- Local-first; no external hosting.
- Native HTML, CSS, and JavaScript only.
- No database.
- Keep critical job information visible and scannable.
- Make empty states and load failures clear.
- Remain usable when scoring fields are missing.
- Render untrusted job data with safe DOM text APIs rather than direct HTML insertion.
- Preserve keyboard and reduced-motion behavior.

## Future Decisions

- Whether online browsing should reuse this UI or receive a separate online design pass.
- Whether saved jobs and application status belong in the first online UI.
