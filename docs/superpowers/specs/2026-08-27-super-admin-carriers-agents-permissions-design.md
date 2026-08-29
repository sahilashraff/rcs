# Design: Super Admin Panel — Carriers & Agents + Permissions

Date: 2026-08-27
Status: Approved

**Revision (2026-08-29):** Section 1 (Carriers & Agents) is rewritten
below. Plan 2 (`2026-08-28-platform-admin-role-tenant-hierarchy`)
established a genuine platform-level **Admin** role distinct from the
tenant-scoped **User** (née "Owner"). This module was originally
designed assuming the tenant Owner created and managed their own
Agents — that assumption no longer holds. Section 2 (Permissions) is
unchanged and already fully implemented (Plan 1); it's left as a
historical record of what was built.

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

- The rest of the Super Admin panel (tenant/reseller provisioning
  beyond a minimal read-only picker, billing dashboards, white-label
  config, reporting) — later modules, built on top of what's defined
  here.
- **Message-sending normalization** (how outbound RCS messages —
  text, rich cards, carousels — get translated per carrier) is
  explicitly deferred to its own design pass. Only *agent creation
  and tracking* is addressed in this design; sending is a separate,
  likely more carrier-divergent problem.
- **Real carrier API integration.** `CarrierAgentAdapter` stays an
  interface documented for the future — no `JioAdapter`/`ViAdapter`/
  `AirtelAdapter` implementation, no real HTTP calls to any carrier.
  Admin drives every `CarrierAgent` through its lifecycle via explicit
  action buttons that only change internal state. This is not a
  simplification of convenience: Jio's own docs (see "Carrier API
  research notes" below) don't document a webhook for
  approval/rejection/suspension at all — there is nothing to integrate
  against yet.
- **RateCard CRUD.** The `RateCard` shape stays documented below as
  the target data model; no UI or endpoint is built until a dedicated
  billing/pricing pass.
- Per-tenant negotiated/custom rate cards — rate cards are
  platform-wide per carrier in this pass, not overridable per tenant.
- Role-based permission groups — permissions are granted directly
  per sub-account, not via a reusable "role" abstraction.
- The high-throughput webhook-ingestion pipeline redesign (backpressure,
  Redis Streams sharding, aggregator/trimmer commands) — a separate,
  already-partially-brainstormed thread, paused to prioritize this
  admin-panel work. Picking it back up is a future session.

## 1. Carriers & Agents module

**Ownership:** Admin creates and manages every Agent and CarrierAgent,
for every tenant, platform-wide. The tenant User gets a **read-only**
view of their own tenant's Agent(s) and per-carrier status — User-only,
not grantable to Team (same `owner_only` structural pattern as the
existing Team page). Team never sees this at all in this pass. Neither
role gets any create/edit/submit action; those are Admin-only.

### Data model

- **Tenant** — unchanged (already exists from Plan 2). Admin gets a
  read-only list endpoint (`id`, `name`) solely to support the tenant
  picker at Agent-creation time — this is not tenant
  provisioning/management, just enough to attach an Agent to the right
  tenant.
- **Carrier** — a real table, not a hardcoded enum: `id`, `code`
  (unique slug, e.g. `jio`/`vi`/`airtel`), `name`, `country` (e.g.
  `IN`, so international carriers slot in without ambiguity later),
  `is_active`. Retiring a carrier is `is_active = false`, never a
  delete — existing `CarrierAgent` rows may still reference it. Admin
  gets minimal CRUD (create/list/toggle-active, no delete). Adding a
  new domestic or international carrier is then a data operation (one
  new row), never a migration or code change to `Agent`/`CarrierAgent`
  — the property the original draft of this spec wanted but didn't
  actually deliver with a hardcoded enum column.
- **Agent** — a tenant's logical RCS bot: `id`, `tenant_id`, `name`,
  `brand_name`, `description`. Holds only what's needed to identify
  and track an agent; the full canonical RBM-style object (logo,
  colors, capability blocks) is deliberately not modeled as columns
  yet — that's a concern for the future templates/messaging design
  pass, not for "can Admin create and assign an agent." Has no
  carrier-specific state itself; its overall status is derived from
  its `CarrierAgent` children (e.g. "Live on 2/3 carriers").
