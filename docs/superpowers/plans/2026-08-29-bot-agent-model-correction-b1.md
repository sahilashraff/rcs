# Bot/Agent Data-Model Correction (B1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the unnecessary parent `Agent` layer built in the earlier Carriers & Agents plan into Tenant-owns-identity + a renamed `Agent` (was `CarrierAgent`) per (carrier × OS), and rework the already-shipped Admin/tenant pages to match — no onboarding yet, that's a separate later plan (B2).

**Architecture:** `tenants` gains `brand_name`/`description`; the old parent `agents` table is dropped; `carrier_agents` is renamed to `agents` with its FK renamed from `agent_id` to `tenant_id`. `CarrierAgent` becomes the new `Agent` model; the old `Agent` model is deleted. `CarrierAgentTransitioner` keeps its exact transition table and guards, only retyped. Admin's per-tenant Agent management collapses into one global, cross-tenant Agents table with inline lifecycle action buttons — no more drilling into a standalone Agent detail page.

**Tech Stack:** Laravel 13 (PHP 8.4, MySQL), React 19 + TypeScript (the `ecme` theme), same stack as every prior plan in this repo.

**Spec:** `docs/superpowers/specs/2026-08-29-bot-agent-model-onboarding-kyc-design.md` (Section "B1 — Data-model correction" — B2 is a separate, later plan).

## Global Constraints

- No automated test code — every task's verification step is a concrete manual command (curl, `artisan tinker`, `mysql`, `npm run build` + `npx tsc --noEmit`), matching this project's established convention.
- Do not add a `Co-Authored-By` / `Claude-Session` trailer to any commit message.
- Do not `git push` as part of any task.
- "Owner" must never appear in new UI copy, code comments, or commit messages.
- Every migration is a NEW file — never edit an already-committed migration in place, matching this project's established convention (every prior plan added new migrations, even for changes to earlier plans' tables).
- Use `migrate:fresh --seed` for verification, not incremental up-migrations preserving data — this is pre-launch dev software with no real user data, matching the standard verification step used throughout every prior plan this session.
- Single-source-of-truth helpers: the derived-status aggregation exists in exactly one place (`Tenant::derivedStatus()`) — no duplicate re-implementation anywhere else.
- New tables/lists use `AdaptiveCard`, `DebouceInput` (that's the actual — typo'd — component name in this codebase, not a typo in this plan), and `DataTable`, matching the pattern already established in `AdminAgents`/`AdminCarriers`.

## Three small, deliberate deviations from the spec's literal wording

Both are noted here so they're traceable, not silent drift — the spec's intent (a clean renamed `Agent` resource, no dead endpoints, no duplicate identity fields) is better served by these than by following the literal text:

1. **`GET /admin/agents/{agent}` (the old `show()` endpoint) is dropped, not kept.** The spec's routes list said to keep it, but that assumed a still-existing Admin Agent Detail page consuming it. Since that page is also being removed (per the spec's own "Frontend" section — one global table replaces it) and the global table's `index()` response already carries every field any consumer needs, `show()` would be dead code with zero callers. Removed instead of kept-but-unused.
2. **The old parent `Agent`'s `name` field is dropped, not moved anywhere.** The spec explicitly moves `brand_name`/`description` to `tenants`, but doesn't address the old `Agent.name` field (a third identity field: an internal admin-facing label, distinct from the customer-facing `brand_name`). Moving it to `tenants` would collide with the column that already exists there (`tenants.name` — the tenant/account name from sign-up, a different concept that happens to share a label). Since the new model assumes one identity per tenant, `tenants.name` (already always set) is sufficient for "what to call this tenant" — no second, confusingly-similar field is added.
3. **The tenant-side Agents page was rebuilt around a single status badge and
   one flat table, not left "unchanged in shape" as the spec's literal text
   said.** The spec assumed the page's existing stats cards, grid item, and
   per-tenant header would carry over untouched, consuming only the
   flattened API response. In practice those components (`AgentsStats.tsx`,
   `AgentGridItem.tsx`, `AgentsHeader.tsx`, `TenantAgentsTableTools.tsx`)
   were built around the old nested `carrier_agents` shape and made
   assumptions (grid-of-cards, per-agent stat tiles) that don't carry over
   cleanly to a flat six-row-max list. Task 5 replaced them with a single
   status tag plus a plain `DataTable`, matching the same pattern already
   used on the Admin side — simpler, and consistent with the rest of this
   plan's UI, at the cost of not being a literal no-op on that page.

---

## Task 1: Backend — migrations

**Files:**
- Create: `backend/database/migrations/2026_08_29_090000_drop_agents_table.php`
- Create: `backend/database/migrations/2026_08_29_090001_add_brand_fields_to_tenants_table.php`
- Create: `backend/database/migrations/2026_08_29_090002_rename_carrier_agents_to_agents.php`

**Interfaces:**
- Consumes: nothing from earlier plans (pure schema change).
- Produces: `tenants.brand_name`/`tenants.description` columns; the `agents` table (renamed from `carrier_agents`, FK column `tenant_id`) — consumed by every later task in this plan.

- [ ] **Step 1: Create the migration that drops the old parent `agents` table**

The old `carrier_agents.agent_id` foreign key points at the old parent `agents` table — that FK must be dropped first, or MySQL will refuse to drop the referenced table.

```bash
cd backend
php artisan make:migration drop_agents_table
```

