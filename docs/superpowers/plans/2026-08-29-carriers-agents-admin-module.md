# Carriers & Agents Admin Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give platform Admin a working Carriers & Agents module — Admin creates/manages tenants' Agents and drives each per-carrier `CarrierAgent` registration through its lifecycle; tenant User gets a read-only view of their own agents.

**Architecture:** Three new tables (`carriers`, `agents`, `carrier_agents`) with `carrier` modeled as a real table (not a hardcoded enum) and `carrier_agents` keyed on `(agent_id, carrier_id, os)`. One `CarrierAgentTransitioner` service is the single place a `CarrierAgent`'s status ever changes, enforcing the approved state-transition table. Admin-only backend routes sit behind the existing `is-admin` middleware; the tenant-side read-only route reuses the existing `owner_only` feature-registry pattern. No real carrier API calls in this pass — every status change is an explicit Admin action.

**Tech Stack:** Laravel 13 (PHP 8.4, MySQL), React 19 + TypeScript (the `ecme` theme), same stack as Plans 1-2.

**Spec:** `docs/superpowers/specs/2026-08-27-super-admin-carriers-agents-permissions-design.md` (Section 1 — Carriers & Agents; Section 2, Permissions, is already implemented from Plan 1).

## Global Constraints

- No automated test code in this pass — every task's verification step is a concrete manual command (curl, `artisan tinker`, `mysql`, `npm run build`), matching this project's established convention.
- Do not add a `Co-Authored-By` / `Claude-Session` trailer to any commit message.
- Do not `git push` as part of any task.
- "Owner" must never appear in new UI copy, code comments, or commit messages — say "Admin" or "User" as appropriate (spec's Terminology rule, carried forward from Plan 2).
- **No real carrier API calls.** `CarrierAgentAdapter` is not implemented in this pass — every `CarrierAgent` status change is an explicit Admin action via the transition endpoint, never an HTTP call to Jio/VI/Airtel.
- **No RateCard CRUD.** Not built in this pass — see spec's Non-goals.
- DB credentials are in `backend/.env` (gitignored). Any command needing them reads via shell substitution (`` $(grep DB_USERNAME backend/.env | cut -d= -f2) ``) — never re-embed the raw password as a literal string.
- Backend runs on `http://127.0.0.1:8000` (`php artisan serve`), frontend on `http://localhost:5173` (`npm run dev`) — same as Plans 1-2.

---

## Task 1: Backend — data model (carriers, agents, carrier_agents)

**Files:**
- Create: `backend/database/migrations/xxxx_create_carriers_table.php`
- Create: `backend/database/migrations/xxxx_create_agents_table.php`
- Create: `backend/database/migrations/xxxx_create_carrier_agents_table.php`
- Create: `backend/app/Models/Carrier.php`
- Create: `backend/app/Models/Agent.php`
- Create: `backend/app/Models/CarrierAgent.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Consumes: nothing from earlier plans (new tables, independent of `users`/`tenants` beyond the `tenant_id` FK).
- Produces: `Carrier`, `Agent`, `CarrierAgent` Eloquent models and their tables — consumed by every later task in this plan.

- [ ] **Step 1: Create the `carriers` migration**

```bash
cd backend
php artisan make:migration create_carriers_table
```

Replace the generated file's contents with:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carriers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('country');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carriers');
    }
};
```

- [ ] **Step 2: Create the `agents` migration**

```bash
php artisan make:migration create_agents_table
```

Replace the generated file's contents with:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('brand_name');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agents');
    }
};
```

`foreignId('tenant_id')->constrained()` already creates the index MySQL needs for that foreign key — no separate `$table->index('tenant_id')` call, same reasoning as Plan 2's tenant-hierarchy migration.

- [ ] **Step 3: Create the `carrier_agents` migration**

```bash
php artisan make:migration create_carrier_agents_table
```

Replace the generated file's contents with:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carrier_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained()->cascadeOnDelete();
            $table->foreignId('carrier_id')->constrained()->restrictOnDelete();
            $table->enum('os', ['android', 'ios'])->default('android');
            $table->string('carrier_external_id')->nullable();
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'live', 'suspended', 'terminated'])->default('draft');
            $table->text('rejection_reason')->nullable();
            $table->enum('suspended_by', ['admin', 'carrier'])->nullable();
            $table->json('last_submitted_payload')->nullable();
            $table->json('last_carrier_response')->nullable();
            $table->timestamps();

            $table->unique(['agent_id', 'carrier_id', 'os']);
            $table->unique(['carrier_id', 'carrier_external_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carrier_agents');
    }
};
```

`os` is non-nullable with a concrete default (`android`) specifically so `UNIQUE(agent_id, carrier_id, os)` actually blocks a duplicate — a nullable column here would let MySQL silently accept two "default" registrations for the same agent+carrier, since `NULL <> NULL` for uniqueness purposes. `carrier_external_id` staying nullable is fine for its own unique index: most rows start without one, and MySQL doesn't enforce uniqueness among NULLs, which is exactly the desired behavior (uniqueness only matters once a real external id is set).

- [ ] **Step 4: Create the `Carrier` model**

Create `backend/app/Models/Carrier.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Carrier extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'country', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function carrierAgents(): HasMany
    {
        return $this->hasMany(CarrierAgent::class);
    }
}
```

- [ ] **Step 5: Create the `Agent` model**

Create `backend/app/Models/Agent.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agent extends Model
{
    use HasFactory;

    protected $fillable = ['tenant_id', 'name', 'brand_name', 'description'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function carrierAgents(): HasMany
    {
        return $this->hasMany(CarrierAgent::class);
    }

    /**
     * Derived from the set of this Agent's CarrierAgent statuses — see
     * the design spec's "Derived Agent.status" table. Not a stored
     * column: agent counts are low-cardinality per tenant, so computing
     * this on read avoids a sync-trigger/materialized-column mismatch.
     */
    public function derivedStatus(): string
    {
        $statuses = $this->carrierAgents->pluck('status');

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

        // 'rejected'-only has no explicit rule in the spec's derived-status
        // table — treated as draft-equivalent since the lifecycle always
        // re-enters Draft from Rejected (not a resting end state).
        return 'draft';
    }
}
```

- [ ] **Step 6: Create the `CarrierAgent` model**

Create `backend/app/Models/CarrierAgent.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarrierAgent extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
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

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class);
    }
}
```

- [ ] **Step 7: Seed the three launch carriers**

Edit `backend/database/seeders/DatabaseSeeder.php` — add the `Carrier` import and seed the three carriers at the end of `run()`:

```php
use App\Models\Carrier;
```

```php
        foreach ([
            ['code' => 'jio', 'name' => 'Jio', 'country' => 'IN'],
            ['code' => 'vi', 'name' => 'Vi', 'country' => 'IN'],
            ['code' => 'airtel', 'name' => 'Airtel', 'country' => 'IN'],
        ] as $carrier) {
            Carrier::create($carrier);
        }
```

(Mass-assignment is safe here — `Carrier` has no privilege-sensitive fields, unlike `User`/`Tenant`.)

- [ ] **Step 8: Run migrations, re-seed, verify relations in tinker**

```bash
php artisan migrate:fresh --seed
```

Expected: all migrations run cleanly, seeder completes with no errors, 3 carriers created.

```bash
php artisan tinker --execute="
\$tenant = App\Models\Tenant::first();
\$agent = App\Models\Agent::create(['tenant_id' => \$tenant->id, 'name' => 'Test Agent', 'brand_name' => 'Test Brand']);
\$jio = App\Models\Carrier::where('code', 'jio')->first();
\$ca = \$agent->carrierAgents()->create(['carrier_id' => \$jio->id]);
dump('carrier_agent os default: ' . \$ca->os);
dump('carrier_agent status default: ' . \$ca->status);
dump('agent->tenant->name: ' . \$agent->tenant->name);
dump('agent derivedStatus (all draft): ' . \$agent->fresh()->derivedStatus());
\$ca->delete();
\$agent->delete();
"
```

