# Platform Bootstrap + Permissions Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Laravel API backend and the `ecme` TypeScript React SPA as sibling projects in this repo, wire them together with token-based auth, and implement the Permissions module (feature registry, per-sub-account grants, sidebar + route enforcement) end to end.

**Architecture:** `backend/` is a Laravel 12 API-only app (no Blade views, no Inertia). `frontend/` is the `ecme` theme's TypeScript starter, copied out of the gitignored `Project/Theme/` reference and adapted to call the real API instead of its built-in mock adapter. Auth is Laravel Sanctum **personal access tokens** (`Authorization: Bearer <token>`), not cookie-session auth — the theme's existing `AuthProvider`/`AxiosBase`/`AuthorityGuard` code already assumes a bearer token plus a `user.authority: string[]` array, so this is the zero-rework fit. Every module/page's access rule lives in one PHP config file (`config/features.php`); one shared `FeatureAccess` helper computes both "which features can this user see" (feeds `user.authority`) and "can this user hit this route" (feeds a Gate), so the check exists exactly once in the codebase per project convention.

**Tech Stack:** Laravel 12 (PHP 8.4, MySQL 8.4 via `pdo_mysql`), Laravel Sanctum (API tokens), React 19 + TypeScript + Vite (the `ecme` theme, already includes Zustand, axios, React Router 7).

## Global Constraints

- No automated test code in this pass (explicit user instruction) — every task's verification step is a concrete manual command (curl, `artisan tinker`, `mysql`, or a described browser check), never a PHPUnit/Jest suite.
- No git worktree — all work happens directly on `master` in this repo, per established project convention.
- Do not add a `Co-Authored-By` / `Claude-Session` trailer to any commit message in this repo.
- Do not `git push` as part of any task.
- Never duplicate the same permission-check logic at multiple call sites — both the sidebar-feeding endpoint and the route Gate call the one `FeatureAccess` helper (spec: `docs/superpowers/specs/2026-08-27-super-admin-carriers-agents-permissions-design.md`, permissions section).
- `Project/Theme/` is read-only reference material (gitignored) — copy from it into `frontend/`, never edit files inside `Project/` itself.
- DB credentials for local dev: host `127.0.0.1`, port `3306`, database `leminai-rbm`, username `leminai-rbm`, password `gT9S03b81F6UhC2MrxWF` (already confirmed working against the running MySQL server).
- Backend runs on `http://127.0.0.1:8000` (`php artisan serve`), frontend dev server on `http://localhost:5173` (`npm run dev`) — these exact ports are used verbatim in every task's config and verification steps.

---

## Task 1: Bootstrap the Laravel backend

**Files:**
- Create: `backend/` (entire Laravel 12 skeleton via Composer)
- Modify: `backend/.env`

**Interfaces:**
- Consumes: nothing from earlier tasks (first task).
- Produces: a running Laravel app at `backend/`, migrated `users`/`cache`/`jobs` tables in the `leminai-rbm` database — every later backend task adds to this app.

- [ ] **Step 1: Install Laravel**

Run from the repo root (`/home/leminai-rbm/htdocs/rbm.leminai.com/public`):

```bash
composer create-project laravel/laravel backend
```

- [ ] **Step 2: Configure `.env` for the local MySQL database**

Edit `backend/.env`, replacing the default `DB_*` block with:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=leminai-rbm
DB_USERNAME=leminai-rbm
DB_PASSWORD=gT9S03b81F6UhC2MrxWF
```

Also set:

```
APP_NAME="RBM Platform"
APP_URL=http://127.0.0.1:8000
```

- [ ] **Step 3: Run the default migrations**

```bash
cd backend
php artisan migrate
```

Expected: output ending in `Migrating: 0001_01_01_000000_create_users_table` ... `DONE` with no errors, for the `users`, `cache`, and `jobs` migrations.

- [ ] **Step 4: Verify against the database directly**

```bash
mysql -u 'leminai-rbm' -p'gT9S03b81F6UhC2MrxWF' -e "SHOW TABLES;" leminai-rbm
```

Expected: a table list including `users`, `cache`, `jobs`, `migrations`.

- [ ] **Step 5: Verify the app boots**

```bash
php artisan about
```

Expected: prints an "Environment" panel with no fatal errors, `Debug Mode: ENABLED`, `URL: http://127.0.0.1:8000`.

