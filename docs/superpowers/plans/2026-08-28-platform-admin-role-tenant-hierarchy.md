# Platform Admin Role & Tenant Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a genuine platform-level Admin role (distinct from tenant-scoped Users), and lay the minimum tenant-hierarchy data shape White Label will eventually need — without building White Label itself. Unblocks the Carriers & Agents plan, which needs to know who manages carriers/rate cards/agents.

**Architecture:** One new boolean (`users.is_admin`) plus two new columns on `tenants` (`parent_tenant_id`, `is_white_label`), a middleware mirroring the existing `is-owner` pattern exactly, and a frontend that renders two entirely separate nav/route trees based on a new `isAdmin` field in the auth payload — never a single filtered list, since Admin and tenant User experiences share nothing. The existing Team/Permissions system (`is_owner`, `FeatureAccess`, `sub_account_permissions`) is completely untouched.

**Tech Stack:** Laravel 13 (PHP 8.4, MySQL), React 19 + TypeScript (the `ecme` theme), same stack as Plan 1.

**Spec:** `docs/superpowers/specs/2026-08-28-platform-admin-role-tenant-hierarchy-design.md`

## Global Constraints

- No automated test code in this pass — every task's verification step is a concrete manual command (curl, `artisan tinker`, `mysql`, `npm run build`), matching this project's established convention.
- Do not add a `Co-Authored-By` / `Claude-Session` trailer to any commit message in this repo.
- Do not `git push` as part of any task.
- "Owner" must never appear in new UI copy, code comments, or commit messages — say "User." The existing `is_owner` database column name is kept as-is (internal-only, never seen by a human) — see spec's Terminology section.
- DB credentials are already in `backend/.env` (gitignored) from Plan 1. Any command needing them reads via shell command substitution (`` $(grep DB_USERNAME backend/.env | cut -d= -f2) ``) — never re-embed the raw password as a literal string in this plan file, a command, or a commit message.
- Backend runs on `http://127.0.0.1:8000` (`php artisan serve`), frontend on `http://localhost:5173` (`npm run dev`) — same as Plan 1.
- The tenant hierarchy is capped at one level (a tenant with `parent_tenant_id` set can never itself have `is_white_label = true` or children) — this pass adds the columns only; no endpoint exists yet that could violate the cap, so there is no enforcement code to write here (see spec's Data model section).

---

## Task 1: Backend — Admin role (schema, middleware, seed, payload, example route)

**Files:**
- Create: `backend/database/migrations/xxxx_add_is_admin_to_users_table.php`
- Create: `backend/app/Http/Middleware/EnsureIsAdmin.php`
- Modify: `backend/bootstrap/app.php`
- Modify: `backend/app/Http/Controllers/Api/AuthController.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `EnsureIsOwner` middleware pattern and `AuthController::userPayload()` from Plan 1 (this task extends both).
- Produces: `users.is_admin` column, `is-admin` middleware alias, `isAdmin` field in every sign-in/`/api/user` response, a seeded `admin@rbm.local` account, and a `GET /admin/ping` example route (mirrors Plan 1's `/permissions/ping` pattern) — proves the gate works both directions before any real admin page exists.

- [ ] **Step 1: Create the `is_admin` migration**

```bash
cd backend
php artisan make:migration add_is_admin_to_users_table --table=users
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
            $table->boolean('is_admin')->default(false)->after('is_owner');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
```

- [ ] **Step 2: Add `is_admin` to the `User` model**

Edit `backend/app/Models/User.php`, adding `is_admin` to `$fillable` and its cast:

```php
    protected $fillable = [
        'tenant_id',
        'is_owner',
        'is_admin',
        'name',
        'email',
        'password',
    ];
```

```php
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_owner' => 'boolean',
            'is_admin' => 'boolean',
        ];
    }
```

- [ ] **Step 3: Create the `EnsureIsAdmin` middleware**

```bash
php artisan make:middleware EnsureIsAdmin
```

Replace `backend/app/Http/Middleware/EnsureIsAdmin.php` with:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_admin) {
            abort(403, 'Admin access required.');
        }

        return $next($request);
    }
}
```

- [ ] **Step 4: Register the `is-admin` alias**

Edit `backend/bootstrap/app.php`, adding to the existing `->withMiddleware()` callback's `alias([...])` array (do not create a second callback):