Expected: `carrier_agent os default: android`, `carrier_agent status default: draft`, `agent->tenant->name: Demo Tenant`, `agent derivedStatus (all draft): draft`.

- [ ] **Step 9: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add Carrier/Agent/CarrierAgent data model and seed the three launch carriers"
```

---

## Task 2: Backend — CarrierAgentTransitioner service

**Files:**
- Create: `backend/app/Support/CarrierAgentTransitioner.php`

**Interfaces:**
- Consumes: `App\Models\CarrierAgent` (Task 1).
- Produces: `CarrierAgentTransitioner::transition(CarrierAgent $carrierAgent, string $action, ?string $rejectionReason = null): CarrierAgent`, throwing `InvalidArgumentException` on an illegal transition — consumed by Task 4's `CarrierAgentController::transition()`.

- [ ] **Step 1: Create the transitioner**

Create `backend/app/Support/CarrierAgentTransitioner.php`:

```php
<?php

namespace App\Support;

use App\Models\CarrierAgent;
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
     *         CarrierAgent's current status
     */
    public function transition(CarrierAgent $carrierAgent, string $action, ?string $rejectionReason = null): CarrierAgent
    {
        if (! isset(self::TRANSITIONS[$action])) {
            throw new InvalidArgumentException("Unknown action: {$action}");
        }

        [$allowedFrom, $to] = self::TRANSITIONS[$action];

        if (! in_array($carrierAgent->status, $allowedFrom, true)) {
            throw new InvalidArgumentException(
                "Cannot {$action} a CarrierAgent with status {$carrierAgent->status}.",
            );
        }

        if ($action === 'reinstate' && $carrierAgent->suspended_by !== 'admin') {
            throw new InvalidArgumentException(
                'Only an admin-suspended CarrierAgent can be reinstated by an admin action.',
            );
        }

        if ($action === 'reject' && ! $rejectionReason) {
            throw new InvalidArgumentException('A rejection_reason is required to reject a CarrierAgent.');
        }

        $carrierAgent->status = $to;

        if ($action === 'reject') {
            $carrierAgent->rejection_reason = $rejectionReason;
        }

        if ($action === 'suspend') {
            $carrierAgent->suspended_by = 'admin';
        }

        if ($action === 'reinstate') {
            $carrierAgent->suspended_by = null;
        }

        $carrierAgent->save();

        return $carrierAgent;
    }
}
```

- [ ] **Step 2: Verify the full lifecycle and its guard rails in tinker**

```bash
cd backend
php artisan tinker --execute="
\$agent = App\Models\Agent::create(['tenant_id' => App\Models\Tenant::first()->id, 'name' => 'Lifecycle Test', 'brand_name' => 'Lifecycle Test']);
\$jio = App\Models\Carrier::where('code', 'jio')->first();
\$ca = \$agent->carrierAgents()->create(['carrier_id' => \$jio->id]);
\$t = new App\Support\CarrierAgentTransitioner();

try {
    \$t->transition(\$ca, 'approve');
    dump('BUG: illegal draft->approve was allowed');
} catch (InvalidArgumentException \$e) {
    dump('illegal draft->approve correctly blocked: ' . \$e->getMessage());
}

\$t->transition(\$ca, 'submit');
dump('after submit: ' . \$ca->fresh()->status);
\$t->transition(\$ca, 'approve');
dump('after approve (should skip straight to live): ' . \$ca->fresh()->status);
\$t->transition(\$ca, 'suspend');
dump('after suspend: status=' . \$ca->fresh()->status . ' suspended_by=' . \$ca->fresh()->suspended_by);
\$t->transition(\$ca, 'reinstate');
dump('after admin reinstate: ' . \$ca->fresh()->status);
\$t->transition(\$ca, 'terminate');
dump('after terminate: ' . \$ca->fresh()->status);

try {
    \$t->transition(\$ca, 'reinstate');
    dump('BUG: reinstate from terminated was allowed');
} catch (InvalidArgumentException \$e) {
    dump('terminated is correctly one-way: ' . \$e->getMessage());
}

\$ca->delete();
\$agent->delete();
"
```

Expected: illegal `draft->approve` blocked; after `submit` status is `submitted`; after `approve` status is `live` directly (no persisted `approved` row); after `suspend`, `status=suspended suspended_by=admin`; after `reinstate`, `status=live`; after `terminate`, `status=terminated`; final `reinstate` attempt blocked.

- [ ] **Step 3: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend/app/Support/CarrierAgentTransitioner.php
git commit -m "Add CarrierAgentTransitioner enforcing the approved state-transition table"
```

---

## Task 3: Backend — Admin Tenant & Carrier endpoints

**Files:**
- Create: `backend/app/Http/Controllers/Api/TenantController.php`
- Create: `backend/app/Http/Controllers/Api/CarrierController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `Tenant`, `Carrier` models (Task 1), existing `is-admin` middleware (Plan 2).
- Produces: `GET /admin/tenants`, `GET/POST /admin/carriers`, `PUT /admin/carriers/{carrier}` — consumed by Task 6/7's frontend services.

- [ ] **Step 1: Create the admin Tenant listing controller**

Create `backend/app/Http/Controllers/Api/TenantController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;

class TenantController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Tenant::query()->get(['id', 'name'])]);
    }
}
```

- [ ] **Step 2: Create the Carrier CRUD controller**

Create `backend/app/Http/Controllers/Api/CarrierController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Carrier;
use Illuminate\Http\Request;

class CarrierController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Carrier::query()->orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:carriers,code'],
            'name' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:2'],
        ]);

        $carrier = Carrier::create($data);

        return response()->json(['data' => $carrier], 201);
    }

    public function update(Request $request, Carrier $carrier)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'country' => ['sometimes', 'string', 'max:2'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $carrier->update($data);

        return response()->json(['data' => $carrier]);
    }
}
```

No `destroy()` — retiring a carrier is `is_active = false` via `update()`, never a delete (existing `CarrierAgent` rows may reference it, and the FK is `restrictOnDelete`).

- [ ] **Step 3: Register the routes**

Edit `backend/routes/api.php` — add the controller imports and the two new routes inside the existing `is-admin` group:

```php
use App\Http\Controllers\Api\CarrierController;
use App\Http\Controllers\Api\TenantController;
```

```php
    Route::middleware('is-admin')->group(function () {
        Route::get('/admin/ping', [PingController::class, 'admin']);
        Route::get('/admin/tenants', [TenantController::class, 'index']);
        Route::get('/admin/carriers', [CarrierController::class, 'index']);
        Route::post('/admin/carriers', [CarrierController::class, 'store']);
        Route::put('/admin/carriers/{carrier}', [CarrierController::class, 'update']);
    });
```

(This replaces the single-line `Route::middleware('is-admin')->get('/admin/ping', ...)` with a group — `/admin/ping` moves inside it unchanged.)

- [ ] **Step 4: Verify with curl**

```bash
cd backend
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

echo "--- Tenants list ---"
curl -s http://127.0.0.1:8000/api/admin/tenants -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo "--- Carriers list (expect jio/vi/airtel) ---"
curl -s http://127.0.0.1:8000/api/admin/carriers -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo "--- Create a new carrier ---"
curl -s -X POST http://127.0.0.1:8000/api/admin/carriers -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"code":"tmobile","name":"T-Mobile","country":"US"}'
echo ""

echo "--- Non-admin (Demo User) hits /admin/carriers (expect 403) ---"
USER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/admin/carriers -H "Authorization: Bearer $USER_TOKEN"