- [ ] **Step 6: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Bootstrap Laravel 12 backend"
```

---

## Task 2: API auth scaffolding (Sanctum) + Tenant/Owner schema

**Files:**
- Modify: `backend/routes/api.php` (created by `install:api`)
- Modify: `backend/bootstrap/app.php`
- Create: `backend/database/migrations/xxxx_create_tenants_table.php`
- Create: `backend/database/migrations/xxxx_add_tenant_and_owner_columns_to_users_table.php`
- Modify: `backend/app/Models/User.php`
- Create: `backend/app/Models/Tenant.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Consumes: the Laravel app from Task 1.
- Produces: `User::HasApiTokens` (used by Task 4's login controller), `users.tenant_id`/`users.is_owner` columns and `Tenant` model (used by every later task that scopes data to a tenant), one seeded Owner login (`owner@rbm.local` / `Owner!12345`) used for manual verification in every later task.

- [ ] **Step 1: Install Sanctum + API routing**

```bash
cd backend
php artisan install:api
```

Expected: installs `laravel/sanctum`, creates `routes/api.php`, publishes and runs the Sanctum `personal_access_tokens` migration automatically (confirm with the `mysql` command from Task 1 Step 4 — `personal_access_tokens` should now be listed).

- [ ] **Step 2: Create the `tenants` table migration**

```bash
php artisan make:migration create_tenants_table
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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
```

- [ ] **Step 3: Add `tenant_id` and `is_owner` to `users`**

```bash
php artisan make:migration add_tenant_and_owner_columns_to_users_table --table=users
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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->boolean('is_owner')->default(false)->after('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropColumn('is_owner');
        });
    }
};
```

- [ ] **Step 4: Create the `Tenant` model**

Create `backend/app/Models/Tenant.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
```

- [ ] **Step 5: Update the `User` model**

Replace `backend/app/Models/User.php` with:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'is_owner',
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_owner' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
```

- [ ] **Step 6: Seed one Tenant and one Owner**

Replace `backend/database/seeders/DatabaseSeeder.php` with:

```php
<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Tenant']);

        User::create([
            'tenant_id' => $tenant->id,
            'is_owner' => true,
            'name' => 'Demo Owner',
            'email' => 'owner@rbm.local',
            'password' => Hash::make('Owner!12345'),
        ]);
    }
}
```

- [ ] **Step 7: Run migrations and seed**

```bash
php artisan migrate:fresh --seed
```

Expected: all migrations re-run cleanly, ends with `Database\Seeders\DatabaseSeeder ..... RUNNING` / `DONE`.

- [ ] **Step 8: Verify the seeded data**

```bash
mysql -u 'leminai-rbm' -p'gT9S03b81F6UhC2MrxWF' leminai-rbm -e "SELECT u.id, u.email, u.is_owner, t.name FROM users u JOIN tenants t ON t.id = u.tenant_id;"
```

Expected: one row — `owner@rbm.local`, `is_owner = 1`, tenant name `Demo Tenant`.

- [ ] **Step 9: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add Sanctum API auth scaffolding and Tenant/Owner schema"
```

---

## Task 3: Feature registry, permission grants, and the shared Gate

**Files:**
- Create: `backend/config/features.php`
- Create: `backend/database/migrations/xxxx_create_sub_account_permissions_table.php`
- Create: `backend/app/Support/FeatureAccess.php`
- Create: `backend/app/Http/Middleware/EnsureIsOwner.php`
- Modify: `backend/bootstrap/app.php`
- Modify: `backend/app/Providers/AppServiceProvider.php`