```php
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'is-owner' => \App\Http\Middleware\EnsureIsOwner::class,
            'is-admin' => \App\Http\Middleware\EnsureIsAdmin::class,
        ]);
    })
```

- [ ] **Step 5: Add `isAdmin` to the shared user-payload helper**

Edit `backend/app/Http/Controllers/Api/AuthController.php`'s `userPayload()` method:

```php
    /**
     * @return array{userId: string, userName: string, authority: string[], avatar: string, email: string, isAdmin: bool}
     */
    private function userPayload(User $user): array
    {
        return [
            'userId' => (string) $user->id,
            'userName' => $user->name,
            'authority' => FeatureAccess::grantedKeys($user),
            'avatar' => '',
            'email' => $user->email,
            'isAdmin' => (bool) $user->is_admin,
        ];
    }
```

Both `signIn()` and `me()` already call this helper, so both responses pick up `isAdmin` automatically — no other change needed in this file.

- [ ] **Step 6: Seed an Admin account**

Edit `backend/database/seeders/DatabaseSeeder.php`, adding after the existing User creation:

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
            'is_admin' => false,
            'name' => 'Demo User',
            'email' => 'owner@rbm.local',
            'password' => Hash::make('Owner!12345'),
        ]);

        User::create([
            'tenant_id' => null,
            'is_owner' => false,
            'is_admin' => true,
            'name' => 'Platform Admin',
            'email' => 'admin@rbm.local',
            'password' => Hash::make('Admin!12345'),
        ]);
    }
}
```

(`Demo User`'s display name is corrected from `Demo Owner` here too, per the spec's terminology rule — it's seed data, safe to rename since it's not referenced by any test or external system.)

- [ ] **Step 7: Add a Gate-protected example admin route**

Edit `backend/routes/api.php`, adding a new `is-admin`-gated group (as a sibling of the existing `auth:sanctum` group, not nested inside it — mirrors how `/permissions/ping` sits inside `auth:sanctum` only):

```php
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FeatureController;
use App\Http\Controllers\Api\PingController;
use App\Http\Controllers\Api\SubAccountController;
use Illuminate\Support\Facades\Route;

Route::post('/sign-in', [AuthController::class, 'signIn']);
Route::middleware('auth:sanctum')->post('/sign-out', [AuthController::class, 'signOut']);
Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'me']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/features', [FeatureController::class, 'index']);

    Route::middleware('can:access-feature,"permissions"')->get('/permissions/ping', [PingController::class, 'permissions']);

    Route::middleware('is-owner')->group(function () {
        Route::get('/sub-accounts', [SubAccountController::class, 'index']);
        Route::post('/sub-accounts', [SubAccountController::class, 'store']);
        Route::put('/sub-accounts/{user}/permissions', [SubAccountController::class, 'updatePermissions']);
    });

    Route::middleware('is-admin')->get('/admin/ping', [PingController::class, 'admin']);
});
```

Edit `backend/app/Http/Controllers/Api/PingController.php`, adding a sibling method to the existing `permissions()` method:

```php
    public function admin()
    {
        return response()->json(['message' => 'admin module reachable']);
    }
```

- [ ] **Step 8: Run the migration, re-seed, and verify with curl**

```bash
php artisan migrate:fresh --seed
```

Expected: all migrations re-run cleanly, seeder completes with no errors.

```bash
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

echo "--- Admin sign-in ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}'
echo ""

ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

echo "--- Demo User sign-in (unchanged behavior, isAdmin should be false) ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}'
echo ""

USER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

echo "--- Admin hits /admin/ping (expect 200) ---"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/admin/ping -H "Authorization: Bearer $ADMIN_TOKEN"

echo "--- Demo User hits /admin/ping (expect 403) ---"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/admin/ping -H "Authorization: Bearer $USER_TOKEN"

kill "$BACKEND_PID" 2>/dev/null
```

Expected, in order: Admin's sign-in JSON has `"isAdmin":true` and `"authority":[]` (Admin has no tenant, so `FeatureAccess::grantedKeys()` — unchanged from Plan 1 — returns nothing, since Admin never matches the `is_owner` bypass and has no `sub_account_permissions` rows); Demo User's sign-in JSON has `"isAdmin":false` with `"authority":["dashboard","permissions"]` unchanged from Plan 1; `/admin/ping` returns `200` for Admin and `403` for the Demo User.

- [ ] **Step 9: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add platform Admin role: is_admin column, EnsureIsAdmin middleware, seed account, and an example gated route"
```

