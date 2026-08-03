# Design: Documentation Vault Scaffolding for the RCS SaaS Platform

Date: 2026-08-03
Status: Approved

## Purpose

Before any product design or implementation work starts on the RCS SaaS
platform, set up the version-controlled documentation repository that
`Project/documentation-blueprint.md` (source: `Project/project.md`)
calls for. This is scaffolding only — folder structure, stub files, vault
tooling, and repo config — not authored content. Content for individual
documents (product vision, tenant hierarchy, credit ledger design, etc.)
gets brainstormed and written in later, separate sessions, one document
(or tightly related group) at a time.

## Non-goals

- No actual document content (beyond a title + one-line purpose per
  stub file).
- No React/frontend scaffolding — a starter template will be added by
  the user in a future session.
- No application code, database, or infrastructure of any kind.

## 1. Repository & Git

- `git init` at repo root (`/home/leminai-rbm/htdocs/rbm.leminai.com/public`),
  remote `origin` → `https://github.com/sahilashraff/rcs.git` (confirmed
  empty on the remote, so no merge is needed).
- This directory is a shared hosting webroot, not a dedicated project
  folder — it contains a placeholder `index.php`, and `.claude/`,
  `.agents/`, `skills-lock.json` from local Claude Code tooling. A
  `.gitignore` excludes all of these plus `Project/` so none of it is
  ever committed or pushed, while remaining on disk for Claude Code /
  other agents to read locally.
- `Project/` (the RCS Postman collection, RCS API PDF/DOCX, and
  `project.md`) stays exactly where it is, untouched. Vault docs that
  need it (e.g. `05-rcs/provider-contract.md`) link to it by relative
  path in their stub notes rather than duplicating the files.

## 2. Obsidian vault (`docs/`)

`docs/` is the vault root. It follows the exact 14-folder structure
from `project.md`'s "Recommended Documentation Repository" section:

```
docs/
├── 00-vision/            product-vision.md, business-model.md, roadmap.md
├── 01-product/            prd.md, feature-catalogue.md, personas.md,
│                          user-journeys.md, acceptance-criteria.md
├── 02-domain/             glossary.md, tenant-hierarchy.md, agent-lifecycle.md,
│                          message-lifecycle.md, event-taxonomy.md
├── 03-architecture/       system-context.md, high-level-architecture.md,
│                          control-data-plane.md,
│                          component-designs/, diagrams/, adr/
├── 04-multitenancy/       isolation-model.md, tenant-context.md,
│                          noisy-neighbour-controls.md, hierarchy-authorization.md
├── 05-rcs/                provider-contract.md, google-rcs-adapter.md,
│                          provider-status-mapping.md, capability-handling.md,
│                          consent-and-policies.md
├── 06-white-label/        branding.md, configuration-inheritance.md,
│                          custom-domains.md, entitlements.md
├── 07-billing/            credit-business-rules.md, ledger-design.md,
│                          charging-state-machine.md, rate-cards.md,
│                          reconciliation.md
├── 08-data/               erd.md, data-dictionary.md, partitioning.md,
│                          retention.md, migrations.md
├── 09-api/                api-guidelines.md, webhooks.md, error-catalogue.md,
│                          openapi/
├── 10-security/           security-architecture.md, threat-model.md, iam.md,
│                          audit-logging.md, incident-response.md
├── 11-infrastructure/     deployment-architecture.md, networking.md,
│                          autoscaling.md, disaster-recovery.md, cost-model.md
├── 12-testing/            master-test-strategy.md, tenant-isolation-tests.md,
│                          billing-tests.md, load-tests.md
└── 13-operations/         slos.md, monitoring.md, alerting.md,
                           runbooks/, support-process.md
```

Rules for this pass:

- Every `.md` file listed above is created as a stub: an H1 title and a
  single-sentence "purpose of this document" line. Nothing else.
- Every numbered folder gets a `README.md` index: what the folder
  covers, and a bullet list linking its files.
- Subfolders with no listed files (`component-designs/`, `diagrams/`,
  `adr/`, `openapi/`, `runbooks/`) get a `README.md` stub too, both to
  explain their purpose and because git doesn't track empty
  directories.
- `docs/superpowers/specs/` (this file's location) is the standing
  location for future design docs, per the brainstorming skill's
  default — it lives inside the vault since it's still project
  documentation.

## 3. Obsidian configuration

- `docs/.obsidian/` is committed with:
  - Core plugins enabled: backlinks, outline, graph view, quick
    switcher.
  - Community plugins: **Dataview** (to later build live tables like
    "which of the 15 minimum docs are drafted") and **Templater**
    (for creating new docs/ADRs from a consistent template).
- `docs/_templates/` holds two Templater templates:
  - `adr-template.md` — Context / Decision / Alternatives Considered /
    Consequences / Risks / Revisit Conditions, matching the ADR shape
    `project.md` specifies.
  - `doc-template.md` — generic template (title, purpose, status,
    related links) for any non-ADR document.

## 4. CLAUDE.md — skill mapping

A root `CLAUDE.md` records which installed Claude Code skills apply to
which phase of this project, so future sessions don't have to
re-derive it:

- Writing or revising any document under `docs/` → `superpowers:brainstorming`
  to shape it, then `superpowers:writing-plans` if the resulting work
  is non-trivial.
- Future React frontend work (once a starter template is added) →
  `design-taste-frontend` / `ui-ux-pro-max`.
- Commits and PRs → `commit-commands`.
- Code review once implementation starts → `code-review` /
  `security-review`.
- Note: `Project/` exists on disk but is gitignored — readable by
  agents locally, never pushed.

## Verification

This is a structural change, not code, so "testing" means:

- Every path listed in section 2 exists under `docs/`.
- `git status` shows `Project/`, `index.php`, `.claude/`, `.agents/`,
  `skills-lock.json` as ignored, not staged.
- Opening `docs/` in Obsidian shows the full folder tree with no
  broken internal links from the `README.md` indexes.