**Interfaces:**
- Consumes: `User` model and its `is_owner` column from Task 2.
- Produces: `FeatureAccess::grantedKeys(User $user): array` (used by Task 4's login response and Task 6's `/api/features` endpoint), `FeatureAccess::allows(User $user, string $key): bool` (used by the `access-feature` Gate, which Task 5's sub-account routes and Task 6's protected routes both wrap with `middleware('can:access-feature,<key>')`), the `is-owner` middleware alias (used by Task 5's sub-account management routes).

- [ ] **Step 1: Define the feature registry**

Create `backend/config/features.php`:

```php
<?php

return [
    [
        'key' => 'dashboard',
        'label' => 'Dashboard',
        'route' => '/home',
        'sidebar' => true,
        'public' => true,
    ],
    [
        'key' => 'permissions',
        'label' => 'Sub-Accounts & Permissions',
        'route' => '/permissions',
        'sidebar' => true,
        'public' => false,
    ],
];
```

A `public: true` entry is visible/accessible to every authenticated user regardless of grants. `public: false` entries require a matching row in `sub_account_permissions` (Owners bypass this check entirely).

- [ ] **Step 2: Create the permission-grants table**

```bash
cd backend
php artisan make:migration create_sub_account_permissions_table
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
        Schema::create('sub_account_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('feature_key');
            $table->timestamps();

            $table->unique(['user_id', 'feature_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_account_permissions');
    }
};
```

- [ ] **Step 3: Create the shared `FeatureAccess` helper**

Create `backend/app/Support/FeatureAccess.php`:

```php
<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class FeatureAccess
{
    /**
     * All feature keys this user is currently granted — public features,
     * plus explicit grants, plus everything if the user is an Owner.
     *
     * @return string[]
     */
    public static function grantedKeys(User $user): array
    {
        $registry = config('features');

        if ($user->is_owner) {
            return array_column($registry, 'key');
        }

        $granted = DB::table('sub_account_permissions')
            ->where('user_id', $user->id)
            ->pluck('feature_key')
            ->all();

        $publicKeys = array_column(array_filter($registry, fn ($f) => $f['public']), 'key');

        return array_values(array_unique([...$publicKeys, ...$granted]));
    }

    public static function allows(User $user, string $key): bool
    {
        return in_array($key, self::grantedKeys($user), true);
    }
}
```

`config('features')` returns the array from `config/features.php` directly — Laravel keys a config file's return value under its filename (`features`), so the list of entries defined in Step 1 comes back as-is, no nesting. Confirm with the `artisan tinker` check in Step 6.

- [ ] **Step 4: Register the Gate**

Edit `backend/app/Providers/AppServiceProvider.php`, adding the import and the `boot()` body:

```php
<?php

namespace App\Providers;

use App\Models\User;
use App\Support\FeatureAccess;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::define('access-feature', fn (User $user, string $key) => FeatureAccess::allows($user, $key));
    }
}
```

- [ ] **Step 5: Create the `EnsureIsOwner` middleware and register its alias**

```bash
php artisan make:middleware EnsureIsOwner
```

Replace `backend/app/Http/Middleware/EnsureIsOwner.php` with:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_owner) {
            abort(403, 'Owner access required.');
        }

        return $next($request);
    }
}
```

Edit `backend/bootstrap/app.php`, adding the alias inside the `->withMiddleware()` callback (create the callback if the skeleton's default is `->withMiddleware(function (Middleware $middleware) {\n    //\n})`):

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'is-owner' => \App\Http\Middleware\EnsureIsOwner::class,
    ]);
})
```

- [ ] **Step 6: Run the migration and verify the helper in `tinker`**

```bash
php artisan migrate
php artisan tinker --execute="dd(App\Support\FeatureAccess::grantedKeys(App\Models\User::first()));"
```

Expected: an array containing `"dashboard"` and `"permissions"` (the seeded user from Task 2 is the Owner, so gets every key).

- [ ] **Step 7: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add feature registry, permission grants table, and shared FeatureAccess Gate"
```