kill "$BACKEND_PID" 2>/dev/null
```

Expected: tenants list includes "Demo Tenant"; carriers list has 3 entries; T-Mobile creates successfully (201); Demo User gets `403`.

- [ ] **Step 5: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add Admin-gated Tenant listing and Carrier CRUD endpoints"
```

---

## Task 4: Backend — Admin Agent & CarrierAgent endpoints

**Files:**
- Create: `backend/app/Http/Controllers/Api/AgentController.php`
- Create: `backend/app/Http/Controllers/Api/CarrierAgentController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `Agent`, `CarrierAgent` models (Task 1), `CarrierAgentTransitioner` (Task 2).
- Produces: `GET/POST /admin/agents`, `GET /admin/agents/{agent}`, `POST /admin/agents/{agent}/carrier-agents`, `POST /admin/carrier-agents/{carrierAgent}/transition` — consumed by Task 8's frontend service.

- [ ] **Step 1: Create the Agent controller**

Create `backend/app/Http/Controllers/Api/AgentController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index()
    {
        $agents = Agent::with('carrierAgents.carrier', 'tenant')->get();

        $data = $agents->map(fn (Agent $agent) => [
            'id' => $agent->id,
            'tenant_id' => $agent->tenant_id,
            'tenant_name' => $agent->tenant->name,
            'name' => $agent->name,
            'brand_name' => $agent->brand_name,
            'status' => $agent->derivedStatus(),
        ]);

        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'name' => ['required', 'string', 'max:255'],
            'brand_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $agent = Agent::create($data);

        return response()->json(['data' => $agent], 201);
    }

    public function show(Agent $agent)
    {
        $agent->load('carrierAgents.carrier', 'tenant');

        return response()->json([
            'data' => [
                'id' => $agent->id,
                'tenant_id' => $agent->tenant_id,
                'tenant_name' => $agent->tenant->name,
                'name' => $agent->name,
                'brand_name' => $agent->brand_name,
                'description' => $agent->description,
                'status' => $agent->derivedStatus(),
                'carrier_agents' => $agent->carrierAgents->map(fn ($ca) => [
                    'id' => $ca->id,
                    'carrier_id' => $ca->carrier_id,
                    'carrier_code' => $ca->carrier->code,
                    'carrier_name' => $ca->carrier->name,
                    'os' => $ca->os,
                    'status' => $ca->status,
                    'carrier_external_id' => $ca->carrier_external_id,
                    'rejection_reason' => $ca->rejection_reason,
                    'suspended_by' => $ca->suspended_by,
                ]),
            ],
        ]);
    }
}
```

- [ ] **Step 2: Create the CarrierAgent controller**

Create `backend/app/Http/Controllers/Api/CarrierAgentController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\CarrierAgent;
use App\Support\CarrierAgentTransitioner;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class CarrierAgentController extends Controller
{
    public function store(Request $request, Agent $agent)
    {
        $data = $request->validate([
            'carrier_id' => ['required', 'exists:carriers,id'],
            'os' => ['sometimes', 'in:android,ios'],
        ]);

        $carrierAgent = $agent->carrierAgents()->create([
            'carrier_id' => $data['carrier_id'],
            'os' => $data['os'] ?? 'android',
        ]);

        return response()->json(['data' => $carrierAgent], 201);
    }

    public function transition(Request $request, CarrierAgent $carrierAgent, CarrierAgentTransitioner $transitioner)
    {
        $data = $request->validate([
            'action' => ['required', 'string'],
            'rejection_reason' => ['nullable', 'string'],
        ]);

        try {
            $updated = $transitioner->transition($carrierAgent, $data['action'], $data['rejection_reason'] ?? null);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['action' => $e->getMessage()]);
        }

        return response()->json(['data' => $updated]);
    }
}
```

`ValidationException::withMessages()` produces Laravel's standard 422 response — this is what gives the spec's "422 with the current status and attempted action" requirement, since the transitioner's exception message includes both.

- [ ] **Step 3: Register the routes**

Edit `backend/routes/api.php` — add the imports and routes to the same `is-admin` group from Task 3:

```php
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\CarrierAgentController;
```

```php
    Route::middleware('is-admin')->group(function () {
        Route::get('/admin/ping', [PingController::class, 'admin']);
        Route::get('/admin/tenants', [TenantController::class, 'index']);
        Route::get('/admin/carriers', [CarrierController::class, 'index']);
        Route::post('/admin/carriers', [CarrierController::class, 'store']);
        Route::put('/admin/carriers/{carrier}', [CarrierController::class, 'update']);
        Route::get('/admin/agents', [AgentController::class, 'index']);
        Route::post('/admin/agents', [AgentController::class, 'store']);
        Route::get('/admin/agents/{agent}', [AgentController::class, 'show']);
        Route::post('/admin/agents/{agent}/carrier-agents', [CarrierAgentController::class, 'store']);
        Route::post('/admin/carrier-agents/{carrierAgent}/transition', [CarrierAgentController::class, 'transition']);
    });
