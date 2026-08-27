# Design: Super Admin Panel — Carriers & Agents + Permissions

Date: 2026-08-27
Status: Approved

## Purpose

First implementation slice of the Super Admin panel for the RCS SaaS
platform (Laravel + React/`ecme` theme, per the platform's tech-stack
direction). Scope is two modules that other Super Admin modules will
build on top of:

1. **Carriers & Agents** — how a tenant's RCS agent is represented,
   registered per carrier (Jio, VI, Airtel today; extensible to
   international carriers later), and priced.
2. **Permissions** — how a tenant Owner grants sub-accounts (staff
   logins under their tenant) access to specific modules/features,
   including how the sidebar and route access both respect that grant.

## Non-goals

- The rest of the Super Admin panel (tenant/reseller provisioning,
  billing dashboards, white-label config, reporting) — later modules,
  built on top of what's defined here.
- **Message-sending normalization** (how outbound RCS messages —
  text, rich cards, carousels — get translated per carrier) is
  explicitly deferred to its own design pass. Only *agent creation*
  is normalized in this design; sending is a separate, likely more
  carrier-divergent problem.
- Per-tenant negotiated/custom rate cards — rate cards are
  platform-wide per carrier in this pass, not overridable per tenant.
- Role-based permission groups — permissions are granted directly
  per sub-account, not via a reusable "role" abstraction.
- The high-throughput webhook-ingestion pipeline redesign (backpressure,
  Redis Streams sharding, aggregator/trimmer commands) — a separate,
  already-partially-brainstormed thread, paused to prioritize this
  admin-panel work. Picking it back up is a future session.

## 1. Carriers & Agents module

### Data model

- **Agent** — a tenant's logical RCS bot: `id`, `tenant_id`, `name`,
  and brand fields (logo, display name, description). Holds the
  **canonical** agent configuration (see below). Has no carrier-specific
  state itself; its overall status is derived from its `CarrierAgent`
  children (e.g. "Live on 2/3 carriers").
- **CarrierAgent** — one row per (Agent × Carrier): `id`, `agent_id`,
  `carrier` (`jio` / `vi` / `airtel`, extensible), `carrier_external_id`
  (set once approved), `status`, `rejection_reason`, plus
  `last_submitted_payload` and `last_carrier_response` (raw JSON, kept
  for audit/debugging carrier rejections). One registration per carrier
  — OS (iOS/Android) is **not** a separate registration, it's purely a
  rate-card dimension (confirmed: a carrier-agent is approved/rejected
  once per carrier, not once per OS).
- **RateCard** — scoped to **carrier**, not per-agent: `id`, `carrier`,
  `os` (`ios`/`android`), `message_type` (`text`/`richcard`/`conversation`),
  `direction` (`a2p`/`p2a`), `price`, `effective_from`, `version`. Rich
  cards and carousels are billed under the same `richcard` line item —
  there is no separate carousel rate. One published rate card per
  carrier applies to every agent live on that carrier. A message always
  bills against whichever version was in effect when it was sent —
  versions are never mutated after the fact.

### Agent lifecycle (per `CarrierAgent`)

```
Draft → Submitted → Approved → Live → Suspended
                  → Rejected            → Terminated
```

Each carrier registration for a given Agent moves through this
independently — a Jio registration can be Live while the same Agent's
Airtel registration is still Rejected. Approved → Live is an automatic
transition (the carrier's approval webhook/response is what makes it
Live) — there is no separate manual "activate" step.

### Canonical agent format

Agent *creation* uses a single standard schema across all carriers,
modeled on Google's RCS Business Messaging / RBM object shape (brand
name, logo, colors, description, use-case, and capability blocks —
rich cards, carousels, suggested replies, suggested actions) — since
all carriers' agent-creation APIs follow the same underlying RCS/GSMA
documentation and this is the most complete public reference for that
shape. This is what the Owner fills in once; it is stored as-is on
`Agent` and is the system's source of truth.

Per-carrier adapters translate canonical ↔ carrier-specific only at
the API boundary:

```php
interface CarrierAgentAdapter {
    submit(CanonicalAgent $agent): CarrierSubmissionResult;
    mapStatus(carrierResponse): CanonicalStatus;
    checkCapability(capability): bool;
}
```

`JioAdapter`, `ViAdapter`, `AirtelAdapter` each implement this.
Nothing else in the system — UI, database, billing — ever sees a
carrier-specific payload shape. Adding an international carrier later
means writing one new adapter class; no changes to `Agent`, the UI, or
any existing carrier's adapter.

Outbound **message**-format normalization (as opposed to agent
creation) is out of scope here — see Non-goals.

## 2. Permissions module

### Data model

- **User** — `id`, `tenant_id`, `name`, `email`, `is_owner` (bool).
  Owners implicitly have access to every module; the permission system
  only constrains sub-accounts.
- **Feature registry** — a single source of truth in code
  (`config/features.php`): a list of `{key, label, icon, route,
  sidebar: bool}` entries, one per module/page. Adding a new feature
  later means adding one entry here plus the page itself — nothing
  else needs to change for it to become permission-aware.
- **Permission grants** — `sub_account_permissions` pivot table
  (`user_id`, `feature_key`). No roles layer: the Owner grants/revokes
  feature keys directly per sub-account.

### Enforcement (two layers)

1. **Sidebar** — filters the feature registry to entries where
   (`user.is_owner` OR the user holds that `feature_key`) AND
   `sidebar: true`. Ungranted modules never render as menu items.
2. **Route/Gate check** — every module's routes are wrapped in a
   Laravel Gate (`can:access-feature,<key>`) checking the same grant.
   This is the actual security boundary — hiding a sidebar link alone
   does not stop a direct URL hit.

Both layers call **one shared helper/Gate definition** for the
permission check — never duplicated per controller or per view. Any
future logic that would otherwise be copy-pasted across call sites
(permission checks, rate-card lookups, agent-status derivation) is
centralized in one helper/service and called from every site, per
project convention.

New sub-accounts default to **no access** (default-deny) until the
Owner explicitly grants each feature key.

## Verification

- Every `CarrierAgent` for a given `Agent` can independently reach
  Approved/Rejected/Live/Suspended/Terminated without affecting its
  siblings' state.
- A message's billed amount always resolves to the `RateCard` version
  that was `effective_from`-current at send time, even after newer
  rate card versions are published.
- Adding a new carrier requires only a new `CarrierAgentAdapter`
  implementation — no changes to `Agent`, migrations, or the UI layer.
- A sub-account with no granted `feature_key`s sees an empty sidebar
  (aside from whatever is universally accessible) and gets denied
  (not just hidden) on any protected route it hits directly.
- Adding a new feature page requires one `config/features.php` entry
  + the page + wrapping its routes in the existing Gate — no changes
  to the sidebar-rendering or grant-checking code itself.