---

## Task 4: Sign-in / sign-out endpoints

**Files:**
- Create: `backend/app/Http/Controllers/Api/AuthController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `FeatureAccess::grantedKeys()` from Task 3, `User::createToken()` from Task 2's Sanctum install.
- Produces: `POST /api/sign-in` and `POST /api/sign-out`, matching the `ecme` theme's existing `SignInResponse` TypeScript type exactly (`{ token, user: { userId, userName, authority, avatar, email } }`) — Task 8 points the frontend at these with zero type changes.

- [ ] **Step 1: Create the controller**

```bash
cd backend
php artisan make:controller Api/AuthController
```

Replace `backend/app/Http/Controllers/Api/AuthController.php` with:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\FeatureAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function signIn(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'userId' => (string) $user->id,
                'userName' => $user->name,
                'authority' => FeatureAccess::grantedKeys($user),
                'avatar' => '',
                'email' => $user->email,
            ],
        ]);
    }

    public function signOut(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['status' => 'ok']);
    }
}
```

- [ ] **Step 2: Register the routes**

Edit `backend/routes/api.php`, adding:

```php
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/sign-in', [AuthController::class, 'signIn']);
Route::middleware('auth:sanctum')->post('/sign-out', [AuthController::class, 'signOut']);
```

- [ ] **Step 3: Verify sign-in with curl**

```bash
php artisan serve &
sleep 1
curl -s -X POST http://127.0.0.1:8000/api/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@rbm.local","password":"Owner!12345"}'
kill %1
```

Expected: a JSON body with a non-empty `token` string and `user.authority` containing `["dashboard","permissions"]`.

- [ ] **Step 4: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add sign-in/sign-out API endpoints"
```

---

## Task 5: Sub-account management API (Owner-only)

**Files:**
- Create: `backend/app/Http/Controllers/Api/SubAccountController.php`
- Create: `backend/app/Http/Controllers/Api/FeatureController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `EnsureIsOwner` middleware and `FeatureAccess` from Task 3, `User`/`Tenant` from Task 2.
- Produces: `GET /api/features` (the full registry, minus `public` entries which need no grant UI), `GET /api/sub-accounts`, `POST /api/sub-accounts`, `PUT /api/sub-accounts/{user}/permissions` — all consumed by Task 8's Permissions page.

- [ ] **Step 1: Create the features listing controller**

```bash
cd backend
php artisan make:controller Api/FeatureController
```

Replace `backend/app/Http/Controllers/Api/FeatureController.php` with:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class FeatureController extends Controller
{
    public function index()
    {
        $grantable = array_values(array_filter(config('features'), fn ($f) => ! $f['public']));

        return response()->json(['data' => $grantable]);
    }
}
```

- [ ] **Step 2: Create the sub-account controller**

```bash
php artisan make:controller Api/SubAccountController
```

Replace `backend/app/Http/Controllers/Api/SubAccountController.php` with:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SubAccountController extends Controller
{
    public function index(Request $request)
    {
        $subAccounts = User::where('tenant_id', $request->user()->tenant_id)
            ->where('is_owner', false)
            ->get(['id', 'name', 'email']);

        $subAccounts->each(function (User $user) {
            $user->permissions = DB::table('sub_account_permissions')
                ->where('user_id', $user->id)
                ->pluck('feature_key');
        });

        return response()->json(['data' => $subAccounts]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'tenant_id' => $request->user()->tenant_id,
            'is_owner' => false,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        return response()->json(['data' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]], 201);
    }

    public function updatePermissions(Request $request, User $user)
    {
        abort_if($user->tenant_id !== $request->user()->tenant_id, 404);

        $data = $request->validate([
            'feature_keys' => ['array'],
            'feature_keys.*' => ['string'],
        ]);

        DB::table('sub_account_permissions')->where('user_id', $user->id)->delete();

        $rows = array_map(fn ($key) => [
            'user_id' => $user->id,
            'feature_key' => $key,
            'created_at' => now(),
            'updated_at' => now(),
        ], $data['feature_keys'] ?? []);

        if ($rows) {
            DB::table('sub_account_permissions')->insert($rows);
        }

        return response()->json(['data' => ['feature_keys' => $data['feature_keys'] ?? []]]);
    }
}
```

