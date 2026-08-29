# Auth Pages: Sign-up, Phone OTP, Password Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Sign-up, Forgot Password, and Reset Password actually work (currently no backend exists for any of them), add Admin-toggleable phone OTP verification at sign-up, and restyle all four auth pages to the theme's split layout.

**Architecture:** Sign-up creates a Tenant + owner User (same pattern as the existing seeder), then either logs them in immediately or — if Admin's `otp_verification_enabled` setting is on — issues a 6-digit code (currently logged, not really sent, via a swappable `OtpSender` interface) and withholds the Sanctum token until `/otp/verify` succeeds. Forgot/Reset Password use Laravel's built-in password-broker (already has its DB table, just never wired up), with the reset-link notification overridden to point at the SPA instead of a backend route. A new minimal `settings` key-value table backs the OTP toggle, general-purpose for future Admin on/off switches.

**Tech Stack:** Laravel 13 (PHP 8.4, MySQL), React 19 + TypeScript (the `ecme` theme), same stack as every prior plan in this repo.

**Spec:** `docs/superpowers/specs/2026-08-29-auth-pages-signup-otp-password-reset-design.md`

## Global Constraints

- No automated test code in this pass — every task's verification step is a concrete manual command (curl, `artisan tinker`, `mysql`, `npm run build`), matching this project's established convention.
- Do not add a `Co-Authored-By` / `Claude-Session` trailer to any commit message.
- Do not `git push` as part of any task.
- "Owner" must never appear in new UI copy, code comments, or commit messages.
- Server-computed/sensitive `User` fields (`otp_code`, `otp_expires_at`, `otp_attempts`, `phone_verified_at`, `is_owner`, `is_admin`, `tenant_id`) are set via direct property assignment, never through `$fillable` mass assignment — same discipline established earlier in this project. `country_code`/`phone` ARE safe to be fillable (user-supplied, non-privileged, same tier as `name`/`email`).
- **No real WhatsApp Business API integration this pass** — the OTP code is logged, not sent. `OtpSender` is the documented swap-in point for later, same pattern as the Carriers module's deferred `CarrierAgentAdapter`.
- Backend runs on `http://127.0.0.1:8000` (`php artisan serve`), frontend on `http://localhost:5173` (`npm run dev`).

---

## Task 1: Backend — users table columns, Settings table + model

**Files:**
- Create: `backend/database/migrations/xxxx_add_phone_and_otp_columns_to_users_table.php`
- Create: `backend/database/migrations/xxxx_create_settings_table.php`
- Create: `backend/app/Models/Setting.php`
- Modify: `backend/app/Models/User.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Consumes: nothing from earlier plans (new columns/table).
- Produces: `users.country_code`/`phone`/`phone_verified_at`/`otp_code`/`otp_expires_at`/`otp_attempts`; `Setting::get(string $key, mixed $default = null): mixed` and `Setting::set(string $key, mixed $value): void` — consumed by every later task in this plan.

- [ ] **Step 1: Create the users-table migration**

```bash
cd backend
php artisan make:migration add_phone_and_otp_columns_to_users_table --table=users
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
            $table->string('country_code')->nullable()->after('email');
            $table->string('phone')->nullable()->after('country_code');
            $table->timestamp('phone_verified_at')->nullable()->after('phone');
            $table->string('otp_code')->nullable()->after('phone_verified_at');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            $table->unsignedTinyInteger('otp_attempts')->default(0)->after('otp_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'country_code',
                'phone',
                'phone_verified_at',
                'otp_code',
                'otp_expires_at',
                'otp_attempts',
            ]);
        });
    }
};
```

- [ ] **Step 2: Create the settings migration**

```bash
php artisan make:migration create_settings_table
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
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
```

- [ ] **Step 3: Create the `Setting` model**

Create `backend/app/Models/Setting.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $primaryKey = 'key';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::query()->where('key', $key)->value('value') ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
```

- [ ] **Step 4: Add `country_code`/`phone` to `User`'s `$fillable`, and cast `phone_verified_at`**

Edit `backend/app/Models/User.php`:

```php
    protected $fillable = [
        'name',
        'email',
        'country_code',
        'phone',
        'password',
    ];
```

```php
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'password' => 'hashed',
            'is_owner' => 'boolean',
            'is_admin' => 'boolean',
        ];
    }
```

(`otp_code`/`otp_expires_at`/`otp_attempts`/`phone_verified_at` are deliberately absent from `$fillable` — server-computed only, per the Global Constraints.)

- [ ] **Step 5: Seed the default setting**

Edit `backend/database/seeders/DatabaseSeeder.php` — add the `Setting` import and seed the default row at the end of `run()`:

```php
use App\Models\Setting;
```

```php
        Setting::set('otp_verification_enabled', '0');
```

- [ ] **Step 6: Run migrations, re-seed, verify in tinker**

```bash
php artisan migrate:fresh --seed
```

Expected: all migrations run cleanly, seeder completes with no errors.

```bash
php artisan tinker --execute="
dump('default setting: ' . App\Models\Setting::get('otp_verification_enabled'));
dump('unknown key falls back: ' . (App\Models\Setting::get('nonexistent_key', 'fallback') === 'fallback' ? 'yes' : 'no'));
App\Models\Setting::set('otp_verification_enabled', '1');
dump('after set: ' . App\Models\Setting::get('otp_verification_enabled'));
App\Models\Setting::set('otp_verification_enabled', '0');
\$u = App\Models\User::first();
\$u->country_code = '+91';
\$u->phone = '9876543210';
\$u->save();
dump('phone saved: ' . \$u->fresh()->country_code . \$u->fresh()->phone);
"
```

Expected: `default setting: 0`, `unknown key falls back: yes`, `after set: 1`, `phone saved: +919876543210`.

- [ ] **Step 7: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add phone/OTP columns to users and a general-purpose Settings table"
```

---

## Task 2: Backend — OtpSender interface + LogOtpSender

**Files:**
- Create: `backend/app/Contracts/OtpSender.php`
- Create: `backend/app/Support/LogOtpSender.php`
- Modify: `backend/app/Providers/AppServiceProvider.php`

