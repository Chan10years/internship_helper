# Forbidden Actions

This document is the source of truth for prohibited actions.

`AGENTS.md` keeps only a short execution copy of the highest-risk bans. If wording differs, use the stricter rule for the current approved phase.

## Git

The current Git repository boundary may be above `D:\CodeLibrary\internship_helper`.

Do not run without explicit approval after a risk explanation:

- `git add .`
- `git commit`
- `git reset`
- `git clean`
- `git rm`
- `git push`

## Filesystem

Do not:

- Modify other projects under `D:\CodeLibrary`.
- Delete files from parent directories.
- Delete user files or existing project documents.
- Clear, delete, or broadly rewrite `data/`.
- Delete logs during documentation-only work.
- Perform broad recursive deletes.
- Create `.browser-profile/` during documentation-only work.

## Dependencies

Do not:

- Run `npm init` unless setup is explicitly requested.
- Run `npm install` unless dependency installation is explicitly approved.
- Install packages globally.
- Use `pnpm`.

## Frameworks And Services

Do not add during the current local phase:

- React.
- Vue.
- Next.js.
- Electron.
- Real LLM APIs.
- OpenAI API calls.
- API-key requirements for core workflows.
- Databases.

Databases are allowed only for the future online product phase after explicit product-manager approval, stack documentation, planning, and dependency approval.

## Documentation-Only Scope

During documentation-only tasks, do not:

- Write `src` business code.
- Scaffold runtime files.
- Add crawler implementation.
- Add server implementation.
- Create runtime data, logs, browser profiles, package setup, or TypeScript config files.
- Execute crawlers.

## Crawler Safety

Do not:

- Automatically log in.
- Manually save, export, print, copy, or commit account passwords, cookies, tokens, or `storageState`.
- Bypass captchas, SMS checks, access controls, risk controls, or fingerprinting protections.
- Add captcha recognition.
- Add proxy pools.
- Add browser fingerprint bypass logic.
- Add high-frequency access behavior.
- Invent uncertain selectors as if verified.
