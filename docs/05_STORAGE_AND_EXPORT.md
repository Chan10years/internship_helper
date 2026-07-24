# Storage And Export

This document is the source of truth for JSON storage, CSV export, merging, deduplication, and export rules.

The data shape lives in `docs/03_DATA_MODEL.md`.

## Current Files

- `data/internships.json`: normalized local job list.
- `data/internships.csv`: CSV export for spreadsheet use.
- `logs/app.log`: normal application logs.
- `logs/error.log`: error logs.

Current data contains 10 real 实习僧 records.

## Storage Rules

- Keep collected data local.
- Do not clear or delete `data/`.
- Never store credentials, cookies, tokens, `storageState`, or passwords in data files.
- After every crawl, save the merged job list to `data/internships.json`.
- After every crawl, export `data/internships.csv` in the same flow.
- Use atomic write patterns where practical.
- Preserve structured fields in JSON.
- Preserve old fields that are still valid when merging.
- Update changed fields from newer crawls only when the incoming value is non-empty.
- Preserve the original `crawledAt` during merge so first-seen time remains traceable.

## Deduplication Rules

- Prefer non-empty `link`.
- Treat `link.trim() === ""` as missing.
- If `link.trim()` is empty, deduplicate by `title + company + city`.
- Keep deduplication deterministic and testable.

## CSV Rules

- CSV export must use `csv-stringify`.
- Do not hand-write CSV escaping unless the product manager explicitly approves it.
- CSV must handle Chinese text, commas, quotes, and newlines.
- Arrays such as `tags`, `matchReasons`, and `resumeAdvice` use ` | ` as the stable separator.
- Keep CSV columns stable once UI or spreadsheet workflows depend on them.

## Current CSV Columns

- `title`
- `company`
- `city`
- `salary`
- `duration`
- `education`
- `workDaysPerWeek`
- `matchScore`
- `matchReasons`
- `resumeAdvice`
- `link`
- `source`
- `crawledAt`

## Future Decisions

- Whether historical snapshots are needed.
- Backup behavior before overwriting exports.
- Whether failed crawl records should be stored separately.