**Interfaces:**
- Consumes: `App\Models\User` (existing).
- Produces: `OtpSender::send(User $user, string $code): void`, bound to `LogOtpSender` in the container — consumed by Task 3's sign-up/resend endpoints.

- [ ] **Step 1: Create the `OtpSender` interface**

Create `backend/app/Contracts/OtpSender.php`:

```php
<?php

namespace App\Contracts;

use App\Models\User;

interface OtpSender
{
    public function send(User $user, string $code): void;
}
```

- [ ] **Step 2: Create `LogOtpSender`**

Create `backend/app/Support/LogOtpSender.php`:

```php
<?php

namespace App\Support;

use App\Contracts\OtpSender;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class LogOtpSender implements OtpSender
{
    /**
     * Writes the code to the application log instead of actually
     * sending it — real WhatsApp Business API integration is a future
     * swap-in point (a WhatsAppOtpSender implementing the same
     * interface), once credentials exist. Nothing else in the system
     * needs to change when that happens.
     */
    public function send(User $user, string $code): void
    {
        Log::info("OTP for user #{$user->id} ({$user->country_code}{$user->phone}): {$code}");
    }
}
```

- [ ] **Step 3: Bind the interface**

Edit `backend/app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use App\Contracts\OtpSender;
use App\Models\User;
use App\Support\FeatureAccess;
use App\Support\LogOtpSender;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(OtpSender::class, LogOtpSender::class);
    }

    public function boot(): void
    {
        Gate::define('access-feature', fn (User $user, string $key) => FeatureAccess::allows($user, $key));
    }
}
```

- [ ] **Step 4: Verify in tinker**

```bash
cd backend
php artisan tinker --execute="
\$user = App\Models\User::first();
app(App\Contracts\OtpSender::class)->send(\$user, '123456');
"
tail -5 storage/logs/laravel.log
```

Expected: the log tail shows a line containing `OTP for user #1` and `123456`.

- [ ] **Step 5: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add OtpSender interface with a log-only implementation"
```

---

## Task 3: Backend — Sign-up + OTP verify/resend endpoints

**Files:**
- Modify: `backend/app/Http/Controllers/Api/AuthController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `Tenant::create()`, `Setting::get()` (Task 1), `OtpSender` (Task 2), existing `userPayload()` helper.
- Produces: `POST /sign-up`, `POST /otp/verify`, `POST /otp/resend` — consumed by Task 7/8's frontend.

- [ ] **Step 1: Add `signUp()`, `verifyOtp()`, `resendOtp()`, and a private `issueOtp()` helper**

Edit `backend/app/Http/Controllers/Api/AuthController.php` — add the new imports and methods (the existing `signIn`/`signOut`/`me`/`userPayload` stay exactly as they are):

```php
use App\Contracts\OtpSender;
use App\Models\Setting;
use App\Models\Tenant;
```

Add these methods to the class, alongside `signIn()`:

```php
    public function signUp(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'country_code' => ['required', 'string', 'max:5'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $tenant = Tenant::create(['name' => "{$data['name']}'s Account"]);

        $user = new User([
            'name' => $data['name'],
            'email' => $data['email'],
            'country_code' => $data['country_code'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
        ]);
        $user->tenant_id = $tenant->id;
        $user->is_owner = true;
        $user->is_admin = false;
        $user->save();

        if (! filter_var(Setting::get('otp_verification_enabled', '0'), FILTER_VALIDATE_BOOLEAN)) {
            $token = $user->createToken('spa')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $this->userPayload($user),
            ]);
        }

        $this->issueOtp($user);

        return response()->json([
            'requiresVerification' => true,
            'userId' => $user->id,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
            'code' => ['required', 'string'],
        ]);

        $user = User::findOrFail($data['userId']);

        if (! $user->otp_code || ! $user->otp_expires_at || $user->otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['This code has expired. Request a new one.'],
            ]);
        }

        if ($user->otp_code !== $data['code']) {
            $user->otp_attempts++;

            if ($user->otp_attempts >= 5) {
                $user->otp_code = null;
                $user->otp_expires_at = null;
                $user->save();

                throw ValidationException::withMessages([
                    'code' => ['Too many incorrect attempts. Request a new code.'],
                ]);
            }

            $user->save();

            throw ValidationException::withMessages([
                'code' => ['Incorrect code.'],
            ]);
        }

        $user->phone_verified_at = now();
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->otp_attempts = 0;
        $user->save();

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function resendOtp(Request $request)
    {
        $data = $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = User::findOrFail($data['userId']);

        $issuedAt = $user->otp_expires_at?->copy()->subMinutes(10);

        if ($issuedAt && $issuedAt->addSeconds(30)->isFuture()) {
            throw ValidationException::withMessages([
                'code' => ['Please wait a few seconds before requesting another code.'],
            ]);
        }

        $this->issueOtp($user);

        return response()->json(['status' => 'sent']);
    }

    private function issueOtp(User $user): void
    {
        $code = (string) random_int(100000, 999999);
        $user->otp_code = $code;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->otp_attempts = 0;
        $user->save();

        app(OtpSender::class)->send($user, $code);
    }
```

- [ ] **Step 2: Register the routes**

Edit `backend/routes/api.php` — add these three public routes alongside the existing `Route::post('/sign-in', ...)` line:

```php
Route::post('/sign-in', [AuthController::class, 'signIn']);
Route::post('/sign-up', [AuthController::class, 'signUp']);
Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
Route::post('/otp/resend', [AuthController::class, 'resendOtp']);
```

- [ ] **Step 3: Verify with curl — both OTP-disabled and OTP-enabled paths**