Rename the generated file to `2026_08_29_090000_drop_agents_table.php` (so its timestamp sorts before the other two migrations in this task) and replace its contents with:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->dropForeign(['agent_id']);
        });

        Schema::dropIfExists('agents');
    }

    public function down(): void
    {
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('brand_name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->foreign('agent_id')->references('id')->on('agents')->cascadeOnDelete();
        });
    }
};
```

- [ ] **Step 2: Create the migration that adds brand fields to `tenants`**

```bash
php artisan make:migration add_brand_fields_to_tenants_table --table=tenants
```

Rename the generated file to `2026_08_29_090001_add_brand_fields_to_tenants_table.php` and replace its contents with:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('brand_name')->nullable()->after('name');
            $table->text('description')->nullable()->after('brand_name');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['brand_name', 'description']);
        });
    }
};
```

- [ ] **Step 3: Create the migration that renames `carrier_agents` to `agents`**

```bash
php artisan make:migration rename_carrier_agents_to_agents
```

Rename the generated file to `2026_08_29_090002_rename_carrier_agents_to_agents.php` and replace its contents with:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->dropUnique(['agent_id', 'carrier_id', 'os']);
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->renameColumn('agent_id', 'tenant_id');
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'carrier_id', 'os']);
        });

        Schema::rename('carrier_agents', 'agents');
    }

    public function down(): void
    {
        Schema::rename('agents', 'carrier_agents');

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'carrier_id', 'os']);
            $table->dropForeign(['tenant_id']);
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->renameColumn('tenant_id', 'agent_id');
        });

        Schema::table('carrier_agents', function (Blueprint $table) {
            $table->unique(['agent_id', 'carrier_id', 'os']);
        });
    }
};
```

Note: `dropForeign(['agent_id'])`/`dropUnique(['agent_id', 'carrier_id', 'os'])` resolve to the conventional constraint names Laravel auto-generated when the original migration created them via `foreignId('agent_id')->constrained()` and `unique(['agent_id', 'carrier_id', 'os'])` — no explicit index name needed.

- [ ] **Step 4: Run the migrations and verify the resulting schema**

```bash
php artisan migrate:fresh
```

Expected: all migrations run cleanly, including the three new ones, with no foreign-key errors.

```bash
php artisan tinker --execute="
dump('tenants columns: ' . implode(',', \Illuminate\Support\Facades\Schema::getColumnListing('tenants')));
dump('agents table exists (renamed from carrier_agents): ' . (\Illuminate\Support\Facades\Schema::hasTable('agents') ? 'yes' : 'no'));
dump('old parent agents-with-name-column gone: ' . (\Illuminate\Support\Facades\Schema::hasColumn('agents', 'brand_name') ? 'STILL THERE (bug)' : 'gone, correct'));
dump('agents.tenant_id exists: ' . (\Illuminate\Support\Facades\Schema::hasColumn('agents', 'tenant_id') ? 'yes' : 'no'));
dump('agents.agent_id gone: ' . (\Illuminate\Support\Facades\Schema::hasColumn('agents', 'agent_id') ? 'STILL THERE (bug)' : 'gone, correct'));
"
```

Expected: `tenants columns` includes `brand_name` and `description`; `agents` table exists; it does NOT have a `brand_name` column (that would mean the old parent table's shape leaked through instead of being replaced by the renamed `carrier_agents`); `tenant_id` exists; `agent_id` is gone.

- [ ] **Step 5: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend/database/migrations
git commit -m "Drop the parent agents table, move brand fields to tenants, rename carrier_agents to agents"
```

---

## Task 2: Backend — models (Tenant, Agent, delete old Agent, retype Transitioner)

**Files:**
- Modify: `backend/app/Models/Tenant.php`
- Delete: `backend/app/Models/Agent.php` (old parent)
- Rename + rewrite: `backend/app/Models/CarrierAgent.php` → `backend/app/Models/Agent.php`
- Modify: `backend/app/Support/CarrierAgentTransitioner.php`

**Interfaces:**
- Consumes: the renamed `agents` table (Task 1).
- Produces: `Tenant::agents(): HasMany`, `Tenant::derivedStatus(): string`, the new `App\Models\Agent` (renamed from `CarrierAgent`, with `tenant()`/`carrier()` relations) — consumed by every later task in this plan.

- [ ] **Step 1: Delete the old parent `Agent` model, then rename `CarrierAgent` into its place**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
rm backend/app/Models/Agent.php
git mv backend/app/Models/CarrierAgent.php backend/app/Models/Agent.php
```

- [ ] **Step 2: Rewrite the (now-renamed) `backend/app/Models/Agent.php`**

Replace its full contents with:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Agent extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'carrier_id',
        'os',
        'carrier_external_id',
        'status',
        'rejection_reason',
        'suspended_by',
        'last_submitted_payload',
        'last_carrier_response',
    ];

    protected function casts(): array
    {
        return [
            'last_submitted_payload' => 'array',
            'last_carrier_response' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class);
    }
}
```

(Only `agent_id` → `tenant_id` in `$fillable`, and the `agent(): BelongsTo` relation renamed to `tenant()` pointing at `Tenant::class` instead of the deleted parent, actually changed — every other field/cast/the `carrier()` relation is byte-for-byte identical to the original `CarrierAgent`.)

- [ ] **Step 3: Update `Tenant.php`**