- **CarrierAgent** — one row per (Agent × Carrier × OS): `id`,
  `agent_id`, `carrier_id`, `os` (`android`|`ios`, **not nullable**,
  default `android`), `carrier_external_id` (set once approved),
  `status`, `rejection_reason`, `suspended_by` (`admin`|`carrier`,
  nullable — see lifecycle below), plus `last_submitted_payload` and
  `last_carrier_response` (raw JSON, kept for audit/debugging carrier
  rejections; different carriers use different transports for the same
  kind of field — e.g. Jio's assistant logo is a hosted URL while its
  Brand logo is inline base64 — so these stay untyped JSON rather than
  a fixed column shape).

  **Why OS is its own dimension, not a rate-card-only concern (revised
  2026-08-29):** the original draft of this spec stated OS was "not a
  separate registration, purely a rate-card dimension" and marked that
  "confirmed." Reading Jio's actual onboarding docs disproved this —
  enabling a Jio assistant for Apple users creates a **second, separate
  assistant entity with its own carrier-side id**, not a flag on the
  existing one, and this is a general per-carrier onboarding pattern,
  not a Jio-specific quirk. `os` is therefore non-nullable with a
  concrete default (not nullable) specifically to avoid a real footgun:
  a nullable column in a `UNIQUE(agent_id, carrier_id, os)` index would
  let MySQL silently accept duplicate "default" registrations, since
  `NULL <> NULL` for uniqueness purposes — two Android-default rows for
  the same agent+carrier would both pass the constraint.
  `UNIQUE(agent_id, carrier_id, os)` blocks a real duplicate
  registration; `UNIQUE(carrier_id, carrier_external_id)` is the index
  a future webhook/status-lookup path resolves an inbound
  carrier-issued id against in O(1) — this is the one place this data
  model has a real performance stake, per the platform's "blazing fast"
  requirement for the eventual message/webhook pipeline built on top
  of it.
- **RateCard** (data model documented, no CRUD this pass — see
  Non-goals) — scoped to **carrier**, not per-agent: `id`, `carrier_id`,
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
          ↑              ↓                ↓
          └── Rejected   └──────→ Terminated ←┘