```bash
cd backend
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

echo "--- Sign-up with OTP disabled (default) — expect token+user, no verification needed ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-up -H "Content-Type: application/json" -d '{"name":"Test User","email":"otp-off@rbm.local","country_code":"+91","phone":"9000000001","password":"Password123"}'
echo ""

echo "--- Enable OTP verification ---"
mysql --defaults-extra-file=/dev/null -u "$(grep DB_USERNAME .env | cut -d= -f2)" -p"$(grep DB_PASSWORD .env | cut -d= -f2)" "$(grep DB_DATABASE .env | cut -d= -f2)" -e "UPDATE settings SET value='1' WHERE \`key\`='otp_verification_enabled';"

echo "--- Sign-up with OTP enabled — expect requiresVerification, no token ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-up -H "Content-Type: application/json" -d '{"name":"Otp Test","email":"otp-on@rbm.local","country_code":"+91","phone":"9000000002","password":"Password123"}'
echo ""

USER_ID=$(mysql --defaults-extra-file=/dev/null -N -u "$(grep DB_USERNAME .env | cut -d= -f2)" -p"$(grep DB_PASSWORD .env | cut -d= -f2)" "$(grep DB_DATABASE .env | cut -d= -f2)" -e "SELECT id FROM users WHERE email='otp-on@rbm.local';")
CODE=$(tail -20 storage/logs/laravel.log | grep -oP "OTP for user #$USER_ID \([^)]*\): \K[0-9]{6}" | tail -1)
echo "Extracted code: $CODE"

echo "--- Wrong code (expect 422) ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8000/api/otp/verify -H "Content-Type: application/json" -d "{\"userId\":$USER_ID,\"code\":\"000000\"}"

echo "--- Correct code (expect 200 with token) ---"
curl -s -X POST http://127.0.0.1:8000/api/otp/verify -H "Content-Type: application/json" -d "{\"userId\":$USER_ID,\"code\":\"$CODE\"}"
echo ""

echo "--- Same code again (expect 422, already cleared) ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8000/api/otp/verify -H "Content-Type: application/json" -d "{\"userId\":$USER_ID,\"code\":\"$CODE\"}"

echo "--- 5-attempt lockout: create a fresh unverified user, exhaust attempts ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-up -H "Content-Type: application/json" -d '{"name":"Lockout Test","email":"otp-lockout@rbm.local","country_code":"+91","phone":"9000000003","password":"Password123"}' > /dev/null
LOCKOUT_ID=$(mysql --defaults-extra-file=/dev/null -N -u "$(grep DB_USERNAME .env | cut -d= -f2)" -p"$(grep DB_PASSWORD .env | cut -d= -f2)" "$(grep DB_DATABASE .env | cut -d= -f2)" -e "SELECT id FROM users WHERE email='otp-lockout@rbm.local';")
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "attempt $i: %{http_code}\n" -X POST http://127.0.0.1:8000/api/otp/verify -H "Content-Type: application/json" -d "{\"userId\":$LOCKOUT_ID,\"code\":\"000000\"}"
done
LOCKOUT_CODE=$(tail -30 storage/logs/laravel.log | grep -oP "OTP for user #$LOCKOUT_ID \([^)]*\): \K[0-9]{6}" | tail -1)
echo "--- 6th attempt with the ACTUAL correct code (expect 422, code was killed after 5 wrong guesses) ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8000/api/otp/verify -H "Content-Type: application/json" -d "{\"userId\":$LOCKOUT_ID,\"code\":\"$LOCKOUT_CODE\"}"

echo "--- Resend throttle: immediate second resend (expect 422) ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-up -H "Content-Type: application/json" -d '{"name":"Resend Test","email":"otp-resend@rbm.local","country_code":"+91","phone":"9000000004","password":"Password123"}' > /dev/null
RESEND_ID=$(mysql --defaults-extra-file=/dev/null -N -u "$(grep DB_USERNAME .env | cut -d= -f2)" -p"$(grep DB_PASSWORD .env | cut -d= -f2)" "$(grep DB_DATABASE .env | cut -d= -f2)" -e "SELECT id FROM users WHERE email='otp-resend@rbm.local';")
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8000/api/otp/resend -H "Content-Type: application/json" -d "{\"userId\":$RESEND_ID}"

echo "--- Disable OTP again, clean up test rows ---"
mysql --defaults-extra-file=/dev/null -u "$(grep DB_USERNAME .env | cut -d= -f2)" -p"$(grep DB_PASSWORD .env | cut -d= -f2)" "$(grep DB_DATABASE .env | cut -d= -f2)" -e "
UPDATE settings SET value='0' WHERE \`key\`='otp_verification_enabled';
DELETE FROM users WHERE email IN ('otp-off@rbm.local','otp-on@rbm.local','otp-lockout@rbm.local','otp-resend@rbm.local');
"

kill "$BACKEND_PID" 2>/dev/null
```

Expected, in order: OTP-disabled sign-up returns `token`+`user`; OTP-enabled sign-up returns `{"requiresVerification":true,"userId":...}` with no token; wrong code `422`; correct code `200` with a token; reusing that same (now-cleared) code `422`; all 5 lockout attempts `422`; the 6th attempt with the *actual* correct code still `422` (proves the lockout really killed it, not just rejected the wrong guesses); immediate resend `422` (throttled).

- [ ] **Step 4: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add sign-up and phone-OTP verify/resend endpoints"
```

---

## Task 4: Backend — Forgot Password / Reset Password

**Files:**
- Create: `backend/app/Notifications/ResetPasswordNotification.php`
- Modify: `backend/app/Models/User.php`
- Modify: `backend/app/Http/Controllers/Api/AuthController.php`
- Modify: `backend/routes/api.php`
- Modify: `backend/config/app.php`
- Modify: `backend/.env`

**Interfaces:**
- Consumes: Laravel's built-in `Password` broker and `password_reset_tokens` table (already exist, unused until now).
- Produces: `POST /forgot-password`, `POST /reset-password` — consumed by Task 9's frontend.

- [ ] **Step 1: Add the frontend URL config**

Edit `backend/config/app.php`, adding a new key right after the existing `'url'` entry:

```php
    'url' => env('APP_URL', 'http://localhost'),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
```

Edit `backend/.env`, adding:

```
FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 2: Create the reset-link notification**

Create `backend/app/Notifications/ResetPasswordNotification.php`:

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $url)
    {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset Password')
            ->line('Click the button below to reset your password.')
            ->action('Reset Password', $this->url)
            ->line('This link will expire in 60 minutes.');
    }
}
```

- [ ] **Step 3: Override `User::sendPasswordResetNotification()`**

Laravel's default notification builds a link to a backend route, which doesn't exist in this SPA setup — override it to point at the frontend instead.

Edit `backend/app/Models/User.php`, adding this method and the notification's `use` import:

```php
use App\Notifications\ResetPasswordNotification;
```

```php
    public function sendPasswordResetNotification($token): void
    {
        $url = rtrim(config('app.frontend_url'), '/') . '/reset-password?token=' . $token . '&email=' . urlencode($this->email);

        $this->notify(new ResetPasswordNotification($url));
    }
