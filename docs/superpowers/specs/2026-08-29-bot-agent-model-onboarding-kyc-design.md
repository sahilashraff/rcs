# Design: Bot/Agent Data-Model Correction + Onboarding/KYC + Account-Lock Gating

Date: 2026-08-29
Status: Approved

## Purpose

The Carriers & Agents Admin module (shipped earlier this session) modeled a
tenant's RCS bot as two layers: a parent `Agent` record holding shared
identity (name, brand name, description) with many child `CarrierAgent`
rows underneath it (one per carrier registration). Working through the
actual real-world flow surfaced that this shape is wrong, and that the
platform still has no self-serve path from "a User signs up" to "that
User's bot is live on a carrier." This design fixes both:

1. **Corrects the data model** — collapses the unnecessary parent layer:
   the tenant owns the shared identity directly, and what the industry
   (and Google's own RCS docs) call "Agent" is exactly what this codebase
   called `CarrierAgent` — a per-(carrier × OS) registration, not a child
   of some other in-between object.
2. **Adds the missing onboarding path** — a locked KYC/RCS-brand
   submission form a new User must complete, an Admin review/approval
   flow (approval is what actually creates Agent rows, with carrier/OS
   selection happening at that point), and account-lock gating that keeps
   the User confined to the onboarding screen until at least one of their
   Agents reaches Live.

This is two sequential, independently-shippable pieces:

- **B1 — Data-model correction.** Fixes the shape of what's already
  built. No onboarding yet.
- **B2 — Onboarding, review, and account-lock gating.** Builds on B1's
  corrected model.

## Non-goals

- **Plans/feature-gating and white-label** (an earlier-discussed future
  piece — "User can become white-label depending on their plan") — not
  addressed here at all.
- **Real carrier API integration** — unchanged from the original Carriers
  & Agents design: Admin still drives every Agent through its lifecycle
  via explicit action buttons, no real HTTP calls to Jio/VI/Airtel.
- **Real cloud file storage** — onboarding document uploads use Laravel's
  local storage disk, same "good enough for now, swap in real
  infrastructure later" pattern already used for email/OTP delivery
  (which currently log instead of really sending).
- **Multiple bots per tenant.** One Tenant has at most one set of shared
  identity fields and up to 6 possible Agent rows (3 carriers × 2 OS,
  today's known set) — not an arbitrary number of independent bot
  profiles.

## B1 — Data-model correction

### Why

Creating a bot is inherently a per-carrier act — there's no such thing as
a carrier-less bot; you call Jio's API, or Vi's, or Airtel's, each
separately. A tenant only ever needs one onboarding, and the identifying
details used to create a bot on any carrier are the *same* details every
time — not a separate set per registration. So there's no need for a
distinct parent record to hold that shared identity; it belongs directly
on the tenant. Each registration can also be OS-specific (already modeled
via `os` on the existing `carrier_agents` table) — 3 carriers × 2 OS means
up to 6 possible registrations per tenant, and Admin decides how many of
those 6 to actually create.

### Data model

- **`tenants`** gains `brand_name` (string, nullable) and `description`
  (text, nullable) — the identity fields that used to live on the removed
  parent `Agent` record.
- **`agents` table (old, parent/"Bot") — dropped entirely.**
- **`carrier_agents` table — renamed to `agents`.** Its `agent_id` column
  is renamed to `tenant_id`, with the foreign key retargeted from the
  dropped table to `tenants`. `UNIQUE(agent_id, carrier_id, os)` becomes
  `UNIQUE(tenant_id, carrier_id, os)` — same purpose (blocks a duplicate
  registration), same non-nullable-`os`-with-default reasoning already
  established (a nullable `os` would let MySQL treat two "default"
  registrations as distinct for uniqueness purposes).

### Models

- `App\Models\Tenant` gains `brand_name`/`description` in `$fillable`,
  an `agents(): HasMany` relation, and a derived-status method — the same
  draft/pending/partially_live/live/suspended/terminated aggregation
  logic the old `Agent::derivedStatus()` already implements, recomputed
  over `$this->agents` directly instead of a two-hop
  `Agent->carrierAgents` path.
- `App\Models\Agent` (old parent) — deleted.
- `App\Models\CarrierAgent` — renamed to `App\Models\Agent`. Its
  `belongsTo` relation changes from the deleted parent to `Tenant`
  directly; `$fillable` swaps `agent_id` for `tenant_id`.
- `App\Support\CarrierAgentTransitioner` — only its type-hints change
  (`Agent` instead of `CarrierAgent`). The `TRANSITIONS` table and every
  guard (the `suspended_by === 'admin'` check on reinstate, the
  `rejection_reason` requirement on reject, `terminated` having no
  outgoing transition) are untouched — this state machine was already
  correct, it just now operates on a differently-parented row.

### Backend endpoints

- `AgentController::store()` (Admin's old manual "Create Agent" action) is
  **removed** — going forward, Agent rows are only ever created as the
  result of an approved onboarding request (B2). `index()`/`show()`
  remain, reading from the renamed model, scoped by `tenant_id`.
- `CarrierAgentController::store()` (the old "add a carrier registration
  to an existing Agent" endpoint) is **removed** — carrier/OS selection
  now only happens via B2's approval action. `transition()` stays,
  retyped to the renamed model.
- Routes: `POST /admin/agents` and `POST
  /admin/agents/{agent}/carrier-agents` removed. `GET /admin/agents`,
  `GET /admin/agents/{agent}`, `POST
  /admin/carrier-agents/{carrierAgent}/transition` stay, pointing at the
  updated controllers.

### Frontend

- **Admin Agents list** (`views/AdminAgents/`) — the "Create Agent" button
  and its tenant-picker dialog are removed. Becomes the **single global
  page** for every tenant's Agent rows platform-wide: a table (Tenant,
  Carrier, OS, Status columns, the existing `AgentListTable`/
  `AgentListTableTools` components as the base) with the same lifecycle
  action buttons `CarrierAgentCard` already renders per status
  (Submit/Approve/Reject/Suspend/Reinstate/Terminate) now inline per row.
  This is a deliberate choice: routine bot management (checking status,
  driving a registration through its lifecycle) should never require
  drilling into a specific tenant — one table, act right there. Drilling
  into a tenant is reserved for the one moment that genuinely needs
  tenant-specific context: reviewing a brand-new onboarding request
  (B2), where the KYC data and carrier/OS selection matter together.
- **Admin Agent Detail** (`views/AdminAgentDetail/`) and its route, and
  the standalone `CarrierAgentCard` component, are **removed** — their
  transition-button logic moves inline into the Agents list rows
  described above.
- **Tenant-side read-only Agents page** (`views/Agents/`) — unchanged in
  shape, consumes the flattened API response (each Agent row already
  carries its own `carrier_id`/`os` directly — no more nested
  `carrier_agents` array).
- `services/AgentService.ts` and `services/TenantAgentService.ts` — types
  and functions updated to the flat shape; `apiCreateAgent`/
  `apiAddCarrierAgent` removed.

## B2 — Onboarding, Admin review, and account-lock gating

### Flow

1. A new User signs up (already fully working, Piece A) and lands on a
   **locked** onboarding screen — the only thing they can do.
2. They fill out a multi-step KYC/RCS-brand form and submit it. This
   creates an `OnboardingRequest` — a **separate** object from any real
   Agent, reviewed by Admin before anything goes live (the same
   review-step-first pattern already used elsewhere: nothing real is
   created until Admin acts).
3. Admin reviews the request. **Reject**: enters a reason; the User sees
   it, edits their form, and resubmits — same Rejected→Draft
   edit-and-resubmit shape as the existing Agent lifecycle. **Approve**:
   Admin also picks which carrier(s)/OS combination(s) to onboard the
   tenant on (out of up to 6 possible) — this is what actually creates
   the Agent rows, starting Draft, ready for the existing transition
   lifecycle.
4. The User stays locked out of the rest of the app until **at least one**
   of their Agents reaches Live — not merely on approval. This reuses
   B1's Tenant-level derived-status aggregation.

### Data model

**New `onboarding_requests` table** — one row per submission:
- `tenant_id` (FK), `status` (`draft`/`submitted`/`approved`/`rejected`).
- Company details: registered company name, company description,
  location, website, GSTIN, PAN, CIN, Udyam registration number, account
  transaction type (stored as a JSON array — multi-select, since "OTP /
  Transactional / Promotional / Multi-use" reads as more than one can
  apply), company address, company phone, company email.
- RCS account section: account/legal name, display name, color,
  description (100 chars).
- Display contact info: phone number, brand contact email, brand website.
- Legal/language info: terms-of-use URL, privacy-policy URL, RCS message
  content languages, RCS opt-in URL.
- Contact person details: industry type, contact person name/designation/
  email (domain email)/mobile number.
- Six nullable file-path columns: brand logo, brand banner, certificate of
  incorporation, PAN document, GST document, other document.
- `rejection_reason` (nullable), `reviewed_by` (nullable FK to the
  reviewing admin User), `reviewed_at` (nullable timestamp).

**File uploads** use Laravel's built-in `Storage` facade against the
**private** `local` disk (`storage/app/private`), not `public` — these are
sensitive KYC documents (PAN, GST, incorporation certificate), so they
must never be reachable via a guessable public URL. Admin's review UI
fetches them through a new `is-admin`-gated download endpoint (e.g. `GET
/admin/onboarding-requests/{id}/documents/{field}`) that streams the file
after confirming the requester is an admin — the same authorization
boundary every other admin-only resource in this app already goes
through, just applied to a file response instead of JSON.

### Backend endpoints

- User-side: `POST /onboarding` (submit or resubmit — the same endpoint,
  branching on whether a request already exists for this tenant), `GET
  /onboarding/mine` (the User's own request, its status, and any
  rejection reason).
- Admin-side (existing `is-admin` middleware group): `GET
  /admin/onboarding-requests` (list), `GET
  /admin/onboarding-requests/{id}` (full detail, all fields + document
  links), `POST /admin/onboarding-requests/{id}/approve` (body: an array
  of `{carrier_id, os}` pairs — creates exactly those Agent rows), `POST
  /admin/onboarding-requests/{id}/reject` (body: `rejection_reason`).

### Account-lock gating

- The shared `userPayload()` helper in `AuthController` (already used by
  `signIn`/`signUp`/`me` so the three response bodies can never drift
  apart) gains a computed `isUnlocked` flag: true if the user `isAdmin`,
  or if their Tenant's derived status (B1) shows at least one Agent Live.
- `AllRoutes.tsx` already branches its active route set on `user.isAdmin`
  — this extends to a three-way branch: admin routes / onboarding-only
  routes (locked) / full tenant routes (unlocked). `getEntryPath()` gets
  the same third branch so a locked user's post-login redirect always
  lands on the onboarding screen.
- A new minimal onboarding-only route config (mirroring the existing
  `adminNavigationConfig`/`adminRoutes.config.ts` pattern) — just the
  onboarding wizard route; no sidebar navigation needed since there's
  nothing else to navigate to while locked.

### Frontend — onboarding wizard

A multi-step form (the `Steps` component, same pattern already used for
Sign-up's 2-step wizard) covering the KYC field groups as steps, with file
inputs for the six documents, submitting to `POST /onboarding`. On
rejection, the same page shows the reason and lets the User edit and
resubmit.

### Frontend — Admin review

A new onboarding-requests list + detail page. List: tenant name, status,
submitted date. Detail: every submitted field, document previews/
downloads, an Approve action (carrier/OS multi-select) and a Reject action
(reason field). This page's job ends once a request is decided — it is
**not** where ongoing bot management happens; once Agent rows exist,
Admin manages them from the global Agents list (B1), never by returning
here.

## Verification

- **B1:** `php artisan migrate:fresh --seed` runs clean; tinker-verify a
  Tenant's `agents()` relation and derived-status aggregation over a
  hand-created set of Agent rows at different statuses; curl the updated
  `/admin/agents`, `/agents` (tenant-side), and the transition endpoint
  end-to-end; `npm run build` + `npx tsc --noEmit` both clean.
- **B2:** full round trip — sign up a fresh User (confirm locked,
  onboarding-only route set via curl/browser), submit the onboarding form
  with file uploads, sign in as Admin and see the request, reject it with
  a reason (confirm the User sees the reason and can resubmit), resubmit,
  approve it picking 2 of the 6 possible carrier/OS combos (confirm
  exactly those Agent rows get created, starting Draft), drive one to
  Live via the existing transition endpoint, confirm the User is now
  unlocked (`/user` shows `isUnlocked: true`, full route set available).