Replace `backend/app/Models/Tenant.php`'s full contents with:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'brand_name', 'description'];

    protected function casts(): array
    {
        return [
            'is_white_label' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function agents(): HasMany
    {
        return $this->hasMany(Agent::class);
    }

    /**
     * The reseller tenant this tenant was onboarded under, if any.
     * Null means this tenant is top-level (either a direct platform
     * customer, or an approved white-label reseller itself).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'parent_tenant_id');
    }

    /**
     * Sub-tenants onboarded under this tenant's white-labeled domain.
     * Only ever non-empty when is_white_label is true — the hierarchy
     * is capped at one level (see spec).
     */
    public function children(): HasMany
    {
        return $this->hasMany(Tenant::class, 'parent_tenant_id');
    }

    /**
     * Derived from the set of this Tenant's Agent statuses — moved here
     * from the (now-deleted) parent Agent record's derivedStatus(), per
     * the Bot/Agent data-model correction design spec. Not a stored
     * column: agent counts are low-cardinality per tenant, so computing
     * this on read avoids a sync-trigger/materialized-column mismatch.
     * The single source of truth for this aggregation — nothing else
     * re-implements it.
     */
    public function derivedStatus(): string
    {
        $statuses = $this->agents->pluck('status');

        if ($statuses->isEmpty() || $statuses->every(fn ($s) => $s === 'draft')) {
            return 'draft';
        }

        $nonTerminated = $statuses->filter(fn ($s) => $s !== 'terminated');

        if ($nonTerminated->isEmpty()) {
            return 'terminated';
        }

        if ($nonTerminated->contains('live')) {
            return $nonTerminated->every(fn ($s) => $s === 'live') ? 'live' : 'partially_live';
        }

        if ($nonTerminated->contains('suspended')) {
            return 'suspended';
        }

        if ($nonTerminated->contains('submitted')) {
            return 'pending';
        }

        return 'draft';
    }
}
```

- [ ] **Step 4: Retype `CarrierAgentTransitioner`**

Edit `backend/app/Support/CarrierAgentTransitioner.php` — replace its full contents with:

```php
<?php

namespace App\Support;

use App\Models\Agent;
use InvalidArgumentException;

class CarrierAgentTransitioner
{
    /**
     * action => [allowed "from" statuses, resulting status]. The single
     * source of truth for the state-transition table in the design spec —
     * both the transition endpoint and any future real carrier-webhook
     * handler must call through here, so the two ways a status can change
     * never drift apart or duplicate this validation.
     */
    private const TRANSITIONS = [
        'submit' => [['draft'], 'submitted'],
        'approve' => [['submitted'], 'live'], // Approved -> Live is automatic per spec; no intermediate state is ever persisted.
        'reject' => [['submitted'], 'rejected'],
        'resubmit' => [['rejected'], 'draft'],
        'suspend' => [['live'], 'suspended'],
        'reinstate' => [['suspended'], 'live'],
        'terminate' => [['live', 'suspended'], 'terminated'],
    ];

    /**
     * @throws InvalidArgumentException if the action is illegal from the
     *         Agent's current status
     */
    public function transition(Agent $agent, string $action, ?string $rejectionReason = null): Agent
    {
        if (! isset(self::TRANSITIONS[$action])) {
            throw new InvalidArgumentException("Unknown action: {$action}");
        }

        [$allowedFrom, $to] = self::TRANSITIONS[$action];

        if (! in_array($agent->status, $allowedFrom, true)) {
            throw new InvalidArgumentException(
                "Cannot {$action} an Agent with status {$agent->status}.",
            );
        }

        if ($action === 'reinstate' && $agent->suspended_by !== 'admin') {
            throw new InvalidArgumentException(
                'Only an admin-suspended Agent can be reinstated by an admin action.',
            );
        }

        if ($action === 'reject' && ! $rejectionReason) {
            throw new InvalidArgumentException('A rejection_reason is required to reject an Agent.');
        }

        $agent->status = $to;

        if ($action === 'reject') {
            $agent->rejection_reason = $rejectionReason;
        }

        if ($action === 'suspend') {
            $agent->suspended_by = 'admin';
        }

        if ($action === 'reinstate') {
            $agent->suspended_by = null;
        }

        $agent->save();

        return $agent;
    }
}
```

(The class name stays `CarrierAgentTransitioner` per the spec's explicit wording — only the type-hints, variable names, and messages change from `CarrierAgent`/`$carrierAgent` to `Agent`/`$agent`. The `TRANSITIONS` table and every guard condition are byte-for-byte the same logic as before.)

- [ ] **Step 5: Verify in tinker**

```bash
cd backend
php artisan tinker --execute="
\$tenant = App\Models\Tenant::create(['name' => 'Model Test Tenant', 'brand_name' => 'Test Brand', 'description' => 'Test description']);
\$jio = App\Models\Carrier::where('code', 'jio')->first();
\$agent1 = \$tenant->agents()->create(['carrier_id' => \$jio->id, 'os' => 'android']);
\$agent2 = \$tenant->agents()->create(['carrier_id' => \$jio->id, 'os' => 'ios']);
dump('tenant->agents count: ' . \$tenant->agents()->count());
dump('agent1->tenant->name: ' . \$agent1->tenant->name);
dump('agent1->carrier->code: ' . \$agent1->carrier->code);
dump('derivedStatus (all draft): ' . \$tenant->fresh()->derivedStatus());

\$t = new App\Support\CarrierAgentTransitioner();
\$t->transition(\$agent1, 'submit');
\$t->transition(\$agent1, 'approve');
dump('derivedStatus (1 live, 1 draft): ' . \$tenant->fresh()->derivedStatus());

\$agent2->delete();
\$agent1->delete();
\$tenant->delete();
"
```

Expected: `tenant->agents count: 2`; `agent1->tenant->name: Model Test Tenant`; `agent1->carrier->code: jio`; first `derivedStatus`: `draft`; second `derivedStatus` (after agent1 reaches live, agent2 still draft): `partially_live`.

- [ ] **Step 6: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend/app/Models backend/app/Support
git commit -m "Collapse Agent/CarrierAgent into Tenant-owns-identity + renamed Agent per (carrier, os)"
```

---

## Task 3: Backend — controllers, routes, seeder

**Files:**
- Modify: `backend/app/Http/Controllers/Api/AgentController.php`
- Modify: `backend/app/Http/Controllers/Api/CarrierAgentController.php`
- Modify: `backend/app/Http/Controllers/Api/TenantAgentController.php`
- Modify: `backend/routes/api.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Consumes: `App\Models\Agent`, `App\Models\Tenant::derivedStatus()`, `App\Support\CarrierAgentTransitioner` (Task 2).
- Produces: `GET /admin/agents` (flat, cross-tenant), `POST /admin/agents/{agent}/transition`, `GET /agents` (tenant-side, flat + aggregate status) — consumed by Tasks 4 and 5's frontend.

- [ ] **Step 1: Rewrite `AgentController`**

Replace `backend/app/Http/Controllers/Api/AgentController.php`'s full contents with:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;

class AgentController extends Controller
{
    public function index()
    {
        $agents = Agent::with('tenant', 'carrier')->get();

        $data = $agents->map(fn (Agent $agent) => [
            'id' => $agent->id,
            'tenant_id' => $agent->tenant_id,
            'tenant_name' => $agent->tenant->name,
            'brand_name' => $agent->tenant->brand_name,
            'carrier_id' => $agent->carrier_id,
            'carrier_code' => $agent->carrier->code,
            'carrier_name' => $agent->carrier->name,
            'os' => $agent->os,
            'status' => $agent->status,
            'carrier_external_id' => $agent->carrier_external_id,
            'rejection_reason' => $agent->rejection_reason,
            'suspended_by' => $agent->suspended_by,
        ]);

        return response()->json(['data' => $data]);
    }
}
```

(`store()` and `show()` are both removed — `store()` per the spec's "manual creation removed entirely" decision, `show()` because nothing consumes it once the standalone Agent Detail page is gone (Task 4) and `index()` already carries every field any consumer needs.)

- [ ] **Step 2: Rewrite `CarrierAgentController`**

Replace `backend/app/Http/Controllers/Api/CarrierAgentController.php`'s full contents with:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Support\CarrierAgentTransitioner;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class CarrierAgentController extends Controller
{
    public function transition(Request $request, Agent $agent, CarrierAgentTransitioner $transitioner)
    {
        $data = $request->validate([
            'action' => ['required', 'string'],
            'rejection_reason' => ['nullable', 'string'],
        ]);

        try {
            $updated = $transitioner->transition($agent, $data['action'], $data['rejection_reason'] ?? null);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['action' => $e->getMessage()]);
        }

        return response()->json(['data' => $updated]);
    }
}
```

(`store()` — the old "add a carrier registration to an existing Agent" endpoint — is removed per the spec; carrier/OS registration now only ever happens via the future onboarding-approval flow, B2.)

- [ ] **Step 3: Rewrite `TenantAgentController`**

Replace `backend/app/Http/Controllers/Api/TenantAgentController.php`'s full contents with:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantAgentController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant()->with('agents.carrier')->first();

        return response()->json([
            'data' => [
                'status' => $tenant->derivedStatus(),
                'agents' => $tenant->agents->map(fn ($agent) => [
                    'id' => $agent->id,
                    'carrier_name' => $agent->carrier->name,
                    'os' => $agent->os,
                    'status' => $agent->status,
                ]),
            ],
        ]);
    }
}
```

(`Tenant::derivedStatus()` is called here as the single source of truth for the aggregate status — this method does not re-implement that aggregation itself.)

- [ ] **Step 4: Update routes**

Edit `backend/routes/api.php` — replace the `is-admin` group's agent-related lines and the tenant-side `/agents` line:

```php
Route::middleware('is-admin')->group(function () {
    Route::get('/admin/ping', [PingController::class, 'admin']);
    Route::get('/admin/tenants', [TenantController::class, 'index']);
    Route::get('/admin/carriers', [CarrierController::class, 'index']);
    Route::post('/admin/carriers', [CarrierController::class, 'store']);
    Route::put('/admin/carriers/{carrier}', [CarrierController::class, 'update']);
    Route::get('/admin/agents', [AgentController::class, 'index']);
    Route::post('/admin/agents/{agent}/transition', [CarrierAgentController::class, 'transition']);
    Route::get('/admin/settings', [AdminSettingController::class, 'index']);
    Route::put('/admin/settings', [AdminSettingController::class, 'update']);
});
```

(Removed: `POST /admin/agents` (old `store`), `GET /admin/agents/{agent}` (old `show`), `POST /admin/agents/{agent}/carrier-agents` (old carrier-registration `store`), and the old `POST /admin/carrier-agents/{carrierAgent}/transition` path — replaced by `POST /admin/agents/{agent}/transition`, keeping the whole API surface free of leftover "carrier-agents" wording now that the resource is just `Agent`.)

The tenant-side `GET /agents` line (inside the existing `auth:sanctum` group, gated by `can:access-feature,"agents"`) does not need to change — it already points at `TenantAgentController::index`, which was rewritten in Step 3.

- [ ] **Step 5: Update the seeder — brand fields on the Demo Tenant, one seeded Live Agent**

Edit `backend/database/seeders/DatabaseSeeder.php`:

Add the import:

```php
use App\Models\Agent;
```

Change the Demo Tenant creation line:

```php
        $tenant = Tenant::create([
            'name' => 'Demo Tenant',
            'brand_name' => 'Demo Support',
            'description' => 'Demo tenant seeded for local development.',
        ]);
```

(was: `$tenant = Tenant::create(['name' => 'Demo Tenant']);`)

Add this at the very end of `run()`, after the existing `foreach` loop that seeds the three carriers:

```php
        Agent::create([
            'tenant_id' => $tenant->id,
            'carrier_id' => Carrier::where('code', 'jio')->first()->id,
            'os' => 'android',
            'status' => 'live',
        ]);
```

This keeps `owner@rbm.local` unlocked out of the box once account-lock gating is introduced in the later B2 plan — without it, every fresh `migrate:fresh --seed` would leave the primary demo/dev account locked out of the app it's meant to demo.

- [ ] **Step 6: Run migrate:fresh --seed and verify with curl**

```bash
cd backend
php artisan migrate:fresh --seed
```

Expected: seeder completes with no errors.

```bash
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
USER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

echo "--- Global Admin Agents list (expect 1 row, Demo Tenant, Jio, android, live) ---"
curl -s http://127.0.0.1:8000/api/admin/agents -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo "--- Tenant-side Agents view (expect status: live, 1 agent) ---"
curl -s http://127.0.0.1:8000/api/agents -H "Authorization: Bearer $USER_TOKEN"
echo ""

echo "--- Old removed routes now 404/405 ---"
curl -s -o /dev/null -w "POST /admin/agents: %{http_code}\n" -X POST http://127.0.0.1:8000/api/admin/agents -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{}'

echo "--- Full lifecycle via the new transition route: create a second (draft) agent, drive it through submit/approve ---"
php artisan tinker --execute="
\$tenant = App\Models\Tenant::first();
\$vi = App\Models\Carrier::where('code', 'vi')->first();
\$agent = \$tenant->agents()->create(['carrier_id' => \$vi->id, 'os' => 'ios']);
echo \$agent->id;
" > /tmp/new_agent_id.txt
NEW_AGENT_ID=$(tail -1 /tmp/new_agent_id.txt)
echo "New agent id: $NEW_AGENT_ID"

curl -s -X POST "http://127.0.0.1:8000/api/admin/agents/$NEW_AGENT_ID/transition" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"action":"submit"}'
echo ""
curl -s -X POST "http://127.0.0.1:8000/api/admin/agents/$NEW_AGENT_ID/transition" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"action":"approve"}'
echo ""

echo "--- Tenant-side aggregate status should now be partially_live (1 live, 1... wait, both live now, so full live). Re-verify ---"
curl -s http://127.0.0.1:8000/api/agents -H "Authorization: Bearer $USER_TOKEN"
echo ""

kill "$BACKEND_PID" 2>/dev/null
```

Expected: global Admin Agents list shows the seeded row with `tenant_name: "Demo Tenant"`, `brand_name: "Demo Support"`, `carrier_name: "Jio"`, `os: "android"`, `status: "live"`; tenant-side view shows `status: "live"`, one agent; the removed `POST /admin/agents` returns `404`/`405` (route no longer exists); the new agent's `submit`→`approve` sequence succeeds via the new `/admin/agents/{agent}/transition` path; the tenant-side view afterward shows `status: "live"` with 2 agents (both now live).

- [ ] **Step 7: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Update Agent/CarrierAgent controllers, routes, and seeder for the renamed model"
```

---

## Task 4: Frontend — Admin Agents global table with inline actions

**Files:**
- Delete: `frontend/src/views/AdminAgentDetail/` (entire directory — `AdminAgentDetail.tsx`, `index.tsx`, `components/AddCarrierAgentDialog.tsx`, `components/CarrierAgentCard.tsx`)
- Delete: `frontend/src/views/AdminAgents/components/CreateAgentDialog.tsx`
- Delete: `frontend/src/views/AdminAgents/components/AgentListActionTools.tsx` (had exactly one purpose — the now-removed "Create Agent" button — nothing left to render)
- Create: `frontend/src/views/AdminAgents/components/AgentActionsCell.tsx`
- Modify: `frontend/src/views/AdminAgents/AdminAgents.tsx`
- Modify: `frontend/src/views/AdminAgents/components/AgentListTable.tsx`
- Modify: `frontend/src/views/AdminAgents/components/AgentListTableTools.tsx`
- Modify: `frontend/src/services/AgentService.ts`
- Modify: `frontend/src/configs/routes.config/adminRoutes.config.ts`

**Interfaces:**
- Consumes: `GET /admin/agents`, `POST /admin/agents/{agent}/transition` (Task 3).
- Produces: nothing consumed elsewhere in this plan — this is the terminal Admin-side deliverable.

- [ ] **Step 1: Delete the removed files**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
rm -rf frontend/src/views/AdminAgentDetail
rm frontend/src/views/AdminAgents/components/CreateAgentDialog.tsx
rm frontend/src/views/AdminAgents/components/AgentListActionTools.tsx
```

- [ ] **Step 2: Rewrite `AgentService.ts`**

Replace `frontend/src/services/AgentService.ts`'s full contents with:

```ts
import ApiService from './ApiService'

export type AgentSummary = {
    id: number
    tenant_id: number
    tenant_name: string
    brand_name: string | null
    carrier_id: number
    carrier_code: string
    carrier_name: string
    os: 'android' | 'ios'
    status: string
    carrier_external_id: string | null
    rejection_reason: string | null
    suspended_by: 'admin' | 'carrier' | null
}

export async function apiGetAgents() {
    return ApiService.fetchDataWithAxios<{ data: AgentSummary[] }>({
        url: '/admin/agents',
        method: 'get',
    })
}

export async function apiTransitionAgent(
    agentId: number,
    action: string,
    rejectionReason?: string,
) {
    return ApiService.fetchDataWithAxios<{ data: AgentSummary }>({
        url: `/admin/agents/${agentId}/transition`,
        method: 'post',
        data: { action, rejection_reason: rejectionReason },
    })
}
```

- [ ] **Step 3: Create `AgentActionsCell.tsx`**

This mirrors the old `CarrierAgentCard`'s status-to-actions mapping verbatim (the exact same legal-transition rules already reviewed and approved in the earlier Carriers & Agents plan), adapted from a standalone card to a compact per-row cell.

Create `frontend/src/views/AdminAgents/components/AgentActionsCell.tsx`:

```tsx
import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { AgentSummary } from '@/services/AgentService'

type AgentActionsCellProps = {
    agent: AgentSummary
    onTransition: (
        agentId: number,
        action: string,
        rejectionReason?: string,
    ) => Promise<void>
}

const STATIC_ACTIONS_BY_STATUS: Record<string, { action: string; label: string }[]> = {
    draft: [{ action: 'submit', label: 'Submit' }],
    submitted: [
        { action: 'approve', label: 'Approve' },
        { action: 'reject', label: 'Reject' },
    ],
    rejected: [{ action: 'resubmit', label: 'Back to Draft' }],
    live: [
        { action: 'suspend', label: 'Suspend' },
        { action: 'terminate', label: 'Terminate' },
    ],
    suspended: [{ action: 'terminate', label: 'Terminate' }],
    terminated: [],
}

const AgentActionsCell = ({ agent, onTransition }: AgentActionsCellProps) => {
    const [pendingAction, setPendingAction] = useState<string | null>(null)

    // Reinstate is legal only when suspended_by === 'admin' — computed
    // separately since it depends on more than just status.
    const actions = [...(STATIC_ACTIONS_BY_STATUS[agent.status] ?? [])]
    if (agent.status === 'suspended' && agent.suspended_by === 'admin') {
        actions.unshift({ action: 'reinstate', label: 'Reinstate' })
    }

    const handleClick = async (action: string) => {
        if (action === 'reject') {
            const reason = window.prompt('Rejection reason:')
            if (!reason) return
            setPendingAction(action)
            try {
                await onTransition(agent.id, action, reason)
            } finally {
                setPendingAction(null)
            }
            return
        }

        setPendingAction(action)
        try {
            await onTransition(agent.id, action)
        } finally {
            setPendingAction(null)
        }
    }

    if (actions.length === 0) {
        return <span className="text-xs text-gray-400">No actions</span>
    }

    return (
        <div className="flex items-center justify-end gap-2">
            {actions.map(({ action, label }) => (
                <Button
                    key={action}
                    size="sm"
                    variant="default"
                    loading={pendingAction === action}
                    onClick={() => handleClick(action)}
                >
                    {label}
                </Button>
            ))}
        </div>
    )
}

export default AgentActionsCell
```

- [ ] **Step 4: Rewrite `AgentListTable.tsx`**

Replace `frontend/src/views/AdminAgents/components/AgentListTable.tsx`'s full contents with:

```tsx
import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'
import DataTable from '@/components/shared/DataTable'
import AgentActionsCell from './AgentActionsCell'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { AgentSummary } from '@/services/AgentService'

type AgentListTableProps = {
    agents: AgentSummary[]
    isLoading: boolean
    onTransition: (
        agentId: number,
        action: string,
        rejectionReason?: string,
    ) => Promise<void>
}

const statusTagClasses: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    submitted: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    suspended: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    terminated: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800',
}

const AgentListTable = ({ agents, isLoading, onTransition }: AgentListTableProps) => {
    const columns: ColumnDef<AgentSummary>[] = useMemo(
        () => [
            {
                header: 'Tenant',
                accessorKey: 'tenant_name',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div>
                            <div className="font-bold heading-text">{row.tenant_name}</div>
                            {row.brand_name && (
                                <div className="text-xs text-gray-500">{row.brand_name}</div>
                            )}
                        </div>
                    )
                },
            },
            {
                header: 'Carrier',
                accessorKey: 'carrier_name',
            },
            {
                header: 'OS',
                accessorKey: 'os',
                cell: (props) => (
                    <span className="capitalize">{props.row.original.os}</span>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (props) => {
                    const row = props.row.original
                    const tagClass = statusTagClasses[row.status] || statusTagClasses.draft
                    return (
                        <Tag className={`text-xs font-semibold capitalize border ${tagClass}`}>
                            {row.status}
                        </Tag>
                    )
                },
            },
            {
                header: '',
                id: 'actions',
                cell: (props) => (
                    <AgentActionsCell
                        agent={props.row.original}
                        onTransition={onTransition}
                    />
                ),
            },
        ],
        [onTransition],
    )

    return (
        <DataTable
            columns={columns}
            data={agents}
            loading={isLoading}
            noData={agents.length === 0}
        />
    )
}

export default AgentListTable
```

- [ ] **Step 5: Update `AgentListTableTools.tsx`'s status options**

The old aggregate-only statuses (`pending`, `partially_live`) never apply to a single flat Agent row — those were derived-status concepts that only ever existed at the old parent-Agent (now Tenant) level. Each row here only ever has one of the six real transitioner states.

Edit `frontend/src/views/AdminAgents/components/AgentListTableTools.tsx`, replacing the `statusOptions` array:

```ts
const statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Live', value: 'live' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Terminated', value: 'terminated' },
]
```

- [ ] **Step 6: Rewrite `AdminAgents.tsx`**

Replace `frontend/src/views/AdminAgents/AdminAgents.tsx`'s full contents with:

```tsx
import { useEffect, useState, useCallback, useMemo } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import AgentListTableTools from './components/AgentListTableTools'
import AgentListTable from './components/AgentListTable'
import { apiGetAgents, apiTransitionAgent } from '@/services/AgentService'
import type { AgentSummary } from '@/services/AgentService'

const AdminAgents = () => {
    const [agents, setAgents] = useState<AgentSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const resp = await apiGetAgents()
            setAgents(resp.data || [])
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Agents">
                    {error?.response?.data?.message || 'Failed to fetch agents.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleTransition = async (
        agentId: number,
        action: string,
        rejectionReason?: string,
    ) => {
        try {
            await apiTransitionAgent(agentId, action, rejectionReason)
            toast.push(
                <Notification type="success" title="Status Updated">
                    Agent transitioned via <strong>{action}</strong>.
                </Notification>,
                { placement: 'top-center' },
            )
            await loadData()
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Transition Failed">
                    {error?.response?.data?.message || 'Could not update status.'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const filteredAgents = useMemo(() => {
        return agents.filter((agent) => {
            const query = searchQuery.toLowerCase().trim()
            const matchesQuery =
                !query ||
                agent.tenant_name.toLowerCase().includes(query) ||
                (agent.brand_name?.toLowerCase().includes(query) ?? false) ||
                agent.carrier_name.toLowerCase().includes(query)

            if (!matchesQuery) return false

            if (statusFilter !== 'all' && agent.status !== statusFilter) {
                return false
            }

            return true
        })
    }, [agents, searchQuery, statusFilter])

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <h3>Agents</h3>
                    </div>

                    <AgentListTableTools
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                    />

                    <AgentListTable
                        agents={filteredAgents}
                        isLoading={isLoading}
                        onTransition={handleTransition}
                    />
                </div>
            </AdaptiveCard>
        </Container>
    )
}

export default AdminAgents
```

- [ ] **Step 7: Remove the deleted `admin.agents.detail` route**

Edit `frontend/src/configs/routes.config/adminRoutes.config.ts`, deleting this entry entirely (the `admin.agents` entry directly above it, and everything else, stays untouched):

```ts
    {
        key: 'admin.agents.detail',
        path: '/admin/agents/:id',
        component: lazy(() => import('@/views/AdminAgentDetail')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
```

- [ ] **Step 8: Verify the build and typecheck**

```bash
cd frontend
npm run build 2>&1 | tail -10
npx tsc --noEmit
```

Expected: `npm run build` completes with zero errors; `npx tsc --noEmit` exits 0 with no output (no stray references to the deleted `AdminAgentDetail`/`CreateAgentDialog`/`CarrierAgentCard`/`AgentListActionTools`).

- [ ] **Step 9: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Rework Admin Agents into one global cross-tenant table with inline lifecycle actions"
```

---

## Task 5: Frontend — tenant-side Agents page

**Files:**
- Delete: `frontend/src/views/Agents/components/AgentsStats.tsx`
- Delete: `frontend/src/views/Agents/components/AgentGridItem.tsx`
- Delete: `frontend/src/views/Agents/components/AgentsHeader.tsx`
- Delete: `frontend/src/views/Agents/components/TenantAgentsTableTools.tsx`
- Modify: `frontend/src/views/Agents/Agents.tsx`
- Modify: `frontend/src/views/Agents/components/TenantAgentsTable.tsx`
- Modify: `frontend/src/services/TenantAgentService.ts`

**Interfaces:**
- Consumes: `GET /agents` (Task 3).
- Produces: nothing consumed elsewhere in this plan — terminal tenant-side deliverable.

**Scope note:** the tenant-side page previously showed a grid/table toggle, four stat cards, and rich per-bot cards with static "Supported Bot Features" badges — all built around the old nested shape (one Agent "bot" with many `carrier_agents` underneath). Under the corrected flat model there is no more nesting to summarize that way: each row IS one specific carrier+OS registration. Reworking that UI to honestly reflect the new shape, rather than keeping decorative elements that no longer correspond to real data, means simplifying down to one status summary plus one flat table — this is a deliberate scope decision for this task, not an oversight.

- [ ] **Step 1: Delete the components that no longer fit the flat data shape**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
rm frontend/src/views/Agents/components/AgentsStats.tsx
rm frontend/src/views/Agents/components/AgentGridItem.tsx
rm frontend/src/views/Agents/components/AgentsHeader.tsx
rm frontend/src/views/Agents/components/TenantAgentsTableTools.tsx
```

- [ ] **Step 2: Rewrite `TenantAgentService.ts`**

Replace `frontend/src/services/TenantAgentService.ts`'s full contents with:

```ts
import ApiService from './ApiService'

export type TenantAgentEntry = {
    id: number
    carrier_name: string
    os: 'android' | 'ios'
    status: string
}

export type TenantAgents = {
    status: string
    agents: TenantAgentEntry[]
}

export async function apiGetTenantAgents() {
    return ApiService.fetchDataWithAxios<{ data: TenantAgents }>({
        url: '/agents',
        method: 'get',
    })
}
```

- [ ] **Step 3: Rewrite `TenantAgentsTable.tsx`**

Replace `frontend/src/views/Agents/components/TenantAgentsTable.tsx`'s full contents with:

```tsx
import { useMemo } from 'react'
import Tag from '@/components/ui/Tag'
import DataTable from '@/components/shared/DataTable'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { TenantAgentEntry } from '@/services/TenantAgentService'

type TenantAgentsTableProps = {
    agents: TenantAgentEntry[]
    isLoading: boolean
}

const statusTagClasses: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    submitted: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    suspended: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    terminated: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800',
}

const TenantAgentsTable = ({ agents, isLoading }: TenantAgentsTableProps) => {
    const columns: ColumnDef<TenantAgentEntry>[] = useMemo(
        () => [
            {
                header: 'Carrier',
                accessorKey: 'carrier_name',
            },
            {
                header: 'OS',
                accessorKey: 'os',
                cell: (props) => (
                    <span className="capitalize">{props.row.original.os}</span>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (props) => {
                    const row = props.row.original
                    const tagClass = statusTagClasses[row.status] || statusTagClasses.draft
                    return (
                        <Tag className={`text-xs font-semibold capitalize border ${tagClass}`}>
                            {row.status}
                        </Tag>
                    )
                },
            },
        ],
        [],
    )

    return (
        <DataTable
            columns={columns}
            data={agents}
            loading={isLoading}
            noData={agents.length === 0}
        />
    )
}

export default TenantAgentsTable
```

- [ ] **Step 4: Rewrite `Agents.tsx`**

Replace `frontend/src/views/Agents/Agents.tsx`'s full contents with:

```tsx
import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import TenantAgentsTable from './components/TenantAgentsTable'
import { apiGetTenantAgents } from '@/services/TenantAgentService'
import type { TenantAgents } from '@/services/TenantAgentService'

const statusTagClasses: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    partially_live: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    pending: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    suspended: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    terminated: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800',
}

const Agents = () => {
    const [data, setData] = useState<TenantAgents | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        apiGetTenantAgents()
            .then((resp) => setData(resp.data))
            .catch((error: any) => {
                toast.push(
                    <Notification type="danger" title="Error Loading Agents">
                        {error?.response?.data?.message || 'Failed to fetch agents.'}
                    </Notification>,
                    { placement: 'top-center' },
                )
            })
            .finally(() => setIsLoading(false))
    }, [])

    const agents = data?.agents ?? []
    const tagClass = data
        ? statusTagClasses[data.status] || statusTagClasses.draft
        : statusTagClasses.draft

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <h3 className="heading-text">Agents</h3>
                            <p className="text-gray-500 text-xs mt-0.5">
                                Your carrier registrations and their current status.
                            </p>
                        </div>
                        {data && (
                            <Tag className={`text-xs font-semibold capitalize border ${tagClass}`}>
                                {data.status.replace('_', ' ')}
                            </Tag>
                        )}
                    </div>

                    <TenantAgentsTable agents={agents} isLoading={isLoading} />
                </div>
            </AdaptiveCard>
        </Container>
    )
}

export default Agents
```

- [ ] **Step 5: Verify the build and typecheck**

```bash
cd frontend
npm run build 2>&1 | tail -10
npx tsc --noEmit
```

Expected: `npm run build` completes with zero errors; `npx tsc --noEmit` exits 0 with no output.

- [ ] **Step 6: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Simplify tenant-side Agents page to the corrected flat per-registration shape"
```

---

## Task 6: End-to-end verification

**Files:** none created — this task only verifies Tasks 1-5 work together.

- [ ] **Step 1: Full backend + frontend round trip**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/backend
php artisan migrate:fresh --seed
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 4

cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/backend

ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
USER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

echo "--- Admin global Agents list (seeded row present) ---"
curl -s http://127.0.0.1:8000/api/admin/agents -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo "--- Tenant-side Agents view (locked-out gating doesn't exist yet — B2 — but the read-only data must already be correct) ---"
curl -s http://127.0.0.1:8000/api/agents -H "Authorization: Bearer $USER_TOKEN"
echo ""

echo "--- Frontend dev server responds ---"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/

kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
```

Expected: Admin's global list shows the seeded Jio/android/live row for Demo Tenant; tenant-side view shows the same data from the tenant's own perspective; frontend responds `200`.

- [ ] **Step 2: Manual browser check (describe to the user, no browser driver in this session)**

Sign in as `admin@rbm.local` — the Agents nav item now leads to one table listing every tenant's agents platform-wide, with action buttons (Submit/Approve/Reject/Suspend/Reinstate/Terminate, whichever are legal for that row's status) right in each row — clicking one updates that row in place, no navigation to a separate detail page. Confirm the search box and status filter both work against the flat list.

