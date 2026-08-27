# RCS SaaS Platform — Working Notes

This repo holds the documentation vault for a multi-tenant RCS SaaS
platform (`docs/`, an Obsidian vault) alongside real application code:
`backend/` (a Laravel API) and `frontend/` (a React SPA). See the
"Running the app" section below for details.

## Reference material

`Project/` contains the RCS API Postman collection, RCS API PDF/DOCX,
and the source documentation blueprint (`project.md`) this vault's
structure was generated from. It is gitignored — present on disk for
Claude Code / other agents to read locally, never pushed to the
remote.

## Running the app

- `backend/` — Laravel 12 API (PHP 8.4). `cd backend && php artisan serve` runs it on `http://127.0.0.1:8000`. DB credentials are in `backend/.env` (gitignored), pointing at the local `leminai-rbm` MySQL database.
- `frontend/` — the `ecme` TypeScript React SPA (Vite). `cd frontend && npm run dev` runs it on `http://localhost:5173`, proxying `/api` to the backend. Auth is Sanctum bearer tokens, not cookie sessions.
- Feature/permission gating lives in one place on each side: `backend/config/features.php` + `backend/app/Support/FeatureAccess.php` (backend), and the `authority` field on nav/route entries in `frontend/src/configs/` (frontend, using the theme's built-in `AuthorityGuard`).

## Which skill to use, by task

- **Writing or revising any document under `docs/`:** use
  `superpowers:brainstorming` to shape the content first, then
  `superpowers:writing-plans` if the resulting work is non-trivial.
- **React frontend work** (in `frontend/`):
  use `design-taste-frontend` or `ui-ux-pro-max`.
- **Commits and PRs:** use `commit-commands`.
- **Code review, once implementation starts:** use `code-review` or
  `security-review`.

## Git conventions for this repo

- Do not add a `Co-Authored-By` or `Claude-Session` trailer to commit
  messages.
- Do not `git push` without explicit confirmation for that specific
  push.