- [ ] **Step 3: Register the routes**

Edit `backend/routes/api.php`, adding:

```php
use App\Http\Controllers\Api\FeatureController;
use App\Http\Controllers\Api\SubAccountController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/features', [FeatureController::class, 'index']);

    Route::middleware('is-owner')->group(function () {
        Route::get('/sub-accounts', [SubAccountController::class, 'index']);
        Route::post('/sub-accounts', [SubAccountController::class, 'store']);
        Route::put('/sub-accounts/{user}/permissions', [SubAccountController::class, 'updatePermissions']);
    });
});
```

- [ ] **Step 4: Verify with curl (Owner token)**

```bash
php artisan serve &
sleep 1
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

curl -s http://127.0.0.1:8000/api/features -H "Authorization: Bearer $TOKEN"
echo ""
curl -s -X POST http://127.0.0.1:8000/api/sub-accounts -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Staff One","email":"staff1@rbm.local","password":"Staff!12345"}'
echo ""
curl -s http://127.0.0.1:8000/api/sub-accounts -H "Authorization: Bearer $TOKEN"
kill %1
```

Expected: `/api/features` returns the `permissions` entry only (not `dashboard`, since it's `public`); the `POST` returns a 201 with the new user's id; the final `GET` lists `staff1@rbm.local` with an empty `permissions` array.

- [ ] **Step 5: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add sub-account management API"
```

---

## Task 6: CORS + protecting a real route with the Gate

**Files:**
- Create: `backend/config/cors.php` (if not already published by the skeleton — Laravel 12 ships one by default; if it exists, modify it)
- Modify: `backend/routes/api.php`
- Create: `backend/app/Http/Controllers/Api/PingController.php`

**Interfaces:**
- Consumes: the `access-feature` Gate from Task 3.
- Produces: a concrete example of the `can:access-feature,<key>` pattern (`GET /api/permissions/ping`) that Task 8's frontend calls to prove the Gate blocks ungranted sub-accounts — every future gated module route follows this exact pattern.

- [ ] **Step 1: Confirm/set CORS to allow the Vite dev origin**

Open `backend/config/cors.php` (Laravel 12 ships this by default). Ensure:

```php
'paths' => ['api/*'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:5173'],
'allowed_headers' => ['*'],
'supports_credentials' => false,
```

(`supports_credentials` stays `false` — this is bearer-token auth, not cookie auth, so no credentialed CORS mode is needed.)

- [ ] **Step 2: Add a Gate-protected example route**

```bash
cd backend
php artisan make:controller Api/PingController
```

Replace `backend/app/Http/Controllers/Api/PingController.php` with:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class PingController extends Controller
{
    public function permissions()
    {
        return response()->json(['message' => 'permissions module reachable']);
    }
}
```

Edit `backend/routes/api.php`, adding inside the existing `auth:sanctum` group from Task 5:

```php
use App\Http\Controllers\Api\PingController;

Route::middleware('can:access-feature,permissions')->get('/permissions/ping', [PingController::class, 'permissions']);
```

- [ ] **Step 3: Verify the Gate actually blocks an ungranted sub-account**

```bash
php artisan serve &
sleep 1
STAFF_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"staff1@rbm.local","password":"Staff!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/permissions/ping -H "Authorization: Bearer $STAFF_TOKEN"
kill %1
```

Expected: `403` (staff1 has no `permissions` grant yet). This proves route access is denied, not just hidden — the core claim of the Permissions module design.

- [ ] **Step 4: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add CORS config and a Gate-protected example route"
```

---

## Task 7: Bootstrap the frontend from the `ecme` theme reference

**Files:**
- Create: `frontend/` (copied from `Project/Theme/TypeScript/starter/`)
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/configs/app.config.ts`

**Interfaces:**
- Consumes: nothing from backend tasks directly (parallel-safe with Tasks 2-6, sequenced last here for a clean commit order).
- Produces: a running Vite dev server at `http://localhost:5173`, proxying `/api` to the backend — every later frontend task builds on this.

- [ ] **Step 1: Copy the theme reference into a tracked project folder**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
cp -r "Project/Theme/TypeScript/starter/." frontend/
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend
npm install
```

- [ ] **Step 3: Point the dev-server proxy at the Laravel backend**

Edit `frontend/vite.config.ts`, changing the proxy target:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      secure: false
    }
  }
},
```

- [ ] **Step 4: Switch off the mock API and fix the token storage strategy**

Edit `frontend/src/configs/app.config.ts`:

```ts
const appConfig: AppConfig = {
    apiPrefix: '/api',
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'en',
    accessTokenPersistStrategy: 'localStorage',
    enableMock: false,
    activeNavTranslation: false,
}
```

(`localStorage` is required, not `cookies` — the existing `AxiosRequestIntrceptorConfigCallback` only attaches the `Authorization: Bearer` header for the `localStorage`/`sessionStorage` strategies, and this app uses bearer-token auth, not cookie-session auth.)

- [ ] **Step 5: Verify the dev server boots and builds**

```bash
npm run build
```

Expected: `vite build` completes with a `build/` output directory and no errors.

```bash
npm run dev &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173
kill %1
```

Expected: `200`.

- [ ] **Step 6: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Bootstrap frontend from the ecme TypeScript theme"
```

---

## Task 8: Wire real endpoints and build the Sub-Accounts & Permissions page

**Files:**
- Modify: `frontend/src/configs/navigation.config/index.ts`
- Modify: `frontend/src/configs/routes.config/routes.config.ts`
- Create: `frontend/src/services/SubAccountService.ts`
- Create: `frontend/src/views/Permissions/index.tsx`
- Delete: the demo views/routes the theme ships with (`SingleMenuView`, `CollapseMenuItemView1/2`, `GroupSingleMenuItemView`, `GroupCollapseMenuItemView1/2` and their nav/route entries)

**Interfaces:**
- Consumes: `SignInResponse`/`User` types (unchanged) from the theme, `GET /api/features`, `GET/POST /api/sub-accounts`, `PUT /api/sub-accounts/{id}/permissions` from Tasks 4-5.
- Produces: the working admin UI — the deliverable this whole plan builds toward.

- [ ] **Step 1: Point sign-in/sign-out at the real endpoints**

`frontend/src/configs/endpoint.config.ts` already uses `/sign-in` and `/sign-out`, matching Task 4's routes exactly — no change needed. Confirm by reading the file and checking `signIn: '/sign-in'`, `signOut: '/sign-out'` are present.

- [ ] **Step 2: Replace the demo navigation with real entries**

Replace `frontend/src/configs/navigation.config/index.ts` with:

```ts
import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'
import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'home',
        path: '/home',
        title: 'Home',
        translateKey: 'nav.home',
        icon: 'home',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'permissions',
        path: '/permissions',
        title: 'Sub-Accounts & Permissions',
        translateKey: 'nav.permissions',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: ['permissions'],
        subMenu: [],
    },
]