```

- [ ] **Step 4: Add `forgotPassword()` and `resetPassword()` to `AuthController`**

Edit `backend/app/Http/Controllers/Api/AuthController.php`, adding the import and two methods:

```php
use Illuminate\Support\Facades\Password;
```

```php
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        return response()->json(['status' => 'ok']);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $status = Password::reset(
            $data,
            function (User $user, string $password) {
                $user->password = Hash::make($password);
                $user->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
```

- [ ] **Step 5: Register the routes**

Edit `backend/routes/api.php`, adding alongside the other public auth routes:

```php
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
```

- [ ] **Step 6: Verify with curl — full round trip**

```bash
cd backend
php artisan config:clear
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

echo "--- Request a reset link for the seeded Demo User ---"
curl -s -X POST http://127.0.0.1:8000/api/forgot-password -H "Content-Type: application/json" -d '{"email":"owner@rbm.local"}'
echo ""

echo "--- Extract the reset URL from the log ---"
RESET_URL=$(tail -20 storage/logs/laravel.log | grep -oP "http://localhost:5173/reset-password\?token=\S+" | tail -1)
echo "Reset URL: $RESET_URL"
TOKEN=$(echo "$RESET_URL" | grep -oP 'token=\K[^&]+')
echo "Token: $TOKEN"

echo "--- Reset the password using that token ---"
curl -s -X POST http://127.0.0.1:8000/api/reset-password -H "Content-Type: application/json" -d "{\"email\":\"owner@rbm.local\",\"token\":\"$TOKEN\",\"password\":\"NewPassword123\"}"
echo ""

echo "--- Sign in with the NEW password (expect success) ---"
curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"NewPassword123"}'
echo ""

echo "--- Reusing the same token again (expect 422, already consumed) ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8000/api/reset-password -H "Content-Type: application/json" -d "{\"email\":\"owner@rbm.local\",\"token\":\"$TOKEN\",\"password\":\"AnotherPassword123\"}"

echo "--- Restore the original seeded password for later tasks/tests ---"
php artisan tinker --execute="
\$u = App\Models\User::where('email', 'owner@rbm.local')->first();
\$u->password = Illuminate\Support\Facades\Hash::make('Owner!12345');
\$u->save();
"

kill "$BACKEND_PID" 2>/dev/null
```

Expected: reset link appears in the log pointing at `localhost:5173` (not the backend); reset succeeds; sign-in with the new password succeeds; reusing the same token fails with `422`.

- [ ] **Step 7: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add Forgot Password / Reset Password endpoints, pointing reset links at the SPA"
```

---

## Task 5: Backend — Admin Settings endpoints

**Files:**
- Create: `backend/app/Http/Controllers/Api/AdminSettingController.php`
- Modify: `backend/routes/api.php`

**Interfaces:**
- Consumes: `Setting::get()`/`Setting::set()` (Task 1), existing `is-admin` middleware.
- Produces: `GET /admin/settings`, `PUT /admin/settings` — consumed by Task 10's frontend.

- [ ] **Step 1: Create the controller**

Create `backend/app/Http/Controllers/Api/AdminSettingController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                'otp_verification_enabled' => filter_var(Setting::get('otp_verification_enabled', '0'), FILTER_VALIDATE_BOOLEAN),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'otp_verification_enabled' => ['required', 'boolean'],
        ]);

        Setting::set('otp_verification_enabled', $data['otp_verification_enabled'] ? '1' : '0');

        return response()->json([
            'data' => [
                'otp_verification_enabled' => $data['otp_verification_enabled'],
            ],
        ]);
    }
}
```

- [ ] **Step 2: Register the routes**

Edit `backend/routes/api.php` — add to the existing `is-admin` group:

```php
use App\Http\Controllers\Api\AdminSettingController;
```

```php
        Route::get('/admin/settings', [AdminSettingController::class, 'index']);
        Route::put('/admin/settings', [AdminSettingController::class, 'update']);
```

- [ ] **Step 3: Verify with curl**

```bash
cd backend
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
USER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"owner@rbm.local","password":"Owner!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")

echo "--- Admin reads settings (expect otp_verification_enabled: false) ---"
curl -s http://127.0.0.1:8000/api/admin/settings -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo "--- Admin toggles it on ---"
curl -s -X PUT http://127.0.0.1:8000/api/admin/settings -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"otp_verification_enabled":true}'
echo ""

echo "--- Admin reads again (expect true) ---"
curl -s http://127.0.0.1:8000/api/admin/settings -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo "--- Turn it back off ---"
curl -s -X PUT http://127.0.0.1:8000/api/admin/settings -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"otp_verification_enabled":false}' > /dev/null

echo "--- Non-admin gets 403 ---"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/admin/settings -H "Authorization: Bearer $USER_TOKEN"

kill "$BACKEND_PID" 2>/dev/null
```

Expected: first read `false`; after PUT, read shows `true`; non-admin `403`.

- [ ] **Step 4: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add backend
git commit -m "Add Admin-gated Settings endpoints"
```

---

## Task 6: Frontend — types, AuthService additions, split layout

**Files:**
- Modify: `frontend/src/@types/auth.ts`
- Modify: `frontend/src/services/AuthService.ts`
- Modify: `frontend/src/components/layouts/AuthLayout/AuthLayout.tsx`

**Interfaces:**
- Consumes: `/sign-up`, `/otp/verify`, `/otp/resend` (Task 3), `/forgot-password`, `/reset-password` (Task 4).
- Produces: updated `SignUpCredential`/`SignUpResponse`/`ForgotPassword`/`ResetPassword` types, `VerifyOtp`/`ResendOtp` types, `apiVerifyOtp()`/`apiResendOtp()` — consumed by Tasks 7-9.

- [ ] **Step 1: Update the auth types**

Edit `frontend/src/@types/auth.ts`:

```ts
export type SignUpCredential = {
    name: string
    email: string
    country_code: string
    phone: string
    password: string
}

export type SignUpResponse =
    | SignInResponse
    | { requiresVerification: true; userId: number }
```

```ts
export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    email: string
    token: string
    password: string
}

export type VerifyOtp = {
    userId: number
    code: string
}

export type ResendOtp = {
    userId: number
}
```

(Replace the existing `ForgotPassword`/`ResetPassword` type blocks with the versions above — `ResetPassword` gains `email`/`token`; add the two new `VerifyOtp`/`ResendOtp` types alongside them.)

- [ ] **Step 2: Add the OTP service functions**

Edit `frontend/src/services/AuthService.ts` — add the import and two functions:

```ts
import type {
    SignInCredential,
    SignUpCredential,
    ForgotPassword,
    ResetPassword,
    VerifyOtp,
    ResendOtp,
    SignInResponse,
    SignUpResponse,
    CurrentUserResponse,
} from '@/@types/auth'
```

```ts
export async function apiVerifyOtp(data: VerifyOtp) {
    return ApiService.fetchDataWithAxios<SignInResponse>({
        url: '/otp/verify',
        method: 'post',
        data,
    })
}

export async function apiResendOtp(data: ResendOtp) {
    return ApiService.fetchDataWithAxios<{ status: string }>({
        url: '/otp/resend',
        method: 'post',
        data,
    })
}
```

- [ ] **Step 3: Switch the auth layout to split**

Edit `frontend/src/components/layouts/AuthLayout/AuthLayout.tsx`:

```ts
const currentLayoutType: LayoutType = 'split'
```

- [ ] **Step 4: Verify the build succeeds**

```bash
cd frontend
npm run build 2>&1 | tail -10
```

Expected: zero errors (the `SignUpCredential`/`SignUpResponse` shape changes will be consumed correctly starting in Task 7 — this task alone only changes types/services/layout, no consuming component yet, so a clean build here confirms the type changes themselves are self-consistent).

- [ ] **Step 5: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Add OTP/reset-password types and services, switch auth layout to split"
```

---

## Task 7: Frontend — Sign-up 2-step wizard + AuthProvider wiring

**Files:**
- Modify: `frontend/src/views/auth/SignUp/components/SignUpForm.tsx`
- Modify: `frontend/src/auth/AuthProvider.tsx`
- Modify: `frontend/src/auth/AuthContext.ts`

**Interfaces:**
- Consumes: `Steps`/`Steps.Item` (existing, unused until now), `SignUpCredential`/`SignUpResponse` (Task 6).
- Produces: `AuthContext`'s `verifyOtp(values: VerifyOtp): AuthResult` — consumed by Task 8.

- [ ] **Step 1: Rebuild `SignUpForm` as a 2-step wizard**

Replace `frontend/src/views/auth/SignUp/components/SignUpForm.tsx` entirely with:

```tsx
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Steps from '@/components/ui/Steps'
import { FormItem, Form } from '@/components/ui/Form'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'

interface SignUpFormProps extends CommonProps {
    disableSubmit?: boolean
    setMessage?: (message: string) => void
}

type SignUpFormSchema = {
    name: string
    email: string
    country_code: string
    phone: string
    password: string
    confirmPassword: string
}

const validationSchema = z
    .object({
        name: z.string().min(1, { message: 'Please enter your name' }),
        email: z.email({ message: 'Please enter a valid email' }),
        country_code: z.string().min(1, { message: 'Required' }),
        phone: z
            .string()
            .min(6, { message: 'Please enter a valid phone number' }),
        password: z
            .string()
            .min(8, { message: 'Password must be at least 8 characters' }),
        confirmPassword: z
            .string()
            .min(1, { message: 'Confirm Password Required' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Password not match',
        path: ['confirmPassword'],
    })

const STEP_FIELDS = [
    ['name', 'email', 'country_code', 'phone'],
    ['password', 'confirmPassword'],
] as const

const SignUpForm = (props: SignUpFormProps) => {
    const { disableSubmit = false, className, setMessage } = props

    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const [currentStep, setCurrentStep] = useState(0)

    const { signUp } = useAuth()

    const {
        handleSubmit,
        trigger,
        formState: { errors },
        control,
    } = useForm<SignUpFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: { country_code: '+91' },
    })

    const handleNext = async () => {
        const valid = await trigger(STEP_FIELDS[currentStep])
        if (valid) {
            setCurrentStep((step) => step + 1)
        }
    }

    const handleBack = () => {
        setCurrentStep((step) => step - 1)
    }

    const onSignUp = async (values: SignUpFormSchema) => {
        const { name, email, country_code, phone, password } = values

        if (!disableSubmit) {
            setSubmitting(true)
            const result = await signUp({
                name,
                email,
                country_code,
                phone,
                password,
            })

            if (result?.status === 'failed') {
                setMessage?.(result.message)
            }

            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            <Steps current={currentStep} className="mb-8">
                <Steps.Item title="Your Details" />
                <Steps.Item title="Set Password" />
            </Steps>
            <Form onSubmit={handleSubmit(onSignUp)}>
                {currentStep === 0 && (
                    <>
                        <FormItem
                            label="Full Name"
                            invalid={Boolean(errors.name)}
                            errorMessage={errors.name?.message}
                        >
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        placeholder="Full Name"
                                        autoComplete="off"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Email"
                            invalid={Boolean(errors.email)}
                            errorMessage={errors.email?.message}
                        >
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        autoComplete="off"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <div className="grid grid-cols-3 gap-3">
                            <FormItem
                                label="Code"
                                invalid={Boolean(errors.country_code)}
                                errorMessage={errors.country_code?.message}
                            >
                                <Controller
                                    name="country_code"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            placeholder="+91"
                                            autoComplete="off"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                            <div className="col-span-2">
                                <FormItem
                                    label="Phone Number"
                                    invalid={Boolean(errors.phone)}
                                    errorMessage={errors.phone?.message}
                                >
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                type="tel"
                                                placeholder="Phone Number"
                                                autoComplete="off"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                            </div>
                        </div>
                        <Button
                            block
                            variant="solid"
                            type="button"
                            onClick={handleNext}
                        >
                            Next
                        </Button>
                    </>
                )}
                {currentStep === 1 && (
                    <>
                        <FormItem
                            label="Password"
                            invalid={Boolean(errors.password)}
                            errorMessage={errors.password?.message}
                        >
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="password"
                                        autoComplete="off"
                                        placeholder="Password"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Confirm Password"
                            invalid={Boolean(errors.confirmPassword)}
                            errorMessage={errors.confirmPassword?.message}
                        >
                            <Controller
                                name="confirmPassword"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="password"
                                        autoComplete="off"
                                        placeholder="Confirm Password"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <div className="flex gap-3">
                            <Button block type="button" onClick={handleBack}>
                                Back
                            </Button>
                            <Button
                                block
                                loading={isSubmitting}
                                variant="solid"
                                type="submit"
                            >
                                {isSubmitting
                                    ? 'Creating Account...'
                                    : 'Sign Up'}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </div>
    )
}

export default SignUpForm
```

- [ ] **Step 2: Add `verifyOtp` to the auth context type**

Edit `frontend/src/auth/AuthContext.ts`:

```ts
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    User,
    OauthSignInCallbackPayload,
    VerifyOtp,
} from '@/@types/auth'
```

```ts
type Auth = {
    authenticated: boolean
    user: User
    signIn: (values: SignInCredential) => AuthResult
    signUp: (values: SignUpCredential) => AuthResult
    verifyOtp: (values: VerifyOtp) => AuthResult
    signOut: () => void
    oAuthSignIn: (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => void
}
```

```ts
const AuthContext = createContext<Auth>({
    authenticated: false,
    user: {},
    signIn: async () => defaultFunctionPlaceHolder(),
    signUp: async () => defaultFunctionPlaceHolder(),
    verifyOtp: async () => defaultFunctionPlaceHolder(),
    signOut: () => {},
    oAuthSignIn: defaultOAuthSignInPlaceHolder,
})
```

- [ ] **Step 3: Branch `signUp()` on the response shape, add `verifyOtp()`**

Edit `frontend/src/auth/AuthProvider.tsx` — add the import and replace the `signUp` function:

```tsx
import {
    apiSignIn,
    apiSignOut,
    apiSignUp,
    apiVerifyOtp,
    apiGetCurrentUser,
} from '@/services/AuthService'
```

```tsx
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    OauthSignInCallbackPayload,
    User,
    Token,
    VerifyOtp,
} from '@/@types/auth'
```

Replace the existing `signUp` function with:

```tsx
    const signUp = async (values: SignUpCredential): AuthResult => {
        try {
            const resp = await apiSignUp(values)
            if (resp && 'requiresVerification' in resp) {
                navigatorRef.current?.navigate(
                    `/otp-verification?userId=${resp.userId}`,
                )
                return {
                    status: 'success',
                    message: '',
                }
            }
            if (resp) {
                handleSignIn({ accessToken: resp.token }, resp.user)
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'Unable to sign up',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const verifyOtp = async (values: VerifyOtp): AuthResult => {
        try {
            const resp = await apiVerifyOtp(values)
            if (resp) {
                handleSignIn({ accessToken: resp.token }, resp.user)
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'Unable to verify code',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }
```

Add `verifyOtp` to the context provider's value:

```tsx
    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                signIn,
                signUp,
                verifyOtp,
                signOut,
                oAuthSignIn,
            }}
        >
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
git commit -m "Rebuild Sign-up as a 2-step wizard, wire signUp()/verifyOtp() branching"
```

---

## Task 8: Frontend — OTP verification page wiring

**Files:**
- Modify: `frontend/src/views/auth/OtpVerification/OtpVerification.tsx`
- Modify: `frontend/src/views/auth/OtpVerification/components/OtpVerificationForm.tsx`
- Modify: `frontend/src/configs/routes.config/authRoute.ts`

**Interfaces:**
- Consumes: `AuthContext.verifyOtp()` (Task 7), `apiResendOtp()` (Task 6).
- Produces: a real, routed `/otp-verification` page — terminal node for the sign-up-with-OTP flow, nothing later depends on this task.

- [ ] **Step 1: Register the route**

Edit `frontend/src/configs/routes.config/authRoute.ts`, adding a new entry:

```ts
    {
        key: 'otpVerification',
        path: `/otp-verification`,
        component: lazy(() => import('@/views/auth/OtpVerification')),
        authority: [],
    },
```

- [ ] **Step 2: Wire the OTP form to the real endpoints**

Replace `frontend/src/views/auth/OtpVerification/components/OtpVerificationForm.tsx` entirely with:

```tsx
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import OtpInput from '@/components/shared/OtpInput'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'

interface OtpVerificationFormProps extends CommonProps {
    userId: number
    setMessage?: (message: string) => void
}

type OtpVerificationFormSchema = {
    otp: string
}

const OTP_LENGTH = 6

const validationSchema = z.object({
    otp: z.string().min(OTP_LENGTH, { message: 'Please enter a valid OTP' }),
})

const OtpVerificationForm = (props: OtpVerificationFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { className, setMessage, userId } = props

    const { verifyOtp } = useAuth()

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<OtpVerificationFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    const onOtpSubmit = async (values: OtpVerificationFormSchema) => {
        setSubmitting(true)
        const result = await verifyOtp({ userId, code: values.otp })

        if (result?.status === 'failed') {
            setMessage?.(result.message)
        }

        setSubmitting(false)
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onOtpSubmit)}>
                <FormItem
                    invalid={Boolean(errors.otp)}
                    errorMessage={errors.otp?.message}
                >
                    <Controller
                        name="otp"
                        control={control}
                        render={({ field }) => (
                            <OtpInput
                                placeholder=""
                                inputClass="h-[58px]"
                                length={OTP_LENGTH}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                >
                    {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </Button>
            </Form>
        </div>
    )
}

export default OtpVerificationForm
```

- [ ] **Step 3: Wire the page to read `userId` from the URL and support real resend**

Replace `frontend/src/views/auth/OtpVerification/OtpVerification.tsx` entirely with:

```tsx
import Alert from '@/components/ui/Alert'
import OtpVerificationForm from './components/OtpVerificationForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { apiResendOtp } from '@/services/AuthService'
import { useSearchParams } from 'react-router'

export const OtpVerificationBase = () => {
    const [searchParams] = useSearchParams()
    const userId = Number(searchParams.get('userId'))

    const [otpResend, setOtpResend] = useTimeOutMessage()
    const [message, setMessage] = useTimeOutMessage()

    const handleResendOtp = async () => {
        try {
            await apiResendOtp({ userId })
            setOtpResend('We have sent you a new One Time Password.')
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            setMessage?.(
                errors?.response?.data?.message || 'Some error occured!',
            )
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h3 className="mb-2">OTP Verification</h3>
                <p className="font-semibold heading-text">
                    We have sent you a One Time Password to your phone.
                </p>
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            )}
            {otpResend && (
                <Alert showIcon className="mb-4" type="info">
                    <span className="break-all">{otpResend}</span>
                </Alert>
            )}
            <OtpVerificationForm userId={userId} setMessage={setMessage} />
            <div className="mt-4 text-center">
                <span className="font-semibold">Din&apos;t receive OTP? </span>
                <button
                    className="heading-text font-bold underline"
                    onClick={handleResendOtp}
                >
                    Resend OTP
                </button>
            </div>
        </div>
    )
}

const OtpVerification = () => {
    return <OtpVerificationBase />
}

export default OtpVerification
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
git commit -m "Wire OTP verification page to the real verify/resend endpoints"
```

---

## Task 9: Frontend — Reset Password reads token/email from the URL

**Files:**
- Modify: `frontend/src/views/auth/ResetPassword/ResetPassword.tsx`
- Modify: `frontend/src/views/auth/ResetPassword/components/ResetPasswordForm.tsx`

**Interfaces:**
- Consumes: `apiResetPassword` (existing, now requires `email`/`token` per Task 6's type change), the reset link's URL query string.
- Produces: nothing consumed elsewhere — terminal page for the password-reset flow.

- [ ] **Step 1: Read `token`/`email` from the URL and pass them down**

Edit `frontend/src/views/auth/ResetPassword/ResetPassword.tsx`:

```tsx
import { useState } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ActionLink from '@/components/shared/ActionLink'
import ResetPasswordForm from './components/ResetPasswordForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useNavigate, useSearchParams } from 'react-router'

type ResetPasswordProps = {
    signInUrl?: string
}

export const ResetPasswordBase = ({
    signInUrl = '/sign-in',
}: ResetPasswordProps) => {
    const [resetComplete, setResetComplete] = useState(false)
    const [searchParams] = useSearchParams()

    const token = searchParams.get('token') ?? ''
    const email = searchParams.get('email') ?? ''

    const [message, setMessage] = useTimeOutMessage()

    const navigate = useNavigate()

    const handleContinue = () => {
        navigate(signInUrl)
    }

    return (
        <div>
            <div className="mb-6">
                {resetComplete ? (
                    <>
                        <h3 className="mb-1">Reset done</h3>
                        <p className="font-semibold heading-text">
                            Your password has been successfully reset
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="mb-1">Set new password</h3>
                        <p className="font-semibold heading-text">
                            Your new password must different to previos password
                        </p>
                    </>
                )}
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            )}
            <ResetPasswordForm
                token={token}
                email={email}
                resetComplete={resetComplete}
                setMessage={setMessage}
                setResetComplete={setResetComplete}
            >
                <Button
                    block
                    variant="solid"
                    type="button"
                    onClick={handleContinue}
                >
                    Continue
                </Button>
            </ResetPasswordForm>
            <div className="mt-4 text-center">
                <span>Back to </span>
                <ActionLink
                    to={signInUrl}
                    className="heading-text font-bold"
                    themeColor={false}
                >
                    Sign in
                </ActionLink>
            </div>
        </div>
    )
}

const ResetPassword = () => {
    return <ResetPasswordBase />
}

export default ResetPassword
```

- [ ] **Step 2: Include `token`/`email` in the reset request**

Edit `frontend/src/views/auth/ResetPassword/components/ResetPasswordForm.tsx`:

```tsx
interface ResetPasswordFormProps extends CommonProps {
    token: string
    email: string
    resetComplete: boolean
    setResetComplete?: (compplete: boolean) => void
    setMessage?: (message: string) => void
}
```

```tsx
const ResetPasswordForm = (props: ResetPasswordFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const {
        className,
        setMessage,
        setResetComplete,
        resetComplete,
        children,
        token,
        email,
    } = props
```

```tsx
    const onResetPassword = async (values: ResetPasswordFormSchema) => {
        const { newPassword } = values

        try {
            const resp = await apiResetPassword<boolean>({
                email,
                token,
                password: newPassword,
            })
            if (resp) {
                setSubmitting(false)
                setResetComplete?.(true)
            }
        } catch (errors) {
            setMessage?.(
                typeof errors === 'string'
                    ? errors
                    : 'Failed to reset password',
            )
            setSubmitting(false)
        }

        setSubmitting(false)
    }
```

(Only the `interface`, the props destructure, and the `apiResetPassword` call body change — the rest of the file, including the whole JSX form, stays exactly as it is.)

- [ ] **Step 3: Verify the build succeeds**

```bash
cd frontend
npm run build 2>&1 | tail -10
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public
git add frontend
git commit -m "Wire Reset Password to read token/email from the reset link's URL"
```

---

## Task 10: Frontend — Admin Settings page

**Files:**
- Create: `frontend/src/services/SettingsService.ts`
- Create: `frontend/src/views/AdminSettings/index.tsx`
- Create: `frontend/src/views/AdminSettings/AdminSettings.tsx`
- Modify: `frontend/src/configs/navigation.config/adminNavigation.config.ts`
- Modify: `frontend/src/configs/routes.config/adminRoutes.config.ts`

**Interfaces:**
- Consumes: `GET/PUT /admin/settings` (Task 5).
- Produces: nothing consumed elsewhere — terminal Admin page.

- [ ] **Step 1: Create the Settings service**

Create `frontend/src/services/SettingsService.ts`:

```ts
import ApiService from './ApiService'

export type Settings = {
    otp_verification_enabled: boolean
}

export async function apiGetSettings() {
    return ApiService.fetchDataWithAxios<{ data: Settings }>({
        url: '/admin/settings',
        method: 'get',
    })
}

export async function apiUpdateSettings(data: Partial<Settings>) {
    return ApiService.fetchDataWithAxios<{ data: Settings }>({
        url: '/admin/settings',
        method: 'put',
        data,
    })
}
```

- [ ] **Step 2: Create the AdminSettings page**

Create `frontend/src/views/AdminSettings/AdminSettings.tsx`:

```tsx
import { useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Switcher from '@/components/ui/Switcher'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiGetSettings, apiUpdateSettings } from '@/services/SettingsService'
import type { Settings } from '@/services/SettingsService'

const AdminSettings = () => {
    const [settings, setSettings] = useState<Settings | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        apiGetSettings()
            .then((resp) => setSettings(resp.data))
            .catch((error: any) => {
                toast.push(
                    <Notification type="danger" title="Error Loading Settings">
                        {error?.response?.data?.message || 'Failed to fetch settings.'}
                    </Notification>,
                    { placement: 'top-center' },
                )
            })
    }, [])

    const handleToggleOtp = async () => {
        if (!settings) return

        const next = !settings.otp_verification_enabled
        setIsSaving(true)
        try {
            const resp = await apiUpdateSettings({ otp_verification_enabled: next })
            setSettings(resp.data)
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="Update Failed">
                    {error?.response?.data?.message || 'Could not update settings.'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Container className="py-2">
            <h3 className="mb-4">Settings</h3>
            <Card className="border border-gray-200 dark:border-gray-700/80">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold heading-text">
                            Require phone verification at sign-up
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            When on, new accounts must verify a code sent to
                            their phone before they can sign in.
                        </p>
                    </div>
                    <Switcher
                        checked={settings?.otp_verification_enabled ?? false}
                        isLoading={isSaving}
                        onChange={handleToggleOtp}
                    />
                </div>
            </Card>
        </Container>
    )
}

export default AdminSettings
```

Create `frontend/src/views/AdminSettings/index.tsx`:

```tsx
export { default } from './AdminSettings'
```

- [ ] **Step 3: Wire the nav and route entries**

Edit `frontend/src/configs/navigation.config/adminNavigation.config.ts`, adding a fifth entry:

```ts
    {
        key: 'admin.settings',
        path: '/admin/settings',
        title: 'Settings',
        translateKey: 'nav.adminSettings',
        icon: 'singleMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
```

Edit `frontend/src/configs/routes.config/adminRoutes.config.ts`, adding a sixth entry:

```ts
    {
        key: 'admin.settings',
        path: '/admin/settings',
        component: lazy(() => import('@/views/AdminSettings')),
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
git commit -m "Add Admin Settings page with the OTP-verification toggle"
```

---

## Task 11: End-to-end verification

**Files:** none created — this task only verifies Tasks 1-10 work together.

- [ ] **Step 1: Full backend + frontend round trip**

```bash
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/backend
php artisan serve > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 4

cd /home/leminai-rbm/htdocs/rbm.leminai.com/public/backend

echo "--- Admin enables OTP verification via the real endpoint ---"
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/sign-in -H "Content-Type: application/json" -d '{"email":"admin@rbm.local","password":"Admin!12345"}' | php -r "echo json_decode(file_get_contents('php://stdin'))->token;")
curl -s -X PUT http://127.0.0.1:8000/api/admin/settings -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"otp_verification_enabled":true}' > /dev/null

echo "--- New user signs up, requires verification ---"
SIGNUP_RESP=$(curl -s -X POST http://127.0.0.1:8000/api/sign-up -H "Content-Type: application/json" -d '{"name":"E2E Signup","email":"e2e-signup@rbm.local","country_code":"+91","phone":"9000009999","password":"Password123"}')
echo "$SIGNUP_RESP"
NEW_USER_ID=$(echo "$SIGNUP_RESP" | php -r "echo json_decode(file_get_contents('php://stdin'))->userId;")

CODE=$(tail -20 storage/logs/laravel.log | grep -oP "OTP for user #$NEW_USER_ID \([^)]*\): \K[0-9]{6}" | tail -1)
echo "--- Verifying with code $CODE (expect token) ---"
curl -s -X POST http://127.0.0.1:8000/api/otp/verify -H "Content-Type: application/json" -d "{\"userId\":$NEW_USER_ID,\"code\":\"$CODE\"}"
echo ""

echo "--- Turn OTP back off, clean up ---"
curl -s -X PUT http://127.0.0.1:8000/api/admin/settings -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"otp_verification_enabled":false}' > /dev/null
mysql --defaults-extra-file=/dev/null -u "$(grep DB_USERNAME .env | cut -d= -f2)" -p"$(grep DB_PASSWORD .env | cut -d= -f2)" "$(grep DB_DATABASE .env | cut -d= -f2)" -e "DELETE FROM users WHERE email='e2e-signup@rbm.local';"

echo "--- Frontend dev server responds ---"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/

kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
```

Expected: sign-up returns `requiresVerification`; OTP verify with the logged code returns a token; frontend responds `200`.

- [ ] **Step 2: Manual browser check (describe to the user, no browser driver in this session)**

All four auth pages (`/sign-in`, `/sign-up`, `/forgot-password`, a `/reset-password?token=...&email=...` link) now render in the split layout (image/message on one side, form on the other).

Sign up as a new account with OTP off (default) — 2-step wizard (Your Details → Set Password), submitting lands you signed in on your entry page.

As Admin, go to Settings, turn on "Require phone verification at sign-up". Sign up again with a new email — after submitting, you're redirected to the OTP Verification page instead of being signed in; check the backend log for the code, enter it, and you're signed in. Try "Resend OTP" and confirm a new code appears in the log.

Use Forgot Password with a real seeded email, find the reset link in the backend log, open it, confirm the Reset Password page's fields are ready to submit without you having to construct the URL yourself, and confirm the new password signs in successfully afterward.

- [ ] **Step 3: Report to the user**

Summarize: Sign-up, Forgot Password, and Reset Password all have working backend endpoints now (none existed before); phone OTP verification is Admin-toggleable via a new Settings page and defaults off; all four auth pages use the split layout; Sign-up is a 2-step wizard. Real WhatsApp sending is not implemented — codes are logged, per the spec's Non-goals, with `OtpSender` as the documented swap-in point. `git push` remains a separate, explicit step. Piece B (the onboarding/KYC request form, account-lock gating, Admin review) is next, as its own design pass.