---

## Task 2: Backend — Tenant hierarchy columns

**Files:**
- Create: `backend/database/migrations/xxxx_add_hierarchy_columns_to_tenants_table.php`
- Modify: `backend/app/Models/Tenant.php`

**Interfaces:**
- Consumes: nothing from Task 1 (independent — different table, no shared code).
- Produces: `tenants.parent_tenant_id` / `tenants.is_white_label` columns, both indexed, plus `Tenant::parent()`/`Tenant::children()` relations — consumed by nothing yet in this plan (no UI/API endpoint mutates or reads these in this pass, per the spec's explicit scope), but this is the data shape the future White Label module builds on.

- [ ] **Step 1: Create the migration**

```bash
cd backend
php artisan make:migration add_hierarchy_columns_to_tenants_table --table=tenants
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
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('parent_tenant_id')
                ->nullable()
                ->after('name')
                ->constrained('tenants')
                ->nullOnDelete();
            $table->boolean('is_white_label')->default(false)->after('parent_tenant_id');

            $table->index('is_white_label');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_tenant_id');
            $table->dropColumn('is_white_label');
        });
    }
};
```

Note: `foreignId('parent_tenant_id')->constrained('tenants')` already creates the index MySQL needs to back that foreign key — no separate `$table->index('parent_tenant_id')` call is needed (a duplicate index adds write overhead for no read benefit). Only `is_white_label` needs its own explicit index, since it isn't a foreign key.

- [ ] **Step 2: Add hierarchy relations to the `Tenant` model**

Replace `backend/app/Models/Tenant.php` with:

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

    protected $fillable = ['name', 'parent_tenant_id', 'is_white_label'];

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
}
```

- [ ] **Step 3: Run the migration and verify the relations in `tinker`**

```bash
cd backend
php artisan migrate
php artisan tinker --execute="
\$reseller = App\Models\Tenant::create(['name' => 'Test Reseller', 'is_white_label' => true]);
\$sub = App\Models\Tenant::create(['name' => 'Test Sub-Tenant', 'parent_tenant_id' => \$reseller->id]);
dump('sub->parent->name: ' . \$sub->parent->name);
dump('reseller->children count: ' . \$reseller->children()->count());
dump('reseller->children->first->name: ' . \$reseller->children->first()->name);
\$sub->delete();
\$reseller->delete();
"
```

Expected output includes `sub->parent->name: Test Reseller`, `reseller->children count: 1`, `reseller->children->first->name: Test Sub-Tenant` — confirms both relations resolve correctly. The test rows are deleted at the end of the same command, leaving the database clean.

- [ ] **Step 4: Confirm the existing Demo Tenant is unaffected**

Read credentials from `backend/.env` at run time via command substitution — never paste the raw password into this plan file or a commit:

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
DB_USER=$(grep DB_USERNAME backend/.env | cut -d= -f2)
DB_PASS=$(grep DB_PASSWORD backend/.env | cut -d= -f2)
DB_NAME=$(grep DB_DATABASE backend/.env | cut -d= -f2)

mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT id, name, parent_tenant_id, is_white_label FROM tenants;"
```

Expected: the "Demo Tenant" row shows `parent_tenant_id = NULL`, `is_white_label = 0` — unaffected by the new columns' defaults.

- [ ] **Step 5: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add tenant hierarchy columns (parent_tenant_id, is_white_label) for future White Label support"
```

---

## Task 3: Frontend scaffolding — Admin type, nav/route configs, placeholder page

**Files:**
- Modify: `frontend/src/@types/auth.ts`
- Modify: `frontend/src/configs/app.config.ts`
- Create: `frontend/src/configs/navigation.config/adminNavigation.config.ts`
- Create: `frontend/src/configs/routes.config/adminRoutes.config.ts`
- Modify: `frontend/src/configs/routes.config/index.ts`
- Create: `frontend/src/views/AdminDashboard/index.tsx`

**Interfaces:**
- Consumes: nothing from Tasks 1-2 (pure frontend, independently buildable — Task 4 is what actually wires this to live user state).
- Produces: `SignInResponse['user'].isAdmin: boolean` and `User.isAdmin?: boolean` types, `adminNavigationConfig`/`adminProtectedRoutes` arrays, `appConfig.adminEntryPath`, and the `AdminDashboard` page component — all consumed by Task 4.

- [ ] **Step 1: Add `isAdmin` to the auth types**

Edit `frontend/src/@types/auth.ts`:

```ts
export type SignInResponse = {
    token: string
    user: {
        userId: string
        userName: string
        authority: string[]
        avatar: string
        email: string
        isAdmin: boolean
    }
}
```

```ts
export type User = {
    userId?: string | null
    avatar?: string | null
    userName?: string | null
    email?: string | null
    authority?: string[]
    isAdmin?: boolean
}
```

- [ ] **Step 2: Add the admin entry path to the single app-config source of truth**

Edit `frontend/src/configs/app.config.ts`:

```ts
export type AppConfig = {
    apiPrefix: string
    authenticatedEntryPath: string
    adminEntryPath: string
    unAuthenticatedEntryPath: string
    locale: string
    accessTokenPersistStrategy: 'localStorage' | 'sessionStorage' | 'cookies'
    enableMock: boolean
    activeNavTranslation: boolean
}

