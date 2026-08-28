# Design: Platform Admin Role & Tenant Hierarchy

Date: 2026-08-28
Status: Approved

## Purpose

Corrects a role-model gap discovered while starting to plan the
Carriers & Agents module: that module's spec (and rate-card
management) assumed a tenant's own "Owner" would create and manage RCS
Agents, carriers, and pricing. In reality, those are platform-operator
concerns — a genuine, cross-tenant **Admin** role that does not
currently exist. This spec adds that role, corrects "Owner" naming to
"User" throughout, and lays the minimum tenant-hierarchy groundwork
White Label will eventually need — without building White Label
itself.

## Non-goals

- **Carriers & Agents module** — next plan, now unblocked by this one.
- **White Label module** — the request/approval workflow, custom-domain
  handling, and branding (logo/color/theme) configuration are a
  separate, future design pass. Only the tenant-hierarchy *data shape*
  needed to support it later is added here.
- **Unbounded reseller nesting** — a reseller's own sub-tenant can
  never itself become a reseller with sub-tenants of its own, in this
  pass. The hierarchy is capped at exactly one level. Revisit only if
  multi-level reselling becomes an actual requirement — it needs a
  materialized-path or closure-table redesign, not a speculative one
  now.
- **Admin-level sub-roles/permissions** — a single `is_admin` boolean,
  all-or-nothing, mirroring how `is_owner` already works. Multiple
  Admins with different admin-level access is a future addition if it
  becomes a real need.
- **Renaming the `is_owner` database column** — kept as an internal
  implementation detail (see Terminology below); every human-visible
  surface uses "User," not "Owner."

## Terminology

Three account tiers, one `users` table, distinguished by two existing
booleans plus one new one:

