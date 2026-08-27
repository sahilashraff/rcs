# RCS SaaS Platform — Working Notes

This repo currently holds the documentation vault for a multi-tenant RCS
SaaS platform (`docs/`, an Obsidian vault). No application code exists
yet — a React starter template will be added in a future session.

## Reference material

`Project/` contains the RCS API Postman collection, RCS API PDF/DOCX,
and the source documentation blueprint (`project.md`) this vault's
structure was generated from. It is gitignored — present on disk for
Claude Code / other agents to read locally, never pushed to the
remote.

## Which skill to use, by task

- **Writing or revising any document under `docs/`:** use
  `superpowers:brainstorming` to shape the content first, then
  `superpowers:writing-plans` if the resulting work is non-trivial.
- **Future React frontend work** (once a starter template exists):
  use `design-taste-frontend` or `ui-ux-pro-max`.
- **Commits and PRs:** use `commit-commands`.
- **Code review, once implementation starts:** use `code-review` or
  `security-review`.

## Git conventions for this repo

- Do not add a `Co-Authored-By` or `Claude-Session` trailer to commit
  messages.
- Do not `git push` without explicit confirmation for that specific
  push.