export default navigationConfig
```

- [ ] **Step 3: Replace the demo protected routes with real entries**

Replace `frontend/src/configs/routes.config/routes.config.ts` with:

```ts
import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: [],
    },
    {
        key: 'permissions',
        path: '/permissions',
        component: lazy(() => import('@/views/Permissions')),
        authority: ['permissions'],
    },
    ...othersRoute,
]
```

- [ ] **Step 4: Delete the now-unreferenced demo view files**

```bash
cd frontend
rm -rf src/views/demo/SingleMenuView.tsx src/views/demo/CollapseMenuItemView1.tsx src/views/demo/CollapseMenuItemView2.tsx src/views/demo/GroupSingleMenuItemView.tsx src/views/demo/GroupCollapseMenuItemView1.tsx src/views/demo/GroupCollapseMenuItemView2.tsx
```

(If any filename differs slightly, `ls src/views/demo` first and delete what's actually there — these were only referenced by the navigation/routes config just replaced, so nothing else imports them.)

- [ ] **Step 5: Add the sub-account service**

Create `frontend/src/services/SubAccountService.ts`:

```ts
import ApiService from './ApiService'

export type Feature = {
    key: string
    label: string
    route: string
    sidebar: boolean
    public: boolean
}

export type SubAccount = {
    id: number
    name: string
    email: string
    permissions: string[]
}