```

Each carrier registration for a given Agent moves through this
independently — a Jio registration can be Live while the same Agent's
Airtel registration is still Rejected.

State-transition table (exact source of truth — the diagram above is
just a visual aid):

| From | To | Trigger |
|---|---|---|
| Draft | Submitted | Admin marks the agent as submitted for carrier review (manual action button — no real API call to the carrier this pass, see Non-goals) |
| Submitted | Approved | Admin marks it approved, once the carrier's own console/console-email confirms it (no documented webhook exists to automate this — see "Carrier API research notes" below) |
| Submitted | Rejected | Admin marks it rejected and enters a `rejection_reason` manually — same reasoning, no API/webhook source exists to pull this from automatically |
| Rejected | Draft | Admin edits the registration to address the rejection reason — re-enters the same flow, not a special path |
| Approved | Live | Automatic, immediately on Approved — no separate manual "activate" step |
| Live | Suspended | Admin action, recorded via `suspended_by = 'admin'` — a future carrier-pushed suspension event would set `suspended_by = 'carrier'` once that integration exists, so `mapStatus()`/its future equivalent can distinguish which, since only admin-suspended agents can be admin-reinstated |
| Suspended | Live | Admin reinstates — **only** if `suspended_by = 'admin'`. A carrier-triggered suspension requires the carrier's own reactivation signal, not an admin toggle |
| Live / Suspended | Terminated | Admin action (or, in the future, a carrier-pushed permanent revocation). **One-way** — no path back from Terminated; a terminated registration must be recreated from Draft if the tenant wants back on that carrier |

One `CarrierAgentTransitioner` service holds this table as data
(`action → [fromStatuses, toStatus]`) and is the **only** place a
status change happens — both the transition endpoint today and any
future real carrier-webhook handler call through it, so the two ways a
status can change can never drift apart or duplicate the validation
logic. An illegal call (e.g. `draft → live` directly) returns a 422
with the current status and the attempted action, whether it's a stale
UI, a race between two Admin tabs, or a direct API probe. The Admin UI
only ever renders the action buttons that are legal from the current
status, mirroring the same table, so an illegal transition isn't just
rejected server-side — it's never offered.

### Derived `Agent.status`

Computed on read (no materialized column — avoids sync triggers, and
agent counts are low-cardinality per tenant so aggregation cost is
negligible), from the set of its `CarrierAgent.status` values:

| Condition | Derived status |
|---|---|
| No `CarrierAgent` rows yet, or all Draft | `draft` |
| At least one Submitted, none Live yet | `pending` |
| At least one Live, at least one not-Live-and-not-Terminated | `partially_live` |
| All non-Terminated registrations are Live | `live` |
| At least one Live, rest Terminated | `live` (Terminated siblings don't drag it down) |
| At least one Suspended, none Live | `suspended` |
| All registrations Terminated | `terminated` |

### Canonical agent format

The long-term target remains a single standard schema across all
carriers, modeled on Google's RCS Business Messaging / RBM object
shape (brand name, logo, colors, description, use-case, and capability
blocks — rich cards, carousels, suggested replies, suggested actions),
since all carriers' agent-creation APIs follow the same underlying
RCS/GSMA documentation. This pass's `Agent` table does **not**
implement that full shape yet (see Data model above) — Admin fills in
only `name`/`brand_name`/`description` for now. The full canonical
object becomes real when the templates/messaging pass needs it.

Per-carrier adapters will translate canonical ↔ carrier-specific only
at the API boundary — documented here as the future integration point,
**not implemented this pass** (see Non-goals):

```php
interface CarrierAgentAdapter {
    submit(CanonicalAgent $agent): CarrierSubmissionResult;
    mapStatus(carrierResponse): CanonicalStatus;
    checkCapability(capability): bool;
}
```

`JioAdapter`, `ViAdapter`, `AirtelAdapter` would each implement this
when real integration is built. Nothing else in the system — UI,
database, billing — should ever see a carrier-specific payload shape.
Adding an international carrier later means writing one new adapter
class; no changes to `Agent`, the UI, or any existing carrier's
adapter.

Outbound **message**-format normalization (as opposed to agent
creation) is out of scope here — see Non-goals.

#### Carrier API research notes (2026-08-29)

Read directly from Jio's own onboarding/API docs
(`Project/Docs/JBM Account Onboarding & Assistant creation_3.2.pdf`,
`Project/Docs/JBM_External_Management_APIs_v1_0.pdf`, and their
Postman collection) to sanity-check the schema above before real
integration is ever built. Recorded here so the future
`JioAdapter` implementation doesn't have to rediscover this:

- **No single field name for the agent identifier.** Jio's own docs
  are inconsistent: the create-assistant response returns it as a bare
  `id` (nested at `result.id`), later endpoints use `assistantId` as a
  URL path parameter for the same value, and Tester Management
  endpoints call it `botId` in a query param. `carrier_external_id`
  intentionally doesn't try to standardize on one of these names —
  store whatever the create response returns, and expect other
  carriers to name it differently again.
- **Brand is a separate, pre-existing entity**, created via its own
  `POST /brands` call (`name`, `logo` as base64, `website`,
  `organizationId`), reusable across multiple assistants — not inline
  fields on the assistant itself. When real integration is built, this
  likely needs its own `carrier_brand_id` concept per tenant/org,
  distinct from `Agent.brand_name`.
- **Required assistant-creation fields** (for the future adapter, not
  this pass's `Agent` table): `displayName`, `description`,
  `termsAndConditions` (URL), `privacyPolicy` (URL), `logoUri` (hosted
  URL), `heroUri` (hosted URL), `billingCategory` (enum),
  `assistantUseCase` (enum), `color` (hex), `assistantCommunication`
  (nested phone/email/website/policy), `brandId`. Image transport
  differs by field — assistant logos are hosted URLs, Brand's logo is
  inline base64 — which is why `last_submitted_payload` stays untyped
  JSON rather than a fixed shape.
- **No documented webhook for approval/rejection/suspension.**
  Approval/rejection happens manually in Jio's own admin console; the
  only API-visible signal found was a bare `technicalState` field
  (e.g. `"Launched"`) on the launch endpoint, and no rejection-reason
  field anywhere. This is why `rejection_reason` stays a manually
  entered field in this design rather than something ingested via API
  — there's no carrier-side contract to ingest it from yet.

### Backend API surface

Admin-gated (`is-admin` middleware, same pattern as the existing
`/admin/ping`):

- `GET /admin/tenants` — `{id, name}` list, for the Agent-creation
  tenant picker.
- `GET /admin/carriers`, `POST /admin/carriers`,
  `PUT /admin/carriers/{carrier}` — minimal CRUD (`code`, `name`,
  `country`, `is_active`). No delete.
- `GET /admin/agents`, `POST /admin/agents` — list (with derived
  `status`) and create (`tenant_id`, `name`, `brand_name`,
  `description`).
- `GET /admin/agents/{agent}` — detail, including its `CarrierAgent`
  rows.
- `POST /admin/agents/{agent}/carrier-agents` — add a new carrier
  registration (`carrier_id`, `os` defaulting to `android`), starts at
  `draft`.
- `POST /admin/carrier-agents/{carrierAgent}/transition` — body
  `{action, rejection_reason?}`, validated against the
  `CarrierAgentTransitioner` table above.

Tenant-side (existing `auth:sanctum` group):

- `GET /agents` — read-only: this tenant's Agents with derived status
  and their CarrierAgent statuses. No mutation endpoints on this side.

### Permissions & feature-registry wiring

- All `/admin/*` routes above sit behind the existing `is-admin`
  middleware alias — no new gating mechanism needed.
- Tenant-side `GET /agents` gets one new `config/features.php` entry:
  `{key: 'agents', label: 'Agents', route: '/agents', sidebar: true,
  owner_only: true}` — reuses the exact `owner_only` structural filter
  built for the Team page, so it's automatically excluded from what's
  grantable to Team even against a smuggled grant row. No changes to
  `FeatureAccess.php` itself.

### Frontend

**Admin side** (new entries under the existing
`adminNavigationConfig`/`adminProtectedRoutes`):

- **Tenants** (`/admin/tenants`) — read-only table, exists solely to
  support the picker.
- **Carriers** (`/admin/carriers`) — table + create/edit form.
- **Agents** (`/admin/agents`) — list (tenant, name, derived status,
  filterable by status) → detail page per agent, showing its
  `CarrierAgent` rows (labeled e.g. "Jio (Android)" / "Jio (iOS)") with
  only the currently-legal action buttons rendered per row.

**Tenant side**: one new nav entry, **Agents** (`/agents`), User-only —
read-only list of this tenant's agents and their per-carrier status.
No create/edit UI.

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

**Carriers & Agents:**

- Creating an Agent requires a valid `tenant_id` — invalid/missing
  tenant rejected with a 422, not a silent null.
- Adding a `CarrierAgent` always starts at `draft`; only the
  transitions in the approved table succeed — spot-check at least one
  illegal jump (e.g. `draft → live` directly) 422s.
- Every `CarrierAgent` for a given `Agent` can independently reach
  Approved/Rejected/Live/Suspended/Terminated without affecting its
  siblings' state.
- `UNIQUE(agent_id, carrier_id, os)` is enforced at the DB level — a
  second Android-default registration for the same agent+carrier is
  rejected, not silently duplicated.
- `UNIQUE(carrier_id, carrier_external_id)` is enforced at the DB
  level.
- Retiring a carrier (`is_active = false`) doesn't affect existing
  `CarrierAgent` rows referencing it, and doesn't appear in the picker
  for *new* CarrierAgent creation.
- Admin sees all tenants' agents; a signed-in tenant User sees only
  their own tenant's agents via `GET /agents`, and a Team member
  granted every other feature still gets a 403 on `/agents`
  (`owner_only` structural filter, same proof pattern already used for
  Team's own page).
- A message's billed amount always resolves to the `RateCard` version
  that was `effective_from`-current at send time, even after newer
  rate card versions are published (verification deferred along with
  RateCard CRUD itself — recorded here as the target behavior).
- Adding a new carrier requires only a new row in the `carriers` table
  for creation/tracking, and (when real integration is eventually
  built) one new `CarrierAgentAdapter` implementation — no changes to
  `Agent`, `CarrierAgent`, migrations, or the UI layer either way.

**Permissions** (already implemented, Plan 1):

- A sub-account with no granted `feature_key`s sees an empty sidebar
  (aside from whatever is universally accessible) and gets denied
  (not just hidden) on any protected route it hits directly.
- Adding a new feature page requires one `config/features.php` entry
  + the page + wrapping its routes in the existing Gate — no changes
  to the sidebar-rendering or grant-checking code itself.