Sign in as `owner@rbm.local` — the Agents nav item shows a status badge ("Live") at the top and a simple table below listing the tenant's own carrier registrations (Jio, Android, Live) — no create/edit controls anywhere on the page.

- [ ] **Step 3: Report to the user**

Summarize: the parent `Agent`/"Bot" table is gone; `tenants` now owns the shared identity (`brand_name`/`description`); the renamed `Agent` model (was `CarrierAgent`) belongs directly to `Tenant`, one row per (carrier × OS); Admin manages every tenant's agents from one global table with inline lifecycle actions, no more standalone detail page; the tenant-side page shows the same corrected flat shape. Three small, documented deviations from the spec's literal text (dropping the unused `show()` endpoint, dropping the old `Agent.name` field instead of duplicating `tenants.name`, rebuilding the tenant-side Agents page around a single status tag and flat table) are called out in this plan's header for traceability. `git push` remains a separate, explicit step. B2 (onboarding/KYC, Admin review, account-lock gating) is next, as its own plan, once this is confirmed working.

## Note for future migrations against `agents`

Every index and foreign-key constraint on the renamed `agents` table still
carries the old `carrier_agents_` name prefix (e.g.
`carrier_agents_tenant_id_carrier_id_os_unique`,
`carrier_agents_tenant_id_foreign`) — `Schema::rename()` does not rename
constraint names, only the table. A future migration that calls
`$table->dropUnique(['tenant_id', 'carrier_id', 'os'])` or
`$table->dropForeign(['tenant_id'])` using bare column-name inference will
compute an `agents_...`-prefixed name and fail, since the actual stored name
is still `carrier_agents_...`-prefixed. Pass the literal current name
(`$table->dropUnique('carrier_agents_tenant_id_carrier_id_os_unique')`, etc.)
until/unless a migration explicitly renames these constraints.