```

- [ ] **Step 4: Verify with curl**

```bash
cd backend
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
TENANT_ID=$(curl -s http://127.0.0.1:8000/api/admin/tenants -H "Authorization: Bearer $ADMIN_TOKEN" | php -r "echo json_decode(file_get_contents('php://stdin'))->data[0]->id;")
JIO_ID=$(curl -s http://127.0.0.1:8000/api/admin/carriers -H "Authorization: Bearer $ADMIN_TOKEN" | php -r "\$d=json_decode(file_get_contents('php://stdin'))->data; foreach(\$d as \$c){if(\$c->code==='jio'){echo \$c->id;}}")

echo "--- Create an Agent ---"
AGENT_ID=$(curl -s -X POST http://127.0.0.1:8000/api/admin/agents -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"tenant_id\":$TENANT_ID,\"name\":\"Support Bot\",\"brand_name\":\"Demo Support\"}" | php -r "echo json_decode(file_get_contents('php://stdin'))->data->id;")
echo "Created agent id: $AGENT_ID"

echo "--- Add a Jio (Android) carrier registration ---"
CA_ID=$(curl -s -X POST "http://127.0.0.1:8000/api/admin/agents/$AGENT_ID/carrier-agents" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"carrier_id\":$JIO_ID}" | php -r "echo json_decode(file_get_contents('php://stdin'))->data->id;")
echo "Created carrier_agent id: $CA_ID"

echo "--- Agent detail shows pending status after submit ---"
curl -s -X POST "http://127.0.0.1:8000/api/admin/carrier-agents/$CA_ID/transition" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"action":"submit"}'
echo ""
curl -s "http://127.0.0.1:8000/api/admin/agents/$AGENT_ID" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo "--- Illegal transition (submit again from submitted) returns 422 ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://127.0.0.1:8000/api/admin/carrier-agents/$CA_ID/transition" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"action":"submit"}'

echo "--- Adding a duplicate (agent, carrier, os) registration is rejected at the DB level ---"
curl -s -X POST "http://127.0.0.1:8000/api/admin/agents/$AGENT_ID/carrier-agents" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"carrier_id\":$JIO_ID}"
echo ""

kill "$BACKEND_PID" 2>/dev/null
```

Expected: Agent and CarrierAgent create successfully; after `submit`, the agent detail's `status` is `pending` and its one carrier_agent shows `status: submitted`; the repeated `submit` returns `422`; the duplicate Jio/Android registration attempt fails (500 from the DB unique-constraint violation is acceptable at this stage — Task 8's frontend won't offer a duplicate os/carrier combo already in use, so this is a defense-in-depth check, not a user-facing flow).

- [ ] **Step 5: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add Admin-gated Agent and CarrierAgent endpoints"
```

---

## Task 5: Backend — tenant-side read-only Agents endpoint

**Files:**
- Create: `backend/app/Http/Controllers/Api/TenantAgentController.php`
- Modify: `backend/config/features.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `Agent` model (Task 1), existing `owner_only` structural filter in `FeatureAccess::grantedKeys()` (Plan 1 — unmodified).
- Produces: `GET /agents` (tenant-scoped, read-only) — consumed by Task 9's frontend.

- [ ] **Step 1: Create the tenant-side controller**

Create `backend/app/Http/Controllers/Api/TenantAgentController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;

class TenantAgentController extends Controller
{
    public function index(Request $request)
    {
        $agents = Agent::where('tenant_id', $request->user()->tenant_id)
            ->with('carrierAgents.carrier')
            ->get();

        $data = $agents->map(fn (Agent $agent) => [
            'id' => $agent->id,
            'name' => $agent->name,
            'brand_name' => $agent->brand_name,
            'status' => $agent->derivedStatus(),
            'carrier_agents' => $agent->carrierAgents->map(fn ($ca) => [
                'carrier_name' => $ca->carrier->name,
                'os' => $ca->os,
                'status' => $ca->status,
            ]),
        ]);

        return response()->json(['data' => $data]);
    }
}
```

- [ ] **Step 2: Register the `agents` feature and route**

Edit `backend/config/features.php`, adding a new entry:

```php
    [
        'key' => 'agents',
        'label' => 'Agents',
        'route' => '/agents',
        'sidebar' => true,
        'public' => false,
        'owner_only' => true,
    ],
```

Edit `backend/routes/api.php` — add the controller import and route, alongside the existing `/permissions/ping` Gate-checked route:

```php
use App\Http\Controllers\Api\TenantAgentController;
```

```php
    Route::middleware('can:access-feature,"agents"')->get('/agents', [TenantAgentController::class, 'index']);
```

- [ ] **Step 3: Verify with curl — User sees it, Team does not**

```bash
cd backend
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

USER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
TEAM_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"team@rbm.local","password":"Team!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

echo "--- Demo User authority includes agents ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}'
echo ""

echo "--- Demo User GET /agents (expect 200) ---"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/agents -H "Authorization: Bearer $USER_TOKEN"

echo "--- Team member GET /agents (expect 403, owner_only) ---"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/agents -H "Authorization: Bearer $TEAM_TOKEN"

echo "--- Team member: even a smuggled sub_account_permissions grant row for 'agents' is still blocked ---"
mysql --defaults-extra-file=/dev/null -u "$(grep DB_USERNAME .env | cut -d= -f2)" -p"$(grep DB_PASSWORD .env | cut -d= -f2)" "$(grep DB_DATABASE .env | cut -d= -f2)" -e "INSERT INTO sub_account_permissions (user_id, feature_key, created_at, updated_at) SELECT id, 'agents', NOW(), NOW() FROM users WHERE email='team@rbm.local';"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/agents -H "Authorization: Bearer $TEAM_TOKEN"
mysql --defaults-extra-file=/dev/null -u "$(grep DB_USERNAME .env | cut -d= -f2)" -p"$(grep DB_PASSWORD .env | cut -d= -f2)" "$(grep DB_DATABASE .env | cut -d= -f2)" -e "DELETE FROM sub_account_permissions WHERE feature_key='agents';"

kill "$BACKEND_PID" 2>/dev/null
```

Expected: Demo User's `authority` array includes `agents`; Demo User gets `200` on `GET /agents`; Team member gets `403` both before **and after** the smuggled grant row (proving the `owner_only` structural filter in `FeatureAccess::grantedKeys()` blocks it regardless — same proof pattern already used for the Team page in Plan 1).

- [ ] **Step 4: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add tenant-side read-only Agents endpoint, owner_only per the feature registry"
```

---

## Task 6: Frontend — Admin Tenants page

**Files:**
- Create: `frontend/src/services/TenantService.ts`
- Create: `frontend/src/views/AdminTenants/index.tsx`
- Create: `frontend/src/views/AdminTenants/AdminTenants.tsx`
- Modify: `frontend/src/configs/navigation.config/adminNavigation.config.ts`
- Modify: `frontend/src/configs/routes.config/adminRoutes.config.ts`

**Interfaces:**
- Consumes: `GET /admin/tenants` (Task 3).
- Produces: nothing consumed elsewhere — this is the tenant-picker's data source, called directly by Task 8's Create Agent dialog via its own import of `apiGetTenants`.

- [ ] **Step 1: Create the Tenant service**

Create `frontend/src/services/TenantService.ts`:

```ts
import ApiService from './ApiService'

export type Tenant = {
    id: number
    name: string
}

export async function apiGetTenants() {
    return ApiService.fetchDataWithAxios<{ data: Tenant[] }>({
        url: '/admin/tenants',
        method: 'get',
    })
}
```

- [ ] **Step 2: Create the AdminTenants page**

Create `frontend/src/views/AdminTenants/AdminTenants.tsx`:

```tsx
import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiGetTenants } from '@/services/TenantService'
import type { Tenant } from '@/services/TenantService'

const AdminTenants = () => {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        apiGetTenants()
            .then((resp) => setTenants(resp.data || []))
            .catch((error: any) => {
                toast.push(
                    <Notification type="danger" title="Error Loading Tenants">
                        {error?.response?.data?.message || 'Failed to fetch tenants.'}
                    </Notification>,
                    { placement: 'top-center' },
                )
            })
            .finally(() => setIsLoading(false))
    }, [])

    return (
        <Container className="py-2">
            <h3 className="mb-4">Tenants</h3>
            <Card bodyClass="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/75 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-6">ID</th>
                                <th className="py-3 px-6">Name</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/80">
                            {!isLoading && tenants.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="py-8 px-6 text-center text-gray-500">
                                        No tenants yet.
                                    </td>
                                </tr>
                            )}
                            {tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td className="py-3 px-6">{tenant.id}</td>
                                    <td className="py-3 px-6 font-semibold heading-text">
                                        {tenant.name}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </Container>
    )
}

export default AdminTenants
```

Create `frontend/src/views/AdminTenants/index.tsx`:

```tsx
export { default } from './AdminTenants'
```

- [ ] **Step 3: Wire the nav and route entries**

Edit `frontend/src/configs/navigation.config/adminNavigation.config.ts`, adding a second entry to the array:

```ts
    {
        key: 'admin.tenants',
        path: '/admin/tenants',
        title: 'Tenants',
        translateKey: 'nav.adminTenants',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
```

Edit `frontend/src/configs/routes.config/adminRoutes.config.ts`, adding a second entry to the array:

```ts
    {
        key: 'admin.tenants',
        path: '/admin/tenants',
        component: lazy(() => import('@/views/AdminTenants')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
```

- [ ] **Step 4: Verify the build succeeds**

```bash
cd frontend
npm run build 2>&1 | tail -10
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Add Admin Tenants page (read-only tenant list)"
```

---

## Task 7: Frontend — Admin Carriers page

**Files:**
- Create: `frontend/src/services/CarrierService.ts`
- Create: `frontend/src/views/AdminCarriers/index.tsx`
- Create: `frontend/src/views/AdminCarriers/AdminCarriers.tsx`
- Create: `frontend/src/views/AdminCarriers/components/CreateCarrierDialog.tsx`
- Modify: `frontend/src/configs/navigation.config/adminNavigation.config.ts`
- Modify: `frontend/src/configs/routes.config/adminRoutes.config.ts`

**Interfaces:**
- Consumes: `GET/POST /admin/carriers`, `PUT /admin/carriers/{carrier}` (Task 3).
- Produces: `apiGetCarriers()` — also consumed directly by Task 8's Add Carrier Registration dialog.

- [ ] **Step 1: Create the Carrier service**

Create `frontend/src/services/CarrierService.ts`:

```ts
import ApiService from './ApiService'

export type Carrier = {
    id: number
    code: string
    name: string
    country: string
    is_active: boolean
}

export async function apiGetCarriers() {
    return ApiService.fetchDataWithAxios<{ data: Carrier[] }>({
        url: '/admin/carriers',
        method: 'get',
    })
}

export async function apiCreateCarrier(data: {
    code: string
    name: string
    country: string
}) {
    return ApiService.fetchDataWithAxios<{ data: Carrier }>({
        url: '/admin/carriers',
        method: 'post',
        data,
    })
}

export async function apiUpdateCarrier(
    carrierId: number,
    data: { name?: string; country?: string; is_active?: boolean },
) {
    return ApiService.fetchDataWithAxios<{ data: Carrier }>({
        url: `/admin/carriers/${carrierId}`,
        method: 'put',
        data,
    })
}
```

- [ ] **Step 2: Create the Create Carrier dialog**

Create `frontend/src/views/AdminCarriers/components/CreateCarrierDialog.tsx`:

```tsx
import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'

type CreateCarrierDialogProps = {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { code: string; name: string; country: string }) => Promise<void>
}

const CreateCarrierDialog = ({ isOpen, onClose, onSubmit }: CreateCarrierDialogProps) => {
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [country, setCountry] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const resetForm = () => {
        setCode('')
        setName('')
        setCountry('')
        setErrorMessage(null)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm()
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        if (!code.trim() || !name.trim() || !country.trim()) {
            setErrorMessage('Code, name, and country are all required.')
            return
        }

        try {
            setIsSubmitting(true)
            await onSubmit({ code: code.trim(), name: name.trim(), country: country.trim().toUpperCase() })
            resetForm()
            onClose()
        } catch (err: any) {
            setErrorMessage(
                err?.response?.data?.message || err?.message || 'Failed to create carrier.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={480}>
            <h4 className="font-bold text-lg heading-text mb-4">Add Carrier</h4>

            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Code" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. tmobile"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Name" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. T-Mobile"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Country (ISO 2-letter)" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. US"
                        maxLength={2}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Add Carrier
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default CreateCarrierDialog
```

- [ ] **Step 3: Create the AdminCarriers page**

Create `frontend/src/views/AdminCarriers/AdminCarriers.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import CreateCarrierDialog from './components/CreateCarrierDialog'
import { apiGetCarriers, apiCreateCarrier, apiUpdateCarrier } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'

const AdminCarriers = () => {
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const resp = await apiGetCarriers()
            setCarriers(resp.data || [])
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Carriers">
                    {error?.response?.data?.message || 'Failed to fetch carriers.'}
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

    const handleCreate = async (data: { code: string; name: string; country: string }) => {
        await apiCreateCarrier(data)
        toast.push(
            <Notification type="success" title="Carrier Added">
                <strong>{data.name}</strong> is ready for agent registrations.
            </Notification>,
            { placement: 'top-center' },
        )
        await loadData()
    }

    const handleToggleActive = async (carrier: Carrier) => {
        setTogglingId(carrier.id)
        try {
            await apiUpdateCarrier(carrier.id, { is_active: !carrier.is_active })
            await loadData()
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Update Failed">
                    {error?.response?.data?.message || 'Could not update carrier.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setTogglingId(null)
        }
    }

    return (
        <Container className="py-2">
            <div className="flex items-center justify-between mb-4">
                <h3>Carriers</h3>
                <Button variant="solid" onClick={() => setIsCreateOpen(true)}>
                    Add Carrier
                </Button>
            </div>
            <Card bodyClass="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/75 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-6">Code</th>
                                <th className="py-3 px-6">Name</th>
                                <th className="py-3 px-6">Country</th>
                                <th className="py-3 px-6">Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/80">
                            {!isLoading && carriers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                                        No carriers yet.
                                    </td>
                                </tr>
                            )}
                            {carriers.map((carrier) => (
                                <tr key={carrier.id}>
                                    <td className="py-3 px-6">
                                        <Tag>{carrier.code}</Tag>
                                    </td>
                                    <td className="py-3 px-6 font-semibold heading-text">
                                        {carrier.name}
                                    </td>
                                    <td className="py-3 px-6">{carrier.country}</td>
                                    <td className="py-3 px-6">
                                        <Switcher
                                            checked={carrier.is_active}
                                            isLoading={togglingId === carrier.id}
                                            onChange={() => handleToggleActive(carrier)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CreateCarrierDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreate}
            />
        </Container>
    )
}

export default AdminCarriers
```

Create `frontend/src/views/AdminCarriers/index.tsx`:

```tsx
export { default } from './AdminCarriers'
```

- [ ] **Step 4: Wire the nav and route entries**

Edit `frontend/src/configs/navigation.config/adminNavigation.config.ts`, adding a third entry:

```ts
    {
        key: 'admin.carriers',
        path: '/admin/carriers',
        title: 'Carriers',
        translateKey: 'nav.adminCarriers',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
```

Edit `frontend/src/configs/routes.config/adminRoutes.config.ts`, adding a third entry:

```ts
    {
        key: 'admin.carriers',
        path: '/admin/carriers',
        component: lazy(() => import('@/views/AdminCarriers')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
```

- [ ] **Step 5: Verify the build succeeds**

```bash
cd frontend
npm run build 2>&1 | tail -10
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Add Admin Carriers page (list, create, active toggle)"
```

---

## Task 8: Frontend — Admin Agents list + Agent detail pages

**Files:**
- Create: `frontend/src/services/AgentService.ts`
- Create: `frontend/src/views/AdminAgents/index.tsx`
- Create: `frontend/src/views/AdminAgents/AdminAgents.tsx`
- Create: `frontend/src/views/AdminAgents/components/CreateAgentDialog.tsx`
- Create: `frontend/src/views/AdminAgentDetail/index.tsx`
- Create: `frontend/src/views/AdminAgentDetail/AdminAgentDetail.tsx`
- Create: `frontend/src/views/AdminAgentDetail/components/CarrierAgentCard.tsx`
- Create: `frontend/src/views/AdminAgentDetail/components/AddCarrierAgentDialog.tsx`
- Modify: `frontend/src/configs/navigation.config/adminNavigation.config.ts`
- Modify: `frontend/src/configs/routes.config/adminRoutes.config.ts`

**Interfaces:**
- Consumes: `GET/POST /admin/agents`, `GET /admin/agents/{agent}`, `POST /admin/agents/{agent}/carrier-agents`, `POST /admin/carrier-agents/{carrierAgent}/transition` (Task 4); `apiGetTenants` (Task 6); `apiGetCarriers` (Task 7).
- Produces: nothing consumed elsewhere in this plan.

This task bundles the list and detail pages together — they're the same feature (clicking a list row navigates to the detail route) and neither is independently meaningful without the other.

- [ ] **Step 1: Create the Agent service**

Create `frontend/src/services/AgentService.ts`:

```ts
import ApiService from './ApiService'

export type AgentSummary = {
    id: number
    tenant_id: number
    tenant_name: string
    name: string
    brand_name: string
    status: string
}

export type CarrierAgentDetail = {
    id: number
    carrier_id: number
    carrier_code: string
    carrier_name: string
    os: 'android' | 'ios'
    status: string
    carrier_external_id: string | null
    rejection_reason: string | null
    suspended_by: 'admin' | 'carrier' | null
}

export type AgentDetail = {
    id: number
    tenant_id: number
    tenant_name: string
    name: string
    brand_name: string
    description: string | null
    status: string
    carrier_agents: CarrierAgentDetail[]
}

export async function apiGetAgents() {
    return ApiService.fetchDataWithAxios<{ data: AgentSummary[] }>({
        url: '/admin/agents',
        method: 'get',
    })
}

export async function apiCreateAgent(data: {
    tenant_id: number
    name: string
    brand_name: string
    description?: string
}) {
    return ApiService.fetchDataWithAxios<{ data: { id: number } }>({
        url: '/admin/agents',
        method: 'post',
        data,
    })
}

export async function apiGetAgent(agentId: number) {
    return ApiService.fetchDataWithAxios<{ data: AgentDetail }>({
        url: `/admin/agents/${agentId}`,
        method: 'get',
    })
}

export async function apiAddCarrierAgent(
    agentId: number,
    data: { carrier_id: number; os?: 'android' | 'ios' },
) {
    return ApiService.fetchDataWithAxios<{ data: CarrierAgentDetail }>({
        url: `/admin/agents/${agentId}/carrier-agents`,
        method: 'post',
        data,
    })
}

export async function apiTransitionCarrierAgent(
    carrierAgentId: number,
    action: string,
    rejectionReason?: string,
) {
    return ApiService.fetchDataWithAxios<{ data: CarrierAgentDetail }>({
        url: `/admin/carrier-agents/${carrierAgentId}/transition`,
        method: 'post',
        data: { action, rejection_reason: rejectionReason },
    })
}
```

- [ ] **Step 2: Create the Create Agent dialog**

Create `frontend/src/views/AdminAgents/components/CreateAgentDialog.tsx`:

```tsx
import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'
import type { Tenant } from '@/services/TenantService'

type TenantOption = { label: string; value: number }

type CreateAgentDialogProps = {
    isOpen: boolean
    onClose: () => void
    tenants: Tenant[]
    onSubmit: (data: {
        tenant_id: number
        name: string
        brand_name: string
        description?: string
    }) => Promise<void>
}

const CreateAgentDialog = ({ isOpen, onClose, tenants, onSubmit }: CreateAgentDialogProps) => {
    const [tenantId, setTenantId] = useState<number | null>(null)
    const [name, setName] = useState('')
    const [brandName, setBrandName] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const tenantOptions: TenantOption[] = tenants.map((t) => ({ label: t.name, value: t.id }))

    const resetForm = () => {
        setTenantId(null)
        setName('')
        setBrandName('')
        setDescription('')
        setErrorMessage(null)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm()
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        if (!tenantId) {
            setErrorMessage('Select a tenant.')
            return
        }
        if (!name.trim() || !brandName.trim()) {
            setErrorMessage('Name and brand name are required.')
            return
        }

        try {
            setIsSubmitting(true)
            await onSubmit({
                tenant_id: tenantId,
                name: name.trim(),
                brand_name: brandName.trim(),
                description: description.trim() || undefined,
            })
            resetForm()
            onClose()
        } catch (err: any) {
            setErrorMessage(
                err?.response?.data?.message || err?.message || 'Failed to create agent.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={560}>
            <h4 className="font-bold text-lg heading-text mb-4">Create Agent</h4>

            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Tenant" asterisk className="mb-0">
                    <Select<TenantOption>
                        options={tenantOptions}
                        value={tenantOptions.find((opt) => opt.value === tenantId)}
                        onChange={(option) => setTenantId(option?.value ?? null)}
                        placeholder="Select a tenant..."
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Name" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. Support Bot"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Brand Name" asterisk className="mb-0">
                    <Input
                        placeholder="e.g. Acme Support"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="Description" className="mb-0">
                    <Input
                        textArea
                        placeholder="Optional"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormItem>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Create Agent
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default CreateAgentDialog
```

- [ ] **Step 3: Create the AdminAgents (list) page**

Create `frontend/src/views/AdminAgents/AdminAgents.tsx`:

```tsx
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import CreateAgentDialog from './components/CreateAgentDialog'
import { apiGetAgents, apiCreateAgent } from '@/services/AgentService'
import type { AgentSummary } from '@/services/AgentService'
import { apiGetTenants } from '@/services/TenantService'
import type { Tenant } from '@/services/TenantService'

type StatusOption = { label: string; value: string }

const statusOptions: StatusOption[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'Partially Live', value: 'partially_live' },
    { label: 'Live', value: 'live' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Terminated', value: 'terminated' },
]

const AdminAgents = () => {
    const navigate = useNavigate()
    const [agents, setAgents] = useState<AgentSummary[]>([])
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const [agentsResp, tenantsResp] = await Promise.all([apiGetAgents(), apiGetTenants()])
            setAgents(agentsResp.data || [])
            setTenants(tenantsResp.data || [])
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

    const handleCreate = async (data: {
        tenant_id: number
        name: string
        brand_name: string
        description?: string
    }) => {
        await apiCreateAgent(data)
        toast.push(
            <Notification type="success" title="Agent Created">
                <strong>{data.name}</strong> is ready for carrier registrations.
            </Notification>,
            { placement: 'top-center' },
        )
        await loadData()
    }

    const filteredAgents = useMemo(() => {
        if (statusFilter === 'all') return agents
        return agents.filter((a) => a.status === statusFilter)
    }, [agents, statusFilter])

    return (
        <Container className="py-2">
            <div className="flex items-center justify-between mb-4">
                <h3>Agents</h3>
                <Button variant="solid" onClick={() => setIsCreateOpen(true)}>
                    Create Agent
                </Button>
            </div>

            <div className="mb-4 w-full sm:w-60">
                <Select<StatusOption>
                    size="sm"
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === statusFilter)}
                    onChange={(option) => setStatusFilter(option?.value || 'all')}
                />
            </div>

            <Card bodyClass="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/75 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-6">Tenant</th>
                                <th className="py-3 px-6">Name</th>
                                <th className="py-3 px-6">Brand</th>
                                <th className="py-3 px-6">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/80">
                            {!isLoading && filteredAgents.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                                        No agents match this filter.
                                    </td>
                                </tr>
                            )}
                            {filteredAgents.map((agent) => (
                                <tr
                                    key={agent.id}
                                    className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                                    onClick={() => navigate(`/admin/agents/${agent.id}`)}
                                >
                                    <td className="py-3 px-6">{agent.tenant_name}</td>
                                    <td className="py-3 px-6 font-semibold heading-text">
                                        {agent.name}
                                    </td>
                                    <td className="py-3 px-6">{agent.brand_name}</td>
                                    <td className="py-3 px-6">
                                        <Tag>{agent.status}</Tag>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CreateAgentDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                tenants={tenants}
                onSubmit={handleCreate}
            />
        </Container>
    )
}

export default AdminAgents
```

Create `frontend/src/views/AdminAgents/index.tsx`:

```tsx
export { default } from './AdminAgents'
```

- [ ] **Step 4: Create the Add Carrier Registration dialog**

Create `frontend/src/views/AdminAgentDetail/components/AddCarrierAgentDialog.tsx`:

```tsx
import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'
import type { Carrier } from '@/services/CarrierService'

type CarrierOption = { label: string; value: number }
type OsOption = { label: string; value: 'android' | 'ios' }

const osOptions: OsOption[] = [
    { label: 'Android', value: 'android' },
    { label: 'iOS', value: 'ios' },
]

type AddCarrierAgentDialogProps = {
    isOpen: boolean
    onClose: () => void
    carriers: Carrier[]
    onSubmit: (data: { carrier_id: number; os: 'android' | 'ios' }) => Promise<void>
}

const AddCarrierAgentDialog = ({
    isOpen,
    onClose,
    carriers,
    onSubmit,
}: AddCarrierAgentDialogProps) => {
    const [carrierId, setCarrierId] = useState<number | null>(null)
    const [os, setOs] = useState<'android' | 'ios'>('android')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const carrierOptions: CarrierOption[] = carriers
        .filter((c) => c.is_active)
        .map((c) => ({ label: c.name, value: c.id }))

    const resetForm = () => {
        setCarrierId(null)
        setOs('android')
        setErrorMessage(null)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm()
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        if (!carrierId) {
            setErrorMessage('Select a carrier.')
            return
        }

        try {
            setIsSubmitting(true)
            await onSubmit({ carrier_id: carrierId, os })
            resetForm()
            onClose()
        } catch (err: any) {
            setErrorMessage(
                err?.response?.data?.message ||
                    err?.message ||
                    'Failed to add carrier registration.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} width={480}>
            <h4 className="font-bold text-lg heading-text mb-4">Add Carrier Registration</h4>

            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4 text-xs">
                    {errorMessage}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormItem label="Carrier" asterisk className="mb-0">
                    <Select<CarrierOption>
                        options={carrierOptions}
                        value={carrierOptions.find((opt) => opt.value === carrierId)}
                        onChange={(option) => setCarrierId(option?.value ?? null)}
                        placeholder="Select a carrier..."
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem label="OS" asterisk className="mb-0">
                    <Select<OsOption>
                        options={osOptions}
                        value={osOptions.find((opt) => opt.value === os)}
                        onChange={(option) => setOs(option?.value || 'android')}
                        isDisabled={isSubmitting}
                    />
                </FormItem>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="plain" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting}>
                        Add Registration
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default AddCarrierAgentDialog
```

- [ ] **Step 5: Create the CarrierAgentCard component**

This renders one `CarrierAgent` row with only the currently-legal action buttons — mirroring `CarrierAgentTransitioner::TRANSITIONS` on the frontend so an illegal action is never even offered, per the spec.

Create `frontend/src/views/AdminAgentDetail/components/CarrierAgentCard.tsx`:

```tsx
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import type { CarrierAgentDetail } from '@/services/AgentService'

type CarrierAgentCardProps = {
    carrierAgent: CarrierAgentDetail
    onTransition: (action: string, rejectionReason?: string) => Promise<void>
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

const CarrierAgentCard = ({ carrierAgent, onTransition }: CarrierAgentCardProps) => {
    const [pendingAction, setPendingAction] = useState<string | null>(null)

    // Reinstate is legal only when suspended_by === 'admin' (see
    // CarrierAgentTransitioner) — computed separately rather than baked
    // into the static table since it depends on more than just status.
    const actions = [...(STATIC_ACTIONS_BY_STATUS[carrierAgent.status] ?? [])]
    if (carrierAgent.status === 'suspended' && carrierAgent.suspended_by === 'admin') {
        actions.unshift({ action: 'reinstate', label: 'Reinstate' })
    }

    const handleClick = async (action: string) => {
        if (action === 'reject') {
            const reason = window.prompt('Rejection reason:')
            if (!reason) return
            setPendingAction(action)
            try {
                await onTransition(action, reason)
            } finally {
                setPendingAction(null)
            }
            return
        }

        setPendingAction(action)
        try {
            await onTransition(action)
        } finally {
            setPendingAction(null)
        }
    }

    return (
        <Card className="border border-gray-200 dark:border-gray-700/80">
            <div className="flex items-center justify-between">
                <div>
                    <div className="font-bold heading-text">
                        {carrierAgent.carrier_name} ({carrierAgent.os === 'ios' ? 'iOS' : 'Android'})
                    </div>
                    {carrierAgent.carrier_external_id && (
                        <div className="text-xs text-gray-500 mt-0.5">
                            External ID: {carrierAgent.carrier_external_id}
                        </div>
                    )}
                    {carrierAgent.rejection_reason && (
                        <div className="text-xs text-red-500 mt-0.5">
                            Rejected: {carrierAgent.rejection_reason}
                        </div>
                    )}
                </div>
                <Tag>{carrierAgent.status}</Tag>
            </div>
            {actions.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
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
            )}
        </Card>
    )
}

export default CarrierAgentCard
```

- [ ] **Step 6: Create the AdminAgentDetail page**

Create `frontend/src/views/AdminAgentDetail/AdminAgentDetail.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import CarrierAgentCard from './components/CarrierAgentCard'
import AddCarrierAgentDialog from './components/AddCarrierAgentDialog'
import {
    apiGetAgent,
    apiAddCarrierAgent,
    apiTransitionCarrierAgent,
} from '@/services/AgentService'
import type { AgentDetail } from '@/services/AgentService'
import { apiGetCarriers } from '@/services/CarrierService'
import type { Carrier } from '@/services/CarrierService'

const AdminAgentDetail = () => {
    const { id } = useParams<{ id: string }>()
    const agentId = Number(id)
    const [agent, setAgent] = useState<AgentDetail | null>(null)
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const [agentResp, carriersResp] = await Promise.all([
                apiGetAgent(agentId),
                apiGetCarriers(),
            ])
            setAgent(agentResp.data)
            setCarriers(carriersResp.data || [])
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Error Loading Agent">
                    {error?.response?.data?.message || 'Failed to fetch agent.'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }, [agentId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleAddCarrierAgent = async (data: { carrier_id: number; os: 'android' | 'ios' }) => {
        await apiAddCarrierAgent(agentId, data)
        toast.push(
            <Notification type="success" title="Carrier Registration Added" />,
            { placement: 'top-center' },
        )
        await loadData()
    }

    const handleTransition = async (
        carrierAgentId: number,
        action: string,
        rejectionReason?: string,
    ) => {
        try {
            await apiTransitionCarrierAgent(carrierAgentId, action, rejectionReason)
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

    if (!agent) {
        return <Container className="py-2" />
    }

    return (
        <Container className="py-2">
            <div className="flex items-center justify-between mb-1">
                <h3>{agent.name}</h3>
                <Tag>{agent.status}</Tag>
            </div>
            <p className="text-gray-500 text-sm mb-1">
                {agent.tenant_name} &middot; {agent.brand_name}
            </p>
            {agent.description && (
                <p className="text-gray-500 text-sm mb-4">{agent.description}</p>
            )}

            <div className="flex items-center justify-between mt-6 mb-3">
                <h4>Carrier Registrations</h4>
                <Button variant="solid" size="sm" onClick={() => setIsAddOpen(true)}>
                    Add Carrier Registration
                </Button>
            </div>

            <div className="space-y-3">
                {agent.carrier_agents.length === 0 && (
                    <p className="text-gray-500 text-sm">No carrier registrations yet.</p>
                )}
                {agent.carrier_agents.map((ca) => (
                    <CarrierAgentCard
                        key={ca.id}
                        carrierAgent={ca}
                        onTransition={(action, reason) => handleTransition(ca.id, action, reason)}
                    />
                ))}
            </div>

            <AddCarrierAgentDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                carriers={carriers}
                onSubmit={handleAddCarrierAgent}
            />
        </Container>
    )
}

export default AdminAgentDetail
```

Create `frontend/src/views/AdminAgentDetail/index.tsx`:

```tsx
export { default } from './AdminAgentDetail'
```

- [ ] **Step 7: Wire the nav and route entries**

Edit `frontend/src/configs/navigation.config/adminNavigation.config.ts`, adding a fourth entry:

```ts
    {
        key: 'admin.agents',
        path: '/admin/agents',
        title: 'Agents',
        translateKey: 'nav.adminAgents',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
```

Edit `frontend/src/configs/routes.config/adminRoutes.config.ts`, adding the list route and the detail route (no nav entry for the detail route — it's reached only by clicking a list row, same reasoning as any other detail page in this theme):

```ts
    {
        key: 'admin.agents',
        path: '/admin/agents',
        component: lazy(() => import('@/views/AdminAgents')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
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

- [ ] **Step 8: Verify the build succeeds**

```bash
cd frontend
npm run build 2>&1 | tail -10
```

Expected: zero errors.

- [ ] **Step 9: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Add Admin Agents list and Agent detail pages with lifecycle action buttons"
```

---

## Task 9: Frontend — Tenant read-only Agents page

**Files:**
- Create: `frontend/src/services/TenantAgentService.ts`
- Create: `frontend/src/views/Agents/index.tsx`
- Create: `frontend/src/views/Agents/Agents.tsx`
- Modify: `frontend/src/constants/feature.constant.ts`
- Modify: `frontend/src/configs/navigation.config/index.ts`
- Modify: `frontend/src/configs/routes.config/routes.config.ts`

**Interfaces:**
- Consumes: `GET /agents` (Task 5); `FEATURE_PERMISSIONS`-style pattern already established in `feature.constant.ts` (Plan 1).
- Produces: nothing consumed elsewhere in this plan — this is the terminal tenant-side page.

- [ ] **Step 1: Add the `agents` feature key**

Edit `frontend/src/constants/feature.constant.ts`:

```ts
export const FEATURE_AGENTS = 'agents'
```

- [ ] **Step 2: Create the tenant-side Agent service**

Create `frontend/src/services/TenantAgentService.ts`:

```ts
import ApiService from './ApiService'

export type TenantAgentCarrierStatus = {
    carrier_name: string
    os: 'android' | 'ios'
    status: string
}

export type TenantAgent = {
    id: number
    name: string
    brand_name: string
    status: string
    carrier_agents: TenantAgentCarrierStatus[]
}

export async function apiGetTenantAgents() {
    return ApiService.fetchDataWithAxios<{ data: TenantAgent[] }>({
        url: '/agents',
        method: 'get',
    })
}
```

- [ ] **Step 3: Create the Agents page**

Create `frontend/src/views/Agents/Agents.tsx`:

```tsx
import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiGetTenantAgents } from '@/services/TenantAgentService'
import type { TenantAgent } from '@/services/TenantAgentService'

const Agents = () => {
    const [agents, setAgents] = useState<TenantAgent[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        apiGetTenantAgents()
            .then((resp) => setAgents(resp.data || []))
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

    return (
        <Container className="py-2">
            <h3 className="mb-4">Agents</h3>
            {!isLoading && agents.length === 0 && (
                <Card>
                    <p className="text-gray-500 text-sm">
                        No agents have been set up for your account yet. Contact your platform
                        admin to get started.
                    </p>
                </Card>
            )}
            <div className="space-y-3">
                {agents.map((agent) => (
                    <Card key={agent.id} className="border border-gray-200 dark:border-gray-700/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold heading-text">{agent.name}</div>
                                <div className="text-xs text-gray-500">{agent.brand_name}</div>
                            </div>
                            <Tag>{agent.status}</Tag>
                        </div>
                        {agent.carrier_agents.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                {agent.carrier_agents.map((ca, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 font-medium"
                                    >
                                        {ca.carrier_name} ({ca.os === 'ios' ? 'iOS' : 'Android'}):{' '}
                                        {ca.status}
                                    </span>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </Container>
    )
}

export default Agents
```

Create `frontend/src/views/Agents/index.tsx`:

```tsx
export { default } from './Agents'
```

- [ ] **Step 4: Wire the tenant nav and route entries**

Edit `frontend/src/configs/navigation.config/index.ts`, adding the import and a third entry to `navigationConfig`:

```ts
import { FEATURE_PERMISSIONS, FEATURE_AGENTS } from '@/constants/feature.constant'
```

```ts
    {
        key: FEATURE_AGENTS,
        path: '/agents',
        title: 'Agents',
        translateKey: 'nav.agents',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [FEATURE_AGENTS],
        subMenu: [],
    },
```

Edit `frontend/src/configs/routes.config/routes.config.ts`, adding the import and a third entry to `protectedRoutes`:

```ts
import { FEATURE_PERMISSIONS, FEATURE_AGENTS } from '@/constants/feature.constant'
```

```ts
    {
        key: FEATURE_AGENTS,
        path: '/agents',
        component: lazy(() => import('@/views/Agents')),
        authority: [FEATURE_AGENTS],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
```

(Insert this entry before the `...othersRoute` spread, same as the existing `permissions` entry.)

- [ ] **Step 5: Verify the build succeeds**

```bash
cd frontend
npm run build 2>&1 | tail -10
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Add tenant-side read-only Agents page"
```

---

## Task 10: End-to-end verification

**Files:** none created — this task only verifies Tasks 1-9 work together.

- [ ] **Step 1: Run the full backend verification script**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/backend
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
USER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
TENANT_ID=$(curl -s http://127.0.0.1:8000/api/admin/tenants -H "Authorization: Bearer $ADMIN_TOKEN" | php -r "echo json_decode(file_get_contents('php://stdin'))->data[0]->id;")
JIO_ID=$(curl -s http://127.0.0.1:8000/api/admin/carriers -H "Authorization: Bearer $ADMIN_TOKEN" | php -r "\$d=json_decode(file_get_contents('php://stdin'))->data; foreach(\$d as \$c){if(\$c->code==='jio'){echo \$c->id;}}")

echo "--- Admin creates an Agent, adds Jio Android + iOS registrations, drives Android to Live ---"
AGENT_ID=$(curl -s -X POST http://127.0.0.1:8000/api/admin/agents -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"tenant_id\":$TENANT_ID,\"name\":\"E2E Bot\",\"brand_name\":\"E2E Brand\"}" | php -r "echo json_decode(file_get_contents('php://stdin'))->data->id;")
CA_ANDROID=$(curl -s -X POST "http://127.0.0.1:8000/api/admin/agents/$AGENT_ID/carrier-agents" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"carrier_id\":$JIO_ID,\"os\":\"android\"}" | php -r "echo json_decode(file_get_contents('php://stdin'))->data->id;")
CA_IOS=$(curl -s -X POST "http://127.0.0.1:8000/api/admin/agents/$AGENT_ID/carrier-agents" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"carrier_id\":$JIO_ID,\"os\":\"ios\"}" | php -r "echo json_decode(file_get_contents('php://stdin'))->data->id;")
curl -s -X POST "http://127.0.0.1:8000/api/admin/carrier-agents/$CA_ANDROID/transition" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"action":"submit"}' > /dev/null
curl -s -X POST "http://127.0.0.1:8000/api/admin/carrier-agents/$CA_ANDROID/transition" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"action":"approve"}' > /dev/null

echo "--- Agent derived status should be partially_live (Android Live, iOS still Draft) ---"
curl -s "http://127.0.0.1:8000/api/admin/agents/$AGENT_ID" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo "--- Demo User's read-only view shows the same tenant's agent and both carrier statuses, no mutation endpoints available ---"
curl -s http://127.0.0.1:8000/api/agents -H "Authorization: Bearer $USER_TOKEN"
echo ""

echo "--- Frontend dev server responds ---"
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/

kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
```

Expected: Agent detail's `status` is `partially_live`; Demo User's `GET /agents` shows the same agent with the Android registration `live` and the iOS one `draft`; frontend responds `200`.

- [ ] **Step 2: Manual browser check (describe to the user, no browser driver in this session)**

Sign in as `admin@rbm.local` — sidebar shows Admin Dashboard, Tenants, Carriers, Agents. Create a carrier, create an agent against the Demo Tenant, open its detail page, add a Jio Android registration, click through Submit → Approve → confirm it shows Live, then Suspend → Reinstate → Terminate, confirming at each step only the legal buttons for that status are visible.

Sign in as `owner@rbm.local` — sidebar now also shows "Agents" alongside Home and Team; opening it shows the agent created above with its per-carrier status badges, and no create/edit controls anywhere on the page.

Sign in as `team@rbm.local` — "Agents" does not appear in the sidebar, and navigating directly to `/agents` in the URL bar redirects away (same `owner_only` behavior already proven for Team's own page).

- [ ] **Step 3: Report to the user**

Summarize: `carriers`/`agents`/`carrier_agents` tables migrated and seeded (Jio/VI/Airtel); Admin can create agents for any tenant, register them per carrier+OS, and drive each registration through the full approved lifecycle via guarded action buttons; tenant User sees a read-only view of their own agents, Team does not (owner_only, same proof pattern as Team's own page); no real carrier API calls exist yet, matching the spec's Non-goals. `git push` remains a separate, explicit step.