export async function apiGetFeatures() {
    return ApiService.fetchDataWithAxios<{ data: Feature[] }>({
        url: '/features',
        method: 'get',
    })
}

export async function apiGetSubAccounts() {
    return ApiService.fetchDataWithAxios<{ data: SubAccount[] }>({
        url: '/sub-accounts',
        method: 'get',
    })
}

export async function apiCreateSubAccount(data: {
    name: string
    email: string
    password: string
}) {
    return ApiService.fetchDataWithAxios<{ data: SubAccount }>({
        url: '/sub-accounts',
        method: 'post',
        data,
    })
}

export async function apiUpdateSubAccountPermissions(
    userId: number,
    featureKeys: string[],
) {
    return ApiService.fetchDataWithAxios<{ data: { feature_keys: string[] } }>({
        url: `/sub-accounts/${userId}/permissions`,
        method: 'put',
        data: { feature_keys: featureKeys },
    })
}
```

- [ ] **Step 6: Build the Permissions page**

Create `frontend/src/views/Permissions/index.tsx`:

```tsx
import { useEffect, useState } from 'react'
import {
    apiGetFeatures,
    apiGetSubAccounts,
    apiCreateSubAccount,
    apiUpdateSubAccountPermissions,
    type Feature,
    type SubAccount,
} from '@/services/SubAccountService'