| Role | `is_admin` | `tenant_id` | `is_owner` |
|---|---|---|---|
| **Admin** | `true` | `null` | *(irrelevant)* |
| **User** (a tenant's primary account) | `false` | set | `true` |
| **Team** (a User's sub-account) | `false` | set | `false` |

- **Admin** runs the platform: approves white-label requests, manages
  carriers, rate cards, and RCS Agents, has visibility across the
  whole tenant tree. Not a member of any tenant.
- **User** is a customer who signed up, completed onboarding, and uses
  the RCS Agent(s) Admin has set up for their tenant. This is what
  Plan 1 built and mislabeled "Owner" — the mechanics (`is_owner =
  true`: sees every tenant feature, can create/manage Team) are
  already correct; only the human-facing word was wrong.
- **Team** is a User's sub-account with individually granted feature
  access — already correctly built in Plan 1, unchanged by this spec.

"Owner" must never appear in UI copy, docs, or conversation going
forward — say "User." The `is_owner` column name itself is kept
internal-only: no code outside this repo's own source ever reads a
column name, so renaming it (migration + every model/controller/
frontend reference) is pure risk for zero user-visible benefit. If a
future session decides the internal name should change too, that's a
separate, explicit decision — not bundled into this one.

## 1. Data model

### `users` table

Add one column: `is_admin` (boolean, default `false`). No migration
needed for `tenant_id` — already nullable from Plan 1.

**Invariant** (app-level, not a DB constraint — matches how this
codebase already handles such rules): every row is exactly one of
Admin / User / Team per the table above — never `is_admin = true` with
a `tenant_id` set, never a non-admin row with `tenant_id = null`.

### `tenants` table

Add two columns:
- `parent_tenant_id` (nullable, self-referencing FK to `tenants.id`,
  `nullOnDelete` — if a reseller tenant is ever deleted, its
  sub-tenants become top-level rather than being silently
  cascade-deleted)
- `is_white_label` (boolean, default `false`) — marks a tenant as an
  approved reseller, able to have children

**Both columns must be indexed** — they are the hot path for every
"who does this user belong to" and "show me every reseller and their
customers" query Admin's dashboard will run.

**Hierarchy is capped at one level** — the rule this schema is built
around: a tenant with `parent_tenant_id` set can never itself have
`is_white_label = true` or children of its own. This makes every
hierarchy query exactly one indexed lookup — `WHERE parent_tenant_id
= X` — regardless of how many tenants exist, with no recursion,
materialized path, or closure table ever required. List views must
batch their queries (`whereIn`, eager-loading) rather than looping
per-row — the index alone doesn't guarantee speed if the query pattern
re-introduces N+1 lookups.

This pass adds the two columns only — no endpoint exists yet that sets
`is_white_label` or assigns `parent_tenant_id` (both stay at their
defaults for every tenant this plan creates), so there is no
enforcement code to write here. The cap is documented now so that
whichever future plan builds the White Label approval flow implements
it from the start, rather than needing a retrofit once tenants already
violate it.

**Identifying a user's position in the hierarchy** (no new schema
beyond the two columns above):
- `tenant.parent_tenant_id` is **not null** → this user's tenant is a
  reseller's sub-tenant; the reseller is `tenant.parent_tenant_id`.
- `tenant.parent_tenant_id` is **null** and `tenant.is_white_label =
  true` → this user's own tenant is itself an approved reseller.
- `tenant.parent_tenant_id` is **null** and `tenant.is_white_label =
  false` → a regular, direct customer, no white-label involved.

## 2. Auth / permission layer

New Gate + middleware, mirroring the existing `is-owner` pattern from
Plan 1 exactly: `EnsureIsAdmin` middleware (alias `is-admin`) checking
`$request->user()->is_admin === true`, for gating platform-level
routes.

No feature-grant system on the Admin side — unlike Team members (who
get individually granted specific features), there is no current need
for multiple Admins with different levels of access. Same blunt,
all-or-nothing pattern `is-owner` already uses successfully.

The existing Team/Permissions system (`is_owner`, `FeatureAccess`,
`sub_account_permissions`) is completely untouched — it keeps working
exactly as built, regardless of whether a tenant is top-level or a
reseller's sub-tenant. The hierarchy lives one level up, at the
Tenant; it doesn't change how permissions work inside any single
tenant.

## 3. Frontend

Admin's experience is structurally separate from a tenant User's —
Admin has no `tenant_id`, so tenant-scoped nav items (Team, and future
tenant-side pages) don't apply to them, and a tenant User will never
see Admin's pages. Rather than force both through one filtered list,
the SPA selects between two entirely separate nav/route arrays based
on a new `isAdmin: boolean` field:

- `navigationConfig` (existing) — Home, Team — for User/Team accounts
- `adminNavigationConfig` (new) — Admin's own nav

`isAdmin` is returned by sign-in and `/api/user` as a top-level field,
parallel to but separate from the existing `authority: string[]` — it
is a role check, not a feature grant, so it does not flow through the
same array.

This pass's deliverable is deliberately minimal: one bare "Admin
Dashboard" placeholder page, proving `is_admin`-gated login → correct
nav → correct route access works end-to-end — the same way Plan 1
proved the Team mechanism before any real Team features existed. The
real admin pages (Carriers, Rate Cards, Tenant hierarchy view,
White-Label approvals) are built in Carriers & Agents and later plans,
on top of this foundation.

## 4. Seed data

One Admin account (`admin@rbm.local`, `is_admin = true`, `tenant_id =
null`) alongside the existing Demo Tenant/User from Plan 1.

## Verification

- Signing in as the seeded Admin returns `isAdmin: true` and an empty
  `authority` array (Admin has no tenant-scoped features).
- Signing in as the existing Demo User returns `isAdmin: false`,
  unchanged `authority` behavior from Plan 1.
- The Admin account reaches the placeholder Admin Dashboard page; the
  Demo User cannot (and vice versa — Admin cannot reach `/permissions`
  since they have no tenant).
- A tenant with `parent_tenant_id` set is correctly identified as a
  reseller's sub-tenant by that single field — no additional query
  needed beyond following `parent_tenant_id`.
- Attempting (in a future session, once White Label exists) to mark a
  tenant that already has a `parent_tenant_id` as `is_white_label =
  true`, or to assign it children, must be rejected at the application
  layer — the one-level cap this schema is built around.
