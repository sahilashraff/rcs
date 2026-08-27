# Docs Vault Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Obsidian documentation vault at `docs/` for the RCS SaaS platform — 14 numbered folders with stub files, vault config, templates, and a root `CLAUDE.md` skill map — per `docs/superpowers/specs/2026-08-03-docs-scaffolding-design.md`.

**Architecture:** Pure file/folder scaffolding, no application code. Each task creates one or two numbered `docs/` folders (README index + stub `.md` files per the spec's tree), verified by grepping the expected title line out of each created file. The final tasks add vault-wide config (`.obsidian/`, `_templates/`) and the root `CLAUDE.md`.

**Tech Stack:** Markdown files, Obsidian's JSON config format (`.obsidian/*.json`), git.

## Global Constraints

- Every leaf `.md` file under a numbered folder contains **only** an H1 title and one single-sentence purpose line — nothing else (spec §2).
- No document content beyond that one sentence. No React/frontend files. No application code, database, or infrastructure of any kind (spec "Non-goals").
- `Project/` stays exactly where it is, untouched and gitignored — never copied into `docs/` (spec §1).
- Every numbered folder (`00-vision` … `13-operations`) gets a `README.md` index linking its files (spec §2).
- Subfolders with no listed files (`03-architecture/component-designs/`, `03-architecture/diagrams/`, `03-architecture/adr/`, `09-api/openapi/`, `13-operations/runbooks/`) get a `README.md` stub explaining their purpose (spec §2).
- `docs/.obsidian/` is committed with core plugins `file-explorer`, `global-search`, `switcher`, `graph`, `backlink`, `outline`, `command-palette`, `page-preview`, `note-composer`, `word-count` enabled, and community plugins `dataview` + `templater-obsidian` declared (spec §3).
- `docs/_templates/` holds `adr-template.md` and `doc-template.md` (spec §3).
- Root `CLAUDE.md` maps project phases to installed Claude Code skills (spec §4).
- Git identity for this repo is already configured (`user.name "sahilashraff"`, `user.email "sahilashraff@gmail.com"`).
- **Do not add a `Co-Authored-By` / `Claude-Session` trailer to any commit message in this repo** — the user explicitly rejected this.
- **Do not `git push`** as part of any task — pushing is a separate, explicit user decision, not part of this plan.

---

## Task 1: `00-vision/` and `01-product/`

**Files:**
- Create: `docs/00-vision/README.md`
- Create: `docs/00-vision/product-vision.md`
- Create: `docs/00-vision/business-model.md`
- Create: `docs/00-vision/roadmap.md`
- Create: `docs/01-product/README.md`
- Create: `docs/01-product/prd.md`
- Create: `docs/01-product/feature-catalogue.md`
- Create: `docs/01-product/personas.md`
- Create: `docs/01-product/user-journeys.md`
- Create: `docs/01-product/acceptance-criteria.md`

**Interfaces:**
- Consumes: `docs/` directory (created by git init in the prior session; already contains `docs/superpowers/`).
- Produces: the `00-vision/` and `01-product/` folders other tasks and future doc-writing sessions link into. No other task in this plan reads these files.

- [ ] **Step 1: Create `00-vision/` files**

`docs/00-vision/product-vision.md`:
```markdown
# Product Vision

Explains why the platform exists: business problem, target customers, direct-vs-reseller model, RCS provider strategy, and MVP boundaries.
```

`docs/00-vision/business-model.md`:
```markdown
# Business Model

Defines how the platform makes money: subscription and per-message pricing, reseller markup, credit policies, and reconciliation.
```

`docs/00-vision/roadmap.md`:
```markdown
# Roadmap

Lays out the phased delivery sequence — Foundation, Campaigns, Enterprise scale — and what ships in each phase.
```

`docs/00-vision/README.md`:
```markdown
# 00 · Vision

Why this platform exists and where it's going.

- [Product Vision](product-vision.md)
- [Business Model](business-model.md)
- [Roadmap](roadmap.md)
```

- [ ] **Step 2: Create `01-product/` files**

`docs/01-product/prd.md`:
```markdown
# Product Requirements Document

The primary product requirements document: goals, personas, functional requirements, user journeys, and acceptance criteria.
```

`docs/01-product/feature-catalogue.md`:
```markdown
# Feature Catalogue

Complete feature table showing MVP, Phase 2, and Enterprise scope with ownership.
```

`docs/01-product/personas.md`:
```markdown
# Personas

Defines the platform's user personas, from super administrator through API developer and compliance reviewer.
```

`docs/01-product/user-journeys.md`:
```markdown
# User Journeys

End-to-end flows for key actions: reseller onboarding, agent creation, campaign execution, credit refund, and more.
```

`docs/01-product/acceptance-criteria.md`:
```markdown
# Acceptance Criteria

Acceptance criteria for the PRD's functional requirements, used to validate each feature before release.
```

`docs/01-product/README.md`:
```markdown
# 01 · Product

Requirements, features, personas, and journeys.

- [PRD](prd.md)
- [Feature Catalogue](feature-catalogue.md)
- [Personas](personas.md)
- [User Journeys](user-journeys.md)
- [Acceptance Criteria](acceptance-criteria.md)
```

- [ ] **Step 3: Verify all 10 files exist with the expected title line**

Run:
```bash
for f in \
  docs/00-vision/README.md:"# 00 · Vision" \
  docs/00-vision/product-vision.md:"# Product Vision" \
  docs/00-vision/business-model.md:"# Business Model" \
  docs/00-vision/roadmap.md:"# Roadmap" \
  docs/01-product/README.md:"# 01 · Product" \
  docs/01-product/prd.md:"# Product Requirements Document" \
  docs/01-product/feature-catalogue.md:"# Feature Catalogue" \
  docs/01-product/personas.md:"# Personas" \
  docs/01-product/user-journeys.md:"# User Journeys" \
  docs/01-product/acceptance-criteria.md:"# Acceptance Criteria" \
; do
  path="${f%%:*}"; title="${f#*:}"
  head -1 "$path" | grep -qF "$title" && echo "OK   $path" || echo "FAIL $path"
done
```
Expected: every line printed as `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/00-vision docs/01-product
git commit -m "Scaffold docs/00-vision and docs/01-product stubs"
```

---

## Task 2: `02-domain/` and `03-architecture/`

**Files:**
- Create: `docs/02-domain/README.md`
- Create: `docs/02-domain/glossary.md`
- Create: `docs/02-domain/tenant-hierarchy.md`
- Create: `docs/02-domain/agent-lifecycle.md`
- Create: `docs/02-domain/message-lifecycle.md`
- Create: `docs/02-domain/event-taxonomy.md`
- Create: `docs/03-architecture/README.md`
- Create: `docs/03-architecture/system-context.md`
- Create: `docs/03-architecture/high-level-architecture.md`
- Create: `docs/03-architecture/control-data-plane.md`
- Create: `docs/03-architecture/component-designs/README.md`
- Create: `docs/03-architecture/diagrams/README.md`
- Create: `docs/03-architecture/adr/README.md`

**Interfaces:**
- Consumes: none from prior tasks.
- Produces: `02-domain/` and `03-architecture/` folders, including the three no-file subfolders under `03-architecture/` that later ADR/diagram/component-design authoring sessions will add files into.

- [ ] **Step 1: Create `02-domain/` files**

`docs/02-domain/glossary.md`:
```markdown
# Glossary

Defines core domain terms (partner, tenant, agent, campaign, credit, entitlement, etc.) so teams share one vocabulary.
```

`docs/02-domain/tenant-hierarchy.md`:
```markdown
# Tenant Hierarchy

Defines the platform → partner → reseller → tenant hierarchy, ownership rules, and depth limits.
```

`docs/02-domain/agent-lifecycle.md`:
```markdown
# Agent Lifecycle

Documents the RCS agent lifecycle from draft through launch, suspension, and termination, with actor and approval rules per transition.
```

`docs/02-domain/message-lifecycle.md`:
```markdown
# Message Lifecycle

Documents the full message state machine, from API request through delivery, read, and failure branches.
```

`docs/02-domain/event-taxonomy.md`:
```markdown
# Event Taxonomy

Catalogues the event types emitted across the platform, their triggers, and their payload shapes.
```

`docs/02-domain/README.md`:
```markdown
# 02 · Domain

Shared vocabulary and core domain state machines.

- [Glossary](glossary.md)
- [Tenant Hierarchy](tenant-hierarchy.md)
- [Agent Lifecycle](agent-lifecycle.md)
- [Message Lifecycle](message-lifecycle.md)
- [Event Taxonomy](event-taxonomy.md)
```

- [ ] **Step 2: Create `03-architecture/` files**

`docs/03-architecture/system-context.md`:
```markdown
# System Context

Diagrams the platform's external actors and systems: tenants, resellers, RCS providers, payment gateway, identity provider.
```

`docs/03-architecture/high-level-architecture.md`:
```markdown
# High-Level Architecture

The conceptual architecture: control plane, messaging plane, credit ledger, queue/event bus, and provider adapters.
```

`docs/03-architecture/control-data-plane.md`:
```markdown
# Control Plane vs Data Plane

Distinguishes control-plane responsibilities (tenant setup, RBAC, rate cards) from data-plane responsibilities (message dispatch, delivery events) and why they scale independently.
```

`docs/03-architecture/component-designs/README.md`:
```markdown
# Component Designs

Component-level design docs for each service (identity, tenant, campaign, dispatch, credit-ledger, etc.) — one file per service.
```

`docs/03-architecture/diagrams/README.md`:
```markdown
# Diagrams

C4 diagrams (context, container, component, code) for the platform's major subsystems.
```

`docs/03-architecture/adr/README.md`:
```markdown
# Architecture Decision Records

One file per significant architectural choice, covering context, decision, alternatives considered, consequences, risks, and revisit conditions. New ADRs should start from `docs/_templates/adr-template.md`.
```

`docs/03-architecture/README.md`:
```markdown
# 03 · Architecture

System design: context, high-level shape, and the control/data plane split.

- [System Context](system-context.md)
- [High-Level Architecture](high-level-architecture.md)
- [Control Plane vs Data Plane](control-data-plane.md)
- [Component Designs](component-designs/README.md)
- [Diagrams](diagrams/README.md)
- [ADRs](adr/README.md)
```

- [ ] **Step 3: Verify all 13 files exist with the expected title line**

Run:
```bash
for f in \
  docs/02-domain/README.md:"# 02 · Domain" \
  docs/02-domain/glossary.md:"# Glossary" \
  docs/02-domain/tenant-hierarchy.md:"# Tenant Hierarchy" \
  docs/02-domain/agent-lifecycle.md:"# Agent Lifecycle" \
  docs/02-domain/message-lifecycle.md:"# Message Lifecycle" \
  docs/02-domain/event-taxonomy.md:"# Event Taxonomy" \
  docs/03-architecture/README.md:"# 03 · Architecture" \
  docs/03-architecture/system-context.md:"# System Context" \
  docs/03-architecture/high-level-architecture.md:"# High-Level Architecture" \
  docs/03-architecture/control-data-plane.md:"# Control Plane vs Data Plane" \
  docs/03-architecture/component-designs/README.md:"# Component Designs" \
  docs/03-architecture/diagrams/README.md:"# Diagrams" \
  docs/03-architecture/adr/README.md:"# Architecture Decision Records" \
; do
  path="${f%%:*}"; title="${f#*:}"
  head -1 "$path" | grep -qF "$title" && echo "OK   $path" || echo "FAIL $path"
done
```
Expected: every line printed as `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/02-domain docs/03-architecture
git commit -m "Scaffold docs/02-domain and docs/03-architecture stubs"
```

---

## Task 3: `04-multitenancy/` and `05-rcs/`

**Files:**
- Create: `docs/04-multitenancy/README.md`
- Create: `docs/04-multitenancy/isolation-model.md`
- Create: `docs/04-multitenancy/tenant-context.md`
- Create: `docs/04-multitenancy/noisy-neighbour-controls.md`
- Create: `docs/04-multitenancy/hierarchy-authorization.md`
- Create: `docs/05-rcs/README.md`
- Create: `docs/05-rcs/provider-contract.md`
- Create: `docs/05-rcs/google-rcs-adapter.md`
- Create: `docs/05-rcs/provider-status-mapping.md`
- Create: `docs/05-rcs/capability-handling.md`
- Create: `docs/05-rcs/consent-and-policies.md`

**Interfaces:**
- Consumes: none from prior tasks.
- Produces: `04-multitenancy/` and `05-rcs/` folders. `05-rcs/` files reference `Project/` by relative path for source material (Postman collection, API PDF/DOCX) — those files are gitignored but remain on disk, per spec §1.

- [ ] **Step 1: Create `04-multitenancy/` files**

`docs/04-multitenancy/isolation-model.md`:
```markdown
# Isolation Model

Documents the tenant isolation strategy (pooled, siloed, or hybrid) per resource: database, cache, storage, queues, logs, and encryption keys.
```

`docs/04-multitenancy/tenant-context.md`:
```markdown
# Tenant Context Propagation

Documents how tenant identity propagates through the request path, from HTTP request through service calls, queues, and provider calls.
```

`docs/04-multitenancy/noisy-neighbour-controls.md`:
```markdown
# Noisy-Neighbour Controls

Defines per-tenant rate limits, worker allocation, and priority classes so large tenants can't block smaller tenants' traffic.
```

`docs/04-multitenancy/hierarchy-authorization.md`:
```markdown
# Hierarchy-Aware Authorization

Defines authorization rules across the reseller hierarchy: who can view, manage, or impersonate whom.
```

`docs/04-multitenancy/README.md`:
```markdown
# 04 · Multi-Tenancy

Tenant isolation, context propagation, and hierarchy-aware authorization.

- [Isolation Model](isolation-model.md)
- [Tenant Context Propagation](tenant-context.md)
- [Noisy-Neighbour Controls](noisy-neighbour-controls.md)
- [Hierarchy-Aware Authorization](hierarchy-authorization.md)
```

- [ ] **Step 2: Create `05-rcs/` files**

`docs/05-rcs/provider-contract.md`:
```markdown
# Provider-Neutral Contract

The provider-neutral interface (checkCapability, sendText, sendRichCard, parseWebhook, etc.) that every RCS provider adapter implements. Source reference material lives in `../../Project/` (gitignored, read locally only).
```

`docs/05-rcs/google-rcs-adapter.md`:
```markdown
# Google RCS Adapter

The Google RCS for Business adapter: authentication, endpoints, agent identifiers, and message formats. See `../../Project/RCS CORE API Documentation v4.docx` and `../../Project/RCS APIs.postman_collection for VI.json` for source reference.
```

`docs/05-rcs/provider-status-mapping.md`:
```markdown
# Provider Status Mapping

Maps provider-specific delivery statuses to the platform's normalized status model (CREATED through REVOKED), preserving the original provider status.
```

`docs/05-rcs/capability-handling.md`:
```markdown
# Capability Handling

Defines how the platform checks and reacts to recipient device/client RCS capabilities before sending rich content.
```

`docs/05-rcs/consent-and-policies.md`:
```markdown
# Consent and Messaging Policy

Documents opt-in recording, opt-out keywords, suppression lists, and compliance with the RCS acceptable-use policy.
```

`docs/05-rcs/README.md`:
```markdown
# 05 · RCS

Provider contract, adapters, status mapping, capabilities, and consent policy.

- [Provider-Neutral Contract](provider-contract.md)
- [Google RCS Adapter](google-rcs-adapter.md)
- [Provider Status Mapping](provider-status-mapping.md)
- [Capability Handling](capability-handling.md)
- [Consent and Messaging Policy](consent-and-policies.md)

Source reference material (Postman collection, API docs) lives in `../../Project/` — gitignored, not part of this vault.
```

- [ ] **Step 3: Verify all 11 files exist with the expected title line**

Run:
```bash
for f in \
  docs/04-multitenancy/README.md:"# 04 · Multi-Tenancy" \
  docs/04-multitenancy/isolation-model.md:"# Isolation Model" \
  docs/04-multitenancy/tenant-context.md:"# Tenant Context Propagation" \
  docs/04-multitenancy/noisy-neighbour-controls.md:"# Noisy-Neighbour Controls" \
  docs/04-multitenancy/hierarchy-authorization.md:"# Hierarchy-Aware Authorization" \
  docs/05-rcs/README.md:"# 05 · RCS" \
  docs/05-rcs/provider-contract.md:"# Provider-Neutral Contract" \
  docs/05-rcs/google-rcs-adapter.md:"# Google RCS Adapter" \
  docs/05-rcs/provider-status-mapping.md:"# Provider Status Mapping" \
  docs/05-rcs/capability-handling.md:"# Capability Handling" \
  docs/05-rcs/consent-and-policies.md:"# Consent and Messaging Policy" \
; do
  path="${f%%:*}"; title="${f#*:}"
  head -1 "$path" | grep -qF "$title" && echo "OK   $path" || echo "FAIL $path"
done
```
Expected: every line printed as `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/04-multitenancy docs/05-rcs
git commit -m "Scaffold docs/04-multitenancy and docs/05-rcs stubs"
```

---

## Task 4: `06-white-label/` and `07-billing/`

**Files:**
- Create: `docs/06-white-label/README.md`
- Create: `docs/06-white-label/branding.md`
- Create: `docs/06-white-label/configuration-inheritance.md`
- Create: `docs/06-white-label/custom-domains.md`
- Create: `docs/06-white-label/entitlements.md`
- Create: `docs/07-billing/README.md`
- Create: `docs/07-billing/credit-business-rules.md`
- Create: `docs/07-billing/ledger-design.md`
- Create: `docs/07-billing/charging-state-machine.md`
- Create: `docs/07-billing/rate-cards.md`
- Create: `docs/07-billing/reconciliation.md`

**Interfaces:**
- Consumes: none from prior tasks.
- Produces: `06-white-label/` and `07-billing/` folders.

- [ ] **Step 1: Create `06-white-label/` files**

`docs/06-white-label/branding.md`:
```markdown
# Branding

Lists every white-label customizable element: platform name, logo, colours, fonts, email sender identity, login page, and more.
```

`docs/06-white-label/configuration-inheritance.md`:
```markdown
# Configuration Inheritance

Defines the settings inheritance order — platform defaults → partner → reseller → tenant → user — and which settings are overridable, locked, or audited.
```

`docs/06-white-label/custom-domains.md`:
```markdown
# Custom Domains

Domain verification, DNS/CNAME handling, automated TLS, and tenant resolution rules for white-label custom domains.
```

`docs/06-white-label/entitlements.md`:
```markdown
# Entitlements

Separates role permissions, plan entitlements, feature flags, quotas, and provider capabilities as distinct, independently-checked concepts.
```

`docs/06-white-label/README.md`:
```markdown
# 06 · White-Label

Branding, configuration inheritance, custom domains, and entitlements.

- [Branding](branding.md)
- [Configuration Inheritance](configuration-inheritance.md)
- [Custom Domains](custom-domains.md)
- [Entitlements](entitlements.md)
```

- [ ] **Step 2: Create `07-billing/` files**

`docs/07-billing/credit-business-rules.md`:
```markdown
# Credit Business Rules

Business rules for the credit system: recharge, promotional credits, expiry, credit limits, reserved vs available balance, and refunds.
```

`docs/07-billing/ledger-design.md`:
```markdown
# Ledger Design

The immutable credit ledger architecture: account categories, transaction fields, and the rule that historical entries are never updated or deleted.
```

`docs/07-billing/charging-state-machine.md`:
```markdown
# Charging State Machine

The Estimate → Reserve → Submit → Capture charging flow, including failure and adjustment patterns, and exactly when a message becomes billable.
```

`docs/07-billing/rate-cards.md`:
```markdown
# Rate Cards

Rate card structure by country, operator, provider, and use case, including versioning so historical messages reference the rate in effect when charged.
```

`docs/07-billing/reconciliation.md`:
```markdown
# Billing Reconciliation

Defines reconciliation between internal message records, the credit ledger, and provider reports/invoices, plus mismatch categories.
```

`docs/07-billing/README.md`:
```markdown
# 07 · Billing

Credit rules, ledger design, charging flow, rate cards, and reconciliation.

- [Credit Business Rules](credit-business-rules.md)
- [Ledger Design](ledger-design.md)
- [Charging State Machine](charging-state-machine.md)
- [Rate Cards](rate-cards.md)
- [Billing Reconciliation](reconciliation.md)
```

- [ ] **Step 3: Verify all 11 files exist with the expected title line**

Run:
```bash
for f in \
  docs/06-white-label/README.md:"# 06 · White-Label" \
  docs/06-white-label/branding.md:"# Branding" \
  docs/06-white-label/configuration-inheritance.md:"# Configuration Inheritance" \
  docs/06-white-label/custom-domains.md:"# Custom Domains" \
  docs/06-white-label/entitlements.md:"# Entitlements" \
  docs/07-billing/README.md:"# 07 · Billing" \
  docs/07-billing/credit-business-rules.md:"# Credit Business Rules" \
  docs/07-billing/ledger-design.md:"# Ledger Design" \
  docs/07-billing/charging-state-machine.md:"# Charging State Machine" \
  docs/07-billing/rate-cards.md:"# Rate Cards" \
  docs/07-billing/reconciliation.md:"# Billing Reconciliation" \
; do
  path="${f%%:*}"; title="${f#*:}"
  head -1 "$path" | grep -qF "$title" && echo "OK   $path" || echo "FAIL $path"
done
```
Expected: every line printed as `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/06-white-label docs/07-billing
git commit -m "Scaffold docs/06-white-label and docs/07-billing stubs"
```

---

## Task 5: `08-data/` and `09-api/`

**Files:**
- Create: `docs/08-data/README.md`
- Create: `docs/08-data/erd.md`
- Create: `docs/08-data/data-dictionary.md`
- Create: `docs/08-data/partitioning.md`
- Create: `docs/08-data/retention.md`
- Create: `docs/08-data/migrations.md`
- Create: `docs/09-api/README.md`
- Create: `docs/09-api/api-guidelines.md`
- Create: `docs/09-api/webhooks.md`
- Create: `docs/09-api/error-catalogue.md`
- Create: `docs/09-api/openapi/README.md`

**Interfaces:**
- Consumes: none from prior tasks.
- Produces: `08-data/` and `09-api/` folders, including the `09-api/openapi/` subfolder for future machine-readable spec files.

- [ ] **Step 1: Create `08-data/` files**

`docs/08-data/erd.md`:
```markdown
# Entity-Relationship Diagram

Entity-relationship diagram covering the platform's core entities: tenants, agents, campaigns, messages, wallets, ledger transactions, and more.
```

`docs/08-data/data-dictionary.md`:
```markdown
# Data Dictionary

Field-level documentation for every entity: meaning, type, validation, tenant ownership, PII classification, and retention.
```

`docs/08-data/partitioning.md`:
```markdown
# Partitioning Strategy

Database partitioning and sharding strategy for high-volume tables, including shard key tradeoffs.
```

`docs/08-data/retention.md`:
```markdown
# Data Retention

Retention periods per data category (message body, delivery events, audit logs, backups) and the deletion process.
```

`docs/08-data/migrations.md`:
```markdown
# Migrations

Conventions and process for schema migrations, including review requirements before production deployment.
```

`docs/08-data/README.md`:
```markdown
# 08 · Data

Entities, field dictionary, partitioning, retention, and migrations.

- [ERD](erd.md)
- [Data Dictionary](data-dictionary.md)
- [Partitioning Strategy](partitioning.md)
- [Data Retention](retention.md)
- [Migrations](migrations.md)
```

- [ ] **Step 2: Create `09-api/` files**

`docs/09-api/api-guidelines.md`:
```markdown
# API Design Guidelines

REST conventions: URL naming, auth, tenant resolution, pagination, error format, idempotency, versioning, and rate limits.
```

`docs/09-api/webhooks.md`:
```markdown
# Webhook Contract

The webhook contract: event names, schema versioning, signature algorithm, retry schedule, and replay protection.
```

`docs/09-api/error-catalogue.md`:
```markdown
# Error Catalogue

Canonical list of API error codes and their meanings, used consistently across all platform APIs.
```

`docs/09-api/openapi/README.md`:
```markdown
# OpenAPI Specifications

Machine-readable OpenAPI specifications for the Tenant, Agent, Messaging, Campaign, Wallet, Reporting, and Administrative APIs.
```

`docs/09-api/README.md`:
```markdown
# 09 · API

Design guidelines, webhook contract, error catalogue, and OpenAPI specs.

- [API Design Guidelines](api-guidelines.md)
- [Webhook Contract](webhooks.md)
- [Error Catalogue](error-catalogue.md)
- [OpenAPI Specifications](openapi/README.md)
```

- [ ] **Step 3: Verify all 11 files exist with the expected title line**

Run:
```bash
for f in \
  docs/08-data/README.md:"# 08 · Data" \
  docs/08-data/erd.md:"# Entity-Relationship Diagram" \
  docs/08-data/data-dictionary.md:"# Data Dictionary" \
  docs/08-data/partitioning.md:"# Partitioning Strategy" \
  docs/08-data/retention.md:"# Data Retention" \
  docs/08-data/migrations.md:"# Migrations" \
  docs/09-api/README.md:"# 09 · API" \
  docs/09-api/api-guidelines.md:"# API Design Guidelines" \
  docs/09-api/webhooks.md:"# Webhook Contract" \
  docs/09-api/error-catalogue.md:"# Error Catalogue" \
  docs/09-api/openapi/README.md:"# OpenAPI Specifications" \
; do
  path="${f%%:*}"; title="${f#*:}"
  head -1 "$path" | grep -qF "$title" && echo "OK   $path" || echo "FAIL $path"
done
```
Expected: every line printed as `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/08-data docs/09-api
git commit -m "Scaffold docs/08-data and docs/09-api stubs"
```

---

## Task 6: `10-security/` and `11-infrastructure/`

**Files:**
- Create: `docs/10-security/README.md`
- Create: `docs/10-security/security-architecture.md`
- Create: `docs/10-security/threat-model.md`
- Create: `docs/10-security/iam.md`
- Create: `docs/10-security/audit-logging.md`
- Create: `docs/10-security/incident-response.md`
- Create: `docs/11-infrastructure/README.md`
- Create: `docs/11-infrastructure/deployment-architecture.md`
- Create: `docs/11-infrastructure/networking.md`
- Create: `docs/11-infrastructure/autoscaling.md`
- Create: `docs/11-infrastructure/disaster-recovery.md`
- Create: `docs/11-infrastructure/cost-model.md`

**Interfaces:**
- Consumes: none from prior tasks.
- Produces: `10-security/` and `11-infrastructure/` folders.

- [ ] **Step 1: Create `10-security/` files**

`docs/10-security/security-architecture.md`:
```markdown
# Security Architecture

Covers network boundaries, trust boundaries, authentication, authorization, encryption, and secret storage across the platform.
```

`docs/10-security/threat-model.md`:
```markdown
# Threat Model

A STRIDE-based threat model covering cross-tenant access, forged provider callbacks, credit manipulation, and other platform-specific threats.
```

`docs/10-security/iam.md`:
```markdown
# Authentication and Authorization

Authentication and authorization specification: password policy, MFA, sessions, API keys, OAuth/OIDC, and impersonation rules.
```

`docs/10-security/audit-logging.md`:
```markdown
# Audit Logging

Defines which actions are audited platform-wide and the append-only, before/after-value format audit records must follow.
```

`docs/10-security/incident-response.md`:
```markdown
# Incident Response

Severity levels, escalation matrix, containment and recovery process, and post-incident review requirements.
```

`docs/10-security/README.md`:
```markdown
# 10 · Security

Security architecture, threat model, IAM, audit logging, and incident response.

- [Security Architecture](security-architecture.md)
- [Threat Model](threat-model.md)
- [Authentication and Authorization](iam.md)
- [Audit Logging](audit-logging.md)
- [Incident Response](incident-response.md)
```

- [ ] **Step 2: Create `11-infrastructure/` files**

`docs/11-infrastructure/deployment-architecture.md`:
```markdown
# Deployment Architecture

Deployment topology across environments: region strategy, load balancers, compute, database, cache, queues, and CI/CD.
```

`docs/11-infrastructure/networking.md`:
```markdown
# Networking

Network topology, trust boundaries, and traffic flow between the platform's services and external systems.
```

`docs/11-infrastructure/autoscaling.md`:
```markdown
# Autoscaling

Autoscaling signals per component — API servers, dispatch workers, webhook workers — and why queue age matters more than CPU for async workers.
```

`docs/11-infrastructure/disaster-recovery.md`:
```markdown
# Disaster Recovery

RPO/RTO targets, backup frequency, and recovery process for regional failure, database corruption, or provider outage.
```

`docs/11-infrastructure/cost-model.md`:
```markdown
# Cost Model

Estimated cost per API request, message, delivery event, and tenant, broken down by infrastructure component.
```

`docs/11-infrastructure/README.md`:
```markdown
# 11 · Infrastructure

Deployment, networking, autoscaling, disaster recovery, and cost.

- [Deployment Architecture](deployment-architecture.md)
- [Networking](networking.md)
- [Autoscaling](autoscaling.md)
- [Disaster Recovery](disaster-recovery.md)
- [Cost Model](cost-model.md)
```

- [ ] **Step 3: Verify all 12 files exist with the expected title line**

Run:
```bash
for f in \
  docs/10-security/README.md:"# 10 · Security" \
  docs/10-security/security-architecture.md:"# Security Architecture" \
  docs/10-security/threat-model.md:"# Threat Model" \
  docs/10-security/iam.md:"# Authentication and Authorization" \
  docs/10-security/audit-logging.md:"# Audit Logging" \
  docs/10-security/incident-response.md:"# Incident Response" \
  docs/11-infrastructure/README.md:"# 11 · Infrastructure" \
  docs/11-infrastructure/deployment-architecture.md:"# Deployment Architecture" \
  docs/11-infrastructure/networking.md:"# Networking" \
  docs/11-infrastructure/autoscaling.md:"# Autoscaling" \
  docs/11-infrastructure/disaster-recovery.md:"# Disaster Recovery" \
  docs/11-infrastructure/cost-model.md:"# Cost Model" \
; do
  path="${f%%:*}"; title="${f#*:}"
  head -1 "$path" | grep -qF "$title" && echo "OK   $path" || echo "FAIL $path"
done
```
Expected: every line printed as `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/10-security docs/11-infrastructure
git commit -m "Scaffold docs/10-security and docs/11-infrastructure stubs"
```

---

## Task 7: `12-testing/` and `13-operations/`

**Files:**
- Create: `docs/12-testing/README.md`
- Create: `docs/12-testing/master-test-strategy.md`
- Create: `docs/12-testing/tenant-isolation-tests.md`
- Create: `docs/12-testing/billing-tests.md`
- Create: `docs/12-testing/load-tests.md`
- Create: `docs/13-operations/README.md`
- Create: `docs/13-operations/slos.md`
- Create: `docs/13-operations/monitoring.md`
- Create: `docs/13-operations/alerting.md`
- Create: `docs/13-operations/runbooks/README.md`
- Create: `docs/13-operations/support-process.md`

**Interfaces:**
- Consumes: none from prior tasks.
- Produces: `12-testing/` and `13-operations/` folders, including the `13-operations/runbooks/` subfolder for future per-incident runbook files. This is the last domain-content task — after this, all 14 numbered folders exist.

- [ ] **Step 1: Create `12-testing/` files**

`docs/12-testing/master-test-strategy.md`:
```markdown
# Master Test Strategy

The overall test strategy: unit, integration, contract, tenant-isolation, security, load, and chaos testing.
```

`docs/12-testing/tenant-isolation-tests.md`:
```markdown
# Tenant Isolation Test Plan

Automated tests that attempt cross-tenant access — reading another tenant's records, using another tenant's API key, resolving the wrong tenant via custom domain.
```

`docs/12-testing/billing-tests.md`:
```markdown
# Credit and Billing Test Plan

Tests for the credit ledger and charging state machine: concurrent deductions, duplicate submissions, refunds, and the debits-equal-credits invariant.
```

`docs/12-testing/load-tests.md`:
```markdown
# Performance and Load-Test Plan

Load-test plan covering message submission, campaign expansion, provider throttling, and worker autoscaling.
```

`docs/12-testing/README.md`:
```markdown
# 12 · Testing

Master strategy, tenant isolation, billing invariants, and load testing.

- [Master Test Strategy](master-test-strategy.md)
- [Tenant Isolation Test Plan](tenant-isolation-tests.md)
- [Credit and Billing Test Plan](billing-tests.md)
- [Performance and Load-Test Plan](load-tests.md)
```

- [ ] **Step 2: Create `13-operations/` files**

`docs/13-operations/slos.md`:
```markdown
# SLOs

Service-level objectives per component (messaging API, webhook ingestion, credit ledger) tied to measurable SLIs.
```

`docs/13-operations/monitoring.md`:
```markdown
# Monitoring

What gets monitored platform-wide: message acceptance, dispatch throughput, queue age, provider latency, and cache hit rate.
```

`docs/13-operations/alerting.md`:
```markdown
# Alerting

Alerting rules, tied to user impact rather than raw infrastructure utilization.
```

`docs/13-operations/runbooks/README.md`:
```markdown
# Runbooks

Operational runbooks for incidents: queue backlog, provider outage, database failover, compromised API key, and more — one file per scenario.
```

`docs/13-operations/support-process.md`:
```markdown
# Support Process

The support escalation process and how support staff interact with tenant data, including impersonation rules.
```

`docs/13-operations/README.md`:
```markdown
# 13 · Operations

SLOs, monitoring, alerting, runbooks, and support process.

- [SLOs](slos.md)
- [Monitoring](monitoring.md)
- [Alerting](alerting.md)
- [Runbooks](runbooks/README.md)
- [Support Process](support-process.md)
```

- [ ] **Step 3: Verify all 11 files exist with the expected title line**

Run:
```bash
for f in \
  docs/12-testing/README.md:"# 12 · Testing" \
  docs/12-testing/master-test-strategy.md:"# Master Test Strategy" \
  docs/12-testing/tenant-isolation-tests.md:"# Tenant Isolation Test Plan" \
  docs/12-testing/billing-tests.md:"# Credit and Billing Test Plan" \
  docs/12-testing/load-tests.md:"# Performance and Load-Test Plan" \
  docs/13-operations/README.md:"# 13 · Operations" \
  docs/13-operations/slos.md:"# SLOs" \
  docs/13-operations/monitoring.md:"# Monitoring" \
  docs/13-operations/alerting.md:"# Alerting" \
  docs/13-operations/runbooks/README.md:"# Runbooks" \
  docs/13-operations/support-process.md:"# Support Process" \
; do
  path="${f%%:*}"; title="${f#*:}"
  head -1 "$path" | grep -qF "$title" && echo "OK   $path" || echo "FAIL $path"
done
```
Expected: every line printed as `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/12-testing docs/13-operations
git commit -m "Scaffold docs/12-testing and docs/13-operations stubs"
```

---

## Task 8: Obsidian vault config and templates

**Files:**
- Create: `docs/.obsidian/app.json`
- Create: `docs/.obsidian/core-plugins.json`
- Create: `docs/.obsidian/community-plugins.json`
- Create: `docs/_templates/adr-template.md`
- Create: `docs/_templates/doc-template.md`

**Interfaces:**
- Consumes: none — this task is independent of Tasks 1–7 and could run in parallel with them, but is sequenced last among content tasks for a clean final commit.
- Produces: the vault config that Obsidian reads on open, and the two templates that `03-architecture/adr/README.md` and future doc-writing sessions reference.

- [ ] **Step 1: Create `docs/.obsidian/app.json`**

```json
{}
```

(Obsidian fills in defaults on first open; an empty object is a valid, minimal config.)

- [ ] **Step 2: Create `docs/.obsidian/core-plugins.json`**

```json
[
  "file-explorer",
  "global-search",
  "switcher",
  "graph",
  "backlink",
  "outline",
  "command-palette",
  "page-preview",
  "note-composer",
  "word-count"
]
```

- [ ] **Step 3: Create `docs/.obsidian/community-plugins.json`**

```json
[
  "dataview",
  "templater-obsidian"
]
```

This file declares the two plugins as enabled, but their code isn't bundled here (no network fetch of third-party plugin binaries as part of this scaffolding task). After opening the vault in Obsidian, go to **Settings → Community plugins → Browse**, install "Dataview" and "Templater", and they'll pick up this file's enabled state.

- [ ] **Step 4: Create `docs/_templates/adr-template.md`**

```markdown
# ADR-<number>: <title>

## Context

## Decision

## Alternatives Considered

## Consequences

## Risks

## Revisit Conditions
```

- [ ] **Step 5: Create `docs/_templates/doc-template.md`**

```markdown
# <Title>

> Purpose: <one-line purpose>

Status: Draft

## Related

-
```

- [ ] **Step 6: Verify all 5 files exist and the two JSON files parse**

Run:
```bash
python3 -m json.tool docs/.obsidian/app.json > /dev/null && echo "OK app.json"
python3 -m json.tool docs/.obsidian/core-plugins.json > /dev/null && echo "OK core-plugins.json"
python3 -m json.tool docs/.obsidian/community-plugins.json > /dev/null && echo "OK community-plugins.json"
test -f docs/_templates/adr-template.md && echo "OK adr-template.md"
test -f docs/_templates/doc-template.md && echo "OK doc-template.md"
```
Expected: five `OK` lines, no JSON parse errors.

- [ ] **Step 7: Commit**

```bash
git add docs/.obsidian docs/_templates
git commit -m "Add Obsidian vault config and doc/ADR templates"
```

---

## Task 9: Root `CLAUDE.md`

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- Consumes: none.
- Produces: the skill-mapping reference future Claude Code sessions in this repo read at session start.

- [ ] **Step 1: Create `CLAUDE.md`**

```markdown
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
```

- [ ] **Step 2: Verify the file exists**

Run: `test -f CLAUDE.md && head -1 CLAUDE.md`
Expected: `# RCS SaaS Platform — Working Notes`

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Add root CLAUDE.md skill mapping"
```

---

## Task 10: Final verification

**Files:** none created — this task only verifies the completed vault.

**Interfaces:**
- Consumes: every folder/file created in Tasks 1–9.
- Produces: nothing — this is the plan's closing check before handing back to the user.

- [ ] **Step 1: Confirm the full 14-folder tree exists**

Run:
```bash
for d in 00-vision 01-product 02-domain 03-architecture 04-multitenancy \
         05-rcs 06-white-label 07-billing 08-data 09-api 10-security \
         11-infrastructure 12-testing 13-operations; do
  test -d "docs/$d" && test -f "docs/$d/README.md" && echo "OK   $d" || echo "FAIL $d"
done
```
Expected: 14 `OK` lines.

- [ ] **Step 2: Confirm gitignored files are not tracked**

Run:
```bash
git status --porcelain=v1 --ignored | grep -E '^\!\! (Project/|index\.php|\.claude/|\.agents/|skills-lock\.json)'
```
Expected: 5 lines shown, all prefixed `!!` (ignored), confirming none of these are staged or tracked.

- [ ] **Step 3: Confirm working tree is clean**

Run: `git status --porcelain`
Expected: no output (everything from Tasks 1–9 already committed).

- [ ] **Step 4: Report to the user**

Summarize: 14 folders, 80 stub/index files, `.obsidian` config with Dataview/Templater declared (manual plugin install still needed inside the Obsidian app), `_templates/`, and root `CLAUDE.md` are committed on `master`. Remind the user that `git push` to `origin` is a separate, explicit step whenever they're ready.