const Permissions = () => {
    const [features, setFeatures] = useState<Feature[]>([])
    const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const load = async () => {
        const [featuresResp, subAccountsResp] = await Promise.all([
            apiGetFeatures(),
            apiGetSubAccounts(),
        ])
        setFeatures(featuresResp.data)
        setSubAccounts(subAccountsResp.data)
    }

    useEffect(() => {
        load()
    }, [])

    const createSubAccount = async () => {
        await apiCreateSubAccount({ name, email, password })
        setName('')
        setEmail('')
        setPassword('')
        await load()
    }

    const toggle = async (subAccount: SubAccount, key: string) => {
        const has = subAccount.permissions.includes(key)
        const next = has
            ? subAccount.permissions.filter((k) => k !== key)
            : [...subAccount.permissions, key]
        await apiUpdateSubAccountPermissions(subAccount.id, next)
        await load()
    }

    return (
        <div>
            <h3>Create sub-account</h3>
            <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={createSubAccount}>Create</button>

            <h3>Sub-accounts</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        {features.map((f) => (
                            <th key={f.key}>{f.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {subAccounts.map((sa) => (
                        <tr key={sa.id}>
                            <td>{sa.name}</td>
                            <td>{sa.email}</td>
                            {features.map((f) => (
                                <td key={f.key}>
                                    <input
                                        type="checkbox"
                                        checked={sa.permissions.includes(
                                            f.key,
                                        )}
                                        onChange={() => toggle(sa, f.key)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Permissions
```

- [ ] **Step 7: Verify the build still succeeds**

```bash
npm run build
```

Expected: completes with no TypeScript errors (confirms no leftover imports of the deleted demo views).

- [ ] **Step 8: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Wire real API endpoints and build the Sub-Accounts & Permissions page"
```

---

## Task 9: End-to-end manual verification

**Files:** none created — this task only verifies Tasks 1-8 work together.

**Interfaces:**
- Consumes: the full running system from every earlier task.
- Produces: nothing — the plan's closing check before handing back to the user.

Run this as **one continuous shell script** (background job numbers and shell variables from `cd`/`&` do not survive across separate command invocations, only within one running shell):

- [ ] **Step 1: Run the full verification script**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/backend && php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/frontend && npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

echo "--- Owner sign-in ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}'
echo ""

OWNER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

echo "--- Fresh sub-account sign-in (before any grant) ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"staff1@rbm.local","password":"Staff!12345"}'
echo ""

STAFF_ID=$(mysql -N -u 'leminai-rbm' -p'gT9S03b81F6UhC2MrxWF' leminai-rbm -e "SELECT id FROM users WHERE email='staff1@rbm.local';")

echo "--- Granting the 'permissions' feature to the sub-account ---"
curl -s -X PUT "http://127.0.0.1:8000/api/sub-accounts/$STAFF_ID/permissions" \
  -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" \
  -d '{"feature_keys":["permissions"]}'
echo ""

echo "--- Sub-account sign-in after the grant ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"staff1@rbm.local","password":"Staff!12345"}'
echo ""

kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
```

Expected, in order: Owner's `user.authority` is `["dashboard","permissions"]`; the fresh sub-account's `user.authority` is `["dashboard"]` only (before the grant); the `PUT` returns `{"data":{"feature_keys":["permissions"]}}`; the final sign-in's `user.authority` now includes `"permissions"` too — confirming grant/revoke actually changes what a sign-in returns, end to end. (In the actual browser app, the same `user.authority` values drive the theme's built-in `AuthorityGuard`: the fresh sub-account's sidebar shows only "Home," and navigating directly to `http://localhost:5173/permissions` redirects to `/access-denied` — no custom frontend code needed for that, per Task 8.)

- [ ] **Step 2: Report to the user**

Summarize: backend (`backend/`) and frontend (`frontend/`) are both running Laravel 12 + the `ecme` TypeScript theme; Owner login, sub-account creation, and feature-key grant/revoke are verified end-to-end via curl; the theme's built-in `AuthorityGuard`/`useAuthority` mechanism enforces both sidebar visibility and direct-URL route access from the same `user.authority` array with no custom frontend permission code. Remind the user this is all local (`127.0.0.1`/`localhost`) — no deployment/hosting config is in scope here.

---

## Task 10: Update root `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing.
- Produces: accurate onboarding notes for the next session — this repo now has real application code, not just the docs vault.

- [ ] **Step 1: Add a "Running the app" section**

Edit `CLAUDE.md`, adding after the existing "Reference material" section:

```markdown
## Running the app

- `backend/` — Laravel 12 API (PHP 8.4). `cd backend && php artisan serve` runs it on `http://127.0.0.1:8000`. DB credentials are in `backend/.env` (gitignored), pointing at the local `leminai-rbm` MySQL database.
- `frontend/` — the `ecme` TypeScript React SPA (Vite). `cd frontend && npm run dev` runs it on `http://localhost:5173`, proxying `/api` to the backend. Auth is Sanctum bearer tokens, not cookie sessions.
- Feature/permission gating lives in one place on each side: `backend/config/features.php` + `backend/app/Support/FeatureAccess.php` (backend), and the `authority` field on nav/route entries in `frontend/src/configs/` (frontend, using the theme's built-in `AuthorityGuard`).
```

- [ ] **Step 2: Verify**

```bash
grep -A3 "## Running the app" CLAUDE.md
```

Expected: the section prints with both bullet points intact.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Document backend/frontend structure in CLAUDE.md"
```