const appConfig: AppConfig = {
    apiPrefix: '/api',
    authenticatedEntryPath: '/home',
    adminEntryPath: '/admin',
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'en',
    accessTokenPersistStrategy: 'localStorage',
    enableMock: false,
    activeNavTranslation: false,
}

export default appConfig
```

- [ ] **Step 3: Create the admin navigation config**

Create `frontend/src/configs/navigation.config/adminNavigation.config.ts`:

```ts
import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'
import type { NavigationTree } from '@/@types/navigation'

const adminNavigationConfig: NavigationTree[] = [
    {
        key: 'admin.dashboard',
        path: '/admin',
        title: 'Admin Dashboard',
        translateKey: 'nav.adminDashboard',
        icon: 'home',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
]

export default adminNavigationConfig
```

- [ ] **Step 4: Create the admin routes config**

Create `frontend/src/configs/routes.config/adminRoutes.config.ts`:

```ts
import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const adminProtectedRoutes: Routes = [
    {
        key: 'admin.dashboard',
        path: '/admin',
        component: lazy(() => import('@/views/AdminDashboard')),
        authority: [],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
]
```

Edit `frontend/src/configs/routes.config/index.ts` to also re-export it:

```ts
export { protectedRoutes, publicRoutes } from './routes.config'
export { adminProtectedRoutes } from './adminRoutes.config'
```

- [ ] **Step 5: Create the placeholder Admin Dashboard page**

Create `frontend/src/views/AdminDashboard/index.tsx`:

```tsx
import Container from '@/components/shared/Container'

const AdminDashboard = () => {
    return (
        <Container className="py-2">
            <h3>Admin Dashboard</h3>
            <p className="text-gray-500 mt-1">
                Platform administration. Carriers, rate cards, and tenant
                management land here in later plans.
            </p>
        </Container>
    )
}

export default AdminDashboard
```

- [ ] **Step 6: Verify the build still succeeds**

```bash
cd frontend
npm run build 2>&1 | tail -10
```

Expected: build completes with zero errors — confirms the new types/configs/page are syntactically and structurally correct, even though nothing consumes them yet.

- [ ] **Step 7: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Add Admin type field, admin nav/route configs, and placeholder Admin Dashboard page"
```

---

## Task 4: Frontend wiring — select admin vs. tenant nav/routes by `isAdmin`

**Files:**
- Modify: `frontend/src/store/authStore.ts`
- Modify: `frontend/src/auth/AuthProvider.tsx`
- Modify: `frontend/src/components/route/AllRoutes.tsx`
- Modify: `frontend/src/components/template/SideNav.tsx`
- Modify: `frontend/src/components/template/MobileNav.tsx`
- Modify: `frontend/src/components/template/StackedSideNav/StackedSideNav.tsx`
- Modify: `frontend/src/components/template/HorizontalNav.tsx`

**Interfaces:**
- Consumes: `adminNavigationConfig`, `adminProtectedRoutes`, `appConfig.adminEntryPath` from Task 3.
- Produces: the actual live behavior — an Admin sees only admin nav/routes, a tenant User sees only theirs, and sign-in redirects each to the correct entry path.

- [ ] **Step 1: Default `isAdmin` in the auth store's initial state**

Edit `frontend/src/store/authStore.ts`:

```ts
const initialState: AuthState = {
    session: {
        signedIn: false,
    },
    user: {
        avatar: '',
        userName: '',
        email: '',
        authority: [],
        isAdmin: false,
    },
}
```

- [ ] **Step 2: Fix the post-sign-in redirect to route Admin to their own entry path**

Edit `frontend/src/auth/AuthProvider.tsx`'s `redirect` function. The current code:

```tsx
    const redirect = () => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)

        navigatorRef.current?.navigate(
            redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath,
        )
    }
```

Replace with:

```tsx
    const redirect = () => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)
        const isAdmin = useSessionUser.getState().user.isAdmin
        const entryPath = isAdmin
            ? appConfig.adminEntryPath
            : appConfig.authenticatedEntryPath

        navigatorRef.current?.navigate(redirectUrl ? redirectUrl : entryPath)
    }
```

This matters correctness-wise, not just cosmetically: `handleSignIn()` (called right before `redirect()` in both `signIn()` and `signUp()`) already calls `setUser(user)` with the fresh sign-in response, and Zustand's `set()` applies synchronously — so `useSessionUser.getState().user.isAdmin` reliably reflects the just-signed-in user's role by the time `redirect()` reads it. Without this fix, an Admin's post-login redirect would send them to `/home` — a path that doesn't exist in their (Task 4 Step 4's) active route set — producing a redirect loop.

- [ ] **Step 3: Branch `AllRoutes.tsx`'s protected routes and index redirect on `isAdmin`**

Replace the entire contents of `frontend/src/components/route/AllRoutes.tsx` with:

```tsx
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import AuthorityGuard from './AuthorityGuard'
import FallbackRoute from './FallbackRoute'
import AppRoute from './AppRoute'
import PageContainer from '@/components/template/PageContainer'
import {
    protectedRoutes,
    publicRoutes,
    adminProtectedRoutes,
} from '@/configs/routes.config'
import appConfig from '@/configs/app.config'
import { useAuth } from '@/auth'
import { Routes, Route, Navigate } from 'react-router'
import type { LayoutType } from '@/@types/theme'

interface ViewsProps {
    pageContainerType?: 'default' | 'gutterless' | 'contained'
    layout?: LayoutType
}

type AllRoutesProps = ViewsProps

const AllRoutes = (props: AllRoutesProps) => {
    const { user } = useAuth()
    const activeRoutes = user.isAdmin ? adminProtectedRoutes : protectedRoutes
    const entryPath = user.isAdmin
        ? appConfig.adminEntryPath
        : appConfig.authenticatedEntryPath

    return (
        <Routes>
            <Route path="/" element={<PublicRoute />}>
                <Route
                    index
                    element={<FallbackRoute />}
                />
                {publicRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <AppRoute
                                routeKey={route.key}
                                component={route.component}
                                {...route.meta}
                            />
                        }
                    />
                ))}
            </Route>
            <Route path="/" element={<ProtectedRoute />}>
                <Route index element={<Navigate replace to={entryPath} />} />
                {activeRoutes.map((route, index) => (
                    <Route
                        key={route.key + index}
                        path={route.path}
                        element={
                            <AuthorityGuard
                                userAuthority={user.authority}
                                authority={route.authority}
                            >
                                <PageContainer {...props} {...route.meta}>
                                    <AppRoute
                                        routeKey={route.key}
                                        component={route.component}
                                        {...route.meta}
                                    />
                                </PageContainer>
                            </AuthorityGuard>
                        }
                    />
                ))}
                <Route path="*" element={<Navigate replace to="/" />} />
            </Route>
        </Routes>
    )
}

export default AllRoutes
```

The only real changes from the original: the import gains `adminProtectedRoutes`; the top-level `const { authenticatedEntryPath } = appConfig` destructure is removed (replaced by the per-render `entryPath` computed inside the component, since it now depends on `user.isAdmin`); `activeRoutes` is selected before the JSX and used in place of the old direct `protectedRoutes` reference; everything else — the `AuthorityGuard`/`PageContainer`/`AppRoute` structure, the public-routes block, the catch-all route — is unchanged from Plan 1.

- [ ] **Step 4: Wire the four nav-rendering components to the same selection**

Each of these four files currently imports `navigationConfig` as a static default export and reads `userAuthority` from the store — apply the identical small change to each: add the `adminNavigationConfig` import, read `isAdmin` from the same store, and compute which config to pass to the nav-rendering child.

Edit `frontend/src/components/template/SideNav.tsx`:

```tsx
import navigationConfig from '@/configs/navigation.config'
import adminNavigationConfig from '@/configs/navigation.config/adminNavigation.config'
```

```tsx
    const userAuthority = useSessionUser((state) => state.user.authority)
    const isAdmin = useSessionUser((state) => state.user.isAdmin)
    const activeNavigationConfig = isAdmin
        ? adminNavigationConfig
        : navigationConfig
```

```tsx
                    <VerticalMenuContent
                        collapsed={sideNavCollapse}
                        navigationTree={activeNavigationConfig}
```

Edit `frontend/src/components/template/MobileNav.tsx`:

```tsx
import navigationConfig from '@/configs/navigation.config'
import adminNavigationConfig from '@/configs/navigation.config/adminNavigation.config'
```

```tsx
    const userAuthority = useSessionUser((state) => state.user.authority)
    const isAdmin = useSessionUser((state) => state.user.isAdmin)
    const activeNavigationConfig = isAdmin
        ? adminNavigationConfig
        : navigationConfig
```

```tsx
                        <VerticalMenuContent
                            collapsed={false}
                            navigationTree={activeNavigationConfig}
```

Edit `frontend/src/components/template/StackedSideNav/StackedSideNav.tsx`:

```tsx
import navigationConfig from '@/configs/navigation.config'
import adminNavigationConfig from '@/configs/navigation.config/adminNavigation.config'
```

```tsx
    const userAuthority = useSessionUser((state) => state.user.authority)
    const isAdmin = useSessionUser((state) => state.user.isAdmin)
    const activeNavigationConfig = isAdmin
        ? adminNavigationConfig
        : navigationConfig
```

```tsx
                        navigationTree={activeNavigationConfig}
```

(This one call site inside `<StackedSideNavMini ...>` is the only `navigationConfig` usage in this file — replace it with `activeNavigationConfig`.)

Edit `frontend/src/components/template/HorizontalNav.tsx`:

```tsx
import navigationConfig from '@/configs/navigation.config'
import adminNavigationConfig from '@/configs/navigation.config/adminNavigation.config'
```

```tsx
    const userAuthority = useSessionUser((state) => state.user.authority)
    const isAdmin = useSessionUser((state) => state.user.isAdmin)
    const activeNavigationConfig = isAdmin
        ? adminNavigationConfig
        : navigationConfig
```

```tsx
        <HorizontalMenuContent
            navigationTree={activeNavigationConfig}
```

- [ ] **Step 5: Verify the build succeeds**

```bash
cd frontend
npm run build 2>&1 | tail -10
```

Expected: zero TypeScript errors — confirms all four component edits and the `AllRoutes.tsx` change compile correctly together.

- [ ] **Step 6: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Wire Admin vs User nav/routes selection through isAdmin, fix post-sign-in redirect"
```

---

## Task 5: End-to-end verification

**Files:** none created — this task only verifies Tasks 1-4 work together.

**Interfaces:**
- Consumes: the full system from every earlier task.
- Produces: nothing — the plan's closing check.

- [ ] **Step 1: Run the full verification script**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/backend && php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/frontend && npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

echo "--- Admin sign-in ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}'
echo ""

echo "--- Demo User sign-in (unchanged from Plan 1, plus isAdmin:false) ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}'
echo ""

echo "--- Frontend dev server responds ---"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/

kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
```

Expected: Admin's response has `"isAdmin":true`, `"authority":[]`; Demo User's response has `"isAdmin":false`, `"authority":["dashboard","permissions"]`; frontend responds `200`.

Manual browser check (describe to the user rather than automate, since this session has no browser driver): sign in as `admin@rbm.local` — sidebar shows only "Admin Dashboard," landing page is `/admin`, and navigating to `/permissions` redirects away (no such route exists in Admin's active route set). Sign in as `owner@rbm.local` — sidebar shows "Home" and "Team" exactly as in Plan 1, landing page is `/home`, and navigating to `/admin` redirects away.

- [ ] **Step 2: Report to the user**

Summarize: `is_admin` (users) and `parent_tenant_id`/`is_white_label` (tenants) are migrated and seeded; `admin@rbm.local` / `Admin!12345` and the existing `owner@rbm.local` / `Owner!12345` both verified end-to-end with correct `isAdmin` values and disjoint nav/route trees; the Team/Permissions system is unchanged. Remind the user that Carriers & Agents can now be planned on solid ground — Admin, not tenant User, will own carriers/rate cards/agent creation. `git push` remains a separate, explicit step.
